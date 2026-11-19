/**
 * @file    mic.c
 * @brief   麦克风驱动实现
 */
#include "mic.h"
#include <string.h>

static MicRing_t g_mic;

void MIC_Init(ADC_HandleTypeDef *hadc, volatile uint16_t *ring, uint32_t ring_len) {
    g_mic.buf = ring;
    g_mic.len = ring_len;
    g_mic.w_idx = 0;
    g_mic.frame_rdy = 0;
    /* 由 main.c 里 HAL_ADC_Start_DMA(hadc, (uint32_t*)ring, ring_len) 启动 */
}

/* HAL 库的 DMA 完成/半传输回调 —— 用户需要在 stm32f1xx_hal.c 的 weak
   HAL_ADC_ConvCpltCallback / HAL_ADC_ConvHalfCpltCallback 里调用 MIC_DmaCpltCallback() */
void MIC_DmaCpltCallback(void) {
    /* 每次 DMA 完整/半传输, 取最近 MIC_FRAME_LEN 个样本作为一帧 */
    /* 简化: 只要凑够一帧就置位 */
    static uint32_t cnt = 0;
    cnt += (g_mic.len / 2);   /* 半传输回调 */
    /* 实际帧判定可根据 DMA 双缓冲设计, 这里留接口 */
    g_mic.frame_rdy = 1;
    if (cnt > 0xFFFFFFFFUL - 1024) cnt = 0;
    /* (示例) 只置位, 真实帧获取由 MIC_ReadFrame 用环形索引 */
}

uint8_t MIC_FrameReady_Flag(void) { return g_mic.frame_rdy; }
void    MIC_ClearFrameFlag(void)  { g_mic.frame_rdy = 0; }

void MIC_ReadFrame(uint16_t *frame_out) {
    /* 最简单: 拷贝 ring 的前 MIC_FRAME_LEN 个样本 */
    for (int i = 0; i < MIC_FRAME_LEN; i++) {
        frame_out[i] = g_mic.buf[i];
    }
    g_mic.frame_rdy = 0;
}
