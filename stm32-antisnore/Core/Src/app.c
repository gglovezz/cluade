/**
 * @file    app.c
 * @brief   应用层实现 —— 把原 main.c 中的业务逻辑收敛到 APP_Init / APP_Loop,
 *          使 CubeMX 生成的 main.c 只需粘贴 4 行代码即可完成集成。
 *
 * @note    本文件自带 LED 初始化与 ADC-DMA 回调, 不依赖工程的 main.c。
 *          使用 CubeMX 工程时请勿再把本工程的 Core/Src/main.c 加入编译。
 */
#include "app.h"
#include "main.h"      /* CubeMX 生成: 提供 hadc1/hi2c1/hi2c2/htim1/huart1 的 extern 声明 */
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

#include <stdio.h>

/* ============ 内部变量 ============ */
static volatile uint16_t s_mic_ring[MIC_RING_LEN];   /* ADC-DMA 环形缓冲 */
static uint32_t          s_tick = 0;                /* 5ms 节拍计数 */

/* ADC 采集帧缓冲 (避免放在栈上) */
static uint16_t s_frame[MIC_FRAME_LEN];

/* ============ LED (PB0, 外接 LED + 1kΩ 限流电阻) ============ */
static void LedInit(void)
{
    GPIO_InitTypeDef g = {0};
    __HAL_RCC_GPIOB_CLK_ENABLE();
    g.Pin   = LED_PIN;
    g.Mode  = GPIO_MODE_OUTPUT_PP;
    g.Pull  = GPIO_NOPULL;
    g.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(LED_PORT, &g);
    HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_RESET);
}

/* ============ ADC + DMA 回调 —— 供 mic.c 置帧就绪标志 ============ */
void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef *hadc)
{
    if (hadc->Instance == ADC1) {
        MIC_DmaCpltCallback();
    }
}

void HAL_ADC_ConvHalfCpltCallback(ADC_HandleTypeDef *hadc)
{
    if (hadc->Instance == ADC1) {
        MIC_DmaCpltCallback();
    }
}

/* ============ 初始化 ============ */
void APP_Init(void)
{
    LedInit();

    MIC_Init(MIC_ADC_HANDLE, s_mic_ring, MIC_RING_LEN);
    MPU6050_Init(MPU_I2C_HANDLE);
    OLED_Init(OLED_I2C_HANDLE);
    SERVO_Init(SERVO_TIM_HANDLE, SERVO_TIM_CH);
    FLASH_Store_Init();

    SNORE_Algo_Init();
    POSTURE_Algo_Init();
    FUSION_Init();

    /* ADC 校准 (F1 系列必须做, 否则零点漂移)
       注意: 此处只校准不启动采样 —— 串口菜单里的麦克风单元测试要独占 ADC,
             等用户输入 'r' 进入主循环时再统一启动 DMA 与 TIM2。 */
    HAL_ADCEx_Calibration_Start(MIC_ADC_HANDLE);

    /* 上电提示 */
    printf("\r\n========== 智能止鼾枕 启动 ==========\r\n");
    HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_SET);
}

/* ============ 串口交互菜单 (阻塞) ============ */
void APP_Console(void)
{
    uint8_t ch = 0;
    printf("输入: '1'=MPU自检 '2'=OLED自检 '3'=舵机自检 '4'=麦克风采样\r\n");
    printf("      'a'=全部单元测试  'r'=运行主循环\r\n> ");
    fflush(stdout);

    while (1) {
        if (HAL_UART_Receive(DBG_UART_HANDLE, &ch, 1, 100) == HAL_OK) {
            if (ch == '1')      { (void)UNIT_TEST_RUN(UT_MPU6050); }
            else if (ch == '2') { (void)UNIT_TEST_RUN(UT_OLED);    }
            else if (ch == '3') { (void)UNIT_TEST_RUN(UT_SERVO);   }
            else if (ch == '4') { (void)UNIT_TEST_RUN(UT_MICRO);   }
            else if (ch == 'a') { (void)UNIT_TEST_RUN(UT_ALL);     }
            else if (ch == 'r') { break; }
            printf("\r\n> ");
            fflush(stdout);
        }
    }
    printf("系统就绪, 进入主循环\r\n");

    /* 从这里开始才启动麦克风采样。
       注意: 单元测试 '4' / 'a' 会用临时缓冲重新初始化 mic,
       所以这里必须把缓冲重新绑定回主循环的 s_mic_ring, 否则读的是已经失效的栈内存。 */
    MIC_Init(MIC_ADC_HANDLE, s_mic_ring, MIC_RING_LEN);
    HAL_ADC_Start_DMA(MIC_ADC_HANDLE, (uint32_t *)s_mic_ring, MIC_RING_LEN);
    HAL_TIM_Base_Start(&htim2);

    /* 进入主循环前给屏幕一个明确的就绪提示 */
    OLED_Clear();
    OLED_DrawString(0, 0, "System Ready");
    OLED_Update();
}

/* ============ 主循环体 (5ms 节拍) ============ */
void APP_Loop(void)
{
    HAL_Delay(5);
    s_tick++;

    /* 1) 姿态读取: 50ms 一次 */
    if ((s_tick % 10U) == 0U) {
        float ax, ay, az, gx, gy, gz;
        MPU6050_ReadAll(&ax, &ay, &az, &gx, &gy, &gz);
        POSTURE_Algo_Update(ax, ay, az);
    }

    /* 2) 鼾声检测: 每凑满 256 样本即处理一帧 */
    if (MIC_FrameReady_Flag()) {
        MIC_ReadFrame(s_frame);
        SNORE_Algo_Update(s_frame, MIC_FRAME_LEN);
    }

    /* 3) 融合触发状态机: 每个节拍都跑 */
    FUSION_Tick();

    /* 4) OLED 3 页轮播: 500ms 一次 */
    if ((s_tick % 100U) == 0U) {
        static uint8_t page = 0;
        char buf[24];

        OLED_Clear();
        if (page == 0) {
            snprintf(buf, sizeof(buf), "FSM: %s", FUSION_StateName(FUSION_GetState()));
            OLED_DrawString(0, 0, buf);
            snprintf(buf, sizeof(buf), "Snore:%lus Sup:%lus",
                     (unsigned long)(FUSION_GetSnoreHoldMs() / 1000U),
                     (unsigned long)(FUSION_GetSupineHoldMs() / 1000U));
            OLED_DrawString(0, 16, buf);
        } else if (page == 1) {
            snprintf(buf, sizeof(buf), "Angle: %.1f deg", SERVO_GetCurrentAngle());
            OLED_DrawString(0, 0, buf);
        } else {
            snprintf(buf, sizeof(buf), "Snore : %lu",
                     (unsigned long)FLASH_Store_Get_SnoreCnt());
            OLED_DrawString(0, 0, buf);
            snprintf(buf, sizeof(buf), "Interv: %lu",
                     (unsigned long)FLASH_Store_Get_InterveneCnt());
            OLED_DrawString(0, 8, buf);
        }
        OLED_Update();
        page = (uint8_t)((page + 1U) % 3U);

        /* 运行指示灯心跳 */
        HAL_GPIO_TogglePin(LED_PORT, LED_PIN);
    }

    /* 5) 串口即时查询: 发送 's' 回传一行状态 */
    {
        uint8_t ch = 0;
        if (HAL_UART_Receive(DBG_UART_HANDLE, &ch, 1, 0) == HAL_OK && ch == 's') {
            printf("snore=%d supine=%d angle=%.1f\r\n",
                   SNORE_Algo_IsSnoring(),
                   POSTURE_Algo_IsSupine(),
                   SERVO_GetCurrentAngle());
        }
    }
}
