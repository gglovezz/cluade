/**
 * @file    flash_store.c
 */
#include "flash_store.h"
#include <string.h>

typedef struct {
    uint32_t magic;        /* 0x41535043 = "ASPC" */
    uint32_t snore_cnt;
    uint32_t intervene_cnt;
    uint32_t max_angle_x10;/* 存角度×10, 保留 0.1° 精度 */
    uint32_t day_stamp;    /* 可选日期戳 */
    uint32_t checksum;
} Stats_t;

#define MAGIC 0x41535043UL

static void flash_write(Stats_t *s) {
    s->magic = MAGIC;
    s->checksum = s->magic ^ s->snore_cnt ^ s->intervene_cnt
                ^ s->max_angle_x10 ^ s->day_stamp;
    HAL_FLASH_Unlock();
    FLASH_PageErase(STATS_FLASH_BASE);
    HAL_FLASH_ClearFlag(FLASH_FLAG_EOP | FLASH_FLAG_PGERR | FLASH_FLAG_WRPRTERR);
    uint32_t *p = (uint32_t*)s;
    for (int i = 0; i < (int)sizeof(Stats_t)/4; i++) {
        HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, STATS_FLASH_BASE + i*4, p[i]);
    }
    HAL_FLASH_Lock();
}

static Stats_t flash_read(void) {
    Stats_t *p = (Stats_t*)STATS_FLASH_BASE;
    return *p;
}

static Stats_t g_stats;

void FLASH_Store_Init(void) {
    g_stats = flash_read();
    if (g_stats.magic != MAGIC || g_stats.checksum !=
        (g_stats.magic ^ g_stats.snore_cnt ^ g_stats.intervene_cnt ^ g_stats.max_angle_x10 ^ g_stats.day_stamp)) {
        memset(&g_stats, 0, sizeof(g_stats));
        flash_write(&g_stats);
    }
}

uint32_t FLASH_Store_Get_SnoreCnt()    { return g_stats.snore_cnt; }
uint32_t FLASH_Store_Get_InterveneCnt(){ return g_stats.intervene_cnt; }
uint32_t FLASH_Store_Get_MaxAngle()    { return g_stats.max_angle_x10; }

void FLASH_Store_SnoreEvent(void) {
    g_stats.snore_cnt++;
    flash_write(&g_stats);
}
void FLASH_Store_InterveneEvent(float max_angle) {
    g_stats.intervene_cnt++;
    g_stats.max_angle_x10 = (uint32_t)(max_angle * 10.0f);
    flash_write(&g_stats);
}
void FLASH_Store_DayRollOver(void) {
    g_stats.snore_cnt = 0;
    g_stats.intervene_cnt = 0;
    g_stats.max_angle_x10 = 0;
    flash_write(&g_stats);
}
