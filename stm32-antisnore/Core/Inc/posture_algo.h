/**
 * @file    posture_algo.h / posture_algo.c
 * @brief   睡眠体位检测 —— 基于 MPU6050 加速度计, pitch/roll 判定仰卧/侧卧
 *
 *   仰卧 (Supine):  pitch ≈ 0° 且 |roll| < 20°
 *   侧卧 (Side)   : |roll| > 25°
 *   判定前先用低通滤波 + 3 秒状态保持
 */
#ifndef __POSTURE_ALGO_H
#define __POSTURE_ALGO_H
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum { PR_UNKNOWN, PR_SUPINE, PR_SIDE } Posture_t;

void    POSTURE_Algo_Init(void);
void    POSTURE_Algo_Update(float ax, float ay, float az);
Posture_t POSTURE_Algo_Get(void);
int     POSTURE_Algo_IsSupine(void);
/* 返回滤波后的 pitch/roll (deg) */
float   POSTURE_Algo_GetPitch(void);
float   POSTURE_Algo_GetRoll(void);

#ifdef __cplusplus
}
#endif
#endif
