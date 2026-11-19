/**
 * @file    flash_store.h / flash_store.c
 * @brief   用 STM32F103C8T6 内部 Flash 模拟 EEPROM 存储睡眠统计
 *          利用 2KB 空间: 0x0807F000 起的最后一个 page (1KB) 放每日统计 + checksum
 */
#ifndef __FLASH_STORE_H
#define __FLASH_STORE_H
#include "stm32f1xx_hal.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define STATS_FLASH_BASE   0x0807F000UL   /* F103C8T6: 64KB Flash, 最后 1KB page: 0x0807F000—0x0807F3FF */

void     FLASH_Store_Init(void);
uint32_t FLASH_Store_Get_SnoreCnt(void);
uint32_t FLASH_Store_Get_InterveneCnt(void);
uint32_t FLASH_Store_Get_MaxAngle(void);
void     FLASH_Store_SnoreEvent(void);
void     FLASH_Store_InterveneEvent(float max_angle);
void     FLASH_Store_DayRollOver(void);

#ifdef __cplusplus
}
#endif
#endif
