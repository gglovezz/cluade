/**
 * @file    mpu6050.h / mpu6050.c
 * @brief   MPU6050 I²C 驱动 + 互补融合姿态解算
 *
 *   寄存器映射参考: https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Datasheet1.pdf
 */
#ifndef __MPU6050_H
#define __MPU6050_H
#include "stm32f1xx_hal.h"
#include "pinout.h"

#ifdef __cplusplus
extern "C" {
#endif

#define MPU6050_REG_WHO_AM_I       0x75
#define MPU6050_REG_PWR_MGMT_1     0x6B
#define MPU6050_REG_PWR_MGMT_2     0x6C
#define MPU6050_REG_CONFIG         0x1A
#define MPU6050_REG_GYRO_CONFIG    0x1B
#define MPU6050_REG_ACCEL_CONFIG   0x1C
#define MPU6050_REG_ACCEL_XOUT_H  0x3B
#define MPU6050_REG_PWR_MGMT_1_RST 0x80
#define MPU6050_REG_PWR_MGMT_1_CLK 0x01   /* PLL with X gyro */

int  MPU6050_Init(I2C_HandleTypeDef *hi2c);
int  MPU6050_ReadAll(float *ax, float *ay, float *az,
                     float *gx, float *gy, float *gz);

/* AHRS 互补融合 */
typedef struct {
    float pitch, roll, yaw;
    float alpha;        /* 互补融合系数, α=0.98 表示陀螺仪占主导 */
} Mahony_t;
void AHRS_Init(Mahony_t *ahrs);
void AHRS_Update(Mahony_t *ahrs, float ax, float ay, float az,
                 float gx, float gy, float gz, float dt_sec);

#ifdef __cplusplus
}
#endif
#endif
