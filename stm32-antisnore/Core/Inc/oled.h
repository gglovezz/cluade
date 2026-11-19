/**
 * @file    oled.h / oled.c
 * @brief   SSD1306 128×64 OLED 驱动 —— I²C, 0x3C, 页写入模式
 */
#ifndef __OLED_H
#define __OLED_H
#include "stm32f1xx_hal.h"
#include "pinout.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

void OLED_Init(I2C_HandleTypeDef *hi2c);
void OLED_Clear(void);
void OLED_Update(void);
void OLED_DrawPixel(int x, int y, uint8_t on);
void OLED_DrawString(int x, int y, const char *s);

#ifdef __cplusplus
}
#endif
#endif
