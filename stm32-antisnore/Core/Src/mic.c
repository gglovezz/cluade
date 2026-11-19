/**
 * @file    mic.c
 * @brief   麦克风驱动实现 —— ADC + DMA 双半区, 每 32ms 输出一帧 256 样本
 *
 *   DMA 缓冲 = 512 半字 = 2 帧:
 *     半传输完成 → 前半区 [0,256)   就绪
 *     全传输完成 → 后半区 [256,512) 就绪
 *   这样每次回调都恰好是一帧 32ms 数据, 与 SNORE_Algo 的帧率一致。
 */
#include "mic.h"
#include <string.h>

static MicRing_t g_mic;
static volatile uint8_t s_read_half = 0;   /* 0=前半区就绪, 1=后半区就绪 */

void MIC_Init(ADC_HandleTypeDef *hadc, volatile uint16_t *ring, uint32_t ring_len) {
    (void)hadc;
    g_mic.buf = ring;
    g_mic.len = ring_len;
    g_mic.w_idx = 0;
    g_mic.frame_rdy = 0;
    s_read_half = 0;
    /* 由 app.c 里 HAL_ADC_Start_DMA(hadc, (uint32_t*)ring, ring_len) 启动 */
}

/* 在 HAL_ADC_ConvCpltCallback / HAL_ADC_ConvHalfCpltCallback 中调用 */
void MIC_DmaCpltCallback(void) {
    /* 第一次回调(半传输) → 前半区; 第二次(全传输) → 后半区; 交替 */
    s_read_half ^= 1;
    g_mic.frame_rdy = 1;
}

uint8_t MIC_FrameReady_Flag(void) { return g_mic.frame_rdy; }
void    MIC_ClearFrameFlag(void)  { g_mic.frame_rdy = 0; }

void MIC_ReadFrame(uint16_t *frame_out) {
    uint32_t off = (s_read_half ? (g_mic.len / 2U) : 0U);
    uint32_t n = MIC_FRAME_LEN;
    if (off + n > g_mic.len) n = g_mic.len - off;   /* 越界保护 */

    for (uint32_t i = 0; i < n; i++) {
        frame_out[i] = g_mic.buf[off + i];
    }
    g_mic.frame_rdy = 0;
}
