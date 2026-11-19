# 整体目录结构说明
# 推荐流程: 用 AntiSnore.ioc 生成 CubeMX 工程, 再按《实物实现操作手册》第 5 章把
#           Core/Inc、Core/Src 中的 .c/.h 加入工程 (不要加入本工程的 main.c)

stm32-antisnore/
├── README.md                       # 本文件
├── AntiSnore.ioc                   # CubeMX 工程配置 (双击打开 → GENERATE CODE)
├── Makefile                        # arm-none-eabi-gcc 脚本 (进阶, 需自行补 HAL 库)
├── generate_hal.bat               # 生成工程的两条路线说明 (推荐 .ioc)
├── linker/
│   └── STM32F103C8Tx_FLASH.ld      # 链接脚本 (FLASH 64KB, RAM 20KB)
├── hardware/
│   ├── schematic.dot               # Graphviz 原理图源文件
│   ├── schematic.png               # 渲染后原理图
│   └── figures/                    # 论文第 5 章 8 张数据图
├── Core/
│   ├── Inc/                        # 头文件
│   │   ├── main.h                  # 仅本仓库参考用; CubeMX 工程请用它自己生成的 main.h
│   │   ├── pinout.h                # 引脚表 + 外设句柄 extern + fmt_f 浮点格式化
│   │   ├── mic.h                   # 麦克风 ADC-DMA 驱动
│   │   ├── mpu6050.h               # MPU6050 驱动 + Mahony 互补融合
│   │   ├── oled.h                  # SSD1306 I²C 页帧缓冲
│   │   ├── servo.h                 # SG90 舵机 + 渐进干预状态机
│   │   ├── flash_store.h           # STM32 Flash 伪 EEPROM
│   │   ├── snore_algo.h            # 鼾声特征 + 状态机
│   │   ├── posture_algo.h          # 睡眠体位 (仰卧/侧卧) 判定
│   │   ├── fusion_fsm.h            # 声音+体位融合触发状态机
│   │   ├── app.h                   # 应用层入口 (APP_Init / APP_Console / APP_Loop)
│   │   └── unit_test.h             # 单元测试入口
│   └── Src/                        # 实现
│       ├── main.c                  # 逻辑参考骨架 (外设初始化由 CubeMX 生成, 不要加入编译)
│       ├── mic.c
│       ├── mpu6050.c
│       ├── oled.c                  # 8×16 ASCII 字库 (0x20—0x7E, 含小写与符号)
│       ├── servo.c
│       ├── flash_store.c
│       ├── snore_algo.c
│       ├── posture_algo.c
│       ├── fusion_fsm.c            # 融合触发状态机 (真实毫秒计时)
│       ├── app.c                   # 应用层实现 (推荐: 由 CubeMX 的 main.c 调用)
│       └── unit_test.c             # UART 命令驱动单元测试固件
├── PC_Test/                        # 第五章测试与仿真
│   ├── serial_monitor.py           # 串口透传 (pyserial)
│   ├── mic_plot.py                 # ADC 原始波形可视化 (matplotlib)
│   ├── sim_main.py                 # 全流程算法仿真, 输出 8 张图
│   └── snore_py.py                 # Python 版鼾声算法
└── [外部依赖, 需用户自己下载]
    ├── Drivers/STM32F1xx_HAL_Driver/   # STM32Cube_FW_F1 V1.8.x HAL
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
