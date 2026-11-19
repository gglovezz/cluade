/**
 * @file    servo.c
 */
#include "servo.h"
#include <math.h>

static TIM_HandleTypeDef *s_tim;
static uint32_t           s_ch;
static float              s_curr_deg = 90.0f;

/* 渐进式状态机 */
static float  s_max_reached = 90.0f;
static uint32_t s_tick_cnt  = 0;

void SERVO_Init(TIM_HandleTypeDef *htim, uint32_t channel) {
    s_tim = htim;
    s_ch  = channel;
    /* TIM1 初始化应由 CubeMX/用户完成:
         Prescaler=71 (72MHz/72 = 1MHz tick), ARR=20000-1 → 50Hz
         Channel1 PWM Mode, 无互补输出, Polarity=High */
    HAL_TIM_PWM_Start(s_tim, s_ch);
    SERVO_SetAngle(90.0f);
}

void SERVO_SetPulseUs(uint32_t us) {
    /* us → CCR (ARR=20000 对应 20000us) */
    uint32_t ccr = us;   /* 1MHz tick, 1 tick = 1us */
    __HAL_TIM_SET_COMPARE(s_tim, s_ch, ccr);
}

void SERVO_SetAngle(float deg) {
    if (deg < 0.0f)   deg = 0.0f;
    if (deg > 180.0f) deg = 180.0f;
    uint32_t us = (uint32_t)(500.0f + (deg / 180.0f) * 2000.0f);
    SERVO_SetPulseUs(us);
    s_curr_deg = deg;
    HAL_Delay(50);    /* 等待舵机到位 */
}

float SERVO_GetCurrentAngle(void) { return s_curr_deg; }

void SERVO_Tick(ServoCmd_t cmd) {
    /* 每次 tick 由主循环每 200ms 调用 */
    if (cmd == INTERVENE) {
        if (s_curr_deg < 105.0f) {       /* 上限 15° 抬起 (90°→105°) */
            float step = 2.0f;           /* 每次 2° */
            float next = s_curr_deg + step;
            SERVO_SetAngle(next);
            s_max_reached = (next > s_max_reached) ? next : s_max_reached;
        }
    } else if (cmd == FINISHED) {
        /* 结束干预, 回中 */
        SERVO_SetAngle(90.0f);
        s_max_reached = 90.0f;
    } else if (cmd == OBSERVE) {
        /* 保持当前位置 */
    }
    s_tick_cnt++;
}

float SERVO_GetMaxAngleReached(void) { return s_max_reached; }
