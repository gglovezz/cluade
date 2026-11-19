# 整体目录结构说明
# 所有核心 C/H 源文件可直接放到 Keil MDK / STM32CubeIDE / Makefile 任意一种工具链
# 以下为论文附录 B 所需源码清单

stm32-antisnore/
├── README.md                       # 本文件
├── Makefile                        # 标准 arm-none-eabi-gcc 交叉编译脚本
├── generate_hal.bat               # Windows 环境 CubeMX 手动配置提示
├── linker/
│   └── STM32F103C8Tx_FLASH.ld      # 链接脚本 (FLSH 64KB, RAM 20KB)
├── hardware/
│   ├── schematic.dot               # Graphviz 原理图源文件
│   ├── schematic.png               # 渲染后原理图 (需安装 graphviz)
│   └── pinout.md                   # 完整引脚分配表 (也在 Core/Inc/pinout.h)
├── Core/
│   ├── Inc/                        # 头文件
│   │   ├── main.h
│   │   ├── pinout.h                # 引脚表 (48 引脚逐项说明)
│   │   ├── mic.h                   # 麦克风 ADC-DMA 驱动
│   │   ├── mpu6050.h               # MPU6050 驱动 + Mahony 互补融合
│   │   ├── oled.h                  # SSD1306 I²C 页帧缓冲
│   │   ├── servo.h                 # SG90 舵机 + 渐进干预状态机
│   │   ├── flash_store.h           # STM32 Flash 伪 EEPROM
│   │   ├── snore_algo.h            # 鼾声特征 + 状态机
│   │   ├── posture_algo.h          # 睡眠体位 (仰卧/侧卧) 判定
│   │   └── unit_test.h             # 单元测试入口
│   └── Src/                        # 实现
│       ├── main.c                  # 系统初始化 + 主循环骨架 + printf 重定向
│       ├── mic.c
│       ├── mpu6050.c
│       ├── oled.c                  # (简单 ASCII 字库, 中文字模可后续替换)
│       ├── servo.c
│       ├── flash_store.c
│       ├── snore_algo.c
│       ├── posture_algo.c
│       └── unit_test.c             # UART 命令驱动单元测试固件
├── PC_Test/                        # 第五章测试数据采集脚本
│   ├── serial_monitor.py           # 简单串口透传 (pyserial)
│   └── mic_plot.py                 # ADC 原始波形可视化 (matplotlib)
└── [外部依赖, 需用户自己下载]
    ├── Drivers/STM32F1xx_HAL_Driver/   # STM32Cube_FW_F1 V1.8.6 HAL
    └── CMSIS/                          # CMSIS Device/CMSIS Core

# 引脚冲突检查 ✅ (论文第三章硬件设计表 3.x 对应)
# PA0  → MIC_ADC  (ADC1)     │  PA8  → SERVO_PWM (TIM1_CH1)      │  PA9/10 → USART1
# PB0  → LED       (GPIO)     │  PB6/7 → MPU_I2C (I2C1)            │  PB10/11 → OLED_I2C (I2C2)
# PC13 → MPU_INT   (GPIO_IN)  │  PD0/1 → HSE 8MHz 晶振
# 所有模块引脚独立, 无冲突 ✅

# HAL 外设启用宏 (stm32f1xx_hal_conf.h)
# 必须把以下外设宏从注释中解除注释:
#   #define HAL_MODULE_ENABLED        /* 核心 */
#   #define HAL_GPIO_MODULE_ENABLED
#   #define HAL_DMA_MODULE_ENABLED
#   #define HAL_ADC_MODULE_ENABLED
#   #define HAL_I2C_MODULE_ENABLED
#   #define HAL_TIM_MODULE_ENABLED
#   #define HAL_UART_MODULE_ENABLED
#   #define HAL_FLASH_MODULE_ENABLED
#   #define HAL_RCC_MODULE_ENABLED
#   #define HAL_PWR_MODULE_ENABLED
#   #define HAL_CORTEX_MODULE_ENABLED
#   #define HAL_PCD_MODULE_ENABLED    /* CubeMX 默认就开 */
