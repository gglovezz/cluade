# PC 端串口可视化测试脚本 —— 配合 STM32 固件单元测试
# 用法: python3 serial_monitor.py [COM_PORT] [BAUD=115200]
# Linux/Mac: ls /dev/ttyUSB* 或 /dev/ttyACM*
# Windows  : COM3 / COM4 ...
import sys, time
import serial

PORT = sys.argv[1] if len(sys.argv) > 1 else None
BAUD = int(sys.argv[2]) if len(sys.argv) > 2 else 115200

if not PORT:
    print("请传入串口, 例如: python3 serial_monitor.py /dev/ttyUSB0")
    sys.exit(1)

ser = serial.Serial(PORT, BAUD, timeout=0.3)
print(f"已打开 {PORT} @ {BAUD}, 回车发送 'a' 运行全部单测")
print("-" * 40)
try:
    while True:
        line = ser.readline()
        if line:
            print(line.decode("utf-8", errors="replace").rstrip())
        # 非阻塞读取控制台 (简单版)
        line2 = sys.stdin.readline()
        if line2:
            ser.write(line2.encode())
except KeyboardInterrupt:
    ser.close()
    print("\n关闭串口")
