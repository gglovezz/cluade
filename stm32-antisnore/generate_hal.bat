@echo off
REM ===== 一键生成 HAL 工程 (Windows 环境) =====
REM 使用 STM32CubeMX 6.10.1+, 运行时会自动执行 Generate Code
REM 本工程以 CubeMX 的配置为起点, 后续我们基于它做最小化修改

echo 请先使用 STM32CubeMX 手动配置, 或直接打开: project/antisnore.ioc
echo ==== 推荐 CubeMX 配置选项 ====
echo . MCU: STM32F103C8Tx, LQFP48, 72MHz
echo . RCC: HSE=8MHz, PLL: 9倍频 → 72MHz
echo . GPIO:
echo .   PB0    → GPIO_Output (推挽, 低电平)
echo .   PC13   → GPIO_Input (上拉, 中断可选)
echo . ADC1  → CH0 PA0, 8kHz 触发 (TIM2 TRGO)
echo . DMA1  → ADC1_CH1, circular + HalfCplt + Cplt 中断
echo . I2C1  → 400kHz (PB6/PB7), MPU6050
echo . I2C2  → 400kHz (PB10/PB11), OLED
echo . TIM1  → CH1 PWM_1KHz (PA8) —— 先配 1kHz 可后改成 50Hz, 或 CubeMX 50Hz
echo . TIM2  → ClockSource Internal, Update Event 8kHz 触发 ADC
echo . USART1 → 115200 8N1, PA9/PA10
echo . NVIC: DMA1 Channel1, TIM2 Update (若单独触发)
echo . Project Manager: MDK-ARM v5 OR Makefile
echo =================================

echo 若 CubeMX 已生成, 把生成的 Core/Inc / Core/Src / Drivers/ / CMSIS/ 覆盖到当前工程对应位置,
echo 再把本工程 Core/Inc/pinout.h + 我们新增的 .c/.h 加到工程里即可.

pause
