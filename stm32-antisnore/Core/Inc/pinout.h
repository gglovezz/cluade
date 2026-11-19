/**
 * @file    pinout.h
 * @brief   系统引脚分配表 —— STM32F103C8T6 (48Pin LQFP)
 * @note    主时钟 HSE=8MHz, PLL→72MHz, HCLK=72MHz, APB1=36MHz, APB2=72MHz
 *
 *   | 引脚 | 功能       | 方向   | 外设/外设模式        | 备注                                    |
 *   | PA0  | MIC_OUT    | ANALOG | ADC1_IN0            | MAX4466 输出, 定时器触发 ADC-DMA 8kHz   |
 *   | PA1  | (保留)     | —      | —                   |                                        |
 *   | PA2  | (保留)     | —      | —                   |                                        |
 *   | PA3  | (保留)     | —      | —                   |                                        |
 *   | PA4  | (保留)     | —      | —                   |                                        |
 *   | PA5  | (保留)     | —      | —                   |                                        |
 *   | PA6  | (保留)     | —      | —                   |                                        |
 *   | PA7  | (保留)     | —      | —                   |                                        |
 *   | PA8  | SERVO_PWM  | AF_PP  | TIM1_CH1            | SG90 PWM 50Hz, 2.5%—12.5% 占空比=0—180° |
 *   | PA9  | USART1_TX  | AF_PP  | USART1_TX           | 调试串口, 115200bps                     |
 *   | PA10 | USART1_RX  | IN_PU  | USART1_RX           |                                        |
 *   | PA11 | (保留)     | —      | —                   |                                        |
 *   | PA12 | (保留)     | —      | —                   |                                        |
 *   | PA13 | SWDIO      | —      | SWD                 | 下载口                                  |
 *   | PA14 | SWCLK      | —      | SWD                 | 下载口                                  |
 *   | PA15 | (保留)     | —      | —                   |                                        |
 *   | PB0  | LED(外接)  | OUT_PP | GPIO                | 运行指示; Blue Pill 板载 LED 是 PC13   |
 *   | PB1  | (保留)     | —      | —                   |                                        |
 *   | PB2  | BOOT1      | —      | —                   | 内部下拉, 保持=0 从Flash启动            |
 *   | PB3  | (保留)     | —      | —                   |                                        |
 *   | PB4  | (保留)     | —      | —                   |                                        |
 *   | PB5  | (保留)     | —      | —                   |                                        |
 *   | PB6  | MPU_I2C_SCL| AF_OD  | I2C1_SCL            | GY-521 模块板载上拉                    |
 *   | PB7  | MPU_I2C_SDA| AF_OD  | I2C1_SDA            | GY-521 模块板载上拉                    |
 *   | PB8  | (保留)     | —      | —                   |                                        |
 *   | PB9  | (保留)     | —      | —                   |                                        |
 *   | PB10 | OLED_I2C_SCL|AF_OD  | I2C2_SCL            | SSD1306, 模块板载上拉                  |
 *   | PB11 | OLED_I2C_SDA|AF_OD  | I2C2_SDA            | SSD1306, 模块板载上拉                  |
 *   | PB12 | (保留)     | —      | —                   |                                        |
 *   | PB13 | (保留)     | —      | —                   |                                        |
 *   | PB14 | (保留)     | —      | —                   |                                        |
 *   | PB15 | (保留)     | —      | —                   |                                        |
 *   | PC13 | MPU_INT    | IN_RISING | GPIO                | MPU6050 数据就绪中断(可选)             |
 *   | PC14 | (保留)     | —      | —                   |                                        |
 *   | PC15 | (保留)     | —      | —                   |                                        |
 *   | PD0  | HSE_OSC_IN | —      | HSE                 | 外部 8MHz 晶振                          |
 *   | PD1  | HSE_OSC_OUT| —      | HSE                 | 外部 8MHz 晶振                          |
 *
 * @attention  引脚冲突检查:
 *   • PA0 做 ADC(麦克风) 与 PA8 做 TIM1_CH1(舵机) 互不冲突
 *   • I2C1(PB6/PB7) 用于 MPU6050, I2C2(PB10/PB11) 用于 OLED, 两条总线独立
 *   • USART1(PA9/PA10) 调试串口
 *   • 所有预留引脚可在后续迭代中扩展
 */
#ifndef __PINOUT_H
#define __PINOUT_H

/* ============ GPIO Port/Pin ============ */
#define LED_PIN           GPIO_PIN_0
#define LED_PORT          GPIOB

/* ============ ADC (麦克风, PA0) ============ */
#define MIC_ADC_HANDLE    &hadc1
#define MIC_ADC_CHANNEL   ADC_CHANNEL_0
#define MIC_ADC_PORT      GPIOA
#define MIC_ADC_PIN       GPIO_PIN_0

/* ============ TIM PWM (舵机, PA8) ============ */
#define SERVO_TIM_HANDLE  &htim1
#define SERVO_TIM_CH      TIM_CHANNEL_1
#define SERVO_PORT        GPIOA
#define SERVO_PIN         GPIO_PIN_8

/* ============ USART1 调试口 (PA9/PA10) ============ */
#define DBG_UART_HANDLE   &huart1

/* ============ MPU6050 I²C1 (PB6=SCL, PB7=SDA) ============ */
#define MPU_I2C_HANDLE    &hi2c1
#define MPU_I2C_SCL_PORT  GPIOB
#define MPU_I2C_SCL_PIN   GPIO_PIN_6
#define MPU_I2C_SDA_PORT  GPIOB
#define MPU_I2C_SDA_PIN   GPIO_PIN_7
#define MPU_INT_PORT      GPIOC
#define MPU_INT_PIN       GPIO_PIN_13

/* ============ OLED I²C2 (PB10=SCL, PB11=SDA) ============ */
#define OLED_I2C_HANDLE   &hi2c2
#define OLED_I2C_SCL_PORT GPIOB
#define OLED_I2C_SCL_PIN  GPIO_PIN_10
#define OLED_I2C_SDA_PORT GPIOB
#define OLED_I2C_SDA_PIN  GPIO_PIN_11
#define OLED_I2C_ADDR     (0x3C << 1)    /* HAL 用 8bit 地址, 左移1位 */

/* ============ 音频采样参数 ============ */
#define MIC_SAMPLE_RATE   8000    /* 8 kHz */
#define MIC_FRAME_LEN     256     /* 每帧 256 样本 → 32ms */
#define MIC_FRAME_OVERLAP 128
#define MIC_RING_LEN      512     /* 环形缓冲 = 2 帧; DMA 半/全传输各完成 256 样本 = 32ms 一帧 */

/* ============ 舵机参数 ============ */
#define SERVO_FREQ_HZ     50      /* 50Hz PWM */
#define SERVO_MIN_US      500     /* 对应 0° */
#define SERVO_MAX_US      2500    /* 对应 180° */
#define SERVO_NEUTRAL_US  1500    /* 90° */

/* ============ MPU6050 I²C 地址 ============ */
#define MPU6050_ADDR         0x68

#endif /* __PINOUT_H */
