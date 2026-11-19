/**
 * @file    main.h
 * @brief   主控头文件 —— 引入 pinout 与 HAL 依赖
 */
#ifndef __MAIN_H
#define __MAIN_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32f1xx_hal.h"
#include "pinout.h"

/* 外设句柄 (定义在 main.c) */
extern ADC_HandleTypeDef   hadc1;
extern I2C_HandleTypeDef   hi2c1;
extern I2C_HandleTypeDef   hi2c2;
extern TIM_HandleTypeDef   htim1;
extern TIM_HandleTypeDef   htim2;   /* 可选:系统节拍定时器 */
extern UART_HandleTypeDef  huart1;

/* main.c 中的初始化函数 */
void SystemClock_Config(void);
void MX_GPIO_Init(void);
void MX_DMA_Init(void);
void MX_ADC1_Init(void);
void MX_I2C1_Init(void);       /* MPU6050 */
void MX_I2C2_Init(void);      /* OLED    */
void MX_TIM1_Init(void);      /* 舵机 PWM */
void MX_TIM2_Init(void);      /* 1ms 系统节拍(可选, HAL 用 SysTick) */
void MX_USART1_UART_Init(void);

/* BSP 层初始化 (在 main() 里 main init 之后调用) */
void BSP_Init(void);

#ifdef __cplusplus
}
#endif

#endif /* __MAIN_H */
