/**
 * @file    unit_test.h / unit_test.c
 * @brief   单元测试固件 —— 独立验证各模块, 便于在 PC 端串口查看结果
 *
 *   运行方式: 上电后串口(115200)输入 '1'/'2'/'3'/'4'/'a' 对应不同测试
 *   输出: 打印 PASS/FAIL 与关键数值, 用于论文第五章测试数据采集
 */
#ifndef __UNIT_TEST_H
#define __UNIT_TEST_H
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    UT_NONE = 0,
    UT_MICRO,
    UT_MPU6050,
    UT_OLED,
    UT_SERVO,
    UT_ALL
} UT_Mode_t;

/* 在 main() 单元测试模式调用 */
int  UNIT_TEST_RUN(UT_Mode_t mode);

/* 各模块独立测试函数 (内部) */
int UT_Test_MPU6050(void);
int UT_Test_OLED(void);
int UT_Test_Servo(void);
int UT_Test_Microphone(void);
int UT_Test_Flash(void);

#ifdef __cplusplus
}
#endif
#endif
