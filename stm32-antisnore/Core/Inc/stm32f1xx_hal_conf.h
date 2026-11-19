/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file    stm32f1xx_hal_conf.h
  * @brief   HAL 模块启用配置 —— 根据本工程实际用到的外设, 将
  *          对应 *_MODULE_ENABLED 宏从注释中解除注释即可
  *
  *   ⚠️ 注意: 这是从 STM32Cube_FW_F1 V1.8.6 提供的 stm32f1xx_hal_conf_template.h
  *          拷贝并修改而来。新工程请先用 CubeMX 生成 (更稳妥), 或直接用本文件作为基础
  *          复制到 Drivers/STM32F1xx_HAL_Driver/Inc/ 目录下重命名为 stm32f1xx_hal_conf.h
  ******************************************************************************
  */
/* USER CODE END Header */

#ifndef __STM32F1xx_HAL_CONF_H
#define __STM32F1xx_HAL_CONF_H

#ifdef __cplusplus
 extern "C" {
#endif

/* ====== HAL 核心模块 (必须启用) ====== */
#define HAL_MODULE_ENABLED

/* ====== GPIO & 系统外设 ====== */
#define HAL_GPIO_MODULE_ENABLED
#define HAL_DMA_MODULE_ENABLED
#define HAL_CORTEX_MODULE_ENABLED
#define HAL_RCC_MODULE_ENABLED
#define HAL_PWR_MODULE_ENABLED
#define HAL_FLASH_MODULE_ENABLED

/* ====== 本工程用到的外设 (解除注释) ====== */
#define HAL_ADC_MODULE_ENABLED
#define HAL_I2C_MODULE_ENABLED
#define HAL_TIM_MODULE_ENABLED
#define HAL_UART_MODULE_ENABLED

/* ====== 以下外设本工程暂不用, 注释掉以减小工程体积 ====== */
/* #define HAL_APB_MODULE_ENABLED   */
/* #define HAL_CAN_MODULE_ENABLED   */
/* #define HAL_IWDG_MODULE_ENABLED  */
/* #define HAL_RTC_MODULE_ENABLED   */
/* #define HAL_SPI_MODULE_ENABLED   */
/* #define HAL_WWDG_MODULE_ENABLED  */
/* #define HAL_PCD_MODULE_ENABLED   */
/* #define HAL_HCD_MODULE_ENABLED   */

/* ====== HAL 通用参数 ====== */
#define USE_HAL_ADC_REGISTER_CALLBACKS         0
#define USE_HAL_I2C_REGISTER_CALLBACKS         0
#define USE_HAL_TIM_REGISTER_CALLBACKS         0
#define USE_HAL_UART_REGISTER_CALLBACKS        0
/* ... (其余默认保留 0) ... */

/* ====== assert 参数校验 ====== */
#ifdef  USE_FULL_ASSERT
  #define assert_param(expr) ((expr) ? (void)0U : assert_failed((uint8_t *)__FILE__, __LINE__))
  void assert_failed(uint8_t *file, uint32_t line);
#else
  #define assert_param(expr) ((void)0U)
#endif

#include "stm32f1xx_hal_msp.h"

#ifdef __cplusplus
}
#endif

#endif /* __STM32F1xx_HAL_CONF_H */
