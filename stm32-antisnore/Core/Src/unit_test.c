/**
 * @file    unit_test.c
 * @brief   单元测试固件实现 —— 打印 PASS/FAIL 与关键参数
 */
#include "unit_test.h"
#include "main.h"
#include "mic.h"
#include "mpu6050.h"
#include "oled.h"
#include "servo.h"
#include "flash_store.h"
#include <stdio.h>
#include <string.h>
#include <math.h>

/* ============ MPU6050 测试 ============ */
int UT_Test_MPU6050(void) {
    printf("\r\n==== MPU6050 Unit Test ====\r\n");
    int ret = MPU6050_Init(MPU_I2C_HANDLE);
    if (ret != 0) { printf("FAIL: init ret=%d\r\n", ret); return -1; }
    printf("PASS: WHO_AM_I=0x%02X, PLL OK\r\n", MPU6050_ADDR);
    float ax, ay, az, gx, gy, gz;
    float ax_sum=0, ay_sum=0, az_sum=0, gx_sum=0, gy_sum=0, gz_sum=0;
    for (int i = 0; i < 100; i++) {
        MPU6050_ReadAll(&ax, &ay, &az, &gx, &gy, &gz);
        ax_sum+=ax; ay_sum+=ay; az_sum+=az; gx_sum+=gx; gy_sum+=gy; gz_sum+=gz;
        HAL_Delay(10);
    }
    printf("  均值 ax=%.3f ay=%.3f az=%.3f gx=%.2f gy=%.2f gz=%.2f\r\n",
           ax_sum/100, ay_sum/100, az_sum/100, gx_sum/100, gy_sum/100, gz_sum/100);
    /* 静止时 |accel| 应接近 1g (≈1.0) */
    float mag = sqrtf((ax_sum/100)*(ax_sum/100) + (ay_sum/100)*(ay_sum/100) + (az_sum/100)*(az_sum/100));
    if (mag > 0.9f && mag < 1.1f) { printf("PASS: accel magnitude=%.3f g\r\n", mag); return 0; }
    printf("FAIL: accel magnitude out of range: %.3f g\r\n", mag);
    return -1;
}

/* ============ OLED 测试 ============ */
int UT_Test_OLED(void) {
    printf("\r\n==== OLED Unit Test ====\r\n");
    OLED_Init(OLED_I2C_HANDLE);
    for (int i = 0; i < 10; i++) {
        OLED_Clear();
        char buf[32];
        snprintf(buf, sizeof(buf), "OLED Test #%d", i);
        OLED_DrawString(0, 0, "Hello STM32!");
        OLED_DrawString(0, 16, buf);
        OLED_DrawString(0, 32, "1234567890");
        OLED_Update();
        HAL_Delay(200);
    }
    printf("PASS: OLED drew 10 frames; 请人工检查屏幕内容\r\n");
    return 0;
}

/* ============ 舵机测试 ============ */
int UT_Test_Servo(void) {
    printf("\r\n==== Servo Unit Test ====\r\n");
    SERVO_Init(SERVO_TIM_HANDLE, SERVO_TIM_CH);
    float angles[] = {0.0f, 45.0f, 90.0f, 135.0f, 180.0f, 90.0f};
    for (int i = 0; i < 6; i++) {
        SERVO_SetAngle(angles[i]);
        printf("  angle → %.0f deg\r\n", angles[i]);
        HAL_Delay(500);
    }
    printf("PASS: 完成 0→45→90→135→180→90 扫描; 请人工确认舵机位置\r\n");
    return 0;
}

/* ============ 麦克风测试 ============ */
int UT_Test_Microphone(void) {
    printf("\r\n==== Mic Unit Test ====\r\n");
    printf("  准备 ADC-DMA 采样 2 秒, 请对着麦克风说话\r\n");
    uint16_t ring[MIC_RING_LEN];
    MIC_Init(MIC_ADC_HANDLE, ring, MIC_RING_LEN);
    HAL_ADC_Start_DMA(MIC_ADC_HANDLE, (uint32_t*)ring, MIC_RING_LEN);
    HAL_Delay(2000);
    uint16_t min=0xFFFF, max=0;
    uint32_t sum=0;
    for (int i = 0; i < MIC_RING_LEN; i++) {
        if (ring[i]<min) min=ring[i];
        if (ring[i]>max) max=ring[i];
        sum += ring[i];
    }
    printf("  min=%u max=%u avg=%u (12bit, 基线≈2048)\r\n", min, max, (unsigned)(sum/MIC_RING_LEN));
    printf("  pk-pk = %u (越接近 4095 越饱满; 0 表示音频输入异常)\r\n", max-min);
    if ((max-min) < 50) { printf("WARN: pk-pk 太小, 检查 MAX4466 增益/电源/接线\r\n"); return -1; }
    if ((max-min) > 200) { printf("PASS: 音频有明显幅度变化\r\n"); return 0; }
    printf("INFO: 幅度中等, 正常说话即可\r\n");
    return 0;
}

/* ============ Flash 存储测试 ============ */
int UT_Test_Flash(void) {
    printf("\r\n==== Flash EEPROM Unit Test ====\r\n");
    FLASH_Store_Init();
    uint32_t s0 = FLASH_Store_Get_SnoreCnt();
    FLASH_Store_SnoreEvent();
    FLASH_Store_SnoreEvent();
    uint32_t s2 = FLASH_Store_Get_SnoreCnt();
    printf("  before=%lu after_inc=%lu (期望: +2)\r\n", (unsigned long)s0, (unsigned long)s2);
    if (s2 == s0 + 2) { printf("PASS: Flash 读写 OK\r\n"); return 0; }
    printf("FAIL: counter mismatch\r\n");
    return -1;
}

int UNIT_TEST_RUN(UT_Mode_t mode) {
    int total = 0, pass = 0;
    if (mode == UT_MICRO || mode == UT_ALL)   { total++; if (UT_Test_Microphone() == 0) pass++; }
    if (mode == UT_MPU6050 || mode == UT_ALL)  { total++; if (UT_Test_MPU6050()    == 0) pass++; }
    if (mode == UT_OLED    || mode == UT_ALL)  { total++; if (UT_Test_OLED()        == 0) pass++; }
    if (mode == UT_SERVO   || mode == UT_ALL)  { total++; if (UT_Test_Servo()       == 0) pass++; }
    if (mode == UT_ALL)                        { total++; if (UT_Test_Flash()       == 0) pass++; }
    printf("\r\n========== UT Summary: %d/%d PASS ==========\r\n", pass, total);
    return (pass == total) ? 0 : -1;
}
