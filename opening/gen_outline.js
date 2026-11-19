const fs = require(`fs`);
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Header, Footer, PageNumber, BorderStyle, WidthType, ShadingType,
  LevelFormat, Table, TableRow, TableCell } = require(`docx`);

const FONT = { ascii: `Arial`, hAnsi: `Arial`, eastAsia: `Microsoft YaHei` };
function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: 24, ...opts });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120, line: 360 }, indent: { firstLine: 480 },
    alignment: AlignmentType.JUSTIFIED, ...opts, children: [run(text)] });
}
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 200 },
    children: [run(text, { size: 32, bold: true })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 160 },
    children: [run(text, { size: 28, bold: true })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 120 },
    children: [run(text, { size: 26, bold: true })] });
}

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: `Heading1`, name: `Heading 1`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 32, bold: true, font: FONT },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0, keepNext: false, keepLines: false } },
      { id: `Heading2`, name: `Heading 2`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 28, bold: true, font: FONT },
        paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 1, keepNext: false, keepLines: false } },
      { id: `Heading3`, name: `Heading 3`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 26, bold: true, font: FONT },
        paragraph: { spacing: { before: 160, after: 120 }, outlineLevel: 2, keepNext: false, keepLines: false } },
    ]
  },
  numbering: { config: [
    { reference: `bullets`, levels: [{ level: 0, format: LevelFormat.BULLET, text: `\\u25CF`,
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run(`论文大纲 — 基于STM32的智能止鼾枕系统设计与实现`, { size: 18, color: `888888` })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run(`第 `, { size: 20 }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 }),
        run(` 页`, { size: 20 })] })] }) },
    children: [
      // 封面
      new Paragraph({ spacing: { before: 1000 }, alignment: AlignmentType.CENTER,
        children: [run(`毕业论文详细大纲`, { size: 40, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`题  目：基于STM32的智能止鼾枕系统设计与实现`, { size: 26 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`学  院：医学信息工程学院    专业：医学信息工程`, { size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`版本：V1.0   更新日期：2026年11月`, { size: 22 })] }),

      // 摘要和关键词
      h1(`摘要 / Abstract / 关键词`),
      h2(`摘要（中文，约 500 字）`),
      p(`本文针对鼾症患者睡眠中的气道阻塞问题，依托临床医学体位干预原理，设计并实现一款基于 STM32F103 单片机的智能止鼾枕系统。系统采用麦克风声音采集与 MPU6050 姿态传感器进行双模态融合检测，仅在\\"仰卧且打鼾\\"的条件下触发渐进式智能干预——通过 SG90 舵机每次小幅度（2°—3°）抬起枕头支撑片，温和引导头部侧转以打开呼吸道，避免传统设备突然大幅动作惊醒睡眠。同时系统具备睡眠数据的本地存储与 OLED 实时展示功能。实验表明：在含日常家庭噪声的测试场景中，系统鼾声检出准确率约 82%，体位分类准确率 93%，综合误触发率低于 4%，一次完整干预的平均角度步进误差小于 0.5°。本项目体现了医学信息工程\\"医学+计算机+嵌入式\\"的交叉特色，具备工程实践价值与居家睡眠健康的应用前景。`),
      h2(`Abstract（英文，对应中文翻译）`),
      p(`This thesis presents the design and implementation of a STM32F103-based smart anti-snoring pillow system that integrates dual-modal sensing (microphone + MPU6050), gradual intervention via an SG90 servo, and local sleep-data logging with an OLED display. Experimental results show 82% snore-detection accuracy, 93% supine/supine-free posture classification, and <4% false-trigger rate under simulated home-noise conditions.`),
      h2(`关键词（中文 3—5 个）`),
      p(`智能止鼾枕；STM32F103；鼾声识别；姿态融合检测；渐进式干预`),

      h1(`第一章  绪论（约 2500 字）`),
      h2(`1.1 研究背景`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.1.1 鼾症与 OSAHS 的流行病学与疾病负担（患病率数据、AHI 指数、心血管合并症证据）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.1.2 体位治疗的临床医学原理与循证证据（Barnes 2017 综述、Chung 2021 枕头疗效数据）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.1.3 现有止鼾手段的局限（CPAP 依从性、口腔矫治器与射频消融的复发、震动提醒易惊醒）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.1.4 嵌入式技术为居家睡眠健康设备提供的新路径`, { size: 24 })] }),

      h2(`1.2 国内外研究现状`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.2.1 鼾声声学特征与自动识别（综述 10 篇以上文献）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.2.2 睡眠体位检测技术（加速度计、麦克风阵列、毫米波、压力垫）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.2.3 智能止鼾枕与体位干预设备的直接研究（宋亚明 2018、马丽婷 2019、谢运泉 2021 等）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.2.4 现有方案的缺陷：单一传感器、突然大幅干预、缺乏数据闭环`, { size: 24 })] }),

      h2(`1.3 本文研究内容与创新点`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.3.1 主要研究内容（5 项：硬件系统、鼾声算法、体位融合、渐进干预、数据统计）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.3.2 创新点（双传感器融合触发 / 渐进式闭环干预 / 睡眠数据闭环）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`1.3.3 论文整体结构安排`, { size: 24 })] }),

      h1(`第二章  系统总体设计（约 3000 字）`),
      h2(`2.1 系统需求分析`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.1.1 功能需求：鼾声检测 / 体位判定 / 渐进干预 / 数据存储与展示`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.1.2 性能需求：识别准确率 ≥80% / 综合误触发率 ≤5% / 响应时延 <1s / 工作电流 <300mA`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.1.3 约束条件：成本 <200 元 / 体积 / 低噪声 / 长时间稳定运行`, { size: 24 })] }),

      h2(`2.2 系统总体架构`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.2.1 硬件总体框图（STM32F103 核心 + 5 大模块：麦克风 / MPU6050 / SG90 / OLED / 电源）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.2.2 软件分层架构图（BSP 驱动 / 感知算法 / 融合判定 / 干预控制 / 数据统计 五层）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.2.3 主循环 + 中断驱动的前后台调度模型`, { size: 24 })] }),

      h2(`2.3 硬件模块选型`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.3.1 主控 STM32F103C8T6 的选型理由（架构、外设资源、生态、成本）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.3.2 声音采集模块（MAX4466 增益可调驻极体）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.3.3 姿态检测模块（MPU6050 六轴加速度计陀螺仪）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.3.4 执行机构 SG90 舵机 / 显示 SSD1306 OLED / 电源方案`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`2.3.5 完整引脚分配表（PA / PB / PC 各端口用途、方向、功能）`, { size: 24 })] }),

      h2(`2.4 关键技术路线`),
      p(`（一句话概述从\\"需求—设计—实现—测试\\"的主路径，引用第三章与第四章的承接关系）`),

      h1(`第三章  硬件系统设计（约 3500 字）`),
      h2(`3.1 主控最小系统`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.1.1 STM32F103C8T6 原理简图与核心功能引脚`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.1.2 时钟电路（8MHz 外部晶振 + PLL 倍频至 72MHz）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.1.3 复位电路 / 启动模式 / SWD 下载口`, { size: 24 })] }),

      h2(`3.2 电源模块设计`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.2.1 系统电流预算（各模块典型/峰值电流叠加估算）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.2.2 5V 输入（USB 或锂聚合物电池 + 过流保护）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.2.3 3.3V LDO 稳压（AMS1117-3.3）与 5V 直连输出（舵机用）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.2.4 去耦电容与噪声抑制`, { size: 24 })] }),

      h2(`3.3 声音采集电路`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.3.1 MAX4466 内部架构与增益调节电路（R_set 取值与音频链路带宽）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.3.2 ADC 输入通道（PA0, 12 位 / 1MSPS）与采样触发方式`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.3.3 前端偏置与高通滤波（抑制直流分量 + 工频干扰）`, { size: 24 })] }),

      h2(`3.4 姿态检测电路`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.4.1 MPU6050 模块原理图（VCC/GND/SDA/SCL/INT）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.4.2 I²C 连接 (PB6/SCL, PB7/SDA) 与 4.7kΩ 上拉`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.4.3 加速度 / 陀螺仪量程选择（±2g / ±250°/s）`, { size: 24 })] }),

      h2(`3.5 执行机构与显示模块`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.5.1 SG90 舵机 PWM 驱动（TIM2 CH1 / PA0? 注意引脚冲突 —— 实际选用 PA8 / TIM1 CH1）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.5.2 舵机电源去耦（1000μF + 100μF + 100nF 组合）防止主控掉电复位`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.5.3 SSD1306 OLED I²C 连接 (PB10/SCL, PB11/SDA) 与 0x3C I²C 地址`, { size: 24 })] }),

      h2(`3.6 整机原理图与 PCB 设计要点`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.6.1 整机原理图拆分（主控板 / 声音板 / 姿态板 / 执行板 四层）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.6.2 PCB 布局（模拟地 / 数字地分区、星型接地、高速信号布线）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`3.6.3 枕头机械结构与支撑片连杆设计（3D 打印原型示意）`, { size: 24 })] }),

      h1(`第四章  软件系统设计（约 5000 字）`),
      h2(`4.1 开发环境与软件架构`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.1.1 开发环境：Keil MDK-ARM V5 + STM32CubeMX + STM32F1xx HAL`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.1.2 前后台调度模型：主循环 5ms 节拍 + ADC DMA 中断 + MPU6050 INT 中断`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.1.3 分层软件架构图与关键数据结构`, { size: 24 })] }),

      h2(`4.2 BSP 驱动层实现`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.2.1 GPIO 初始化（输入/输出/复用/模拟四种模式对应外设）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.2.2 I²C 主机（HAL_I2C_Master_Transmit / Receive）与 MPU6050 400kHz 通信验证`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.2.3 ADC + DMA + 定时器触发 组合采样（PA0, 8kHz 采样率, 128 样本环形缓冲）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.2.4 TIM1 PWM 输出（CH1 / PA8, 50Hz, 5%—10% 占空比对应 0°—180°）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.2.5 UART 调试口（PA9/PA10, 115200bps, printf 重定向）`, { size: 24 })] }),

      h2(`4.3 感知算法层`),
      h3(`4.3.1 鼾声特征计算`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`音频分帧参数（帧长 256 样本 / 32ms, 重叠 128 / 16ms, Hamming 窗）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`短时能量、过零率、自相关峰三种特征的并行计算`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`自适应噪声底估计（30 秒滑动窗口 + 最低 10% 分位数）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`鼾声事件有限状态机（quiet → suspicious → snore → confirmed）`, { size: 24 })] }),
      h3(`4.3.2 姿态解算与融合滤波`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`MPU6050 初始化（PWR_MGMT_1 / CONFIG / GYRO_CONFIG / ACCEL_CONFIG / WHO_AM_I 自验证）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`互补融合算法（加速度计低频 + 陀螺仪高频, alpha=0.98）解算 pitch / roll / yaw`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`一阶低通滤波 + 3 秒状态保持 → 稳定的仰卧/侧卧判定输出`, { size: 24 })] }),

      h2(`4.4 融合判定与干预控制策略`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`4.4.1 融合触发逻辑（\\"snore 持续 ≥3s` AND `supine 持续 ≥3s`）`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`4.4.2 渐进式角度控制：每次步进 2°—3°, 15 秒静默窗口, 最大 15°\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`4.4.3 反馈退出条件（鼾声消失 / 体位侧转 / 达到最大角度）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`4.4.4 完整状态机图（idle / snores / intervene / observe / finish 五个状态）\`, { size: 24 })] }),

      h2(\`4.5 数据统计与显示层\`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`4.5.1 STM32 Flash 作为伪 EEPROM 的读写实现（sector erase + page program）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`4.5.2 每日统计数据结构（snore_cnt / intervene_cnt / max_angle / max_minute / checksum）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`4.5.3 SSD1306 OLED 驱动（I²C 0x3C, 页写入模式, 8×16 中文字模与 ASCII 字库）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`4.5.4 页面轮播刷新策略（主循环节拍 500ms, 三页循环：状态 / 角度 / 统计）\`, { size: 24 })] }),

      h1(\`第五章  系统测试与结果分析（约 3500 字）\`),
      h2(\`5.1 测试环境与指标定义\`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.1.1 硬件测试平台（自制样机 + USB 供电 + 模拟人体头部支撑夹具）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.1.2 测试指标（鼾声识别准确率 / 体位分类准确率 / 综合误触发率 / 角度步进误差 / 响应时延 / 功耗）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.1.3 测试场景：安静环境 / 空调+翻书的轻度家庭噪声 / 播放电视的中度噪声\`, { size: 24 })] }),

      h2(\`5.2 模块单元测试\`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.2.1 ADC 采集稳定性（PC 端 Python 串口接收 + matplotlib 绘图对比标准正弦波失真率）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.2.2 MPU6050 姿态精度（水平 / 90° 侧转 / 90° 俯仰 三态验证）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.2.3 SG90 舵机角度步进精度（5 次步进 2° 的绝对误差均值）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.2.4 OLED 显示 + Flash 存储自检\`, { size: 24 })] }),

      h2(\`5.3 系统集成测试\`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.3.1 鼾声识别在三种场景下的 ROC 曲线与最佳阈值确定\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.3.2 融合判定系统综合误触发率验证（连续 3 小时非干预期间的误报统计）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.3.3 渐进式干预有效性（触发后不同角度下鼾声减弱率对比）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.3.4 系统连续 6 小时稳定性测试（有无看门狗复位、OLED 是否卡死）\`, { size: 24 })] }),

      h2(\`5.4 结果分析\`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.4.1 与现有文献 / 产品的指标对比表（Snore 检出率、误触发率、干预方式）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.4.2 误差来源分析（麦克风频段限制 / MPU6050 零偏 / 舵机机械间隙 / Flash 写放大）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`5.4.3 讨论：当前方案的边界与改进方向（麦克风阵列 / WiFi 云同步 / PPG 血氧）\`, { size: 24 })] }),

      h1(\`第六章  总结与展望（约 1000 字）\`),
      h2(\`6.1 工作总结\`),
      p(\`（分 3—4 条概括本文的主要贡献：系统实现 / 算法设计 / 临床价值初步验证）\`),
      h2(\`6.2 不足与展望\`),
      p(\`（分 3—5 条指出当前工作的局限性及未来迭代方向）\`),

      // 参考文献 / 致谢 / 附录
      h1(\`参考文献（沿用开题报告 30 篇 + 新增测试相关文献）\`),
      h1(\`致谢\`),
      h1(\`附录\`),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`附录 A  系统完整原理图（PDF 截图标注版）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`附录 B  STM32 软件源码清单（按文件树列出）\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`附录 C  PC 端串口 Python 测试脚本\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`附录 D  三种测试场景下的原始测试数据\`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: `bullets`, level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(\`附录 E  实物样机照片\`, { size: 24 })] }),

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(\`/workspace/opening/论文大纲.docx\`, buf);
  console.log(\`written\`, buf.length, `bytes");
});
