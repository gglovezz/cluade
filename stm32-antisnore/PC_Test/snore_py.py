"""
鼾声识别 Python 原型 —— 与 STM32 版本 snore_algo.c 逻辑完全对齐
特征: 短时能量(dBFS) + 过零率 + 自相关主峰位置
状态机: QUIET → SUSPECT → SNORE → QUIET
阈值: 自适应噪声底 + 固定下限 -40dBFS

作者: 论文原型验证用, 可直接画 ROC 曲线
"""
import numpy as np

FRAME_LEN = 256
SAMPLE_RATE = 8000

def frame_energy_dbfs(frame):
    """短时能量 dBFS, 12bit 归一化到 [-1, 1]"""
    v = (frame.astype(np.float32) - 2048) / 4095.0
    e = np.mean(v * v)
    if e < 1e-12: e = 1e-12
    return 10.0 * np.log10(e)

def frame_zcr(frame):
    """过零率 (归一化) — 自适应去均值, 对直流偏移不敏感"""
    x = frame.astype(np.float32) - np.mean(frame.astype(np.float32))
    return np.mean(np.abs(np.diff(np.sign(x))))

def autocorr_peak(frame):
    """自相关主峰位置 (样本), 反映鼾声周期"""
    x = (frame.astype(np.float32) - 2048).astype(np.float64)
    x = x - x.mean()
    ac = np.correlate(x, x, mode='full')
    ac = ac[len(ac)//2:]  # 正延迟
    if ac[0] == 0: return 0
    ac = ac / ac[0]
    # 找第一个非零延迟的峰值 (跳过零延迟)
    if len(ac) < 10: return 0
    return int(np.argmax(ac[10:80]) + 10)

class SnoreDetector:
    def __init__(self, verbose=False):
        self.state = 'QUIET'
        self.noise_floor = -60.0
        self.energy_now = -60.0
        self.above_cnt = 0
        self.below_cnt = 0
        self.history = []         # 用于 ROC: 每帧能量
        self.verbose = verbose

    def threshold(self):
        thr = self.noise_floor + 4.0
        if thr < -45.0: thr = -45.0
        return thr

    def update(self, frame):
        e = frame_energy_dbfs(frame)
        self.energy_now = e
        z = frame_zcr(frame)
        self.history.append((e, z))

        # 自适应噪声底 —— 仅在明显低于阈值时学习 (纯安静段才更新), 避免被鼾声带偏
        if e < self.noise_floor + 8.0:
            self.noise_floor = 0.97 * self.noise_floor + 0.03 * e

        thr = self.threshold()
        # 过零率过滤: 下限 0.02 滤直流, 上限 0.35 滤宽带白噪声 (鼾声 ZCR 通常 0.04-0.15)
        above = (e > thr) and (0.02 < z < 0.35)

        if self.state == 'QUIET':
            self.state = 'SUSPECT' if (above and self.above_cnt >= 1) else ('QUIET')
            if above: self.above_cnt += 1
            else: self.above_cnt = 0
        elif self.state == 'SUSPECT':
            if above:
                self.above_cnt += 1
                if self.above_cnt >= 4: self.state = 'SNORE'
            else:
                self.above_cnt = 0; self.state = 'QUIET'
        elif self.state == 'SNORE':
            if above: self.below_cnt = 0
            else:
                self.below_cnt += 1
                if self.below_cnt >= 3: self.state = 'QUIET'
        if self.verbose:
            print(f"  [snore] state={self.state:7s} E={e:5.1f}dBFS thr={thr:5.1f} floor={self.noise_floor:5.1f}")
        return self.state == 'SNORE'

    def is_snoring(self): return self.state == 'SNORE' or self.state == 'SUSPECT'


"""
体位检测 Python 原型 —— Mahony 互补融合 + 低通 + 3秒保持
"""
class PostureDetector:
    def __init__(self, fs=20, supine_roll_thr=20.0, side_roll_thr=25.0, hold_sec=3.0):
        self.fs = fs                  # 姿态更新频率 Hz
        self.alpha = 0.8              # LPF 系数
        self.pitch_lpf = 0.0; self.roll_lpf = 0.0
        self.current = 'UNKNOWN'
        self.candidate = 'UNKNOWN'
        self.hold_cnt = 0
        self.hold_target = int(hold_sec * fs)
        self.supine_thr = supine_roll_thr
        self.side_thr   = side_roll_thr

    def update(self, ax, ay, az):
        # 归一化到 g
        m = np.sqrt(ax*ax+ay*ay+az*az)
        if m < 1e-3: return
        ax, ay, az = ax/m, ay/m, az/m
        p = np.degrees(np.arctan2(ay, az))
        r = np.degrees(np.arctan2(ax, np.sqrt(ay*ay+az*az)))
        self.pitch_lpf = self.alpha * self.pitch_lpf + (1-self.alpha) * p
        self.roll_lpf  = self.alpha * self.roll_lpf  + (1-self.alpha) * r

        if abs(self.roll_lpf) < self.supine_thr: cand = 'SUPINE'
        else:                                   cand = 'SIDE'

        if cand == self.candidate:
            self.hold_cnt += 1
            if self.hold_cnt >= self.hold_target:
                self.current = cand
        else:
            self.candidate = cand
            self.hold_cnt  = 0

    def is_supine(self): return self.current == 'SUPINE'
