/**
 * @file    mic.h / mic.c
 * @brief   麦克风驱动 —— ADC + DMA + TIM2 定时器触发, 8kHz 采样
 */
#ifndef __MIC_H
#define __MIC_H
#include "stm32f1xx_hal.h"
#include "pinout.h"

#ifdef __cplusplus
extern "C" {
#endif

/* 环形缓冲 */
typedef struct {
    volatile uint16_t *buf;
    uint32_t           len;
    volatile uint32_t  w_idx;      /* DMA 写入位置 */
    volatile uint8_t   frame_rdy;  /* 一帧(256)样本就绪标志 */
} MicRing_t;

void MIC_Init(ADC_HandleTypeDef *hadc, volatile uint16_t *ring, uint32_t ring_len);
uint8_t MIC_FrameReady_Flag(void);
void    MIC_ClearFrameFlag(void);
void    MIC_ReadFrame(uint16_t *frame_out);

/* DMA 完成半/满传输回调 (在 stm32f1xx_it.c 或 HAL 回调里调用) */
void    MIC_DmaCpltCallback(void);

#ifdef __cplusplus
}
#endif
#endif
