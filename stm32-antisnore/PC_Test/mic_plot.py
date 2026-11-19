# 从串口实时采集麦克风原始波形并绘图 —— 验证 ADC 采样质量
# 用法: python3 mic_plot.py /dev/ttyUSB0
# STM32 固件需在 main() 单测模式选 '4' (UT_MIC)
# STM32 固件需额外支持命令 'x' 输出一段 ADC 原始样本 (示例)
import sys
import numpy as np
import matplotlib.pyplot as plt
import serial

PORT = sys.argv[1] if len(sys.argv) > 1 else None
if not PORT:
    print("python3 mic_plot.py /dev/ttyUSB0"); sys.exit(1)

ser = serial.Serial(PORT, 115200, timeout=2)
# 发送 'x' 触发 STM32 输出原始样本 (需在 unit_test.c 扩展命令)
ser.write(b'x\n')

# 等待一行 header
header = ser.readline()
print("header:", header.decode(errors="replace").strip())

data = []
# 假设 STM32 输出 1024 个 12bit 值用逗号分隔在 2 行
buf = b""
for _ in range(2):
    buf += ser.readline()
for v in buf.decode().split(","):
    v = v.strip()
    if v:
        try: data.append(int(v))
        except: pass
if not data:
    print("没收到数据, 固件是否已加 'x' 命令?"); sys.exit(1)

print(f"样本数: {len(data)}, 基线≈2048, pk-pk={max(data)-min(data)}")
plt.figure(figsize=(10, 4))
plt.plot(data, lw=0.8)
plt.title("ADC raw waveform (mic)")
plt.xlabel("sample"); plt.ylabel("12bit ADC count")
plt.tight_layout()
plt.savefig("/workspace/stm32-antisnore/PC_Test/mic_wave.png", dpi=120)
print("已保存 mic_wave.png")
