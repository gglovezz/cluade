/**
 * @file    app.h
 * @brief   应用层入口 —— 供 CubeMX 生成的 main.c 调用, 避免手工合并大量代码
 *
 *   使用方式 (在 CubeMX 生成的 Core/Src/main.c 中):
 *     USER CODE BEGIN Includes :  #include "app.h"
 *     USER CODE BEGIN 2        :  APP_Init();  APP_Console();
 *     USER CODE BEGIN WHILE    :  APP_Loop();
 */
#ifndef __APP_H
#define __APP_H

#include "stm32f1xx_hal.h"

#ifdef __cplusplus
extern "C" {
#endif

/* 外设与模块初始化 (LED / 麦克风 / MPU6050 / OLED / 舵机 / Flash / 算法 / 融合FSM) */
void APP_Init(void);

/* 串口交互菜单: 输入 1/2/3/4/a 跑单元测试, 输入 r 进入正常运行 (阻塞等待) */
void APP_Console(void);

/* 主循环体, 内部自带 HAL_Delay(5) —— 每次调用间隔 5ms */
void APP_Loop(void);

#ifdef __cplusplus
}
#endif
#endif /* __APP_H */
