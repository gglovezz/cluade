/**
 * @file    snore_algo.h / snore_algo.c
 * @brief   鼾声识别 —— 短时能量 + 过零率 + 自相关峰, 自适应噪声底, 状态机
 */
#ifndef __SNORE_ALGO_H
#define __SNORE_ALGO_H
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum { SN_QUIET, SN_SUSPECT, SN_SNORE, SN_CONFIRMED } SnoreState_t;

void SNORE_Algo_Init(void);
/* 每帧(256 样本)调用一次 */
void SNORE_Algo_Update(const uint16_t *frame, int len);
/* 返回当前状态 */
int  SNORE_Algo_IsSnoring(void);
/* 调试: 取出短时能量 */
float SNORE_Algo_GetEnergy(void);

#ifdef __cplusplus
}
#endif
#endif
