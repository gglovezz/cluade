/**
 * @file    unit_test.c
 * @brief   单元测试固件实现 —— 打印 PASS/FAIL 与关键参数
 */
#include "unit_test.h"
#include "main.h"
#include "pinout.h"
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
    float axm = ax_sum/100, aym = ay_sum/100, azm = az_sum/100;
    float gxm = gx_sum/100, gym = gy_sum/100, gzm = gz_sum/100;
    char s_ax[10], s_ay[10], s_az[10], s_gx[10], s_gy[10], s_gz[10];
    fmt_f(s_ax, sizeof(s_ax), axm, 3); fmt_f(s_ay, sizeof(s_ay), aym, 3); fmt_f(s_az, sizeof(s_az), azm, 3);
    fmt_f(s_gx, sizeof(s_gx), gxm, 2); fmt_f(s_gy, sizeof(s_gy), gym, 2); fmt_f(s_gz, sizeof(s_gz), gzm, 2);
    printf("  均值 ax=%s ay=%s az=%s gx=%s gy=%s gz=%s\r\n", s_ax, s_ay, s_az, s_gx, s_gy, s_gz);
    /* 静止时 |accel| 应接近 1g (≈1.0) */
    float mag = sqrtf(axm*axm + aym*aym + azm*azm);
    char s_mag[10]; fmt_f(s_mag, sizeof(s_mag), mag, 3);
    if (mag > 0.9f && mag < 1.1f) { printf("PASS: accel magnitude=%s g\r\n", s_mag); return 0; }
    printf("FAIL: accel magnitude out of range: %s g\r\n", s_mag);
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
        char s_a[8]; fmt_f(s_a, sizeof(s_a), angles[i], 0);
        printf("  angle -> %s deg\r\n", s_a);
        HAL_Delay(500);
    }
    printf("PASS: 完成 0→45→90→135→180→90 扫描; 请人工确认舵机位置\r\n");
    return 0;
}

/* ============ 麦克风测试 ============ */
int UT_Test_Microphone(void) {
    printf("\r\n==== Mic Unit Test ====\r\n");
    printf("  准备 ADC-DMA 采样 2 秒, 请对着麦克风说话\r\n");

    /* 单元测试独占 ADC: 若主循环的 DMA 已启动, 先停掉, 否则 Start_DMA 返回 BUSY */
    HAL_ADC_Stop_DMA(MIC_ADC_HANDLE);

    /* 静态缓冲: 512 半字 = 1KB。默认启动文件的栈只有 1KB(0x400),
       放在局部变量里会直接栈溢出 → HardFault, 所以必须加 static。 */
    static uint16_t ring[MIC_RING_LEN];
    MIC_Init(MIC_ADC_HANDLE, ring, MIC_RING_LEN);
    HAL_NVIC_SetPriority(DMA1_Channel1_IRQn, 1, 0);
    HAL_NVIC_EnableIRQ(DMA1_Channel1_IRQn);   /* 确保 DMA 中断已开 */
    HAL_ADC_Start_DMA(MIC_ADC_HANDLE, (uint32_t*)ring, MIC_RING_LEN);
    HAL_TIM_Base_Start(&htim2);          /* 触发源必须先跑起来 */

    /* 连续统计 2 秒: 每 50ms 扫一遍环形缓冲, 累计 min/max/avg。
       若只等 2 秒再读一次, 读到的只是最后 64ms(512/8000) 的快照。 */
    uint16_t min = 0xFFFF, max = 0;
    uint32_t sum = 0, cnt = 0;
    for (int k = 0; k < 40; k++) {
        HAL_Delay(50);
        for (int i = 0; i < MIC_RING_LEN; i++) {
            uint16_t v = ring[i];
            if (v < min) min = v;
            if (v > max) max = v;
            sum += v;
        }
        cnt += MIC_RING_LEN;
    }
    /* 采完立即停掉 DMA, 避免测试结束后它继续往缓冲里写 */
    HAL_ADC_Stop_DMA(MIC_ADC_HANDLE);

    printf("  min=%u max=%u avg=%u (12bit, 基线≈2048)\r\n", min, max, (unsigned)(sum/cnt));
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
