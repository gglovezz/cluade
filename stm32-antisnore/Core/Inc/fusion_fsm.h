/**
 * @file    fusion_fsm.h / fusion_fsm.c
 * @brief   声音 + 体位融合触发状态机 —— 智能止鼾枕核心决策逻辑
 *
 *   状态转换:
 *     IDLE ──(snore≥3s AND supine≥3s)──▶ INTERVENE ──(每次步进 2°, 最大 15°)──▶ OBSERVE
 *        ▲                                      ▲                                │
 *        │                                      │◀─────(条件仍满足, 继续干预)──────┤
 *        │                                      │                                │
 *        └──────────────(条件消失 OR 静默窗口到)──┴──────────────────────────────┘
 *
 *   设计要点:
 *   1. 双条件独立计时, 必须同时持续 ≥ FUSION_HOLD_MS 才触发, 滤除偶然翻身/咳嗽
 *   2. 干预过程闭环: 每次 2° 小步进 + 15s 静默观察, 避免一步大幅惊醒用户
 *   3. 单次干预最大 15°, 达到后强制进入 OBSERVE 再回到 IDLE
 *   4. 与 servo.c 的渐进式状态机配合 (FUSION_Tick 决定何时 SERVO_SetAngle)
 */
#ifndef __FUSION_FSM_H
#define __FUSION_FSM_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============ 融合 FSM 状态 ============ */
typedef enum {
    FSM_IDLE = 0,       /* 待机, 等待触发 */
    FSM_ARMED,          /* 双条件已满足, 持续计时中 */
    FSM_INTERVENE,      /* 渐进干预中 (步进抬升枕头) */
    FSM_OBSERVE,        /* 干预后静默观察期 (15s 不动作, 只看条件是否消失) */
    FSM_COOLDOWN        /* 一次完整干预完成后的冷却 (防止连续触发) */
} FusionState_t;

/* ============ 可配置参数 (全部以 ms 为单位, 适配 5ms 主循环节拍) ============ */
#define FUSION_HOLD_MS          3000U    /* 双条件同时持续 ≥ 3s 才触发 */
#define FUSION_OBSERVE_MS       15000U   /* 干预后静默窗口 15s */
#define FUSION_COOLDOWN_MS       5000U   /* 一轮干预结束后冷却 5s */
#define FUSION_MAX_ANGLE_DEG    15.0f    /* 单次干预最大角度 */
#define FUSION_STEP_DEG          2.0f    /* 每次步进角度 */

/* ============ 对外接口 ============ */
void         FUSION_Init(void);
void         FUSION_Tick(void);              /* 主循环每 5ms 调用一次 */
FusionState_t FUSION_GetState(void);
const char  *FUSION_StateName(FusionState_t s);

/* 统计量 (供 OLED / UART 查询) */
uint32_t     FUSION_GetSnoreHoldMs(void);    /* 当前鼾声已持续时间 ms */
uint32_t     FUSION_GetSupineHoldMs(void);   /* 当前仰卧已持续时间 ms */
uint32_t     FUSION_GetInterveneCnt(void);   /* 累计干预次数 (断电不保存) */

#ifdef __cplusplus
}
#endif

#endif /* __FUSION_FSM_H */
