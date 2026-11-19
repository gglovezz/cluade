/**
 * @file    flash_store.h / flash_store.c
 * @brief   用 STM32F103C8T6 内部 Flash 模拟 EEPROM 存储睡眠统计
 *          F103C8T6 为 64KB Flash、1KB/页，共 64 页（第 0—63 页）。
 *          取第 63 页（0x0800FC00—0x0800FFFF）作为统计存储区。
 * @note    若程序体积超过 63KB，必须把 STATS_FLASH_BASE 改到更靠前的空闲页，
 *          并同步修改分散加载文件，否则会擦掉程序本身。
 */
#ifndef __FLASH_STORE_H
#define __FLASH_STORE_H
#include "stm32f1xx_hal.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* F103C8T6: 64KB Flash 的最后一页 = 0x08000000 + 63×1024 = 0x0800FC00 */
#define STATS_FLASH_BASE   0x0800FC00UL

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
