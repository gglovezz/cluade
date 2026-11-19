/**
 * @file    main.c
 * @brief   STM32F103 主控源文件 —— HAL 初始化 + 主循环骨架
 * @note    由 STM32CubeMX 自动生成框架, 此处基于 CubeMX 输出进行最小化修改
 *
 *   编译条件: 使用 STM32Cube_FW_F1 V1.8.6 HAL 库, 需在工程中加入:
 *     Drivers/STM32F1xx_HAL_Driver/Src/stm32f1xx_*.c
 *     Drivers/STM32F1xx_HAL_Driver/Src/stm32f1xx_hal_msp.c
 *     CMSIS/Device/ST/STM32F1xx/Source/Templates/system_stm32f1xx.c
 *     CMSIS/Device/ST/STM32F1xx/Source/Templates/gcc/startup_stm32f103xb.s
 */
#include "main.h"
#include <stdio.h>
#include <string.h>

/* 独立模块头文件 */
#include "pinout.h"
#include "mic.h"
#include "mpu6050.h"
#include "oled.h"
#include "servo.h"
#include "flash_store.h"
#include "snore_algo.h"
#include "posture_algo.h"
#include "fusion_fsm.h"
#include "unit_test.h"

/* ============== 外设句柄定义 ============== */
ADC_HandleTypeDef  hadc1;
I2C_HandleTypeDef  hi2c1;   /* MPU6050 */
I2C_HandleTypeDef  hi2c2;   /* OLED    */
TIM_HandleTypeDef  htim1;   /* 舵机 PWM */
TIM_HandleTypeDef  htim2;   /* 可选 */
UART_HandleTypeDef huart1;

/* DMA (ADC 用) */
DMA_HandleTypeDef  hdma_adc1;

/* 音频环形缓冲 (DMA 回写) */
static volatile uint16_t mic_ring[MIC_RING_LEN];
static volatile uint8_t  mic_frame_ready_flag = 0;

/* ============ printf 重定向 ============ */
#ifdef __GNUC__
int __io_putchar(int ch) {
    HAL_UART_Transmit(&huart1, (uint8_t*)&ch, 1, HAL_MAX_DELAY);
    return ch;
}
#endif

/* ============ 主程序 ============ */
int main(void) {
    HAL_Init();
    SystemClock_Config();

    MX_GPIO_Init();
    MX_DMA_Init();
    MX_ADC1_Init();
    MX_I2C1_Init();
    MX_I2C2_Init();
    MX_TIM1_Init();
    MX_TIM2_Init();
    MX_USART1_UART_Init();

    /* ------ 单元测试入口:串口输入 '1'—'4'/'a' 进入单测模式 ------ */
    uint8_t ch = 0;
    printf("\r\n========== 智能止鼾枕 启动 ==========\r\n");
    printf("输入: '1'=MPU自检  '2'=OLED自检  '3'=舵机自检  '4'=麦克风采样\r\n");
    printf("      'a'=全部单元测试  'r'=运行主循环\r\n> ");
    fflush(stdout);
    while (1) {
        if (HAL_UART_Receive(&huart1, &ch, 1, 100) == HAL_OK) {
            if (ch == '1') { UNIT_TEST_RUN(UT_MPU6050); }
            else if (ch == '2') { UNIT_TEST_RUN(UT_OLED); }
            else if (ch == '3') { UNIT_TEST_RUN(UT_SERVO); }
            else if (ch == '4') { UNIT_TEST_RUN(UT_MICRO); }
            else if (ch == 'a') { UNIT_TEST_RUN(UT_ALL); }
            else if (ch == 'r') { break; }
            printf("\r\n> "); fflush(stdout);
        }
    }

    /* ============== 正常运行初始化 ============== */
    BSP_Init();
    MIC_Init(MIC_ADC_HANDLE, mic_ring, MIC_RING_LEN);
    MPU6050_Init(MPU_I2C_HANDLE);
    OLED_Init(OLED_I2C_HANDLE);
    SERVO_Init(SERVO_TIM_HANDLE, SERVO_TIM_CH);
    FLASH_Store_Init();
    SNORE_Algo_Init();
    POSTURE_Algo_Init();
    FUSION_Init();                          /* 融合触发 FSM 初始化 */

    /* 启动 ADC-DMA 连续采样 (8kHz) */
    HAL_ADC_Start_DMA(MIC_ADC_HANDLE, (uint32_t*)mic_ring, MIC_RING_LEN);

    printf("系统就绪, 进入主循环\r\n");
    OLED_Clear();
    OLED_DrawString(0, 0, "Smart Pillow OK");
    OLED_Update();

    /* ============== 主循环 (5ms 节拍) ============== */
    uint32_t tick = 0;
    while (1) {
        HAL_Delay(5);
        tick++;

        /* 姿态读取 (50ms 一次) */
        if ((tick % 10) == 0) {
            float ax, ay, az, gx, gy, gz;
            MPU6050_ReadAll(&ax, &ay, &az, &gx, &gy, &gz);
            POSTURE_Algo_Update(ax, ay, az);     /* 解算 pitch/roll, 判断仰卧/侧卧 */
        }

        /* 鼾声检测 (每 32ms 触发 —— 由 DMA/定时器中断写入 MIC_FRAME_LEN 样本) */
        if (MIC_FrameReady_Flag()) {
            static uint16_t frame[MIC_FRAME_LEN];   /* 静态: 避免 512B 占用 1KB 栈 */
            MIC_ReadFrame(frame);
            SNORE_Algo_Update(frame, MIC_FRAME_LEN);
        }

        /* 融合触发状态机 (每个主循环节拍都调用 —— 内部自带 3s/15s/5s 计时器) */
        FUSION_Tick();

        /* OLED 轮播刷新 (500ms 一次) */
        if ((tick % 100) == 0) {
            static uint8_t page = 0;
            if (page == 0) {
                /* 第 0 页: 融合状态 + 触发条件保持时间 */
                char line1[20], line2[24], line3[24];
                snprintf(line1, sizeof(line1), "FSM: %s", FUSION_StateName(FUSION_GetState()));
                snprintf(line2, sizeof(line2), "Snore:%lus Sup:%lus",
                         FUSION_GetSnoreHoldMs()/1000, FUSION_GetSupineHoldMs()/1000);
                OLED_Clear();
                OLED_DrawString(0, 0, line1);
                OLED_DrawString(0, 16, line2);
            } else if (page == 1) {
                char s_ang[10], buf[24];
                fmt_f(s_ang, sizeof(s_ang), SERVO_GetCurrentAngle(), 1);
                snprintf(buf, sizeof(buf), "Angle: %s deg", s_ang);
                OLED_Clear();
                OLED_DrawString(0, 0, buf);
            } else {
                uint32_t s = FLASH_Store_Get_SnoreCnt();
                uint32_t i = FLASH_Store_Get_InterveneCnt();
                char buf[32];
                OLED_Clear();
                snprintf(buf, sizeof(buf), "Snore  : %lu", s);  OLED_DrawString(0, 0, buf);
                snprintf(buf, sizeof(buf), "Interv : %lu", i);  OLED_DrawString(0, 8, buf);
            }
            OLED_Update();
            page = (page + 1) % 3;
        }

        /* UART 控制指令 (非阻塞) */
        uint8_t ch2;
        if (HAL_UART_Receive(&huart1, &ch2, 1, 0) == HAL_OK) {
            /* 可以在此扩展远程控制 */
            if (ch2 == 's') {
                char s_ang[10];
                fmt_f(s_ang, sizeof(s_ang), SERVO_GetCurrentAngle(), 1);
                printf("snore=%d supine=%d angle=%s\r\n",
                       SNORE_Algo_IsSnoring(), POSTURE_Algo_IsSupine(), s_ang);
            }
        }
    }
}

/* ============== 系统时钟配置 (HSE8 → PLL×9 → 72MHz) ============== */
void SystemClock_Config(void) {
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
    RCC_OscInitStruct.OscillatorType  = RCC_OSCILLATORTYPE_HSE;
    RCC_OscInitStruct.HSEState        = RCC_HSE_ON;
    RCC_OscInitStruct.HSEPredivValue  = RCC_HSE_PREDIV_DIV1;
    RCC_OscInitStruct.PLL.PLLState    = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource   = RCC_PLLSOURCE_HSE;
    RCC_OscInitStruct.PLL.PLLMUL      = RCC_PLL_MUL9;
    HAL_RCC_OscConfig(&RCC_OscInitStruct);

    RCC_ClkInitStruct.ClockType       = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                                       |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource    = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider   = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider  = RCC_HCLK_DIV2;   /* 36MHz */
    RCC_ClkInitStruct.APB2CLKDivider  = RCC_HCLK_DIV1;   /* 72MHz */
    HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2);
}

/* ============== 中断处理 (CubeMX 模板, 必须保留) ============== */
void NMI_Handler(void){}
void HardFault_Handler(void){}
void MemManage_Handler(void){}
void BusFault_Handler(void){}
void UsageFault_Handler(void){}
void SVC_Handler(void){}
void DebugMon_Handler(void){}
void PendSV_Handler(void){}
void SysTick_Handler(void){ HAL_IncTick(); }

/* ============ 空的 CubeMX 模板函数 —— 实际 Msp 实现在 stm32f1xx_hal_msp.c ============ */
void MX_GPIO_Init(void){}
void MX_DMA_Init(void){}
void MX_ADC1_Init(void){}
void MX_I2C1_Init(void){}
void MX_I2C2_Init(void){}
void MX_TIM1_Init(void){}
void MX_TIM2_Init(void){}
void MX_USART1_UART_Init(void){}

/* ============ BSP_Init —— 外设 Msp 实际实现 ============ */
void BSP_Init(void) {
    /* LED PB0 推挽输出 */
    GPIO_InitTypeDef g = {0};
    __HAL_RCC_GPIOB_CLK_ENABLE();   /* PB0 属于 GPIOB, 使用前必须开时钟 */
    g.Pin   = LED_PIN;
    g.Mode  = GPIO_MODE_OUTPUT_PP;
    g.Pull  = GPIO_NOPULL;
    g.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(LED_PORT, &g);
    HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_RESET);
}
