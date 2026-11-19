/**
 * @file    fusion_fsm.c
 * @brief   声音+体位融合触发状态机 —— 实现 "双条件 ≥3s → 渐进干预 → 静默观察 → 冷却" 完整闭环
 *
 * @note    依赖 snore_algo.h / posture_algo.h / servo.h / flash_store.h
 *          计时使用 HAL_GetTick() 的真实毫秒差, 不再假设主循环严格 5ms。
 *          这样即使 OLED 刷新或串口打印让某一轮变慢, 3s/15s/5s 仍然准确。
 */
#include "fusion_fsm.h"
#include "snore_algo.h"
#include "posture_algo.h"
#include "servo.h"
#include "flash_store.h"
#include "pinout.h"
#include "stm32f1xx_hal.h"
#include <stdio.h>

/* 单次 Tick 允许累计的最大时间间隔 (ms)。
 * 若主循环被长时间阻塞(例如首次刷屏、串口大量打印), 用 250ms 上限代替真实差值,
 * 避免计时器一次性跳过整个 3s 窗口。 */
#define FSM_DT_MAX_MS   250U

/* 舵机基准: SG90 中位 90° = 支撑片水平; 干预抬升至 105° (中位 +15°) */
#define SERVO_NEUTRAL_DEG   90.0f
#define SERVO_MAX_DEG       (SERVO_NEUTRAL_DEG + FUSION_MAX_ANGLE_DEG)

/* ============ 内部状态 ============ */
static FusionState_t fsm_state     = FSM_IDLE;
static uint32_t      snore_hold_ms = 0;     /* 鼾声连续保持时间 */
static uint32_t      supine_hold_ms = 0;    /* 仰卧连续保持时间 */
static uint32_t      state_ms      = 0;     /* 当前状态已持续时间 */
static uint32_t      intervene_cnt = 0;     /* 累计干预次数 */
static float         round_max_deg = SERVO_NEUTRAL_DEG; /* 本轮达到的最大角度 */
static uint32_t      last_tick_ms  = 0;     /* 上一次 Tick 的 HAL_GetTick() */

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
    round_max_deg = SERVO_NEUTRAL_DEG;
    last_tick_ms  = HAL_GetTick();
}

/* ============ 主 Tick (每个主循环调用一次) ============ */
void FUSION_Tick(void) {
    static uint8_t printed_state = 0;

    /* 用真实毫秒差计时, 主循环抖动不会累积成误差 */
    uint32_t now = HAL_GetTick();
    uint32_t dt  = now - last_tick_ms;
    last_tick_ms = now;
    if (dt > FSM_DT_MAX_MS) dt = FSM_DT_MAX_MS;

    int snore_now = SNORE_Algo_IsSnoring();     /* 1=当前判定打鼾 */
    int supine_now = POSTURE_Algo_IsSupine();   /* 1=当前判定仰卧 */

    /* ------ 条件持续计时 (独立运行, 不依赖状态) ------ */
    if (snore_now) {
        if (snore_hold_ms < FUSION_HOLD_MS + 1000U)    /* 封顶避免溢出 */
            snore_hold_ms += dt;
    } else {
        snore_hold_ms = 0;                              /* 条件消失立即清零 */
    }

    if (supine_now) {
        if (supine_hold_ms < FUSION_HOLD_MS + 1000U)
            supine_hold_ms += dt;
    } else {
        supine_hold_ms = 0;
    }

    state_ms += dt;

    /* ------ 状态机转换 ------ */
    switch (fsm_state) {

    /* ---- IDLE: 待机, 等待双条件同时满足 ≥ 3s ---- */
    case FSM_IDLE:
        if (snore_hold_ms >= FUSION_HOLD_MS && supine_hold_ms >= FUSION_HOLD_MS) {
            fsm_state = FSM_ARMED;
            state_ms  = 0;
            printf("[FUSION] ARMED: snore=%lums supine=%lums\n",
                   (unsigned long)snore_hold_ms, (unsigned long)supine_hold_ms);
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
        /* 进入干预: 记录一轮的起点, 累计一次鼾声事件与一轮干预 */
        round_max_deg = SERVO_NEUTRAL_DEG;
        intervene_cnt++;
        FLASH_Store_SnoreEvent();
        fsm_state = FSM_INTERVENE;
        state_ms  = 0;
        printf("[FUSION] -> INTERVENE (干预 #%lu)\r\n", (unsigned long)intervene_cnt);
        /* fall through — 立即执行第一次步进 */

    /* ---- INTERVENE: 抬升 2° 后立刻转入 OBSERVE 静默观察 ---- */
    case FSM_INTERVENE: {
        float cur = SERVO_GetCurrentAngle();

        /* 条件在干预瞬间消失 → 不动作, 直接观察 */
        if (snore_hold_ms < FUSION_HOLD_MS / 2U || supine_hold_ms < FUSION_HOLD_MS / 2U) {
            printf("[FUSION] INTERVENE->OBSERVE: 条件消失 (snore=%lu supine=%lu)\n",
                   (unsigned long)snore_hold_ms, (unsigned long)supine_hold_ms);
            fsm_state = FSM_OBSERVE;
            state_ms  = 0;
            break;
        }

        /* 每次只抬 2°, 不超上限 105° (中位 90° + 15°) */
        if (cur < SERVO_MAX_DEG - 0.5f) {
            float next = cur + FUSION_STEP_DEG;
            if (next > SERVO_MAX_DEG) next = SERVO_MAX_DEG;
            SERVO_SetAngle(next);
            if (next > round_max_deg) round_max_deg = next;
            char s1[8], s2[8];
            fmt_f(s1, sizeof(s1), next, 1);
            fmt_f(s2, sizeof(s2), next - SERVO_NEUTRAL_DEG, 1);
            printf("[FUSION] 步进 -> %s° (相对中位 +%s°)\r\n", s1, s2);
        }

        /* 无论是否步进, 都进入 15s 静默观察窗口 */
        fsm_state = FSM_OBSERVE;
        state_ms  = 0;
        break;
    }

    /* ---- OBSERVE: 15s 静默观察, 不动作只监测 ---- */
    case FSM_OBSERVE:
        /* 静默窗口到 */
        if (state_ms >= FUSION_OBSERVE_MS) {
            if (snore_hold_ms >= FUSION_HOLD_MS && supine_hold_ms >= FUSION_HOLD_MS) {
                if (SERVO_GetCurrentAngle() < SERVO_MAX_DEG - 0.5f) {
                    /* 条件仍满足且未到上限 → 再抬 2° */
                    fsm_state = FSM_INTERVENE;
                    state_ms  = 0;
                    printf("[FUSION] OBSERVE->INTERVENE: 条件仍满足, 继续抬升\r\n");
                } else {
                    /* 已达上限 105° → 保持角度, 继续观察, 不回落 */
                    state_ms = 0;
                    printf("[FUSION] 已到上限 %d°, 保持并继续观察\r\n", (int)SERVO_MAX_DEG);
                }
            } else {
                /* 条件消失 → 记录本轮最大抬升角, 舵机回中位 */
                float lift = round_max_deg - SERVO_NEUTRAL_DEG;
                FLASH_Store_InterveneEvent(lift);
                SERVO_SetAngle(SERVO_NEUTRAL_DEG);
                char s_lift[8];
                fmt_f(s_lift, sizeof(s_lift), lift, 1);
                printf("[FUSION] OBSERVE->COOLDOWN: 本轮结束 (最大抬升 %s°), 舵机回中位 90°\r\n", s_lift);
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
