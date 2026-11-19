# STM32F103C8Tx_Flash.ld  —— 最小化链接脚本
# 可直接从 STM32Cube_FW_F1 V1.8.6 的 Projects/STM32F103RB_Nucleo/Templates/GCC_LL
# 目录下拷贝 stm32f103rg_flash.ld 后, 只需将 MEMORY 改成以下容量即可
#
# FLASH: 64KB → 65536
# RAM  : 20KB → 20480 (实际 C8T6=20KB)
# 同时需把启动文件 startup_stm32f103xb.s 从 CMSIS 目录拷贝到工程

MEMORY {
  FLASH (rx)      : ORIGIN = 0x08000000, LENGTH = 64K
  RAM   (xrw)     : ORIGIN = 0x20000000, LENGTH = 20K
  MEMORY (xrw)    : ORIGIN = 0x20005000, LENGTH = 3K      /* 片上 RAM bitband 保留 */
}

ENTRY(Reset_Handler)

/* ==== HAL 段定义 (与 CubeMX 输出一致) ==== */
SECTIONS {
  .isr_vector  : { KEEP(*(.isr_vector)) }         > FLASH
  .text        : { *(.text*) }                     > FLASH
  .rodata      : { *(.rodata*) }                   > FLASH
  .ARM.exidx   : { *(.ARM.exidx*) }                > FLASH
  .ARM.extab   : { *(.ARM.extab* .gnu.linkonce.armextab.*) } > FLASH
  _etext = .;

  _sidata = LOADADDR(.data);
  .data : {
    _sdata = .;
    *(.data*);
    _edata = .;
  } > RAM AT > FLASH

  .bss : {
    _sbss = .;
    *(.bss*) *(COMMON);
    _ebss = .;
  } > RAM

  /* C++ 支持 (本科工程可缺省) */
  .ARM.extab   : { *(.ARM.extab* .gnu.linkonce.armextab.*) } > FLASH
  .ARM : { __exidx_start = .; *(.ARM.exidx*) __exidx_end = .; } > FLASH

  /* 用户自定义段: 若未来有需要可扩展 Flash EEPROM 位置 */
  /* .user_eeprom (NOLOAD) : { . = ALIGN(1024); *(.user_eeprom*) } > FLASH */

  _estack = ORIGIN(RAM) + LENGTH(RAM);

  /DISCARD/ : {
    *(.ARM.exidx*)
    *(.ARM.extab*)
  }
}

/* HAL 默认中断向量引用 */
EXTERN(SystemInit)
EXTERN(Main_Handler)
EXTERN(Default_Handler)
EXTERN(__libc_init_array)
