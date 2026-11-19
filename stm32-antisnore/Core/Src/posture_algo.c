/**
 * @file    posture_algo.c
 */
#include "posture_algo.h"
#include <math.h>
#include <string.h>

typedef struct {
    float pitch_lpf;
    float roll_lpf;
    Posture_t current;
    Posture_t candidate;
    uint32_t hold_cnt;
} PostureAlgo_t;

static PostureAlgo_t g_pr;

void POSTURE_Algo_Init(void) {
    memset(&g_pr, 0, sizeof(g_pr));
    g_pr.current = PR_UNKNOWN;
}

void POSTURE_Algo_Update(float ax, float ay, float az) {
    float p = atan2f(ay, az) * 57.2957795f;
    float r = atan2f(ax, sqrtf(ay*ay + az*az)) * 57.2957795f;
    /* 一阶低通, fc ≈ α×fs / (2π) ≈ 0.2×50 / 2π ≈ 1.6Hz */
    g_pr.pitch_lpf = 0.8f * g_pr.pitch_lpf + 0.2f * p;
    g_pr.roll_lpf  = 0.8f * g_pr.roll_lpf + 0.2f * r;

    /* 候选判定 */
    Posture_t cand;
    if (fabsf(g_pr.roll_lpf) < 20.0f) cand = PR_SUPINE;
    else                              cand = PR_SIDE;

    if (cand == g_pr.candidate) {
        g_pr.hold_cnt++;
        /* 主循环每 5ms 一次, 姿态更新每 50ms 一次 —— 计 60 次 ≈ 3s */
        if (g_pr.hold_cnt >= 60) {
            g_pr.current = cand;
        }
    } else {
        g_pr.candidate = cand;
        g_pr.hold_cnt  = 0;
    }
}

Posture_t POSTURE_Algo_Get(void) { return g_pr.current; }
int     POSTURE_Algo_IsSupine(void) { return (g_pr.current == PR_SUPINE); }
float   POSTURE_Algo_GetPitch(void) { return g_pr.pitch_lpf; }
float   POSTURE_Algo_GetRoll(void)  { return g_pr.roll_lpf; }
