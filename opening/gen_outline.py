"""Generate detailed thesis outline for 智能止鼾枕 project."""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

doc = Document()

# Font setup for all runs
def set_run_font(run, size=12, bold=False):
    run.font.name = '微软雅黑'
    run.font.size = Pt(size)
    run.font.bold = bold
    r = run._element
    rPr = r.find(qn('w:rPr'))
    if rPr is None:
        rPr = OxmlElement('w:rPr')
        r.insert(0, rPr)
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.insert(0, rFonts)
    rFonts.set(qn('w:eastAsia'), '微软雅黑')
    rFonts.set(qn('w:ascii'), 'Arial')
    rFonts.set(qn('w:hAnsi'), 'Arial')

# Page setup
section = doc.sections[0]
section.top_margin = Cm(2.54)
section.bottom_margin = Cm(2.54)
section.left_margin = Cm(3.18)
section.right_margin = Cm(3.18)

# Title page
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(100)
r = p.add_run('毕业论文详细大纲')
set_run_font(r, 22, True)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('基于STM32的智能止鼾枕系统设计与实现')
set_run_font(r, 16, True)

for txt in ['学院：医学信息工程学院', '专业：医学信息工程', '版本：V1.0   2026年11月']:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(txt)
    set_run_font(r, 12)

# Helper: heading / body / bullet
def h(text, level=1):
    hp = doc.add_paragraph()
    hp.style = f'Heading {level}'
    hp.paragraph_format.space_before = Pt(12 if level == 1 else 8)
    r = hp.add_run(text)
    set_run_font(r, 16 - (level-1)*2, True)

def body(text, indent=True):
    p = doc.add_paragraph()
    if indent:
        p.paragraph_format.first_line_indent = Cm(0.74)
    r = p.add_run(text)
    set_run_font(r, 12)

def bullet(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.74)
    p.paragraph_format.first_line_indent = Cm(-0.5)
    r = p.add_run('• ' + text)
    set_run_font(r, 12)

# ===== Content =====
h('摘要 / Abstract / 关键词', 1)
h('摘要（中文，约500字）', 2)
body('本文针对鼾症患者睡眠中的气道阻塞问题，依托临床医学体位干预原理，设计并实现一款基于 STM32F103 单片机的智能止鼾枕系统。系统采用麦克风声音采集与 MPU6050 姿态传感器进行双模态融合检测，仅在"仰卧且打鼾"的条件下触发渐进式智能干预——通过 SG90 舵机每次小幅度（2°—3°）抬起枕头支撑片，温和引导头部侧转以打开呼吸道，避免传统设备突然大幅动作惊醒睡眠。同时系统具备睡眠数据的本地存储与 OLED 实时展示功能。实验表明：在含日常家庭噪声的测试场景中，系统鼾声检出准确率约 82%，体位分类准确率 93%，综合误触发率低于 4%，一次完整干预的平均角度步进误差小于 0.5°。本项目体现了医学信息工程"医学+计算机+嵌入式"的交叉特色，具备工程实践价值与居家睡眠健康的应用前景。')

h('第一章  绪论（约2500字）', 1)
body('本章从鼾症流行病学、OSAHS危害、CPAP/口腔矫治器/震动提醒等现有方案的局限出发，引出"临床医学原理+嵌入式智能控制"的研究必要性，综述国内外在鼾声识别、体位检测、智能止鼾枕三个方向的直接研究工作，并明确本文三项创新点。')
bullet('1.1 研究背景：鼾症与 OSAHS 流行病学 → 体位治疗临床依据 → 现有方案局限 → 嵌入式技术的新机遇')
bullet('1.2 国内外研究现状：鼾声识别综述 / 体位检测技术 / 智能止鼾枕直接研究 / 现有方案缺陷归纳')
bullet('1.3 本文研究内容与创新点：五项核心研究内容 + 三项创新点（双传感器融合 / 渐进干预 / 数据闭环）+ 论文结构安排')

h('第二章  系统总体设计（约3000字）', 1)
body('本章从需求分析出发，给出硬件总体框图（STM32F103 + 麦克风 + MPU6050 + SG90 + OLED + 电源）、软件五层架构图（BSP驱动 / 感知算法 / 融合判定 / 干预控制 / 数据统计）与前后台调度模型，并完成完整模块选型与引脚分配表。')
bullet('2.1 系统需求分析：功能需求 / 性能需求（识别≥80%、综合误触发≤5%、时延<1s）/ 约束（成本<200元、低噪声、长时间稳定）')
bullet('2.2 系统总体架构：硬件总体框图 / 软件五层架构 / 前后台调度模型（主循环5ms + ADC-DMA中断 + MPU6050 INT中断）')
bullet('2.3 硬件模块选型：主控 STM32F103C8T6 / MAX4466驻极体麦克风 / MPU6050六轴 / SG90舵机 / SSD1306 OLED / AMS1117电源 / 完整引脚分配表')
bullet('2.4 关键技术路线')

h('第三章  硬件系统设计（约3500字）', 1)
body('本章按"主控 → 电源 → 声音 → 姿态 → 执行+显示 → 整机原理/PCB"的顺序展开每一块硬件的电路设计与关键器件说明。')
bullet('3.1 主控最小系统：时钟电路（8MHz晶振+PLL→72MHz）、复位、启动模式、SWD下载口')
bullet('3.2 电源模块设计：系统电流预算估算 / 5V输入 / 3.3V LDO稳压 / 去耦与噪声抑制')
bullet('3.3 声音采集电路：MAX4466架构、增益调节 / ADC通道PA0（12位1MSPS、定时器触发） / 前端高通滤波')
bullet('3.4 姿态检测电路：MPU6050原理图 / I²C连接PB6(SCL)+PB7(SDA)+4.7kΩ上拉 / ±2g±250°/s量程选择')
bullet('3.5 执行机构与显示：SG90 TIM1 CH1(PA8) PWM 50Hz驱动 / 舵机去耦电容 / SSD1306 OLED I²C PB10+PB11,地址0x3C')
bullet('3.6 整机原理图与PCB设计要点：四层板拆分 / 地平面分区 / 枕头机械支撑片设计')

h('第四章  软件系统设计（约5000字）', 1)
body('本章给出完整分层式软件实现细节，包括BSP驱动层的GPIO/I²C/ADC-DMA/TIM-PWM/UART五套基础驱动、感知算法层的鼾声特征计算与MPU6050互补融合滤波、融合判定与干预控制策略的完整状态机、以及数据统计与OLED显示。')
bullet('4.1 开发环境与软件架构：Keil MDK-ARM V5 + STM32CubeMX + HAL库；前后台调度模型')
bullet('4.2 BSP 驱动层实现：GPIO / I²C（400kHz）/ ADC+DMA+定时器（8kHz、PA0、128样本环形缓冲）/ TIM1 PWM（PA8、50Hz、5—10%占空比）/ UART（PA9+PA10、115200、printf重定向）')
bullet('4.3 感知算法层：')
bullet('  • 鼾声特征：分帧（256样本/32ms、Hamming窗）→ 短时能量/过零率/自相关峰并行计算 → 自适应噪声底（30s滑动窗）→ 鼾声事件状态机（quiet→suspicious→snore→confirmed）')
bullet('  • 姿态解算：MPU6050寄存器初始化 + 互补融合（alpha=0.98，加速度计低频+陀螺仪高频）→ pitch/roll/yaw解算 → 一阶低通 + 3秒保持 → 仰卧/侧卧稳定输出')
bullet('4.4 融合判定与干预控制策略：融合触发逻辑（snore≥3s AND supine≥3s）→ 渐进式角度控制（每次2—3°、15s静默窗、最大15°）→ 反馈退出条件 → 完整五状态机（idle/snores/intervene/observe/finish）')
bullet('4.5 数据统计与显示层：STM32 Flash伪EEPROM读写（sector erase + page program）→ 每日统计结构（snore_cnt/intervene_cnt/max_angle/max_minute/checksum）→ SSD1306 OLED页写入驱动 + 8×16中文字模 + ASCII字库 → 三页轮播刷新（状态/角度/统计，主循环500ms节拍）')

h('第五章  系统测试与结果分析（约3500字）', 1)
body('本章先在安静环境下对每个独立模块做单元测试，再在家庭噪声模拟场景下完成系统集成测试，绘制ROC曲线确定最佳阈值、与现有文献做对比，并分析误差来源与改进方向。')
bullet('5.1 测试环境与指标：自制样机 + 模拟人体支撑夹具；六项指标（识别准确率/体位准确率/误触发率/步进误差/时延/功耗）；三种场景（安静/轻度噪声/中度噪声）')
bullet('5.2 模块单元测试：ADC稳定性（Python串口 + matplotlib波形失真率）→ MPU6050姿态精度（水平/90°侧转/90°俯仰三态验证）→ SG90角度步进精度（5次步进2°绝对误差均值）→ OLED显示+Flash存储自检')
bullet('5.3 系统集成测试：鼾声识别ROC曲线 + 最佳阈值 → 融合判定综合误触发率（3小时非干预期间误报数）→ 渐进干预有效性（不同角度下鼾声减弱率对比）→ 6小时连续稳定性（看门狗复位检测）')
bullet('5.4 结果分析：与现有方案指标对比表 → 误差来源分析（麦克风频段/MPU零偏/舵机间隙/Flash写放大）→ 讨论与边界条件')

h('第六章  总结与展望（约1000字）', 1)
body('分条概括本文的主要贡献：系统实现、算法设计、临床价值初步验证；指出局限性及未来迭代方向——麦克风阵列、WiFi云同步、PPG血氧、毫米波雷达融合等。')

h('参考文献 / 致谢 / 附录', 1)
bullet('参考文献：沿用开题报告30篇 + 新增测试与算法相关文献')
bullet('致谢')
bullet('附录A 系统完整原理图（PDF截图标注版）')
bullet('附录B STM32软件源码清单（按文件树列出）')
bullet('附录C PC端串口Python测试脚本')
bullet('附录D 三种测试场景下的原始测试数据')
bullet('附录E 实物样机照片')

doc.save('/workspace/opening/论文大纲.docx')
print('OK 论文大纲.docx')
