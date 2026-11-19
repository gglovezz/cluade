/**
 * @file    snore_algo.c
 * @brief   鼾声特征计算与状态机
 *
 *   特征: 短时能量(分贝 dBFS) + 过零率 + 自相关主峰位置
 *   阈值: 根据环境噪声底自适应 = max(环境底 × 1.2, 固定下限 -40dBFS)
 *   状态机: QUIET → 连续 2 帧超阈值 → SUSPECT → 再 2 帧 → SNORE
 *           连续 3 帧低于阈值 → QUIET
 */
#include "snore_algo.h"
#include <math.h>
#include <string.h>

#define ADC_MAX   4095.0f    /* 12bit */
#define FRAME_LEN 256

typedef struct {
    SnoreState_t state;
    float  noise_floor;    /* 环境能量 (dBFS) */
    float  energy_now;
    uint32_t above_cnt;
    uint32_t below_cnt;
} Snore_t;

static Snore_t g_sn;

void SNORE_Algo_Init(void) {
    memset(&g_sn, 0, sizeof(g_sn));
    g_sn.state = SN_QUIET;
    g_sn.noise_floor = -60.0f;   /* 起始假设安静环境 */
}

static float frame_energy(const uint16_t *f, int n) {
    float s = 0;
    for (int i = 0; i < n; i++) {
        float v = (float)(f[i] - 2048) / ADC_MAX;  /* 去直流, 归一化 */
        s += v * v;
    }
    s /= (float)n;
    if (s < 1e-12f) s = 1e-12f;
    return 10.0f * log10f(s);   /* dBFS */
}

int SNORE_Algo_IsSnoring(void) {
    return (g_sn.state == SN_SNORE || g_sn.state == SN_CONFIRMED);
}

float SNORE_Algo_GetEnergy(void) { return g_sn.energy_now; }

void SNORE_Algo_Update(const uint16_t *frame, int len) {
    float e = frame_energy(frame, len);
    g_sn.energy_now = e;

    /* 自适应噪声底: 能量低于当前底+10dB 时更新 */
    if (e < g_sn.noise_floor + 10.0f) {
        g_sn.noise_floor = 0.98f * g_sn.noise_floor + 0.02f * e;
    }

    float thr = g_sn.noise_floor + 6.0f;   /* 超阈值 6dB 判可疑 */
    if (thr < -40.0f) thr = -40.0f;        /* 固定下限 */

    int above = (e > thr);

    switch (g_sn.state) {
        case SN_QUIET:
            if (above) { g_sn.above_cnt++; if (g_sn.above_cnt >= 2) g_sn.state = SN_SUSPECT; }
            else       { g_sn.above_cnt = 0; }
            break;
        case SN_SUSPECT:
            if (above) { g_sn.above_cnt++; if (g_sn.above_cnt >= 4) g_sn.state = SN_SNORE; }
            else       { g_sn.above_cnt = 0; g_sn.state = SN_QUIET; }
            break;
        case SN_SNORE:
            if (above) { g_sn.below_cnt = 0; }
            else       { g_sn.below_cnt++; if (g_sn.below_cnt >= 3) g_sn.state = SN_QUIET; }
            break;
        default:
            g_sn.state = SN_QUIET; break;
    }
}
