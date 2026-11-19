/**
 * @file    servo.h / servo.c
 * @brief   SG90 舵机驱动 —— TIM1 CH1 PA8, PWM 50Hz, 5%—10% 占空比
 *
 *   SG90: 500μs→0°,  1500μs→90°,  2500μs→180°
 *   系统 72MHz / 72MHz=1MHz 定时器时基 → 预分频 PSC=71, ARR=20000-1 → 20ms=50Hz
 *   CCRx = (duty%/100) * 20000 = duty% * 200
 */
#ifndef __SERVO_H
#define __SERVO_H
#include "stm32f1xx_hal.h"
#include "pinout.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum { IDLE, INTERVENE, OBSERVE, FINISHED } ServoCmd_t;

void   SERVO_Init(TIM_HandleTypeDef *htim, uint32_t channel);
void   SERVO_SetAngle(float deg);          /* 0—180° */
void   SERVO_SetPulseUs(uint32_t us);      /* 直接写脉冲宽度(us) */
float  SERVO_GetCurrentAngle(void);

/* 渐进式干预状态机 */
void   SERVO_Tick(ServoCmd_t cmd);         /* 主循环周期调用 */
float  SERVO_GetMaxAngleReached(void);

#ifdef __cplusplus
}
#endif
#endif
