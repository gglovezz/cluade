/**
 * @file    mpu6050.c
 * @brief   MPU6050 I²C 寄存器读写 + 互补融合 (Mahony 经典简化版)
 */
#include "mpu6050.h"
#include <math.h>
#include <string.h>

static I2C_HandleTypeDef *s_i2c = NULL;

/* 底层寄存器读写 (HAL I²C API) */
static int mpu_write(uint8_t reg, uint8_t val) {
    return (HAL_I2C_Mem_Write(s_i2c, MPU6050_ADDR << 1, reg, I2C_MEMADD_SIZE_8BIT,
                              &val, 1, 100) == HAL_OK) ? 0 : -1;
}
static int mpu_read(uint8_t reg, uint8_t *buf, int n) {
    return (HAL_I2C_Mem_Read(s_i2c, MPU6050_ADDR << 1, reg, I2C_MEMADD_SIZE_8BIT,
                             buf, n, 100) == HAL_OK) ? 0 : -1;
}

int MPU6050_Init(I2C_HandleTypeDef *hi2c) {
    s_i2c = hi2c;
    uint8_t id = 0;
    if (mpu_read(MPU6050_REG_WHO_AM_I, &id, 1) != 0) return -1;
    if (id != MPU6050_ADDR) return -2;

    /* 复位 */
    mpu_write(MPU6050_REG_PWR_MGMT_1, MPU6050_REG_PWR_MGMT_1_RST);
    HAL_Delay(100);
    /* PLL 启用, 用 X 陀螺仪 */
    mpu_write(MPU6050_REG_PWR_MGMT_1, MPU6050_REG_PWR_MGMT_1_CLK);
    /* 关闭待机 */
    mpu_write(MPU6050_REG_PWR_MGMT_2, 0x00);
    /* 低通滤波 DLPF_CFG=3 → 44Hz */
    mpu_write(MPU6050_REG_CONFIG, 0x03);
    /* 陀螺仪 ±250°/s → 0x00  */
    mpu_write(MPU6050_REG_GYRO_CONFIG, 0x00);
    /* 加速度 ±2g → 0x00       */
    mpu_write(MPU6050_REG_ACCEL_CONFIG, 0x00);
    return 0;
}

int MPU6050_ReadAll(float *ax, float *ay, float *az,
                    float *gx, float *gy, float *gz) {
    uint8_t raw[14];
    if (mpu_read(MPU6050_REG_ACCEL_XOUT_H, raw, 14) != 0) return -1;

    int16_t ax_raw = (int16_t)(raw[0]<<8 | raw[1]);
    int16_t ay_raw = (int16_t)(raw[2]<<8 | raw[3]);
    int16_t az_raw = (int16_t)(raw[4]<<8 | raw[5]);
    int16_t gx_raw = (int16_t)(raw[8]<<8 | raw[9]);
    int16_t gy_raw = (int16_t)(raw[10]<<8 | raw[11]);
    int16_t gz_raw = (int16_t)(raw[12]<<8 | raw[13]);

    /* ±2g → 16384 LSB/g; ±250°/s → 131 LSB/(°/s) */
    *ax = ax_raw / 16384.0f;   *ay = ay_raw / 16384.0f;   *az = az_raw / 16384.0f;
    *gx = gx_raw / 131.0f;    *gy = gy_raw / 131.0f;     *gz = gz_raw / 131.0f;
    return 0;
}

/* 互补融合: 加速度计解 pitch/roll 低频部分, 陀螺仪积分高频部分 */
void AHRS_Init(Mahony_t *a) {
    memset(a, 0, sizeof(*a));
    a->alpha = 0.98f;
}

void AHRS_Update(Mahony_t *a, float ax, float ay, float az,
                 float gx, float gy, float gz, float dt) {
    float accel_pitch = atan2f(ay, az) * 57.2957795f;   /* deg */
    float accel_roll  = atan2f(ax, sqrtf(ay*ay + az*az)) * 57.2957795f;

    a->pitch = a->alpha * (a->pitch + gy * dt) + (1.0f - a->alpha) * accel_pitch;
    a->roll  = a->alpha * (a->roll  + gx * dt) + (1.0f - a->alpha) * accel_roll;
    a->yaw  += gz * dt;     /* 偏航没有加速度计参考, 纯积分 */
}
