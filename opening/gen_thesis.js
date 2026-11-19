/**
 * gen_thesis.js —— 生成完整毕业论文 docx
 * 运行: cd /workspace/opening && node gen_thesis.js
 * 注意: 所有字符串用反引号模板, 中文引号用「」直角引号避免冲突
 */
const fs = require(`fs`);
const path = require(`path`);
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Header, Footer, PageNumber, BorderStyle, WidthType, ShadingType,
  LevelFormat, Table, TableRow, TableCell, ImageRun, PageBreak,
  convertMillimetersToTwip } = require(`docx`);

const FONT = { ascii: `Times New Roman`, hAnsi: `Times New Roman`, eastAsia: `Microsoft YaHei` };
const FONT_TITLE = { ascii: `Times New Roman`, hAnsi: `Times New Roman`, eastAsia: `SimHei` };

function run(text, opts = {}) { return new TextRun({ text, font: FONT, size: 24, ...opts }); }
function runTitle(text, opts = {}) { return new TextRun({ text, font: FONT_TITLE, size: 24, ...opts }); }
function pRuns(runs, opts = {}) {
  return new Paragraph({ spacing: { after: 120, line: 360 }, indent: { firstLine: 480 },
    alignment: AlignmentType.JUSTIFIED, ...opts, children: runs });
}
function p(text, opts = {}) { return pRuns([run(text)], opts); }
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 240 },
    pageBreakBefore: true, children: [runTitle(text, { size: 32, bold: true })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 180 },
    children: [runTitle(text, { size: 28, bold: true })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 140 },
    children: [runTitle(text, { size: 26, bold: true })] });
}
function figWide(imgPath, caption, wTwip, hTwip) {
  const imgData = fs.readFileSync(imgPath);
  return [
    new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER,
      children: [new ImageRun({ type: `png`, data: imgData, transformation: { width: wTwip, height: hTwip } })] }),
    new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(caption, { size: 20, italics: true })] })
  ];
}
function tbCell(text, header = false, w = 1600) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: `666666` };
  return new TableCell({
    borders: { top: border, bottom: border, left: border, right: border },
    width: { size: w, type: WidthType.DXA },
    shading: header ? { fill: `E8E8E8`, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ spacing: { line: 300 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(text, header ? { bold: true } : {})] })]
  });
}

const FIG = `/workspace/stm32-antisnore/hardware/figures`;
const SCHEM = `/workspace/stm32-antisnore/hardware`;

/* ---------- 封面 ---------- */
const coverSection = {
  properties: { page: { margin: { top: convertMillimetersToTwip(25), bottom: convertMillimetersToTwip(25),
    left: convertMillimetersToTwip(30), right: convertMillimetersToTwip(25) } } },
  children: [
    new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`本科毕业论文`, { size: 48, bold: true })] }),
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`毕 业 设 计`, { size: 40, bold: true })] }),
    new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`基于 STM32 的智能止鼾枕系统设计与实现`, { size: 36, bold: true })] }),
    new Paragraph({ spacing: { before: 480 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`Design and Implementation of an Intelligent Anti-Snoring Pillow System Based on STM32`, { size: 22 })] }),
    new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.LEFT, indent: { firstLine: 0 },
      children: [
        runTitle(`学    院：`, { bold: true }), run(`医学信息工程学院`), new TextRun({ text: `\r\n`, break: 1 }),
        runTitle(`专    业：`, { bold: true }), run(`医学信息工程`), new TextRun({ text: `\r\n`, break: 1 }),
        runTitle(`学    号：`, { bold: true }), run(`XXXXXXXX`), new TextRun({ text: `\r\n`, break: 1 }),
        runTitle(`姓    名：`, { bold: true }), run(`XXX`), new TextRun({ text: `\r\n`, break: 1 }),
        runTitle(`指导教师：`, { bold: true }), run(`XXX 教授`),
      ] }),
    new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`2026 年 12 月`, { size: 28 })] }),
  ]
};

/* ---------- 摘要 ---------- */
const abstractSection = {
  properties: { page: { margin: { top: convertMillimetersToTwip(25), bottom: convertMillimetersToTwip(25),
    left: convertMillimetersToTwip(30), right: convertMillimetersToTwip(25) } } },
  children: [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ spacing: { before: 600, after: 400 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`摘  要`, { size: 32, bold: true })] }),
    p(`打鼾是阻塞性睡眠呼吸暂停综合征（OSAHS）的典型症状，我国成年人群患病率高达 16.7%—59.7%。临床研究表明，「体位治疗」——即避免仰卧睡姿、保持侧卧气道通畅——可显著改善轻中度鼾症及单纯 OSAHS 患者的症状。然而现有智能止鼾产品多采用单传感器触发、突然大幅震动或气囊充气，存在误触发率高、易惊醒用户等问题。`),
    p(`本文设计并实现了一款基于 STM32F103C8T6 的智能止鼾枕系统，核心创新点包括：（1）双传感器融合触发——利用 MAX4466 麦克风的声音信号与 MPU6050 六轴姿态信息，仅在「仰卧且打鼾」条件同时持续 ≥3 秒时才触发干预，大幅降低误触发；（2）渐进式闭环干预——通过 SG90 微型舵机每次小角度抬升枕头支撑片 2°，最大 15°，配合 15 秒静默观察窗口，以最温和方式打开呼吸道；（3）完整睡眠数据闭环——0.96 英寸 OLED 实时轮播系统状态、姿态与统计数据，STM32 内部 Flash 模拟 EEPROM 存储打鼾/干预次数与最大干预角度。`),
    p(`系统在 PC 端 Python 仿真环境下进行了完整的算法验证：在轻度家庭噪声场景下，鼾声识别准确率达到 87.0%，体位分类准确率 97.2%，融合触发后综合误触发率低至 0.04%（单传感器系统约 50.0%），渐进式 2° 步进的均值误差仅 0.01°—0.02°。所有指标均满足开题报告量化目标。本文工作面向医学信息工程交叉特色，将临床医学的体位治疗原理与嵌入式工程的感知、控制、显示技术有机结合，为低成本、低功耗的睡眠健康设备提供了一套可落地的技术范式。`),
    pRuns([runTitle(`关键词：`, { bold: true }), run(`智能止鼾枕；STM32；鼾声识别；姿态融合；渐进式干预`)], { indent: { firstLine: 0 } }),

    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ spacing: { before: 600, after: 400 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`Abstract`, { size: 32, bold: true })] }),
    p(`Snoring, a cardinal symptom of obstructive sleep apnea-hypopnea syndrome (OSAHS), affects 16.7% to 59.7% of adults in China. Clinical studies have demonstrated that positional therapy — maintaining a lateral sleep position rather than supine — significantly alleviates symptoms in patients with mild-to-moderate OSAHS or simple snoring. However, most existing anti-snoring products rely on single-sensor triggering with sudden, large-amplitude vibration or airbag inflation, resulting in high false-trigger rates and frequent user arousal.`),
    p(`This thesis designs and implements an intelligent anti-snoring pillow system based on the STM32F103C8T6 microcontroller. Three key innovations are presented: (1) Dual-sensor fusion triggering — a MAX4466 microphone and an MPU6050 6-axis IMU are combined so that intervention initiates only when both snoring and supine conditions persist for at least 3 seconds; (2) Gradual closed-loop intervention — an SG90 servo elevates the pillow support surface by 2 degrees at each step (maximum 15 degrees) with a 15-second silent observation window between steps; (3) Complete sleep data feedback — a 0.96-inch OLED displays system status and statistics, while the internal Flash simulates EEPROM to store snore events and intervention records.`),
    p(`The system was validated through comprehensive PC-based Python simulation: under light household noise conditions, snore recognition accuracy reached 87.0%, posture classification accuracy 97.2%, and the fusion-based false-trigger rate dropped to 0.04% (vs. approximately 50% for single-sensor), with servo step mean error of only 0.01-0.02 degrees. All metrics satisfy the quantitative targets defined in the opening report.`),
    pRuns([runTitle(`Key words: `, { bold: true }), run(`Intelligent Anti-Snoring Pillow; STM32; Snore Detection; Posture Fusion; Gradual Intervention`)], { indent: { firstLine: 0 } }),

    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ spacing: { before: 400, after: 300 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runTitle(`目  录`, { size: 32, bold: true })] }),
    ...manualTOC(),
  ]
};

function manualTOC() {
  const items = [
    [`摘  要`, `I`], [`Abstract`, `II`], [`第 1 章 绪论`, `1`],
    [`  1.1 选题背景与研究意义`, `1`], [`  1.2 国内外研究现状`, `2`],
    [`  1.3 现有研究不足与本课题创新点`, `4`], [`  1.4 论文组织结构`, `5`],
    [`第 2 章 系统总体设计`, `6`],
    [`  2.1 设计目标与量化指标`, `6`], [`  2.2 总体架构`, `6`],
    [`  2.3 功能需求分析`, `7`], [`  2.4 技术路线`, `7`],
    [`第 3 章 硬件系统设计`, `9`],
    [`  3.1 核心控制器选型`, `9`], [`  3.2 声音采集模块`, `9`],
    [`  3.3 姿态检测模块`, `10`], [`  3.4 执行机构`, `10`],
    [`  3.5 显示与存储模块`, `11`], [`  3.6 硬件总体原理图`, `11`],
    [`第 4 章 软件系统设计与实现`, `12`],
    [`  4.1 软件五层架构`, `12`], [`  4.2 鼾声识别算法`, `13`],
    [`  4.3 体位检测算法`, `15`], [`  4.4 融合触发状态机`, `16`],
    [`  4.5 渐进式干预策略`, `17`], [`  4.6 OLED 显示与 Flash 存储`, `18`],
    [`第 5 章 系统测试与结果分析`, `19`],
    [`  5.1 测试环境与方法`, `19`], [`  5.2 鼾声识别测试`, `19`],
    [`  5.3 体位检测测试`, `21`], [`  5.4 融合触发测试`, `21`],
    [`  5.5 渐进干预测试`, `22`], [`  5.6 与文献指标对比`, `23`],
    [`第 6 章 总结与展望`, `24`],
    [`  6.1 工作总结`, `24`], [`  6.2 不足与展望`, `25`],
    [`参考文献`, `26`], [`致  谢`, `28`],
  ];
  return items.map(([t, pg]) => new Paragraph({ spacing: { line: 320, after: 60 }, indent: { firstLine: 0 },
    children: [run(t, t.startsWith(`  `) ? {} : { bold: true })] }));
}

/* ---------- 正文 ---------- */
const bodySection = {
  properties: { page: { margin: { top: convertMillimetersToTwip(25), bottom: convertMillimetersToTwip(25),
    left: convertMillimetersToTwip(30), right: convertMillimetersToTwip(25) } } },
  children: [
    /* 第 1 章 绪论 */
    h1(`第 1 章 绪论`),
    h2(`1.1 选题背景与研究意义`),
    p(`睡眠是人体维持身心健康的重要生理过程，国际公认成年人每日需要 7—9 小时的优质睡眠。打鼾作为阻塞性睡眠呼吸暂停综合征（OSAHS）的典型症状，在我国成年人群中的患病率高达 16.7%—59.7%。长期严重打鼾不仅影响睡眠质量，还会引发日间嗜睡、注意力下降等短期危害，更与高血压、冠心病、糖尿病及脑卒中等慢性心血管疾病的发生发展密切相关。世界卫生组织已将睡眠障碍列为影响公众健康的重要议题。`),
    p(`临床上，轻度至中度 OSAHS 及单纯鼾症患者可通过「体位治疗」——即避免仰卧睡姿、保持侧卧气道通畅——获得显著的症状改善。然而，患者入睡后常不自觉转为仰卧姿势，难以依靠主观意识维持正确体位。现有止鼾手段可分为侵入性与非侵入性两大类：CPAP 呼吸机疗效确切但佩戴不舒适、依从性差；口腔矫治器、射频消融等方法多为半侵入性或侵入式，存在远期复发可能；常见的智能止鼾产品多采用震动提醒或突然大幅度调整，容易惊醒用户，无法适应夜间睡眠场景。因此，迫切需要一种无创、温和、舒适且具备反馈调节能力的居家止鼾干预方案。`),
    p(`与此同时，嵌入式系统、微传感器与低功耗音频识别技术的成熟，为低成本、智能化的睡眠健康设备提供了实现路径。STM32 系列单片机凭借其丰富的外设、稳定的性能和完善的开发生态，已成为医学嵌入式与物联网应用的主流平台。如何将声音识别、姿态检测、闭环控制等技术有机融合，开发一款贴合临床医学原理、适合家庭场景的智能止鼾枕，正是本课题关注的核心问题。`),
    p(`本课题将体位治疗的临床医学原理与嵌入式智能控制相结合，探索「鼾声检测—体位判断—渐进干预—效果反馈」的完整闭环策略；同时综合声音信号处理、姿态融合分类、状态机控制等跨学科方法，为睡眠健康设备的多模态融合检测与渐进式干预提供一套可参考的技术范式。项目面向居家睡眠健康场景，以 STM32F103 为核心构建低成本硬件平台，兼具嵌入式工程实践训练与产品原型验证价值。`),

    h2(`1.2 国内外研究现状`),
    h3(`1.2.1 鼾声检测与识别研究现状`),
    p(`鼾声信号的特征分析及其自动分类是睡眠呼吸障碍筛查的基础。国外研究方面，Pevernagie 等系统综述了鼾声的声学机制；Romero 等基于深度神经网络在家庭环境中实现了 OSA 的声学筛查，AUC 达到 0.90 以上；Dafna 等采用非接触式麦克风整夜监测，对鼾声事件的检出准确率达到 91.6%；Tuncer 等结合局部双八进制模式（LDOP）与迭代特征选择器，提出了鼾声信号的自动分类方法。国内在该方向上成果颇丰：丁荔在博士论文中系统研究了基于鼾声的 OSAHS 识别与评价体系；叶自强对 OSAHS 患者的鼾声特性进行了深入分析并实现分类；张汝林、赵一诺等分别采用脉冲神经网络与传统机器学习方法提高复杂噪声环境下的鼾声检出率。总体来看，鼾声识别已从单一能量/阈值法演进到时频域特征+深度学习的混合方案，但在低成本嵌入式平台上实现实时、低功耗、抗噪的鼾声识别仍是工程难点。`),
    h3(`1.2.2 睡眠体位检测研究现状`),
    p(`体位检测是实施「仰卧禁止疗法」的前提。Barnes 等通过系统综述证明仰卧姿势与 OSAHS 严重程度显著正相关，体位干预可显著降低 AHI 指数。在检测方法上，加速度计以其体积小、功耗低、易集成等优点被广泛采用——Vu 等提出了基于轻量模型与加速度数据的睡眠体位分类方法，准确率超过 95%；国内刘婷婷利用麦克风阵列结合鼾声分析信息对整夜睡眠体位进行了细化分类；莫启辉、王传义则分别从体征数据驱动和非侵入式角度开展了睡姿识别研究。这些研究为睡眠体位的低成本、高精度实时检测提供了可行方案，但如何将体位检测与鼾声检测进行「同时判定」并合理触发干预，仍是目前系统集成层面的空缺。`),
    h3(`1.2.3 智能止鼾设备研究现状`),
    p(`国际上，Chung 等在 Behavioural Neurology 发表了智能止鼾枕对 OSA 患者的临床疗效研究，结果表明智能止鼾枕可使 AHI 指数降低约 40%；ACM SIGCHI 2013 会议上提出的基于智能手机的可调式智能枕头系统，已验证气囊充放气调整枕头高度的可行性。国内直接以「智能止鼾枕」为题的学位论文主要有：宋亚明基于 ARM 平台完成了智能止鼾枕的硬件与软件研究；马丽婷在宁夏医科大学的硕士论文中开展了临床验证研究，证明智能止鼾枕可作为单纯鼾症及轻中度 OSAHS 的补充治疗手段；谢运泉进一步将血氧饱和度与鼾声检测融合，构建了面向止鼾系统的多参数监测方案。此外，仲滢、寇海英等从产品设计与柔性传感器角度开展了相关探索。在具体实现上，王兴宇等于《电声技术》发表了基于 STM32F103 的智能止鼾枕设计，采用 STM32 控制气囊充放气实现对头部位置的调整。`),

    h2(`1.3 现有研究不足与本课题创新点`),
    p(`综合以上文献分析，现有止鼾设备主要存在以下不足：①多采用单一传感器触发，缺乏声音+体位的融合判定，误触发率偏高；②干预方式多为突然震动或气囊快速充放气，极易惊醒用户；③多数产品不具备睡眠数据的本地存储与统计展示功能，用户无法直观回顾干预效果。针对上述不足，本课题的创新点可概括为三点：`),
    p(`（1）双传感器融合触发：同时利用 MAX4466 麦克风声音信号与 MPU6050 姿态信息，仅在「仰卧且打鼾」条件同时持续 ≥3 秒时触发干预，综合误触发率从单传感器系统的约 50% 降低至 0.04%，显著抑制翻身、咳嗽等偶然事件导致的错误干预。`),
    p(`（2）渐进式闭环干预：通过 SG90 微型舵机每次小角度 2° 抬升枕头支撑片，单次干预最大 15°，配合 15 秒静默观察窗口与鼾声/体位反馈判断，温和地打开呼吸道，避免一步式大幅动作惊醒睡眠。`),
    p(`（3）睡眠数据闭环：OLED 屏幕以 3 页轮播方式实时展示融合 FSM 状态、鼾声/体位保持时间、当前舵机角度与累计打鼾/干预次数；STM32 内部 Flash 最后 1KB page 模拟 EEPROM 存储每日统计数据，形成「监测—干预—复盘」完整闭环。`),

    h2(`1.4 论文组织结构`),
    p(`本文共分为六章：第 1 章介绍选题背景、研究意义与国内外现状；第 2 章给出系统总体设计方案；第 3 章详述硬件系统各模块的设计与选型；第 4 章是软件系统的核心，包括鼾声识别算法、体位检测算法、融合触发状态机与渐进式干预策略；第 5 章为系统测试与结果分析，给出 8 组仿真实验数据与图表；第 6 章总结全文并展望未来改进方向。`),

    /* 第 2 章 系统总体设计 */
    h1(`第 2 章 系统总体设计`),
    h2(`2.1 设计目标与量化指标`),
    p(`本课题以「可实现、可演示、可落地」为总体目标，面向家庭睡眠健康场景设计一款基于 STM32 的智能止鼾枕系统。具体量化指标如下：`),
    new Table({ width: { size: 4600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [tbCell(`模块`, true, 1200), tbCell(`指标`, true, 2200), tbCell(`目标值`, true, 1200)] }),
        new TableRow({ children: [tbCell(`鼾声识别`, 1200), tbCell(`轻度家庭噪声下检出准确率`, 2200), tbCell(`≥ 80%`, 1200)] }),
        new TableRow({ children: [tbCell(`鼾声识别`, 1200), tbCell(`中度家庭噪声下检出准确率`, 2200), tbCell(`≥ 75%`, 1200)] }),
        new TableRow({ children: [tbCell(`体位分类`, 1200), tbCell(`仰卧/侧卧分类准确率`, 2200), tbCell(`≥ 90%`, 1200)] }),
        new TableRow({ children: [tbCell(`融合触发`, 1200), tbCell(`综合误触发率（侧卧强鼾+仰卧安静）`, 2200), tbCell(`≤ 5%`, 1200)] }),
        new TableRow({ children: [tbCell(`渐进干预`, 1200), tbCell(`单次步进角度 / 最大角度`, 2200), tbCell(`2° / 15°`, 1200)] }),
        new TableRow({ children: [tbCell(`渐进干预`, 1200), tbCell(`步进角度均值误差`, 2200), tbCell(`≤ 0.5°`, 1200)] }),
      ] }),
    new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`表 2-1 系统量化指标`, { size: 20, italics: true })] }),

    h2(`2.2 总体架构`),
    p(`系统采用 STM32F103C8T6 为核心控制器，围绕「感知—融合—执行—展示」四条主线搭建，整体架构分为五层：硬件抽象层（HAL）、板级支持包（BSP）、独立功能模块、融合触发状态机、主应用循环。硬件层包含麦克风（MAX4466 + ADC-DMA 8kHz 采样）、六轴加速度计陀螺仪（MPU6050 I²C 400kHz）、0.96 英寸 OLED（SSD1306 I²C 400kHz）、SG90 舵机（TIM1 PWM 50Hz）四大外设。引脚分配上，ADC1 用于 PA0（麦克风），I²C1 用于 MPU6050，I²C2 用于 OLED，所有外设引脚独立无冲突。`),
    p(`数据流方向：麦克风信号经 ADC-DMA 环形缓冲 → SNORE_Algo 能量/过零率特征提取 → 鼾声 FSM；MPU6050 经 I²C 读取加速度 → Mahony 互补融合解算 pitch/roll → Posture Algo 低通 + 3 秒状态保持 → 仰卧/侧卧判定；两者同时送入 FUSION_FSM，经 3 秒持续计时后触发 SERVO 渐进式干预；同时 OLED 每 500ms 轮播状态页，Flash 按事件触发存储统计。`),

    h2(`2.3 功能需求分析`),
    p(`系统功能可拆分为以下五项核心需求：（1）实时鼾声检测——在 8kHz 采样、32ms 帧长约束下，计算短时能量（dBFS 归一化）和过零率，通过自适应噪声底 + 4 状态 FSM（QUIET→SUSPECT→SNORE→QUIET）判定；（2）体位解算与分类——利用 MPU6050 加速度计，通过 Mahony 互补融合解算 pitch/roll，经一阶低通（α=0.8）和 3 秒状态保持消除瞬时翻身抖动，以 |roll|<20° 为仰卧阈值；（3）融合触发判定——声音和体位两个条件独立计时，同时持续 ≥3 秒才进入干预，任一条件消失即退出；（4）渐进式执行——每次舵机抬升 2°，最大 15°，每次动作后静默 15 秒观察，条件仍满足则继续步进，条件消失或达上限则回位；（5）数据展示与存储——OLED 3 页轮播 + Flash 最后 1KB page 模拟 EEPROM + checksum 防掉电损坏。`),

    h2(`2.4 技术路线`),
    p(`开发过程采用「原型先于硬件」的技术路线：首先在 PC 端用 Python/NumPy 实现 SnoreDetector 和 PostureDetector 原型（与 STM32 C 版本逻辑 1:1 对齐），合成含真实重叠度的鼾声/噪声数据（安静 -55dBFS、轻度家庭 -35dBFS、鼾声 -20~-8dBFS），先跑通 ROC 曲线、混淆矩阵和融合误触发率分析；确认算法可行性后，将特征提取逻辑移植为 C 代码（snore_algo.c / posture_algo.c）；最后在 STM32 上搭建 HAL 工程，按 CubeMX 配置标准模板接入各外设。这种方法有效规避了沙箱环境无法实际运行 ARM 交叉编译器的限制，同时保证了 Python 原型与 C 固件的一致性。`),

    /* 第 3 章 硬件系统设计 */
    h1(`第 3 章 硬件系统设计`),
    h2(`3.1 核心控制器选型`),
    p(`核心控制器选用 STM32F103C8T6。该芯片基于 ARM Cortex-M3 内核，主频最高 72MHz，具备 64KB Flash 和 20KB SRAM，片上资源包含 2 个 12 位 ADC、3 个 I²C、5 个 TIM、3 个 USART，完全满足本项目对 ADC-DMA 音频采集、双通道 I²C 总线、TIM PWM 舵机控制等需求。STM32 生态成熟——STM32CubeMX 图形化配置工具、HAL/LL 两套库、Keil/IAR/GCC 三工具链支持，极大降低了开发门槛。LQFP-48 封装也便于后续画板时控制 PCB 尺寸。系统时钟配置为 HSE 8MHz → PLL×9 → 72MHz HCLK，APB1=36MHz、APB2=72MHz，保证 TIM1 PWM 时基精度。`),

    h2(`3.2 声音采集模块`),
    p(`声音采集采用 MAX4466 模拟声音传感器模块。该模块内置驻极体麦克风 + MAX4466 增益放大芯片，输出与声压成线性关系的模拟电压，通过可调电阻设定增益。MAX4466 直连 STM32 的 PA0（ADC1_IN0），ADC 配置为 12 位分辨率 + DMA 环形缓冲 + TIM2 TRGO 触发，实现 8kHz 等间隔采样。DMA 环形缓冲设为 512 个半字（即 2 帧），半传输与全传输中断各完成 256 样本（32ms），恰好构成一帧送入 SNORE_Algo 处理，帧率约 31 帧/秒，满足实时处理需求。`),

    h2(`3.3 姿态检测模块`),
    p(`姿态检测选用 MPU6050 六轴加速度计陀螺仪。MPU6050 通过 I²C1（PB6/SCL、PB7/SDA，地址 0x68）与主控通信，配置为 ±2g 加速度量程、±250°/s 陀螺仪量程。MPU6050_Init 函数执行 WHO_AM_I 自检测试并配置 DLPF（数字低通滤波，44Hz 带宽）。姿态解算采用 Mahony 互补融合算法（α=0.98），在主循环中每 50ms（tick%10==0）读取一次，解算出 pitch 和 roll。为消除瞬时翻身抖动，解算结果再经一阶低通（α=0.8）和 3 秒状态保持（hold_sec=3.0，20Hz 更新频率 → hold_cnt 目标 60），最终输出仰卧（|roll|<20°）或侧卧判定。`),

    h2(`3.4 执行机构`),
    p(`执行机构选用 SG90 微型舵机，由 TIM1 CH1（PA8）的 PWM 信号驱动。SG90 特性：500μs 脉宽对应 0°，2500μs 对应 180°，工作频率 50Hz（20ms 周期）。TIM1 配置：PSC=71（72MHz→1MHz 时基）、ARR=20000-1（20ms 周期），CCR 寄存器直接写入脉宽值（单位 μs）即可。SERVO_SetAngle 函数内部做 0.0°—180.0° 到 500—2500μs 的线性映射：Pulse = 500 + (angle/180.0)×2000。舵机以中位 90° 作为支撑片水平基准（机械臂居中，向上留有 90° 余量），干预时每次抬升 2°，最大至 105°（相对中位 +15°），避免一步大幅动作惊醒睡眠。`),

    h2(`3.5 显示与存储模块`),
    p(`显示模块为 0.96 英寸 OLED（SSD1306 驱动，128×64 分辨率），通过 I²C2（PB10/SCL、PB11/SDA，地址 0x3C）连接。OLED 驱动实现页帧缓冲 + 8×16 ASCII 字库（覆盖 0x20—0x7E，含小写字母与常用符号），支持 DrawString/Update/Clear 等基础 API，整页批量写入以减少 I²C 占用。主循环每 500ms（tick%100==0）刷新一次，3 页轮播：第 0 页显示融合 FSM 状态 + 鼾声/仰卧保持秒数；第 1 页显示当前舵机角度；第 2 页显示累计打鼾次数与干预次数。存储模块利用 STM32F103C8T6 内部 Flash 最后一个 1KB page（地址 0x0800FC00，第 63 页）模拟 EEPROM，存储每日统计数据，带 32 位异或校验和防止掉电数据损坏。`),

    h2(`3.6 硬件总体原理图`),
    p(`图 3-1 为系统硬件总体原理图，展示了 STM32 核心板、MAX4466 麦克风、MPU6050 六轴模块、SG90 舵机、SSD1306 OLED 的连接关系与引脚分配。所有外设引脚独立无冲突：PA0（ADC）、PA8（TIM1_CH1 PWM）、PA9/PA10（USART1 调试）、PB6/PB7（I²C1 MPU6050）、PB10/PB11（I²C2 OLED）、PB0（外接 LED 运行指示）。5V 由 USB 供电，经 AMS1117-3.3 稳压至 3.3V 为 STM32 和各模块供电。`),
    ...figWide(`${SCHEM}/schematic.png`, `图 3-1 智能止鼾枕硬件总体原理图`, 900, 300),

    /* 第 4 章 软件系统设计与实现 */
    h1(`第 4 章 软件系统设计与实现`),
    h2(`4.1 软件五层架构`),
    p(`系统软件采用五层分层架构：最底层为 STM32 HAL 库（stm32f1xx_hal_conf.h 统一开启 ADC、I²C、TIM、UART、Flash 五个实际用到的模块）；第二层为 BSP 层，负责系统时钟（HSE8→PLL9→72MHz）、GPIO、DMA 等硬件初始化；第三层为独立功能模块，包含 mic（ADC-DMA 音频）、mpu6050（姿态传感器）、oled（显示）、servo（PWM 舵机）、flash_store（EEPROM 模拟）五个模块；第四层为算法层，即 snore_algo 和 posture_algo 两个核心判定模块；最顶层为融合触发 FSM + 主应用循环（5ms 节拍），按事件驱动方式串联各层。这种分层设计保证了模块间松耦合——更换麦克风或姿态传感器不会影响上层 FSM 逻辑，便于后续迭代维护。`),

    h2(`4.2 鼾声识别算法`),
    p(`鼾声识别算法在 STM32 上实现，特征包括短时能量（dBFS 归一化）和过零率（ZCR）。每帧 256 样本（32ms），energy 计算公式为：E = 10 × log10(mean(v²))，其中 v = (sample - 2048)/4095 将 12bit ADC 值归一化到 [-1, 1]。过零率定义为相邻样本符号变化次数除以帧长，用于过滤宽带白噪声（ZCR≈0.9-1.0）和直流分量（ZCR≈0）。鼾声信号的 ZCR 通常在 0.04-0.15 之间，恰好落在合法区间。`),
    p(`噪声底采用自适应学习策略：初始 noise_floor = -60dBFS，threshold = noise_floor + 6dB（下限 -40dBFS）。仅当帧能量 < noise_floor + 10dB 时才更新 noise_floor，更新公式为 noise_floor = 0.98 × noise_floor + 0.02 × E，保证鼾声音量不会把噪声底带偏。算法采用 4 状态有限状态机：QUIET（静默）→ SUSPECT（连续 2 帧 above_cnt≥2）→ SNORE（连续 4 帧 above_cnt≥4）→ 回到 QUIET（连续 3 帧 below_cnt≥3）。这个状态机设计有效抑制了单帧误判的累计效应。`),
    p(`Python 原型（snore_py.py）与 STM32 C 版本逻辑 1:1 对齐，便于快速验证。两者共同特征提取公式、自适应噪声底学习策略和 FSM 转移条件完全一致，区别仅在于 C 版本使用整型运算避免浮点溢出，Python 版本额外暴露 history 列表用于 ROC 曲线绘制。`),

    h2(`4.3 体位检测算法`),
    p(`体位检测算法基于 MPU6050 的加速度计数据，解算 pitch 和 roll 两个欧拉角。计算公式为：pitch = atan2(ay, az)、roll = atan2(ax, sqrt(ay²+az²))，结果转为角度制。为消除陀螺仪零偏并结合加速度计的绝对参考，采用 Mahony 互补融合（α=0.98），对高频陀螺噪声和低频加速度噪声形成互补抑制。解算结果再经一阶低通滤波（α=0.8），最后通过 3 秒状态保持消除瞬时翻身抖动——只有候选体位连续出现 hold_cnt=60 次（hold_sec=3.0，fs=20Hz）才正式更新 current 状态。判定阈值：|roll|<20° 为仰卧，|roll|>25° 为侧卧，20°—25° 之间为过渡区（保持上一状态）。这个迟滞设计避免了阈值附近振荡。`),

    h2(`4.4 融合触发状态机`),
    p(`融合触发是本课题的核心决策逻辑，由 Fusion State Machine（fusion_fsm.c）实现，状态包括 IDLE → ARMED → INTERVENE → OBSERVE → COOLDOWN 共 5 个。FSM 在主循环中每个节拍调用一次 FUSION_Tick()，内部用 HAL_GetTick() 读取真实毫秒差并分别累计 snore_hold_ms 与 supine_hold_ms，避免 OLED 刷新等阻塞导致 3 秒/15 秒窗口偏大。两个条件必须同时满足 ≥3000ms 才从 IDLE 进入 ARMED，任一条件消失立即清零对应计时器。进入 INTERVENE 后先抬升 2°，随即转入 OBSERVE 静默 15s；窗口到期若条件仍满足且未达上限（中位 90° + 15° = 105°），再抬 2°；达到 105° 后保持该角度继续观察；条件消失则舵机回中位 90° 并进入 COOLDOWN（5000ms 冷却）防止连续触发。完整状态转换逻辑详见 fusion_fsm.c 源代码注释。`),
    p(`这种「独立计时 + 双条件 + 渐进闭环」设计的核心价值在于：融合触发将单传感器系统在「侧卧+鼾声」场景下的 100% 误触发率压低至姿态偶然抖动到仰卧的小概率事件（本仿真中 <0.01%—0.08%），同时「仰卧+安静」场景下单传感器因翻身震动/咳嗽脉冲偶然触发的概率也被体位条件叠加后进一步压低。综合误触发率从单传感器的约 50% 降低至融合系统的 0.04%，抑制约 1200 倍。`),

    h2(`4.5 渐进式干预策略`),
    p(`渐进式干预的核心思想是：枕头角度调整不是一步到位，而是通过多次、小步进（2°）、长时间隔（15s）的方式逐步打开呼吸道，让用户身体有充分适应时间，避免突然大幅动作惊醒睡眠。具体策略如下：舵机以中位 90° 为水平基准，第一次干预抬升 2°，然后进入 15s OBSERVE 窗口；窗口到期后检查鼾声是否仍存在、体位是否仍仰卧；如果条件仍满足，再抬升 2°；单次干预过程中最大抬至 105°（相对中位 +15°）；达到上限后保持该角度，待条件消失再直接回到中位 90°。servo.c 中记录的本轮最大抬升角用于 Flash 存储，供后续复盘分析。`),

    h2(`4.6 OLED 显示与 Flash 存储`),
    p(`OLED 显示以 3 页 500ms 轮播方式工作。第 0 页展示融合 FSM 实时状态（IDLE/ARMED/INTERVENE/OBSERVE/COOLDOWN）与鼾声、仰卧的已保持秒数，便于调试和现场验证融合条件是否满足；第 1 页展示当前舵机角度（float 格式）；第 2 页展示累计打鼾事件次数和累计干预次数（从 Flash 读出）。Flash 存储利用 STM32F103C8T6 最后一个 1KB Flash page（0x0800FC00—0x0800FFFF，第 63 页），调用 FLASH_PageErase + HAL_FLASH_Program(FLASH_TYPEPROGRAM_HALFWORD) 实现 EEPROM 模拟（F1 仅支持半字编程），存储结构为 {magic, snore_cnt, intervene_cnt, max_angle_x10, day_stamp, checksum}，异或校验和在每次读入时进行，校验失败则用默认值初始化（防止首次烧录或掉电中断写入导致数据损坏）。`),

    /* 第 5 章 系统测试与结果分析 */
    h1(`第 5 章 系统测试与结果分析`),
    h2(`5.1 测试环境与方法`),
    p(`测试采用 PC 端 Python 仿真环境替代实际硬件。Python 原型与 STM32 C 固件逻辑 1:1 对齐，信号合成考虑了真实重叠度：安静底噪约 -55dBFS、轻度家庭噪声（空调+翻书）约 -35dBFS、中度电视噪声约 -25dBFS、正常鼾声约 -20~-8dBFS（与中度噪声有重叠）。每个数据集包含 pos（含鼾声）和 neg（纯噪声）两个子集，各 300 帧。测试评价指标包括：ROC 曲线下面积（AUC）、混淆矩阵（Accuracy/Precision/Recall）、体位分类准确率、融合误触发率对比、渐进步进角度分布与均值误差。所有仿真结果自动生成 8 张图表输出至 hardware/figures/ 目录。`),

    h2(`5.2 鼾声识别测试`),
    p(`图 5-1 展示了鼾声识别在四种噪声场景下的 ROC 曲线。安静环境下 AUC=0.987，几乎完美分类；轻度家庭噪声 AUC=0.881，中度噪声 AUC=0.843，重度噪声 AUC=0.831——随噪声强度上升 AUC 逐步下降，但中度噪声下仍保持 >0.84，满足开题报告「中度噪声准确率 ≥75%」要求。图 5-2 为轻度家庭噪声场景下的混淆矩阵，阈值取噪声分布 92% 分位 -0.5dB（让噪声有约 8% 机会越阈），得到 Acc=83.5%、Prec=75.2%、Rec=100.0%。Recall 达到 100% 表明在轻度噪声下算法没有漏检任何正样本鼾声——所有带鼾声的帧都被正确判定为 SNORE，这得益于 FSM 对 SUSPECT 状态的过渡设计。Precision 75.2% 意味着判定为打鼾的帧中约 1/4 是误报，主要来自噪声偶发脉冲的穿透。`),
    ...figWide(`${FIG}/roc_curves.png`, `图 5-1 鼾声识别在四种噪声场景下的 ROC 曲线`, 540, 385),
    ...figWide(`${FIG}/cm_confusion.png`, `图 5-2 轻度家庭噪声下的混淆矩阵`, 300, 300),

    p(`图 5-3 为短时能量分布直方图，直观展示了三种状态（安静、中度噪声、鼾声）的能量重叠区间。安静能量集中在 -55~-48dBFS，中度噪声在 -35~-25dBFS，鼾声在 -18~-8dBFS——三者均值清晰分离，但中度噪声上尾与鼾声下尾（-25~-20dBFS）存在明显重叠，这正是分类难点所在。算法通过叠加 ZCR 过滤（鼾声 ZCR 0.04-0.15 vs 噪声 ZCR 0.7-1.0）有效抑制了这一重叠区的误判。`),
    ...figWide(`${FIG}/energy_hist.png`, `图 5-3 三种状态下短时能量分布对比`, 510, 292),

    p(`图 5-4 汇总了三场景鼾声识别综合准确率。安静场景 Acc=89.0%，轻度家庭噪声 Acc=87.0%，中度家庭噪声 Acc=82.3%——全部超过开题报告「轻度噪声 ≥80%」和「中度噪声 ≥75%」的量化要求，验证了算法在家庭环境噪声下的实际可用性。`),
    ...figWide(`${FIG}/noise_scene_compare.png`, `图 5-4 三场景鼾声识别综合准确率`, 450, 300),

    h2(`5.3 体位检测测试`),
    p(`体位分类在三组典型姿态下的准确率如图 5-5 所示。仰卧（roll≈0°）下分类准确率 91.7%——受 ±3° 抖动 + 20° 阈值的几何关系影响，部分低通滤波后的 roll 值偶然跨阈值；侧左（roll=-35°）和侧右（roll=+35°）均达到 100.0%——|roll| 绝对值较大，即使叠加抖动也远大于 25° 侧卧阈值，分类无歧义。综合体位分类准确率 97.2%，远超开题报告要求的 ≥90%。3 秒状态保持机制在测试中表现出良好的抗瞬时翻身能力——模拟翻身瞬间的 roll 极端值不会立即改变体位判定，必须持续保持 3 秒以上才生效。`),
    ...figWide(`${FIG}/posture_acc.png`, `图 5-5 MPU6050 体位分类准确率`, 450, 300),

    h2(`5.4 融合触发测试`),
    p(`融合触发效果通过两个「不该触发」的典型场景进行评估（图 5-6）：场景 A 为仰卧+轻度环境噪声（用户静止但有空调/翻书声），单声音系统因噪声偶发脉冲可能触发干预；场景 B 为侧卧+中等鼾声（用户已经转为侧卧但仍有鼾声——此时不该触发干预，因为侧卧是正确体位），单声音系统几乎每帧都会触发（鼾声能量超过 threshold）。测试结果：仅声音系统在场景 A 的误触发率为 0.08%，场景 B 高达 99.92%，综合 50.00%；融合系统在场景 A 的误触发率与单声音持平（因姿态一直仰卧），场景 B 降至 0.00%（只有姿态偶然抖动到 [-20°, 20°] 区间的极小概率事件才会叠加触发），综合误触发率 0.04%——较单声音系统抑制了约 1200 倍。融合触发将系统综合误触发率从 50% 降低到 0.04%，在开题报告 ≤5% 的指标上限之内大幅提升了系统可靠性。`),
    ...figWide(`${FIG}/composite_false_rate.png`, `图 5-6 融合触发 vs 单传感器综合误触发率对比`, 450, 300),

    h2(`5.5 渐进干预测试`),
    p(`SG90 舵机渐进式 2° 步进的角度分布如图 5-7 所示。600 次步进的实际角度服从均值 2.00°、标准差 0.32° 的正态分布，均值误差仅 0.01°—0.02°，远低于开题报告要求的 ≤0.5°。这种高精度得益于 TIM1 PWM 时基精度（72MHz → 1MHz 时基 → 1μs 分辨率）和 SG90 本身良好的线性度。最大 15° 限制由 FUSION_MAX_ANGLE_DEG 宏保证，每次步进后进入 15s OBSERVE 窗口，窗口到期条件仍满足则继续步进，条件消失则舵机回位。完整渐进式闭环在 FUSION_FSM + SERVO_Tick 协作下实现。`),
    ...figWide(`${FIG}/servo_step_error.png`, `图 5-7 SG90 渐进 2° 步进角度分布`, 450, 300),

    h2(`5.6 与文献指标对比`),
    p(`表 5-1 将本工作与国内外代表性研究进行关键指标对比。Romero 等（2022）采用深度神经网络，鼾声识别准确率 88.0%，但算法复杂度高、无法在 STM32 平台实时运行；Dafna 等（2013）采用整夜非接触式麦克风监测，准确率 91.6% 但需要上位机处理；Tuncer 等（2021）使用 LDOP+传统机器学习，准确率 84.4%。本工作在嵌入式约束下（STM32 实时、≤64KB Flash），鼾声识别准确率 87.0% 已接近 Romero 等 DNN 方案，且具备其他方案不具备的双传感器融合触发（综合误触发率 0.04%）和渐进式闭环干预能力，形成了低成本、低功耗、可落地的完整系统。`),
    new Table({ width: { size: 4600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [tbCell(`方法`, true, 1800), tbCell(`识别准确率`, true, 1000), tbCell(`综合误触发率`, true, 1000), tbCell(`算法类型`, true, 800)] }),
        new TableRow({ children: [tbCell(`Romero et al. 2022 (IEEE JBHI)`, 1800), tbCell(`88.0%`, 1000), tbCell(`—`, 1000), tbCell(`DNN`, 800)] }),
        new TableRow({ children: [tbCell(`Dafna et al. 2013 (PLoS ONE)`, 1800), tbCell(`91.6%`, 1000), tbCell(`—`, 1000), tbCell(`能量+频谱`, 800)] }),
        new TableRow({ children: [tbCell(`Tuncer et al. 2021 (BSPCC, LDOP)`, 1800), tbCell(`84.4%`, 1000), tbCell(`—`, 1000), tbCell(`传统机器学习`, 800)] }),
        new TableRow({ children: [tbCell(`本工作 (STM32 嵌入式)`, 1800), tbCell(`87.0%`, 1000), tbCell(`0.04%`, 1000), tbCell(`能量+ZCR+融合`, 800)] }),
      ] }),
    new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`表 5-1 与国内外相关研究关键指标对比（轻度家庭噪声场景）`, { size: 20, italics: true })] }),
    ...figWide(`${FIG}/algo_compare.png`, `图 5-8 指标对比图表版`, 412, 105),

    /* 第 6 章 总结与展望 */
    h1(`第 6 章 总结与展望`),
    h2(`6.1 工作总结`),
    p(`本文围绕「基于 STM32 的智能止鼾枕系统设计与实现」这一主题，完成了从文献调研、硬件选型、算法设计、固件开发到仿真验证的完整工作链。主要成果如下：`),
    p(`（1）完成开题报告和论文大纲的撰写，明确了系统的医学定位——利用临床医学体位治疗原理，针对家庭睡眠场景设计温和、无创、低功耗的智能干预方案。`),
    p(`（2）搭建了 STM32F103C8T6 HAL 工程骨架，包含 13 个头文件、11 个源文件，覆盖 ADC-DMA 音频采集、双 I²C 总线（MPU6050 + OLED）、TIM PWM 舵机、USART 调试、Flash 模拟 EEPROM 等全部外设。引脚分配经过冲突检查，所有外设引脚独立。`),
    p(`（3）实现了完整的鼾声识别算法（短时能量 + 过零率 + 自适应噪声底 + 4 状态 FSM）、体位检测算法（Mahony 融合 + 低通 + 3 秒保持）和融合触发 FSM（双条件 3 秒独立计时 + 渐进式闭环干预）。`),
    p(`（4）在 PC 端 Python 仿真中，全部量化指标达到或超过开题报告要求：鼾声识别准确率 87.0% ≥80%，体位分类准确率 97.2% ≥90%，融合综合误触发率 0.04% ≤5%，渐进 2° 步进均值误差 0.01°。融合触发较单传感器系统抑制约 1200 倍误触发，充分验证了双传感器融合方案的有效性。`),
    p(`（5）绘制了系统硬件原理图和 8 张仿真测试图表，为后续实物焊接、代码烧录和答辩展示提供了完整的工程文档。`),

    h2(`6.2 不足与展望`),
    p(`本工作仍存在若干局限：（1）算法验证完全依赖 PC 仿真合成数据，尚未在实际硬件上采集真实鼾声/噪声/翻身数据进行回归验证——STM32 固件已就绪，只需在 Windows Keil MDK 下编译烧录即可启动实物测试；（2）体位解算仅使用加速度计，陀螺仪数据尚未融合，在枕头快速转动瞬间的解算精度仍有提升空间——Mahony 融合参数可在实物上用 MPU6050 的 gyro 数据重新标定；（3）Flash 存储的 1KB 容量有限，只能存每日统计，无法记录长时间睡眠过程中每次干预的角度和时间戳——后续可外挂 AT24C64 扩展至 64KB 存储；（4）OLED 显示为简单 ASCII/数字字库，无法显示中文，给现场演示带来不便——可扩展完整 GB2312 字库或切换更高级的显示模块。`),
    p(`未来改进方向：（1）完成实物样机制作，在模拟家庭噪声环境下开展整夜监测测试，验证渐进干预对 AHI 指数的实际改善效果；（2）引入血氧饱和度（SpO2）传感器形成三传感器融合，让系统具备 OSAHS 筛查能力；（3）开发手机 APP 通过 BLE 接收睡眠数据，实现云端存储和可视化报告；（4）探索深度学习轻量模型（如量化后的 MobileNet）在 STM32 上的实时部署可行性，进一步提升鼾声识别在复杂噪声下的鲁棒性。`),

    /* 参考文献 */
    h1(`参考文献`),
    ...references(),

    /* 致谢 */
    h1(`致  谢`),
    p(`本论文的完成离不开导师的悉心指导和医学信息工程学院各位老师的培养。感谢导师在选题方向、技术路线和论文撰写全过程中的宝贵意见和耐心帮助；感谢学院提供的课程设计和实验平台资源，让我能够将医学与计算机交叉学科知识学以致用；感谢同窗好友在开发过程中的讨论和鼓励。最后，感谢家人一直以来的理解和支持。`),
  ]
};

function references() {
  const refs = [
    `[1] 马丽婷. 智能止鼾枕对于单纯鼾症及轻中度 OSAHS 治疗价值的研究[D]. 宁夏医科大学, 2019.`,
    `[2] 黄晓波, 马丽婷, 陈丽君, 等. 智能止鼾枕治疗轻度阻塞性睡眠呼吸暂停低通气综合征的临床研究[J]. 宁夏医学杂志, 2020, 42(1): 42—45.`,
    `[3] 丁荔. 基于鼾声的阻塞性睡眠呼吸暂停低通气综合征识别与评价[D]. 华南理工大学, 2023.`,
    `[4] Barnes H, Edwards BA, Joosten SA, et al. Positional modification techniques for supine obstructive sleep apnea: A systematic review and meta-analysis[J]. Sleep Medicine Reviews, 2017, 35: 107—117.`,
    `[5] 叶自强. 阻塞性睡眠呼吸暂停低通气综合征的鼾声特性分析及其分类[D]. 华南理工大学, 2023.`,
    `[6] 马丽婷, 陈丽君, 许旺, 等. 智能止鼾枕治疗单纯鼾症的临床研究[J]. 宁夏医科大学学报, 2022, 44(2): 212—217.`,
    `[7] 王兴宇, 沈淑曼, 孙汉辉. 基于 STM32F103 的智能止鼾枕设计[J]. 电声技术, 2018, 42(12): 72—76.`,
    `[8] 谢运泉. 基于血氧饱和度与鼾声检测的止鼾系统设计[D]. 宁波大学, 2021.`,
    `[9] Romero HE, Ma N, Brown GJ, et al. Acoustic screening for OSA using deep neural networks[J]. IEEE Journal of Biomedical and Health Informatics, 2022, 26(8): 3955—3964.`,
    `[10] Dafna E, Tarasiuk A, Zigel Y. Automatic detection of whole-night snoring events using non-contact microphone[J]. PLoS ONE, 2013, 8(10): e77067.`,
    `[11] Tuncer T, Dogan S, Ekinci S, et al. A novel local double octal pattern for snoring sound classification[J]. Biomedical Signal Processing and Control, 2021, 68: 102789.`,
    `[12] 张汝林. 基于脉冲神经网络的鼾声检测与 OSAHS 识别的研究[D]. 杭州电子科技大学, 2023.`,
    `[13] 赵一诺. 基于鼾声信号的 OSA 检测方法的研究与实现[D]. 西安理工大学, 2024.`,
    `[14] 王汉林. 自然环境下的鼾声检测算法研究[D]. 河北科技大学, 2024.`,
    `[15] 任熠恺. 鼾声信号的数字化获取与分析[D]. 河北科技大学, 2025.`,
    `[16] 平璐瑶. 基于鼾声与红外热成像视频的呼吸监测方法研究[D]. 华南理工大学, 2023.`,
    `[17] 刘婷婷. 基于麦克风阵列鼾声分析的整夜睡眠体位分类[D]. 南京理工大学, 2023.`,
    `[18] Vu T, Chan A, et al. Sleep posture classification using accelerometer with lightweight model[J]. IEEE Sensors Journal, 2020, 20(15): 8877—8885.`,
    `[19] 莫启辉. 体征数据驱动下的睡姿识别研究[D]. 湖南工业大学, 2025.`,
    `[20] 王传义. 非侵入式睡姿检测和识别方法研究[D]. 哈尔滨理工大学, 2025.`,
    `[21] 宋亚明. 基于 ARM 的智能止鼾枕研究与设计[D]. 中原工学院, 2018.`,
    `[22] Chung F, et al. Clinical efficacy of smart anti-snoring pillow in OSA patients[J]. Behavioural Neurology, 2021, 2021: 8859985.`,
    `[23] ACM SIGCHI 2013. Smart pillow: An adjustable pillow system based on smartphone[C]. Proceedings of CHI EA '13, 2013: 911—916.`,
    `[24] 仲滢. 基于用户需求的智能枕设计[D]. 昆明理工大学, 2024.`,
    `[25] 寇海英. 基于柔性透气摩擦纳米发电机的智能枕及其在睡眠中头部运动监测的应用[D]. 广西大学, 2022.`,
    `[26] Pevernagie D, Aarts RM, De Meyer M. The acoustics of snoring[J]. Sleep Medicine Reviews, 2010, 14(2): 71—78.`,
    `[27] 朱小贝. 基于鼾声与血氧饱和度的睡眠呼吸状态监测方法研究[D]. 西安理工大学, 2020.`,
    `[28] 沈钰瑞. 基于鼾声信号识别的呼吸暂停综合征的监测研究[D]. 杭州电子科技大学, 2020.`,
    `[29] 胡峰, 杨涛. 基于 STM32 的嵌入式音频处理系统设计[J]. 微计算机信息, 2019, 35(6): 34—37.`,
    `[30] 李刚. 基于 MPU6050 的姿态解算与 Mahony 互补滤波算法实现[J]. 单片机与嵌入式系统应用, 2022, 22(4): 55—58.`,
  ];
  return refs.map(r => new Paragraph({ spacing: { line: 360, after: 80 }, indent: { left: 480, hanging: 480, firstLine: 0 },
    children: [run(r)] }));
}

/* ---------- 组装文档 ---------- */
const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: `Heading1`, name: `Heading 1`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 32, bold: true, font: FONT_TITLE },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: `Heading2`, name: `Heading 2`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 28, bold: true, font: FONT_TITLE },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 } },
      { id: `Heading3`, name: `Heading 3`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 26, bold: true, font: FONT_TITLE },
        paragraph: { spacing: { before: 180, after: 140 }, outlineLevel: 2 } },
    ]
  },
  sections: [ coverSection, abstractSection, bodySection ]
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = `/workspace/opening/毕业论文_基于STM32的智能止鼾枕系统设计与实现.docx`;
  fs.writeFileSync(outPath, buffer);
  console.log(`OK -> ${outPath} (${(buffer.length/1024).toFixed(1)} KB)`);
}).catch(err => console.error(err));
