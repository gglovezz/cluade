@echo off
REM ===== HAL 工程生成说明 (Windows) =====
REM 推荐做法: 直接打开本目录下的 AntiSnore.ioc (CubeMX 6.x)
REM 若 .ioc 打不开, 按《实物实现操作手册》第 4 章手动配置, 参数完全等价.

echo ============================================================
echo  AntiSnore 工程生成 (二选一)
echo ============================================================
echo  方式 A (推荐, 30 秒):
echo    1) 新建空文件夹 D:\work\AntiSnore
echo    2) 把本目录的 AntiSnore.ioc 复制进去
echo    3) 双击 AntiSnore.ioc, CubeMX 自动打开全部配置
echo    4) 点 GENERATE CODE, 生成 MDK-ARM 工程
echo.
echo  方式 B (当 .ioc 无法打开时):
echo    按《实物实现操作手册》4.1—4.8 手动填写, 关键参数:
echo      MCU  : STM32F103C8Tx  LQFP48
echo      RCC  : HSE 8MHz, PLL x9 = 72MHz, APB1 /2, ADC /6
echo      ADC1 : IN0(PA0), TIM2 TRGO 触发, DMA1_CH1 循环, 半字
echo      TIM2 : PSC=71, ARR=124  (8kHz 触发)
echo      I2C1 : 400kHz PB6/PB7  (MPU6050 0x68)
echo      I2C2 : 400kHz PB10/PB11 (OLED 0x3C)
echo      TIM1 : CH1 PWM, PSC=71, ARR=19999 (50Hz, PA8)
echo      USART1: 115200 8N1 PA9/PA10
echo      NVIC : DMA1 Channel1 中断使能 (必须!)
echo      SYS  : Debug = Serial Wire
echo ============================================================

echo.
echo 生成完成后务必检查两点:
echo  1) Core/Src/stm32f1xx_it.c 里应有 DMA1_Channel1_IRQHandler
echo  2) 没有的话, 手工补上:
echo        void DMA1_Channel1_IRQHandler(void) { HAL_DMA_IRQHandler(&hdma_adc1); }
echo.
pause
