# Makefile —— STM32F103C8T6 (Cortex-M3) HAL 工程
#
# 本工程用标准 arm-none-eabi-gcc 交叉编译 (Linux / Mac / WSL)
# Windows 下推荐: 直接在 Keil MDK 或 STM32CubeIDE 里打开
#
# === 环境准备 (仅首次) ===
# Ubuntu/Debian:
#   sudo apt install gcc-arm-none-eabi binutils-arm-none-eabi libnewlib-arm-none-eabi
# macOS (Homebrew):
#   brew install arm-none-eabi-gcc
# === 编译 ===
#   make
# === 下载 ===
#   make flash     (需 openocd + st-link 探针)
#   或: st-flash write build/main.bin 0x8000000
# === 调试 ===
#   make debug     (gdb + openocd gdbserver)
#   arm-none-eabi-gdb build/main.elf
#   (gdb) file build/main.elf
#   (gdb) target remote localhost:3333
#   (gdb) load

CC       = arm-none-eabi-gcc
OBJCOPY  = arm-none-eabi-objcopy
OBJDUMP  = arm-none-eabi-objdump
SIZE     = arm-none-eabi-size

MCU      = -mcpu=cortex-m3 -mthumb
# HAL 驱动源码路径 —— 从 STM32Cube_FW_F1 V1.8.6 解压到 Drivers/ 目录
HAL_DIR  = Drivers/STM32F1xx_HAL_Driver
CMSIS_DIR= CMSIS/Device/ST/STM32F1xx
# 工程自己的源码
SRC_DIR  = Core/Src
INC_DIR  = Core/Inc

# 编译选项
CFLAGS   = $(MCU) -std=gnu11 -g3 -O2 -Wall -Wextra -Wno-unused-parameter \
           -DSTM32F103xB -DUSE_HAL_DRIVER -fno-common \
           -ffunction-sections -fdata-sections \
           -I$(INC_DIR) \
           -I$(HAL_DIR)/Inc \
           -I$(HAL_DIR)/Inc/Legacy \
           -ICMSIS/Include \
           -I$(CMSIS_DIR)/Include \
           -I$(CMSIS_DIR)/Source/Templates/gcc

LDSCRIPT = linker/STM32F103C8Tx_FLASH.ld
LDFLAGS  = $(MCU) -T$(LDSCRIPT) -Wl,--gc-sections,--print-memory-usage -specs=nano.specs

# 源码集合
C_SRCS = $(wildcard $(SRC_DIR)/*.c) \
         $(HAL_DIR)/Src/stm32f1xx_hal.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_adc.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_can.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_cortex.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_dma.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_flash.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_flash_ex.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_gpio.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_i2c.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_pwr.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_rcc.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_rcc_ex.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_tim.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_tim_ex.c \
         $(HAL_DIR)/Src/stm32f1xx_hal_uart.c \
         $(CMSIS_DIR)/Source/Templates/system_stm32f1xx.c

ASM_SRCS = $(CMSIS_DIR)/Source/Templates/gcc/startup_stm32f103xb.s

BUILD   = build
OBJS    = $(patsubst %.c,$(BUILD)/%.o,$(notdir $(C_SRCS))) \
          $(patsubst %.s,$(BUILD)/%.o,$(notdir $(ASM_SRCS)))
# 按源路径做 VPATH, 方便通配编译
VPATH   = $(sort $(dir $(C_SRCS)) $(dir $(ASM_SRCS)))

TARGET  = main

.PHONY: all clean flash debug

all: $(TARGET).elf
	$(SIZE) $(TARGET).elf
	$(OBJCOPY) -O binary $(TARGET).elf $(TARGET).bin
	$(OBJCOPY) -O ihex   $(TARGET).elf $(TARGET).hex
	@echo "--- 构建完成 ---"
	@echo "可烧录 bin: $(shell ls -la $(TARGET).bin | awk '{print $5}') 字节"

$(TARGET).elf: $(OBJS)
	@mkdir -p $(BUILD)
	$(CC) $(OBJS) $(LDFLAGS) -o $@

$(BUILD)/%.o: %.c | $(BUILD)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD)/%.o: %.s | $(BUILD)
	$(CC) $(CFLAGS) -x assembler-with-cpp -c $< -o $@

$(BUILD):
	mkdir -p $(BUILD)

flash: $(TARGET).bin
	st-flash write $(TARGET).bin 0x8000000

debug:
	openocd -f interface/stlink.cfg -f target/stm32f1x.cfg -c 'program $(TARGET).elf verify reset halt'

clean:
	rm -rf $(BUILD) $(TARGET).elf $(TARGET).bin $(TARGET).hex
