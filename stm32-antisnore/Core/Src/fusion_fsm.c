/**
 * @file    fusion_fsm.c
 * @brief   声音+体位融合触发状态机 —— 实现 "双条件 ≥3s → 渐进干预 → 静默观察 → 冷却" 完整闭环
 *
 * @note    依赖 snore_algo.h / posture_algo.h / servo.h / flash_store.h
 *          主循环节拍: 5ms (由 HAL_Delay(5) 保证)
 */
#include "fusion_fsm.h"
#include "snore_algo.h"
#include "posture_algo.h"
#include "servo.h"
#include "flash_store.h"

/* 主循环节拍 (由 main.c HAL_Delay 决定) */
#define FSM_TICK_MS     5U

/* ============ 内部状态 ============ */
static FusionState_t fsm_state     = FSM_IDLE;
static uint32_t      snore_hold_ms = 0;     /* 鼾声连续保持时间 */
static uint32_t      supine_hold_ms = 0;    /* 仰卧连续保持时间 */
static uint32_t      state_ms      = 0;     /* 当前状态已持续时间 */
static uint32_t      intervene_cnt = 0;     /* 累计干预次数 */
static uint8_t       stepped_this_round = 0;/* 本轮干预是否已步进过 */

/* ============ 字符串映射 (调试用) ============ */
const char *FUSION_StateName(FusionState_t s) {
    switch (s) {
        case FSM_IDLE:     return "IDLE";
        case FSM_ARMED:    return "ARMED";
        case FSM_INTERVENE:return "INTERVENE";
        case FSM_OBSERVE:  return "OBSERVE";
        case FSM_COOLDOWN: return "COOLDOWN";
        default:           return "?";
    }
}

/* ============ 初始化 ============ */
void FUSION_Init(void) {
    fsm_state     = FSM_IDLE;
    snore_hold_ms = 0;
    supine_hold_ms = 0;
    state_ms      = 0;
    intervene_cnt = 0;
    stepped_this_round = 0;
}

/* ============ 主 Tick (5ms 一次) ============ */
void FUSION_Tick(void) {
    static uint8_t printed_state = 0;

    int snore_now = SNORE_Algo_IsSnoring();     /* 1=当前判定打鼾 */
    int supine_now = POSTURE_Algo_IsSupine();   /* 1=当前判定仰卧 */

    /* ------ 条件持续计时 (独立运行, 不依赖状态) ------ */
    if (snore_now) {
        if (snore_hold_ms < FUSION_HOLD_MS + 1000U)    /* 封顶避免溢出 */
            snore_hold_ms += FSM_TICK_MS;
    } else {
        snore_hold_ms = 0;                              /* 条件消失立即清零 */
    }

    if (supine_now) {
        if (supine_hold_ms < FUSION_HOLD_MS + 1000U)
            supine_hold_ms += FSM_TICK_MS;
    } else {
        supine_hold_ms = 0;
    }

    state_ms += FSM_TICK_MS;

    /* ------ 状态机转换 ------ */
    switch (fsm_state) {

    /* ---- IDLE: 待机, 等待双条件同时满足 ≥ 3s ---- */
    case FSM_IDLE:
        if (snore_hold_ms >= FUSION_HOLD_MS && supine_hold_ms >= FUSION_HOLD_MS) {
            fsm_state = FSM_ARMED;
            state_ms  = 0;
            printf("[FUSION] ARMED: snore=%lums supine=%lums\n", snore_hold_ms, supine_hold_ms);
        }
        break;

    /* ---- ARMED: 双条件已持续 ≥ 3s, 进入干预 ---- */
    case FSM_ARMED:
        /* 双条件丢失 → 回 IDLE (去抖动冗余, 3s 已经过了) */
        if (snore_hold_ms < FUSION_HOLD_MS || supine_hold_ms < FUSION_HOLD_MS) {
            fsm_state = FSM_IDLE;
            state_ms  = 0;
            printf("[FUSION] ARMED->IDLE: 条件丢失\n");
            break;
        }
        /* 进入干预 */
        fsm_state = FSM_INTERVENE;
        state_ms  = 0;
        stepped_this_round = 0;
        intervene_cnt++;
        printf("[FUSION] -> INTERVENE (干预 #%lu)\n", intervene_cnt);
        /* fall through — 立即执行第一次步进 */

    /* ---- INTERVENE: 渐进干预, 每次 +2°, 达 15° 或条件消失进入 OBSERVE ---- */
    case FSM_INTERVENE: {
        float cur = SERVO_GetCurrentAngle();

        /* 条件消失 → 提前结束干预进入 OBSERVE */
        if (snore_hold_ms < FUSION_HOLD_MS / 2U || supine_hold_ms < FUSION_HOLD_MS / 2U) {
            printf("[FUSION] INTERVENE->OBSERVE: 条件消失 (snore=%lu supine=%lu)\n",
                   snore_hold_ms, supine_hold_ms);
            fsm_state = FSM_OBSERVE;
            state_ms  = 0;
            break;
        }

        /* 还没到最大角度 → 再步进一次 */
        if (cur < FUSION_MAX_ANGLE_DEG - 0.5f && stepped_this_round == 0) {
            float next = cur + FUSION_STEP_DEG;
            if (next > FUSION_MAX_ANGLE_DEG) next = FUSION_MAX_ANGLE_DEG;
            SERVO_SetAngle(next);
            stepped_this_round = 1;
            FLASH_Store_SnoreEvent();
            printf("[FUSION] 步进 -> %.1f° (snore=%d supine=%d)\n", next, snore_now, supine_now);
        }

        /* 到达最大角度 → 进入 OBSERVE 静默窗口 */
        if (cur >= FUSION_MAX_ANGLE_DEG - 0.5f) {
            printf("[FUSION] INTERVENE->OBSERVE: 达到最大角度 %.1f°\n", cur);
            fsm_state = FSM_OBSERVE;
            state_ms  = 0;
        }
        break;
    }

    /* ---- OBSERVE: 15s 静默观察, 不动作只监测 ---- */
    case FSM_OBSERVE:
        /* 静默窗口到 */
        if (state_ms >= FUSION_OBSERVE_MS) {
            /* 条件还在 → 再一轮渐进干预 (如果还没到最大角) */
            if (snore_hold_ms >= FUSION_HOLD_MS &&
                supine_hold_ms >= FUSION_HOLD_MS &&
                SERVO_GetCurrentAngle() < FUSION_MAX_ANGLE_DEG - 0.5f) {
                fsm_state = FSM_INTERVENE;
                state_ms  = 0;
                stepped_this_round = 0;
                printf("[FUSION] OBSERVE->INTERVENE: 条件仍满足, 继续干预\n");
            } else {
                /* 条件消失 OR 已达最大角 → 舵机回位 + COOLDOWN */
                float max_a = SERVO_GetMaxAngleReached();
                FLASH_Store_InterveneEvent(max_a);
                SERVO_SetAngle(0.0f);
                printf("[FUSION] OBSERVE->COOLDOWN: 本轮结束 (max=%.1f°), 舵机回 0°\n", max_a);
                fsm_state = FSM_COOLDOWN;
                state_ms  = 0;
            }
        }
        break;

    /* ---- COOLDOWN: 5s 冷却, 防止连续触发 ---- */
    case FSM_COOLDOWN:
        if (state_ms >= FUSION_COOLDOWN_MS) {
            fsm_state = FSM_IDLE;
            state_ms  = 0;
            printf("[FUSION] COOLDOWN->IDLE: 等待下一轮\n");
        }
        break;

    default:
        fsm_state = FSM_IDLE;
        state_ms  = 0;
        break;
    }

    /* 状态变化时打印一次 */
    if (printed_state != fsm_state) {
        printed_state = fsm_state;
        /* 上面各状态转换里已经打印了, 这里留空防止重复 */
    }
}

/* ============ 查询接口 ============ */
FusionState_t FUSION_GetState(void)       { return fsm_state; }
uint32_t      FUSION_GetSnoreHoldMs(void) { return snore_hold_ms; }
uint32_t      FUSION_GetSupineHoldMs(void){ return supine_hold_ms; }
uint32_t      FUSION_GetInterveneCnt(void){ return intervene_cnt; }
