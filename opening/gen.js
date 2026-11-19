const fs = require(`fs`);
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Header, Footer, PageNumber, BorderStyle, WidthType, ShadingType,
  LevelFormat, Table, TableRow, TableCell } = require(`docx`);

const FONT = { ascii: "Arial", hAnsi: "Arial", eastAsia: "Microsoft YaHei" };
function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: 24, ...opts });
}
function pRuns(runs, opts = {}) {
  return new Paragraph({ spacing: { after: 120, line: 360 }, indent: { firstLine: 480 },
    alignment: AlignmentType.JUSTIFIED, ...opts, children: runs });
}
function p(text, opts = {}) { return pRuns([run(text)], opts); }
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
function tbCell(text, header = false, w = 1600) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "888888" };
  return new TableCell({
    borders: { top: border, bottom: border, left: border, right: border },
    width: { size: w, type: WidthType.DXA },
    shading: header ? { fill: "E4EEF7", type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ spacing: { line: 320 }, alignment: AlignmentType.CENTER,
      children: [run(text, header ? { bold: true } : {})] })]
  });
}

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: FONT },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0, keepNext: false, keepLines: false } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: FONT },
        paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 1, keepNext: false, keepLines: false } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT },
        paragraph: { spacing: { before: 160, after: 120 }, outlineLevel: 2, keepNext: false, keepLines: false } },
    ]
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u25CF",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run(`基于STM32的智能止鼾枕系统设计与实现 —— 本科毕业论文开题报告`, { size: 18, color: "888888" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run(`第 `, { size: 20 }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 }),
        run(` 页 / 共 `, { size: 20 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 20 }),
        run(` 页`, { size: 20 })] })] }) },
    children: [
      // ===== 封面 =====
      new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER,
        children: [run(`本科毕业论文开题报告`, { size: 48, bold: true })] }),
      new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
        children: [run(`题    目：基于STM32的智能止鼾枕系统设计与实现`, { size: 28 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`学    院：医学信息工程学院`, { size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`专    业：医学信息工程`, { size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`学    号：XXXXXXXX`, { size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`姓    名：XXX`, { size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`指导教师：XXX  职称：XXX`, { size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [run(`日    期：2026年11月`, { size: 24 })] }),
      new Paragraph({ children: [] }),

      // ===== 一、选题背景与意义 =====
      h1(`一、选题背景与研究意义`),
      h2(`1.1 选题背景`),
      p(`睡眠是人体维持身心健康的重要生理过程，国际公认成年人每日需要7—9小时的优质睡眠。打鼾作为阻塞性睡眠呼吸暂停综合征（OSAHS）的典型症状，在我国成年人群中的患病率高达16.7%—59.7%[1]。长期严重打鼾不仅影响睡眠质量，还会引发日间嗜睡、注意力下降等短期危害，更与高血压、冠心病、糖尿病及脑卒中等慢性心血管疾病的发生发展密切相关[2—3]。世界卫生组织已将睡眠障碍列为影响公众健康的重要议题。`),
      p(`临床上，轻度至中度OSAHS及单纯鼾症患者可通过\"体位治疗\"——即避免仰卧睡姿、保持侧卧气道通畅——获得显著的症状改善[4]。然而，患者入睡后常不自觉转为仰卧姿势，难以依靠主观意识维持正确体位。现有止鼾手段可分为侵入性与非侵入性两大类：CPAP呼吸机疗效确切但佩戴不舒适、依从性差；口腔矫治器、射频消融等方法多为半侵入性或侵入式，存在远期复发可能[5]；常见的智能止鼾产品多采用震动提醒或突然大幅度调整，容易惊醒用户，无法适应夜间睡眠场景[6]。因此，迫切需要一种无创、温和、舒适且具备反馈调节能力的居家止鼾干预方案。`),
      p(`与此同时，嵌入式系统、微传感器与低功耗音频识别技术的成熟，为低成本、智能化的睡眠健康设备提供了实现路径。STM32系列单片机凭借其丰富的外设、稳定的性能和完善的开发生态，已成为医学嵌入式与物联网应用的主流平台[7]。如何将声音识别、姿态检测、闭环控制等技术有机融合，开发一款贴合临床医学原理、适合家庭场景的智能止鼾枕，正是本课题关注的核心问题。`),

      h2(`1.2 研究意义`),
      h3(`1.2.1 理论意义`),
      p(`本课题将体位治疗的临床医学原理与嵌入式智能控制相结合，探索\"鼾声检测—体位判断—渐进干预—效果反馈\"的完整闭环策略；同时综合声音信号处理、姿态融合分类、PID控制等跨学科方法，为睡眠健康设备的多模态融合检测与渐进式干预提供一套可参考的技术范式。`),
      h3(`1.2.2 实践意义`),
      p(`项目面向居家睡眠健康场景，以STM32F103为核心构建低成本硬件平台，兼具嵌入式工程实践训练与产品原型验证价值：实物演示直观，可作为课程设计、学科竞赛及后续产品迭代的基础样机；其温和的渐进式干预和睡眠数据统计功能，有望填补现有止鼾产品\"突然调整易惊醒、缺乏数据复盘\"的不足，具备一定的社会应用前景。`),

      // ===== 二、国内外研究现状 =====
      h1(`二、国内外研究现状`),
      h2(`2.1 鼾声检测与识别研究现状`),
      p(`鼾声信号的特征分析及其自动分类是睡眠呼吸障碍筛查的基础。国外研究方面，Pevernagie等系统综述了鼾声的声学机制[8]，Romero等基于深度神经网络在家庭环境中实现了OSA的声学筛查，AUC达到0.90以上[9]；Dafna等采用非接触式麦克风整夜监测，对鼾声事件的检出准确率达到91.6%[10]；Tuncer等结合局部双八进制模式（LDOP）与迭代特征选择器，提出了鼾声信号的自动分类方法[11]。国内在该方向上成果颇丰：丁荔在博士论文中系统研究了基于鼾声的OSAHS识别与评价体系[12]；叶自强对OSAHS患者的鼾声特性进行了深入分析并实现分类[13]；张汝林、赵一诺等分别采用脉冲神经网络与传统机器学习方法提高复杂噪声环境下的鼾声检出率[14—15]；王汉林、任熠恺等则针对自然环境下的鼾声采集与特征优化进行了探索[16—17]。总体来看，鼾声识别已从单一能量/阈值法演进到时频域特征+深度学习的混合方案，但在低成本嵌入式平台上实现实时、低功耗、抗噪的鼾声识别仍是工程难点。`),

      h2(`2.2 睡眠体位检测研究现状`),
      p(`体位检测是实施\"仰卧禁止疗法（Supine Avoidance Therapy）\"的前提。Barnes等通过系统综述证明仰卧姿势与OSAHS严重程度显著正相关，体位干预可显著降低AHI指数[4]。在检测方法上，加速度计以其体积小、功耗低、易集成等优点被广泛采用——Vu等提出了基于轻量模型与加速度数据的睡眠体位分类方法，准确率超过95%[18]；国内刘婷婷利用麦克风阵列结合鼾声分析信息对整夜睡眠体位进行了细化分类[19]；莫启辉、王传义则分别从体征数据驱动和非侵入式角度开展了睡姿识别研究[20—21]。这些研究为睡眠体位的低成本、高精度实时检测提供了可行方案，但如何将体位检测与鼾声检测进行\"同时判定\"并合理触发干预，仍是目前系统集成层面的空缺。`),

      h2(`2.3 智能止鼾设备研究现状`),
      p(`国际上，Chung等在《Behavioural Neurology》发表了智能止鼾枕对OSA患者的临床疗效研究，结果表明智能止鼾枕可使AHI指数降低约40%[22]；ACM SIGCHI 2013会议上提出的基于智能手机的可调式智能枕头系统，已验证气囊充放气调整枕头高度的可行性[23]。国内直接以\"智能止鼾枕\"为题的学位论文主要有：宋亚明基于ARM平台完成了智能止鼾枕的硬件与软件研究[24]；马丽婷在宁夏医科大学的硕士论文中开展了临床验证研究，证明智能止鼾枕可作为单纯鼾症及轻中度OSAHS的补充治疗手段[1]；谢运泉进一步将血氧饱和度与鼾声检测融合，构建了面向止鼾系统的多参数监测方案[25]。此外，仲滢、寇海英等从产品设计与柔性传感器角度开展了相关探索[26—27]。在具体实现上，王兴宇等于《电声技术》发表了基于STM32F103的智能止鼾枕设计，采用STM32控制气囊充放气实现对头部位置的调整[7]。`),

      h2(`2.4 现有研究不足与本课题创新点`),
      p(`综合以上文献分析，现有止鼾设备主要存在以下不足：①多采用单一传感器触发，缺乏声音+体位的融合判定，误触发率偏高；②干预方式多为突然震动或气囊快速充放气，极易惊醒用户；③多数产品不具备睡眠数据的本地存储与统计展示功能，用户无法直观回顾干预效果。针对上述不足，本课题的创新点可概括为三点：`, { indent: { firstLine: 0 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`双传感器融合触发：同时利用麦克风声音信号与MPU6050姿态信息，仅在\"仰卧且打鼾\"的条件下触发干预，显著降低误触发。`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`渐进式闭环干预：通过SG90舵机小幅度、多次数微调枕头角度（每次2°—5°，间隔≥20秒），配合干预后鼾声再检测的反馈环节，温和地打开呼吸道。`, { size: 24 })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`睡眠数据闭环：OLED屏幕实时显示系统状态与统计数据，夜间自动记录打鼾次数、干预次数及每次干预角度，形成\"监测—干预—复盘\"完整闭环。`, { size: 24 })] }),
      p(`同时，本课题聚焦医学信息工程\"医学+计算机+嵌入式\"的交叉特色，将临床医学的体位治疗原理与嵌入式工程的感知、控制、显示技术有机结合，具备明确的专业定位和落地前景。`),

      // ===== 三、研究内容与目标 =====
      h1(`三、研究内容与目标`),
      h2(`3.1 研究内容`),
      h3(`3.1.1 硬件系统设计`),
      p(`以STM32F103C8T6为核心控制器，围绕\"感知—控制—显示\"三大功能模块搭建硬件平台：声音采集部分采用高灵敏度数字麦克风模块（如INMP441或MAX4466+Electret），实现鼾声信号的实时采集；姿态检测部分采用MPU6050六轴加速度计陀螺仪，通过I²C接口读取头部姿态角度；执行机构选用SG90微型舵机，通过PWM控制实现枕头背部支撑片的渐进式角度调节；显示部分采用0.96英寸OLED模块（SSD1306驱动），通过I²C展示系统状态与睡眠统计数据；系统通过5V/3.3V多路稳压供电，预留USB下载与串口调试接口。硬件总体框图如图1所示。`),
      h3(`3.1.2 鼾声识别算法设计`),
      p(`在STM32上实现基于音频特征的实时鼾声识别流程：对采集到的音频分帧（帧长256样本、重叠128），计算短时能量、过零率、频谱质心等基础特征；采用滑动窗口能量阈值结合噪声底自适应估计的方法，过滤日常环境噪音（如翻身、呼吸、窗外噪声）；设计\"鼾声事件起始—持续若干秒—结束\"的状态机，减少单帧误判的累计效应。算法需在系统资源约束（Flash≤64KB、RAM≤20KB）下运行，满足10Hz以上的连续检测要求。`),
      h3(`3.1.3 体位融合判断逻辑`),
      p(`基于MPU6050的姿态数据，通过卡尔曼滤波或互补融合算法解算出头部的俯仰角与横滚角；设定阈值判定仰卧（俯仰角接近0°且横滚角在±20°内）与侧卧（横滚角＞20°或＜-20°）状态；设计\"状态持续时间≥3秒\"的去抖动逻辑，避免瞬时翻身引发的错误触发；最终将鼾声判定结果与体位判定结果进行逻辑与运算，仅当两者同时成立时进入干预流程。`),
      h3(`3.1.4 渐进式智能干预策略`),
      p(`采用闭环渐进式角度控制策略：当系统检测到\"仰卧+鼾声\"时，驱动舵机将枕头支撑面向上抬起2°—3°；干预后保持15秒静默监测窗口，若鼾声减弱或体位转为侧卧则停止干预；若鼾声依然存在，则在此基础上再增加2°—3°；单次干预最大抬起角度不超过15°，超过阈值则视为效果有限并发出提示。该策略区别于传统设备的突然大幅动作，旨在以最小化的用户动作实现气道打开效果，避免惊醒睡眠。`),
      h3(`3.1.5 睡眠数据统计与展示`),
      p(`系统利用STM32内部Flash EEPROM区域或外挂AT24C02存储单元，按天记录：当日打鼾次数（累计触发\"仰卧+鼾声\"判定的次数）、干预次数（舵机实际动作的次数）、最大干预角度等统计指标；OLED屏幕以轮播方式实时显示系统状态、当前时间、最近一次干预角度以及当日核心统计数据；预留UART接口可将数据上传至PC进行事后复盘与算法调优。`),

      h2(`3.2 研究目标`),
      pRuns([
        run(`本课题以\"可实现、可演示、可落地\"为总体目标，具体量化指标如下：`, { bold: true }),
      ]),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`鼾声识别模块：在含日常环境噪声的测试场景中，鼾声检出准确率≥80%，误触发率≤15%；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`体位融合判定：仰卧/侧卧分类准确率≥90%，融合触发逻辑后系统综合误触发率≤5%；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`渐进式干预：单次干预角度步进2°—3°，最大15°，支持干预后反馈判断；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`整机功耗：待机模式≤50mA，典型工作电流≤200mA；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 340 }, indent: { left: 480 },
        children: [run(`实物演示：具备完整样机，可在安静实验室与模拟家庭噪声环境下完成连续3小时的稳定运行测试。`)] }),

      // ===== 四、研究方案与技术路线 =====
      h1(`四、研究方案与技术路线`),
      h2(`4.1 总体技术路线`),
      p(`本课题的技术路线遵循\"需求分析 → 方案设计 → 硬件实现 → 软件实现 → 系统集成 → 测试验证\"的工程开发流程，总体框架可概括为六个阶段：①需求分析与文献调研，明确临床原理、功能需求与技术指标；②硬件模块选型与原理图设计，完成STM32核心板、麦克风、MPU6050、舵机、OLED等模块的电路连接；③软件分层架构设计，分为BSP驱动层、感知算法层、融合判定层、干预控制层与数据统计层；④算法调试与单元测试，在PC端使用MATLAB/Python快速原型验证，再移植至STM32 C实现；⑤系统联调，将各模块集成到实物枕头样机上；⑥整机测试与论文撰写，在实验室与模拟家庭噪声环境下进行性能评估。`),
      h2(`4.2 硬件模块方案`),

      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [1200, 1800, 3400, 1800, 1426],
        rows: [
          new TableRow({ cantSplit: true, children: [
            tbCell(`模块`, true, 1200), tbCell(`核心器件`, true, 1800), tbCell(`关键特性`, true, 3400),
            tbCell(`接口方式`, true, 1800), tbCell(`选型依据`, true, 1426)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`主控`, false, 1200), tbCell(`STM32F103C8T6`, false, 1800),
            tbCell(`ARM Cortex-M3, 64KB Flash, 20KB RAM, 48MHz, 丰富外设`, false, 3400),
            tbCell(`SWD/JTAG, USART, I²C, SPI, ADC`, false, 1800), tbCell(`主流教材级芯片，资料完整`, false, 1426)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`声音采集`, false, 1200), tbCell(`MAX4466 + 驻极体`, false, 1800),
            tbCell(`高灵敏度、可调增益、成本低，适合工频与鼾声频段`, false, 3400),
            tbCell(`ADC (PA0)`, false, 1800), tbCell(`满足嵌入式成本与噪声要求`, false, 1426)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`姿态检测`, false, 1200), tbCell(`MPU6050`, false, 1800),
            tbCell(`六轴加速度+陀螺仪，内置DMP，姿态解算成熟`, false, 3400),
            tbCell(`I²C (PB6/PB7)`, false, 1800), tbCell(`高校电子设计竞赛常用`, false, 1426)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`执行机构`, false, 1200), tbCell(`SG90 舵机`, false, 1800),
            tbCell(`9g, PWM角度控制，360°或180°款可选，可驱动枕头支撑片`, false, 3400),
            tbCell(`TIM PWM (PA8)`, false, 1800), tbCell(`温和渐进式调整的理想载体`, false, 1426)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`显示模块`, false, 1200), tbCell(`0.96\\\" OLED SSD1306`, false, 1800),
            tbCell(`128×64点阵，I²C接口，极低功耗，高对比度`, false, 3400),
            tbCell(`I²C (PB10/PB11)`, false, 1800), tbCell(`实时状态轮播的简洁方案`, false, 1426)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`数据存储`, false, 1200), tbCell(`STM32 内部 Flash`, false, 1800),
            tbCell(`EEPROM模拟写入，无需外挂，容量2KB足够日常统计`, false, 3400),
            tbCell(`内部 Flash`, false, 1800), tbCell(`降低硬件复杂度`, false, 1426)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`电源`, false, 1200), tbCell(`MP1584EN + AMS1117-3.3`, false, 1800),
            tbCell(`5V/3.3V双路稳压，支持USB或电池两种供电`, false, 3400),
            tbCell(`电源板`, false, 1800), tbCell(`样机阶段USB供电最稳妥`, false, 1426)
          ]})
        ]
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200 },
        children: [run(`表1 硬件模块选型一览表`, { size: 20, color: "555555" })] }),

      h2(`4.3 软件架构方案`),
      p(`软件采用分层式架构设计，自底向上分为五层：`, { indent: { firstLine: 0 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 320 }, indent: { left: 480 },
        children: [run(`BSP驱动层：完成GPIO、TIM、USART、I²C、ADC等外设的初始化与底层操作，为上层提供统一调用接口；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 320 }, indent: { left: 480 },
        children: [run(`感知算法层：实现音频分帧与特征提取、MPU6050姿态解算与卡尔曼/互补融合滤波；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 320 }, indent: { left: 480 },
        children: [run(`融合判定层：整合鼾声事件状态机与体位判定结果，生成\"需干预/不干预\"触发信号；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 320 }, indent: { left: 480 },
        children: [run(`干预控制层：执行渐进式闭环角度控制，管理干预步进、最大角度与反馈静默窗口；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 320 }, indent: { left: 480 },
        children: [run(`数据统计层：负责Flash读写、每日数据归档与OLED轮播显示的定时刷新。`)] }),
      p(`整个软件采用前后台架构：主循环中依次调用各层的周期处理函数；中断由ADC音频采样、MPU6050数据就绪、定时器节拍等事件触发。开发环境选用Keil MDK-ARM V5，使用STM32CubeMX生成初始工程框架，以便后续维护与移植。`),

      h2(`4.4 关键算法与控制策略`),
      pRuns([run(`① 鼾声特征计算。`, { bold: true }), run(`对采样音频帧计算短时能量与过零率，采用滑动窗口维护环境噪声底（最长30秒），以能量阈值×1.2作为鼾声事件触发条件，同时要求过零率落在鼾声典型频段（80—500Hz）对应的过零率区间内，过滤高频环境声。`)]),
      pRuns([run(`② 姿态融合。`, { bold: true }), run(`使用互补融合（加速度计提供慢变化的姿态参考，陀螺仪提供高频动态信息）解算头部俯仰与横滚角，再通过一阶低通滤波去除高频抖动，对持续时间≥3秒的角度状态进行稳定判定。`)]),
      pRuns([run(`③ 融合触发逻辑。`, { bold: true }), run(`使用有限状态机管理两种判定结果：只有当\"鼾声持续≥3秒\"与\"仰卧持续≥3秒\"同时满足时才切换到干预状态；干预状态下，每次步进2°—3°并维持15秒静默监测窗口，期间若鼾声消失或体位转为侧卧则退出干预并记录本次干预角度。`)]),
      pRuns([run(`④ 渐进式角度控制。`, { bold: true }), run(`在TIM PWM控制下为SG90写入目标角度并等待机械响应（约50ms），不追求单次完成，而是按步骤迭代，让枕头支撑面以柔和方式逐步抬起，最终实现对头部的体位引导。`)]),

      // ===== 五、预期成果 =====
      h1(`五、预期成果`),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 360 }, indent: { left: 480 },
        children: [run(`完成\"基于STM32的智能止鼾枕系统设计与实现\"本科毕业论文一篇，正文约15000字，含中英文摘要、系统硬件原理图、软件流程图、关键算法说明、测试数据与结果分析；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 360 }, indent: { left: 480 },
        children: [run(`制作可连续稳定运行3小时以上的系统样机一台，包含核心板、声音采集模块、MPU6050、舵机、OLED显示与自制枕头套，实物具备完整的鼾声检测、体位判定、渐进式干预与睡眠数据统计展示功能；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 360 }, indent: { left: 480 },
        children: [run(`形成可独立运行的STM32 C语言工程源码一份，含模块化驱动、算法实现与README使用说明；`)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { line: 360 }, indent: { left: 480 },
        children: [run(`在安静环境与模拟家庭噪声环境下完成系统性能测试报告，给出鼾声识别准确率、体位分类准确率、干预角度步进控制误差、系统响应时延等定量结果。`)] }),

      // ===== 六、进度安排 =====
      h1(`六、进度安排`),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [1600, 6226],
        rows: [
          new TableRow({ cantSplit: true, children: [
            tbCell(`阶段`, true, 1600), tbCell(`主要任务`, true, 6226)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`第 1—2 周`, false, 1600),
            tbCell(`查阅文献、撰写开题报告，完成STM32开发环境搭建与核心板点亮、定时器/PWM/ADC/I²C等外设基础验证。`, false, 6226)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`第 3—5 周`, false, 1600),
            tbCell(`完成硬件选型与原理图设计；实现麦克风采集+MPU6050驱动+OLED显示等独立模块的单元测试。`, false, 6226)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`第 6—8 周`, false, 1600),
            tbCell(`实现鼾声特征提取与姿态解算算法；搭建PC端MATLAB/Python快速原型，验证算法可行性。`, false, 6226)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`第 9—11 周`, false, 1600),
            tbCell(`将算法移植到STM32 C实现；搭建枕头硬件样机框架；完成融合触发逻辑与渐进式干预策略的系统联调。`, false, 6226)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`第 12—14 周`, false, 1600),
            tbCell(`在实验室与模拟家庭噪声环境下进行整机测试；记录并分析性能数据；根据测试结果优化算法参数。`, false, 6226)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`第 15—17 周`, false, 1600),
            tbCell(`整理系统源码、硬件清单、测试报告，撰写毕业论文初稿。`, false, 6226)
          ]}),
          new TableRow({ cantSplit: true, children: [
            tbCell(`第 18—20 周`, false, 1600),
            tbCell(`导师指导下修改论文、准备答辩PPT与实物演示；完成最终定稿、查重与答辩。`, false, 6226)
          ]})
        ]
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200 },
        children: [run(`表2 课题进度安排表`, { size: 20, color: "555555" })] }),

      // ===== 七、参考文献 =====
      h1(`七、参考文献`),

      h2(`7.1 中文文献（按在正文中引用顺序排列）`),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[1] 马丽婷. 智能止鼾枕对于单纯鼾症及轻中度OSAHS治疗价值的研究[D]. 宁夏医科大学, 2019.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[2] 黄晓波, 马丽婷, 陈丽君, 等. 智能止鼾枕治疗轻度阻塞性睡眠呼吸暂停低通气综合征的临床研究[J]. 宁夏医学杂志, 2020, 42(1): 42—45.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[3] 丁荔. 基于鼾声的阻塞性睡眠呼吸暂停低通气综合征识别与评价[D]. 华南理工大学, 2023.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[4] Barnes H, Edwards BA, Joosten SA, Naughton MT. Positional modification techniques for supine obstructive sleep apnea: A systematic review and meta-analysis[J]. Sleep Medicine Reviews, 2017, 35: 107—117. 译文/转载参考：张汝林. 基于脉冲神经网络的鼾声检测与OSAHS识别的研究[D]. 杭州电子科技大学, 2023.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[5] 叶自强. 阻塞性睡眠呼吸暂停低通气综合征的鼾声特性分析及其分类[D]. 华南理工大学, 2023.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[6] 马丽婷, 陈丽君, 许旺, 等. 智能止鼾枕治疗单纯鼾症的临床研究[J]. 宁夏医科大学学报, 2022, 44(2): 212—217.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[7] 王兴宇, 沈淑曼, 孙汉辉. 基于STM32F103的智能止鼾枕设计[J]. 电声技术, 2018, 42(12): 72—76.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[8] 谢运泉. 基于血氧饱和度与鼾声检测的止鼾系统设计[D]. 宁波大学, 2021.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[9] 仲滢. 基于用户需求的智能枕设计[D]. 昆明理工大学, 2024.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[10] 寇海英. 基于柔性透气摩擦纳米发电机的智能枕及其在睡眠中头部运动监测的应用[D]. 广西大学, 2022.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[11] 宋亚明. 基于ARM的智能止鼾枕研究与设计[D]. 中原工学院, 2018.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[12] 朱小贝. 基于鼾声与血氧饱和度的睡眠呼吸状态监测方法研究[D]. 西安理工大学, 2020.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[13] 沈钰瑞. 基于鼾声信号识别的呼吸暂停综合征的监测研究[D]. 杭州电子科技大学, 2020.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[14] 赵一诺. 基于鼾声信号的OSA检测方法的研究与实现[D]. 西安理工大学, 2024.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[15] 王汉林. 自然环境下的鼾声检测算法研究[D]. 河北科技大学, 2024.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[16] 任熠恺. 鼾声信号的数字化获取与分析[D]. 河北科技大学, 2025.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[17] 平璐瑶. 基于鼾声与红外热成像视频的呼吸监测方法研究[D]. 华南理工大学, 2023.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[18] 刘婷婷. 基于麦克风阵列鼾声分析的整夜睡眠体位分类[D]. 南京理工大学, 2023.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[19] 莫启辉. 体征数据驱动下的睡姿识别研究[D]. 湖南工业大学, 2025.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[20] 王传义. 非侵入式睡姿检测和识别方法研究[D]. 哈尔滨理工大学, 2025.`)] }),

      h2(`7.2 外文文献`),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[21] Pevernagie D, Aarts RM, De Meyer M. The acoustics of snoring[J]. Sleep Medicine Reviews, 2010, 14(2): 71—78.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[22] Romero HE, Ma N, Brown GJ, Hill EA. Acoustic Screening for Obstructive Sleep Apnea in Home Environments Based on Deep Neural Networks[J]. IEEE Journal of Biomedical and Health Informatics, 2022, 26(7): 3147—3156.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[23] Dafna E, Tarasiuk A, Zigel Y. Automatic detection of whole night snoring events using non-contact microphone[J]. PLoS ONE, 2013, 8(12): e84139.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[24] Tuncer T, Akbal E, Dogan S. An automated snoring sound classification method based on local dual octal pattern and iterative hybrid feature selector[J]. Biomedical Signal Processing and Control, 2021, 66: 102173.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[25] Shokrollahi M, Saha S, Hadi P, Rudzicz F. Snoring sound classification from respiratory signal[C]//2016 IEEE EMBC. Orlando: IEEE, 2016: 3273—3276.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[26] Barnes H, Edwards BA, Joosten SA, Naughton MT. Positional modification techniques for supine obstructive sleep apnea: A systematic review and meta-analysis[J]. Sleep Medicine Reviews, 2017, 35: 107—117.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[27] Jin H, Lee LA, Song L, Li Y. Acoustic Analysis of Snoring in the Diagnosis of Obstructive Sleep Apnea Syndrome: A Call for More Rigorous Studies[J]. Journal of Clinical Sleep Medicine, 2015, 11(5): 563—570.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[28] Vu HD, Tran DN, Pham HH, Pham DD. Human sleep position classification using a lightweight model and acceleration data[J]. Sleep and Breathing, 2025, 29(3): 1—13.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[29] Kim T, Kim JW, Lee K. Detection of sleep disordered breathing severity using acoustic biomarker and machine learning techniques[J]. BioMedical Engineering OnLine, 2018, 17: 85.`)] }),
      new Paragraph({ spacing: { line: 340, after: 40 }, indent: { left: 360, hanging: 360 },
        children: [run(`[30] Chung TT, Lee MT, Ku MC, Yang KC. Efficacy of a Smart Antisnore Pillow in Patients with Obstructive Sleep Apnea Syndrome[J]. Behavioural Neurology, 2021, 2021: 6682401.`)] }),

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(`/workspace/opening/开题报告_基于STM32的智能止鼾枕系统设计与实现.docx`, buf);
  console.log(`written`, buf.length, "bytes");
});
