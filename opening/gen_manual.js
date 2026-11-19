/**
 * gen_manual.js —— 生成《智能止鼾枕 实物实现操作手册（从零到一）》
 * 运行: cd /workspace/opening && node gen_manual.js
 * 约定: 字符串一律用反引号; 中文引号用「」; 代码块用 String.raw 防止转义
 */
const fs = require(`fs`);
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, WidthType, ShadingType, Table, TableRow, TableCell, ImageRun,
  PageBreak, convertMillimetersToTwip } = require(`docx`);

const FONT = { ascii: `Times New Roman`, hAnsi: `Times New Roman`, eastAsia: `Microsoft YaHei` };
const FONT_H = { ascii: `Times New Roman`, hAnsi: `Times New Roman`, eastAsia: `SimHei` };
const FONT_CODE = { ascii: `Consolas`, hAnsi: `Consolas`, eastAsia: `Microsoft YaHei` };

const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 21, ...o });
const runH = (t, o = {}) => new TextRun({ text: t, font: FONT_H, size: 21, ...o });

function p(text, o = {}) {
  return new Paragraph({ spacing: { after: 100, line: 330 }, indent: { firstLine: 420 },
    alignment: AlignmentType.JUSTIFIED, ...o, children: [run(text)] });
}
function pKv(label, text) {
  return new Paragraph({ spacing: { after: 80, line: 330 }, indent: { firstLine: 0 },
    alignment: AlignmentType.JUSTIFIED,
    children: [runH(label, { bold: true }), run(text)] });
}
function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
    spacing: { before: 200, after: 220 },
    children: [runH(t, { size: 30, bold: true })] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 140 },
    children: [runH(t, { size: 24, bold: true })] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 100 },
    children: [runH(t, { size: 21, bold: true })] });
}
/* 代码块: 逐行输出, 浅灰底, 等宽字体 */
function code(src) {
  const lines = src.replace(/\t/g, `    `).split(`\n`);
  return lines.map((ln) => new Paragraph({
    spacing: { line: 240, after: 0, before: 0 },
    indent: { firstLine: 0, left: 240 },
    shading: { fill: `F4F4F4`, type: ShadingType.CLEAR },
    children: [new TextRun({ text: ln.length ? ln : ` `, font: FONT_CODE, size: 17 })]
  }));
}
function note(text, fill = `FFF7E6`) {
  return new Paragraph({ spacing: { before: 80, after: 120, line: 320 }, indent: { firstLine: 0, left: 200, right: 200 },
    shading: { fill, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: `E0A040` } },
    children: [run(text, { size: 19 })] });
}
function bullet(text) {
  return new Paragraph({ spacing: { after: 60, line: 320 }, indent: { firstLine: 0, left: 420, hanging: 240 },
    children: [run(`• ` + text)] });
}
const B = { style: BorderStyle.SINGLE, size: 1, color: `888888` };
function cell(t, w, { bold = false, fill = null, align = AlignmentType.LEFT, size = 18 } = {}) {
  return new TableCell({
    borders: { top: B, bottom: B, left: B, right: B },
    width: { size: w, type: WidthType.DXA },
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ alignment: align, spacing: { line: 260 }, indent: { firstLine: 0 },
      children: [run(t, { bold, size })] })]
  });
}
function table(widths, header, rows) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((t, i) => cell(t, widths[i], { bold: true, fill: `E9EEF6`, align: AlignmentType.CENTER })) }),
      ...rows.map((r) => new TableRow({ children: r.map((t, i) => cell(String(t), widths[i], { align: i === 0 ? AlignmentType.LEFT : AlignmentType.LEFT })) }))
    ] });
}
function cap(t) {
  return new Paragraph({ spacing: { before: 80, after: 160 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
    children: [run(t, { size: 17, italics: true })] });
}
function img(path, w, h, caption) {
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 },
      children: [new ImageRun({ data: fs.readFileSync(path), transformation: { width: w, height: h } })] }),
    cap(caption)
  ];
}

/* ================= 封面 ================= */
const cover = {
  properties: { page: { margin: { top: convertMillimetersToTwip(25), bottom: convertMillimetersToTwip(25),
    left: convertMillimetersToTwip(28), right: convertMillimetersToTwip(24) } } },
  children: [
    new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runH(`智能止鼾枕系统`, { size: 44, bold: true })] }),
    new Paragraph({ spacing: { before: 260 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runH(`实物实现操作手册`, { size: 40, bold: true })] }),
    new Paragraph({ spacing: { before: 300 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`从下单采购 · 软件安装 · 接线 · 建工程 · 烧录 · 联调 · 演示`, { size: 22 })] }),
    new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`适用平台：STM32F103C8T6（Blue Pill）+ Keil MDK 5 + STM32CubeMX`, { size: 20 })] }),
    new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`配套工程：/workspace/stm32-antisnore`, { size: 20 })] }),
    new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`医学信息工程 · 本科毕业设计`, { size: 22 })] }),
  ]
};

/* ================= 正文 ================= */
const body = {
  properties: { page: { margin: { top: convertMillimetersToTwip(24), bottom: convertMillimetersToTwip(24),
    left: convertMillimetersToTwip(28), right: convertMillimetersToTwip(24) } } },
  children: [
    /* ---------- 阅读说明 ---------- */
    h1(`阅读说明与总流程`),
    p(`本手册按「先买、再装、再接、再编、最后调」的顺序编排，每一步都给出可直接照做的操作、预期现象和失败时的排查方法。建议严格按顺序执行，不要跳步——尤其不要一上来就把所有模块全部接上再上电，那样一旦出错很难定位。`),
    h3(`九个阶段一张图`),
    table([760, 2500, 3300], [`阶段`, `你要做的事`, `完成标志`], [
      [`① 采购`, `下单 13 类物料（约 130 元）`, `快递到齐，型号核对无误`],
      [`② 装软件`, `CubeMX / Keil / ST-Link 驱动 / CH340 驱动 / 串口助手`, `Keil 能新建并编译空工程`],
      [`③ 接线`, `分 6 步接线，每步用万用表量电压`, `3.3V 与 5V 均正常，无发烫`],
      [`④ 建工程`, `CubeMX 按参数表配置并生成 Keil 工程`, `生成成功，目录含 Core/Drivers`],
      [`⑤ 集成源码`, `拷贝 21 个源文件 + 粘贴 4 段代码`, `Keil 编译 0 Error`],
      [`⑥ 烧录`, `ST-Link 下载并复位运行`, `串口打印「智能止鼾枕 启动」`],
      [`⑦ 分段联调`, `LED→串口→OLED→MPU→麦克风→舵机→整体`, `7 项全部 PASS`],
      [`⑧ 演示`, `手机放鼾声 + 倾斜板子`, `FSM 走完 ARMED→INTERVENE`],
      [`⑨ 采数据`, `串口抓日志，替换论文仿真数据`, `得到真实测试表格`],
    ]),
    note(`时间投入参考：采购等快递 2—3 天；装软件 2 小时；接线与建工程 3 小时；联调 1—2 天。全程不需要焊接，面包板 + 杜邦线即可完成。`),

    /* ---------- 第 1 章 采购 ---------- */
    h1(`第 1 章 物料采购清单`),
    p(`下表按「一项功能一个模块」列出全部物料。单价为 2025—2026 年淘宝/立创商城常见价位，仅供预算参考。购买时优先选「销量高 + 带引脚定义图」的店铺，模块引脚丝印清晰能省大量调试时间。`),
    table([300, 2100, 700, 800, 1900], [`序号`, `物料名称（搜索关键词）`, `数量`, `参考价`, `选型要点`], [
      [`1`, `STM32F103C8T6 最小系统板（Blue Pill）`, `2`, `¥12`, `买 2 块备用；要 C8T6 主控，板载 8MHz 晶振`],
      [`2`, `ST-Link V2 下载器（ST-Link V2 仿真器）`, `1`, `¥12`, `需支持 SWD；带 4 根杜邦线`],
      [`3`, `MAX4466 麦克风模块（MAX4466 声音传感器）`, `1`, `¥7`, `模拟输出 OUT；可调增益电位器`],
      [`4`, `MPU6050 六轴模块（MPU6050 GY-521）`, `1`, `¥7`, `GY-521 版；VCC 支持 3.3—5V`],
      [`5`, `SG90 舵机（9g 舵机）`, `2`, `¥6`, `扭矩 1.6kg·cm；配 3 根杜邦线`],
      [`6`, `0.96 寸 OLED 显示屏（SSD1306 I2C 4针）`, `1`, `¥11`, `必须 4 针 I2C 版；地址 0x3C`],
      [`7`, `面包板 830 孔`, `1`, `¥8`, `带电源轨，免焊`],
      [`8`, `杜邦线 公对母 / 母对母 各 40 根`, `1 套`, `¥9`, `20cm 长度最合适`],
      [`9`, `USB 转 TTL 模块（CH340）`, `1`, `¥7`, `CH340C/G 均可；用于串口调试与供电`],
      [`10`, `5V 2A USB 电源适配器 + Micro USB 线`, `1`, `¥12`, `舵机与主板分开供电更稳`],
      [`11`, `4.7kΩ 电阻`, `4`, `¥1`, `I2C 上拉；多数模块已自带，备用`],
      [`12`, `LED 3mm + 1kΩ 电阻`, `2`, `¥1`, `PB0 运行指示灯`],
      [`13`, `泡沫板 / 小枕头 + 硬纸板`, `1`, `¥10`, `做「支撑片」，演示舵机抬升`],
    ]),
    cap(`表 1-1 物料采购清单（合计约 120—140 元）`),
    h3(`采购避坑要点`),
    bullet(`不要买「STM32F103C8T6 核心板带 CH340」以外的扩展板，扩展板引脚被占用，接线反而更麻烦。`),
    bullet(`OLED 一定要买 4 针 I2C 版本（VCC/GND/SCL/SDA），7 针 SPI 版接线完全不同，本工程不支持。`),
    bullet(`MAX4466 模块工作电压 2.4—5.5V，本工程统一供 3.3V，使输出中点约 1.65V，正好落在 ADC 量程中部。`),
    bullet(`SG90 必须用外部 5V 供电，绝对不能从 STM32 的 3.3V 引脚取电——舵机堵转电流可达 700mA，会把单片机拉复位。`),
    bullet(`Blue Pill 的板载 LED 在 PC13，而本工程把 PC13 规划给 MPU6050 中断，因此运行指示灯请外接 LED 到 PB0（或看 OLED 判断运行状态）。`),

    /* ---------- 第 2 章 软件 ---------- */
    h1(`第 2 章 软件安装（Windows）`),
    p(`共需安装 5 个软件。全部装完后按 2.6 节的清单逐项验证，确认无误再进入接线环节。`),
    table([1500, 1700, 2500, 1800], [`软件`, `版本建议`, `用途`, `获取方式`], [
      [`STM32CubeMX`, `6.8 ~ 6.14`, `图形化配置外设、生成 Keil 工程`, `st.com 搜 STM32CubeMX，需注册账号`],
      [`Keil MDK-ARM`, `5.36 ~ 5.38`, `编译、下载、调试`, `keil.com 下载 MDK-ARM`],
      [`Keil.STM32F1xx_DFP`, `2.4.0`, `F1 系列器件支持包`, `Keil 内 Pack Installer 在线装`],
      [`ARM Compiler 5 (AC5)`, `5.06u7`, `HAL 库需 AC5 编译（Keil 5.37+ 默认只有 AC6）`, `Keil 官网 Legacy 下载`],
      [`ST-Link 驱动`, `STSW-LINK009`, `识别下载器`, `st.com 搜 STSW-LINK009`],
      [`CH340 驱动`, `CH341SER.EXE`, `识别 USB 转串口`, `wch.cn 官网下载`],
      [`串口助手`, `SSCOM 或 XCOM`, `看串口打印`, `任意下载站`],
      [`Python 3（可选）`, `3.9+`, `跑仿真与串口采集脚本`, `python.org`],
    ]),
    cap(`表 2-1 软件清单`),

    h2(`2.1 安装 STM32CubeMX`),
    ...stepList([
      `到 st.com 注册账号（免费），搜索 STM32CubeMX，下载 Windows 版安装包（.exe）。`,
      `双击安装，一路 Next。安装目录不要含中文和空格，建议 D:\\STM32CubeMX。`,
      `首次启动会提示安装 STM32Cube 固件包，选择 STM32F1 系列，安装 STM32Cube FW_F1 V1.8.x（HAL 库版本）。`,
      `安装完成后菜单 Help → Manage embedded software packages，确认 F1 包显示 Installed。`,
    ]),
    note(`CubeMX 自带 Java 运行环境，一般无需单独装 JDK。若启动报 Java 错误，安装 JDK 8 后重装 CubeMX。`),

    h2(`2.2 安装 Keil MDK-ARM 与器件包`),
    ...stepList([
      `下载 MDK-ARM 安装包，双击安装到 D:\\Keil_v5（路径同样不要有中文）。`,
      `安装过程中弹出的「Pack Installer」可以稍后再用。`,
      `打开 Keil，点工具栏 Pack Installer 图标 → 左侧 Devices 找到 STMicroelectronics → STM32F1 Series → STM32F103 → STM32F103C8，右侧 Packs 选 Keil::STM32F1xx_DFP，点 Install。`,
      `等待下载完成（约 100MB），状态变为 Up to date 即可。`,
    ]),
    note(`Keil 5.37 之后默认不再自带 ARM Compiler 5（AC5），而 STM32F1 的 HAL 库用 AC5 最稳。请到 Keil 官网下载 Arm Compiler 5.06 update 7，安装后 Keil 会自动识别；或在 Options for Target → Target 页把编译器切到 AC6 也能编译（本工程两种都可以，AC5 更省事）。`),

    h2(`2.3 安装 ST-Link 驱动`),
    ...stepList([
      `下载 STSW-LINK009（ST-Link USB 驱动），解压后运行 dpinst_amd64.exe。`,
      `插入 ST-Link V2，打开设备管理器，应出现「STMicroelectronics STLink dongle」。`,
      `若显示黄色感叹号，右键 → 更新驱动 → 手动指向解压目录。`,
    ]),

    h2(`2.4 安装 CH340 驱动`),
    ...stepList([
      `下载 CH341SER.EXE 并安装。`,
      `插入 USB 转 TTL 模块，设备管理器 → 端口（COM 和 LPT）应出现 USB-SERIAL CH340 (COMx)，记下这个 COM 号（例如 COM5）。`,
    ]),

    h2(`2.5 安装串口助手与 Python`),
    ...stepList([
      `安装 SSCOM（绿色版免安装），后续所有串口调试都用它：波特率 115200、数据位 8、停止位 1、无校验、不勾流控。`,
      `（可选）安装 Python 3，命令行执行 pip install pyserial matplotlib numpy，用于跑 PC 端仿真与本工程自带的 serial_monitor.py。`,
    ]),

    h2(`2.6 装完自检清单`),
    table([5200, 1200], [`检查项`, `是否通过`], [
      [`CubeMX 能启动并成功安装 STM32Cube FW_F1 固件包`, `□`],
      [`Keil 能新建 STM32F103C8 工程（Pack 已装）`, `□`],
      [`设备管理器能看到 STLink dongle`, `□`],
      [`设备管理器能看到 USB-SERIAL CH340 (COMx)`, `□`],
      [`串口助手能打开该 COM 口且不报占用`, `□`],
    ]),
    cap(`表 2-2 软件安装自检`),

    /* ---------- 第 3 章 接线 ---------- */
    h1(`第 3 章 硬件接线`),
    h2(`3.1 接线总表（先看全貌，再动手）`),
    table([1100, 1500, 1700, 2600], [`模块`, `模块引脚`, `STM32 引脚`, `说明`], [
      [`MAX4466`, `VCC`, `3.3V`, `统一 3.3V 供电，输出中点 1.65V`],
      [`MAX4466`, `GND`, `GND`, `共地`],
      [`MAX4466`, `OUT`, `PA0`, `ADC1_IN0，模拟信号`],
      [`MPU6050`, `VCC`, `3.3V`, `GY-521 板内有 LDO`],
      [`MPU6050`, `GND`, `GND`, `共地`],
      [`MPU6050`, `SCL`, `PB6`, `I2C1_SCL`],
      [`MPU6050`, `SDA`, `PB7`, `I2C1_SDA`],
      [`MPU6050`, `INT`, `PC13（可选）`, `不接也能运行`],
      [`OLED`, `VCC`, `3.3V`, `4 针 I2C 版`],
      [`OLED`, `GND`, `GND`, `共地`],
      [`OLED`, `SCL`, `PB10`, `I2C2_SCL`],
      [`OLED`, `SDA`, `PB11`, `I2C2_SDA`],
      [`SG90`, `红（VCC）`, `外部 5V`, `严禁接 3.3V`],
      [`SG90`, `棕（GND）`, `GND（共地）`, `必须与主板共地`],
      [`SG90`, `橙（信号）`, `PA8`, `TIM1_CH1`],
      [`ST-Link`, `3.3V`, `3.3V`, `仅用于识别目标，不建议长期由它供电`],
      [`ST-Link`, `GND`, `GND`, `共地`],
      [`ST-Link`, `SWDIO`, `PA13`, `下载数据线`],
      [`ST-Link`, `SWCLK`, `PA14`, `下载时钟线`],
      [`USB-TTL`, `TXD`, `PA10`, `交叉连接：模块 TX 接板子 RX`],
      [`USB-TTL`, `RXD`, `PA9`, `模块 RX 接板子 TX`],
      [`USB-TTL`, `GND`, `GND`, `共地`],
      [`USB-TTL`, `5V`, `5V`, `可作为主板供电（与 USB 供电二选一）`],
    ]),
    cap(`表 3-1 完整接线表`),
    ...img(`/workspace/stm32-antisnore/hardware/schematic.png`, 640, 214, `图 3-1 系统硬件连接原理图（与本表一致）`),

    h2(`3.2 分步接线（务必按顺序）`),
    p(`核心原则：每接完一组就上电检查一次，确认电压正常、不发烫，再接下一组。这样出错时能立刻定位到刚接的那根线。`),
    h3(`Step 1：只连供电，点亮板子`),
    ...stepList([
      `Blue Pill 上两个跳线帽（BOOT0、BOOT1）都插在 0 侧（靠近板边一侧编号 0），保证从 Flash 启动。`,
      `USB-TTL 的 5V 接板子 5V，GND 接 GND；USB-TTL 插电脑。`,
      `板子上电后电源 LED 常亮。用万用表直流档量板子 3.3V 与 GND 之间，应为 3.25—3.35V。`,
      `若 3.3V 只有 1V 左右或发烫，立即断电，检查是否 5V 与 3.3V 接反。`,
    ]),
    h3(`Step 2：接 ST-Link，确认能识别芯片`),
    ...stepList([
      `按表 3-1 接 SWDIO→PA13、SWCLK→PA14、GND→GND、3.3V→3.3V。`,
      `打开 STM32CubeProgrammer（或 Keil 的 Debug 设置），点 Connect，应显示 Device: STM32F103C8，Flash 64KB。`,
      `识别不到就先别往下走，见第 9 章排查表第 1—3 条。`,
    ]),
    h3(`Step 3：接 OLED（I2C2）`),
    ...stepList([
      `OLED 四根线：VCC→3.3V、GND→GND、SCL→PB10、SDA→PB11。`,
      `上电后屏幕不亮是正常的（还没烧程序），但用手轻触模块不应发烫。`,
    ]),
    h3(`Step 4：接 MPU6050（I2C1）`),
    ...stepList([
      `VCC→3.3V、GND→GND、SCL→PB6、SDA→PB7；INT 可先不接。`,
      `两条 I2C 总线分别走 I2C1 和 I2C2，互不干扰，这是本工程引脚规划的关键。`,
    ]),
    h3(`Step 5：接 MAX4466（ADC）`),
    ...stepList([
      `VCC→3.3V、GND→GND、OUT→PA0。`,
      `模块上的小电位器先拧到中间位置（增益适中），后续联调时再微调。`,
    ]),
    h3(`Step 6：最后接 SG90（独立 5V 供电）`),
    ...stepList([
      `红线接 5V 电源正极，棕线接 5V 电源负极，同时把 5V 电源负极与 STM32 的 GND 连在一起（共地，必须做）。`,
      `橙线接 PA8。`,
      `上电瞬间舵机可能会轻微抖动一下，属正常现象。`,
    ]),
    note(`供电三选一，不要同时用：① USB-TTL 的 5V 给主板；② Blue Pill 的 Micro USB 口；③ ST-Link 的 3.3V。任意一种都行，但同时接两种可能造成电源对冲。舵机的 5V 始终单独走电源适配器。`),

    /* ---------- 第 4 章 CubeMX ---------- */
    h1(`第 4 章 用 STM32CubeMX 建工程（逐项参数）`),
    p(`本章每一步都对应 CubeMX 界面上的一个具体位置。配置完成后生成 Keil 工程，下一章再把本工程的源码放进去。`),
    h2(`4.1 新建工程与选型`),
    ...stepList([
      `打开 CubeMX → File → New Project。`,
      `在搜索框输入 STM32F103C8，选中列表中的 STM32F103C8Tx，点 Start Project。`,
      `弹出「Initialize all peripherals with their default Mode?」选 No。`,
    ]),
    h2(`4.2 系统与时钟（SYS / RCC / Clock）`),
    table([1800, 1800, 2800], [`位置`, `参数`, `说明`], [
      [`System Core → SYS`, `Debug: Serial Wire`, `开启 SWD，否则下载一次后锁死`],
      [`System Core → SYS`, `Timebase Source: SysTick`, `HAL 时基`],
      [`System Core → RCC`, `HSE: Crystal/Ceramic Resonator`, `使用板载 8MHz 晶振`],
      [`Clock Configuration`, `HSE 8 → PLLMul ×9 → SYSCLK 72MHz`, `AHB /1，APB1 /2=36M，APB2 /1=72M`],
      [`Clock Configuration`, `ADC Prescaler: /6`, `ADCCLK=12MHz（≤14MHz 上限）`],
    ]),
    h2(`4.3 ADC1 + DMA（麦克风采样）`),
    table([2000, 2300, 2100], [`参数`, `取值`, `位置`], [
      [`IN0 通道`, `勾选 IN0（对应 PA0）`, `Analog → ADC1`],
      [`Resolution`, `12 Bits`, `Parameter Settings`],
      [`Scan Conversion Mode`, `Disabled`, `单通道`],
      [`Continuous Conversion`, `Disabled`, `由定时器触发`],
      [`External Trigger`, `Timer 2 Trigger Out event`, `关键：8kHz 等间隔`],
      [`Sampling Time`, `71.5 Cycles`, `采样约 7μs，远小于 125μs`],
      [`DMA Continuous Requests`, `Enabled`, `DMA 循环搬运`],
      [`Rank 1`, `Channel 0, Sampling 71.5 Cycles`, `ADC1_IN0`],
      [`DMA Settings`, `ADC1 → Circular, Half Word, Memory Increment`, `环形缓冲`],
      [`NVIC`, `不勾 ADC 中断`, `用 DMA 传输完成回调即可`],
    ]),
    h2(`4.4 TIM2（8kHz 触发源）`),
    table([1500, 2900, 1800], [`参数`, `取值`, `计算`], [
      [`Clock Source`, `Internal Clock`, `TIM2 挂在 APB1，定时器时钟 72MHz`],
      [`Prescaler (PSC)`, `71`, `72MHz/(71+1)=1MHz`],
      [`Counter Period (ARR)`, `124`, `1MHz/(124+1)=8kHz`],
      [`Trigger Event Selection`, `Update Event`, `TRGO 输出，触发 ADC`],
    ]),
    h2(`4.5 TIM1 CH1（舵机 PWM）`),
    table([1500, 2900, 1800], [`参数`, `取值`, `说明`], [
      [`Channel1`, `PWM Generation CH1`, `对应 PA8`],
      [`Prescaler`, `71`, `1MHz 时基，1 个计数=1μs`],
      [`Counter Period (ARR)`, `19999`, `20000μs=20ms=50Hz`],
      [`Pulse`, `1500`, `上电默认 90°，初值安全`],
      [`PWM Polarity`, `High`, `高电平有效`],
    ]),
    h2(`4.6 I2C1 / I2C2（两条独立总线）`),
    table([1200, 1700, 2400], [`参数`, `取值`, `位置`], [
      [`I2C1 引脚`, `PB6=SCL, PB7=SDA`, `默认引脚，无需重映射`],
      [`I2C1 Speed`, `Fast Mode, 400kHz`, `MPU6050 支持 400kHz`],
      [`I2C2 引脚`, `PB10=SCL, PB11=SDA`, `默认引脚`],
      [`I2C2 Speed`, `Fast Mode, 400kHz`, `SSD1306 支持 400kHz`],
    ]),
    h2(`4.7 USART1（调试串口）`),
    table([1500, 1700, 2100], [`参数`, `取值`, `位置`], [
      [`Mode`, `Asynchronous`, `Connectivity → USART1`],
      [`Baud Rate`, `115200`, `与串口助手一致`],
      [`Word Length`, `8 Bits`, `8N1`],
      [`Parity`, `None`, `—`],
      [`Stop Bits`, `1`, `—`],
    ]),
    h2(`4.8 GPIO`),
    table([1200, 1700, 2400], [`引脚`, `模式`, `用途`], [
      [`PB0`, `Output Push Pull, Low`, `运行指示灯（外接 LED）`],
      [`PC13`, `Input, 上拉`, `MPU6050 INT（可选）`],
    ]),
    h2(`4.9 生成工程`),
    ...stepList([
      `Project Manager → Project：Project Name 填 AntiSnore，Project Location 选 D:\\（不要中文路径），Toolchain 选 MDK-ARM，Min Version 选 V5。`,
      `Code Generator 页：勾选「Copy only the necessary library files」，其余保持默认（不要勾「Generate peripheral initialization as a pair of .c/.h files」，本手册按全部生成在 main.c 里说明）。`,
      `点右上角 GENERATE CODE，等待完成后点 Open Project，Keil 会自动打开工程。`,
    ]),
    h2(`4.10 生成后目录核对`),
    ...code(String.raw`AntiSnore/
├── Core/
│   ├── Inc/   main.h, stm32f1xx_hal_conf.h, stm32f1xx_it.h, adc.h, i2c.h, tim.h, usart.h, gpio.h
│   └── Src/   main.c, stm32f1xx_it.c, stm32f1xx_hal_msp.c, adc.c, i2c.c, tim.c, usart.c, gpio.c, system_stm32f1xx.c
├── Drivers/   STM32F1xx_HAL_Driver/ + CMSIS/
├── MDK-ARM/   AntiSnore.uvprojx（Keil 工程文件）
└── AntiSnore.ioc（CubeMX 工程文件，以后改配置双击它）`),
    note(`此时先直接点 Keil 的 Build（F7），确认空工程能编译通过（0 Error）。这一步通过再往下做，避免把编译环境和源码问题混在一起。`),

    /* ---------- 第 5 章 源码集成 ---------- */
    h1(`第 5 章 把本工程源码放进 Keil`),
    p(`本章是最容易出错的一步，请逐条对照。总原则：CubeMX 生成的 main.c 保留（里面是外设初始化），本工程的 main.c 不要加入编译（它的 MX_*_Init 是空函数，会覆盖 CubeMX 的实现）。业务逻辑已经收敛到 app.c，只需粘贴 4 段代码。`),
    h2(`5.1 复制文件（21 个：10 个 .c + 11 个 .h）`),
    p(`从 /workspace/stm32-antisnore 复制以下文件到 CubeMX 工程对应目录。注意：main.h 与 stm32f1xx_hal_conf.h 一律使用 CubeMX 生成的那份，不要用本工程的覆盖，否则外设初始化声明会丢失。`),
    ...code(String.raw`源目录 Core/Inc/  →  目标 AntiSnore/Core/Inc/
    pinout.h  mic.h  mpu6050.h  oled.h  servo.h
    flash_store.h  snore_algo.h  posture_algo.h  fusion_fsm.h  unit_test.h  app.h

源目录 Core/Src/  →  目标 AntiSnore/Core/Src/
    mic.c  mpu6050.c  oled.c  servo.c  flash_store.c
    snore_algo.c  posture_algo.c  fusion_fsm.c  unit_test.c  app.c

【不要复制】Core/Src/main.c（用 CubeMX 生成的那个）`),
    h2(`5.2 在 Keil 里添加文件`),
    ...stepList([
      `Keil 左侧 Project 树，展开 Target 1，右键 Source Group 1（或新建组 Application），选 Add Existing Files to Group。`,
      `文件类型选 All files (*.*)，进入 Core/Src，按住 Ctrl 多选上面 10 个 .c 文件，点 Add，再点 Close。`,
      `确认 Project 树里能看到这 10 个文件（不要重复添加，也不要添加 main.c）。`,
    ]),
    h2(`5.3 三个必须改的设置`),
    pKv(`① 宏定义：`, `Options for Target → C/C++ → Define 填 USE_HAL_DRIVER,STM32F103xB（英文逗号，不能有空格）。`),
    pKv(`② 头文件路径：`, `同页 Include Paths 里确认包含 Core/Inc、Drivers/STM32F1xx_HAL_Driver/Inc、Drivers/CMSIS/Device/ST/STM32F1xx/Include、Drivers/CMSIS/Include。`),
    pKv(`③ MicroLIB：`, `Options for Target → Target 页勾选 Use MicroLIB（printf 重定向必需）。`),
    h2(`5.4 在 CubeMX 的 main.c 里粘贴 4 段代码`),
    p(`打开 Core/Src/main.c，找到 CubeMX 用注释标出的 USER CODE 区域（这些区域以后重新生成代码时不会被清除）。按下面 4 处粘贴。`),
    h3(`第 ① 处：USER CODE BEGIN Includes`),
    ...code(String.raw`/* USER CODE BEGIN Includes */
#include "app.h"
#include <stdio.h>
/* USER CODE END Includes */`),
    h3(`第 ② 处：USER CODE BEGIN 0（printf 重定向）`),
    p(`Keil/ARMCC 用 fputc，不是 GCC 的 __io_putchar。粘贴：`),
    ...code(String.raw`/* USER CODE BEGIN 0 */
int fputc(int ch, FILE *f)
{
    HAL_UART_Transmit(&huart1, (uint8_t *)&ch, 1, HAL_MAX_DELAY);
    return ch;
}
/* USER CODE END 0 */`),
    h3(`第 ③ 处：USER CODE BEGIN 2（初始化）`),
    ...code(String.raw`/* USER CODE BEGIN 2 */
APP_Init();       /* 模块初始化 + 启动 ADC-DMA */
APP_Console();    /* 串口菜单：1/2/3/4/a 单元测试，r 进入主循环 */
/* USER CODE END 2 */`),
    h3(`第 ④ 处：USER CODE BEGIN WHILE`),
    ...code(String.raw`/* USER CODE BEGIN WHILE */
while (1)
{
    APP_Loop();   /* 内部自带 5ms 延时与全部业务逻辑 */
    /* USER CODE END WHILE */
    /* USER CODE BEGIN 3 */
}
/* USER CODE END 3 */`),
    note(`注意：CubeMX 生成的 while(1) 里原本就有 USER CODE BEGIN WHILE...END WHILE 和 BEGIN 3...END 3 两段，把 APP_Loop(); 放在两者之间即可，不要破坏注释标记，否则下次重新生成代码时会被清空。`),
    h2(`5.5 编译`),
    ...stepList([
      `按 F7（或点 Build 按钮），等待编译。`,
      `成功后底部显示 0 Error(s), 0 Warning(s)（Warning 可以暂时忽略）。`,
      `若报 No such file 类错误，99% 是 Include Paths 漏了，回去补 5.3 ②。`,
    ]),

    /* ---------- 第 6 章 烧录 ---------- */
    h1(`第 6 章 烧录与首次运行`),
    h2(`6.1 Keil 下载配置`),
    ...stepList([
      `点魔术棒（Options for Target）→ Debug 页，左上角选 ST-Link Debugger，点右侧 Settings。`,
      `Debug 子页：Port 选 SW，Max Clock 选 1.8MHz；右侧 SW Device 应显示 IDCODE 0x1BA01477，说明连上芯片。`,
      `Flash Download 子页：勾选 Reset and Run，Programming Algorithm 里应有 STM32F10x Med-density Flash 128KB（若没有点 Add 添加）。`,
      `点 OK 保存，然后点工具栏 Load（或 F8）下载。`,
    ]),
    note(`如果下载报「No Cortex-M SW Device Found」：① 检查 4 根线是否接对、是否松动；② 长按 Blue Pill 的复位键再点下载；③ 若之前误配了 SWD 引脚复用导致锁死，把 BOOT0 跳到 1 上电，再用 CubeProgrammer 全片擦除（Full chip erase），之后 BOOT0 跳回 0。`),
    h2(`6.2 首次上电应该看到什么`),
    bullet(`Blue Pill 的电源 LED 常亮，PB0 外接 LED 点亮。`),
    bullet(`串口助手（COM 口、115200、8N1、不勾流控）收到：`),
    ...code(String.raw`========== 智能止鼾枕 启动 ==========
输入: '1'=MPU自检  '2'=OLED自检  '3'=舵机自检  '4'=麦克风采样
      'a'=全部单元测试  'r'=运行主循环
>`),
    bullet(`OLED 显示「Smart Pillow OK」后开始 3 页轮播。`),
    bullet(`串口输入 r 回车，打印「系统就绪, 进入主循环」，OLED 开始显示 FSM 状态。`),

    /* ---------- 第 7 章 联调 ---------- */
    h1(`第 7 章 分阶段联调（7 关）`),
    p(`不要一上来就跑整体。按下面 7 关逐个打通，每关都有明确的通过标志。任何一关不过，只查这一关相关的线，不要动其他部分。`),
    h2(`第 1 关：GPIO 与供电`),
    pKv(`操作：`, `上电，串口输入 'r'。`),
    pKv(`预期：`, `PB0 外接 LED 每 500ms 翻转一次（OLED 刷新节拍）。`),
    pKv(`失败：`, `LED 不亮 → 检查 LED 极性（长脚接 PB0，短脚经 1kΩ 接 GND）；一直亮不闪 → 程序没进主循环，看是否卡在 APP_Console 等待串口输入。`),
    h2(`第 2 关：USART1`),
    pKv(`操作：`, `打开串口助手，波特率 115200，发送字符 s。`),
    pKv(`预期：`, `返回 snore=0 supine=0 angle=0.0 这类一行状态。`),
    pKv(`失败：`, `乱码 → 波特率不对，核对 CubeMX 里 USART1 是否 115200；完全无输出 → TX/RX 接反了（模块 TX 必须接 PA10）。`),
    h2(`第 3 关：OLED（I2C2）`),
    pKv(`操作：`, `串口输入 '2' 跑 OLED 自检。`),
    pKv(`预期：`, `屏幕出现测试图案或字符，串口打印 OLED PASS。`),
    pKv(`失败：`, `全黑 → 先确认 VCC 是 3.3V 而非 5V（部分模块 5V 会烧）；再确认 SCL/SDA 没接反（PB10/PB11）；仍不行用 I2C 扫描程序确认地址是否为 0x3C（有些模块是 0x3D，改 pinout.h 的 OLED_I2C_ADDR）。`),
    h2(`第 4 关：MPU6050（I2C1）`),
    pKv(`操作：`, `串口输入 '1'。`),
    pKv(`预期：`, `打印 WHO_AM_I = 0x68，并连续输出 ax/ay/az 与 pitch/roll。把板子立起来，pitch 变化；左右翻，roll 变化。`),
    pKv(`失败：`, `WHO_AM_I 读到 0x00 或 0xFF → I2C1 没通，检查 PB6/PB7 与上拉；读到 0x98 等异常值 → 供电不稳，改用独立 3.3V。`),
    h2(`第 5 关：麦克风（ADC-DMA）`),
    pKv(`操作：`, `串口输入 '4'，对着麦克风拍手、说话。`),
    pKv(`预期：`, `打印的短时能量值（dBFS）在安静时约 -55~-45，拍手时明显跳高到 -20 以上。`),
    pKv(`失败：`, `能量恒定不变 → ADC-DMA 没跑起来，检查 CubeMX 里 External Trigger 是否选了 Timer2 TRGO、DMA 是否 Circular；数值恒为 0 或 4095 → OUT 线没接对或模块增益拧到底。`),
    h2(`第 6 关：舵机（TIM1 PWM）`),
    pKv(`操作：`, `串口输入 '3'。`),
    pKv(`预期：`, `舵机依次转到 0°、2°、15°、0°，动作平滑无抖动。`),
    pKv(`失败：`, `完全不动 → 检查舵机 5V 是否独立供电、是否共地、信号线是否接 PA8；抖动或复位 → 供电不足，换 5V 2A 电源。`),
    h2(`第 7 关：整体融合`),
    pKv(`操作：`, `输入 'r' 进入主循环；手机播放打鼾声音频并把音量调大，同时让板子保持水平（模拟仰卧）。`),
    pKv(`预期：`, `OLED 第 0 页显示 FSM: IDLE → 约 3 秒后 ARMED → INTERVENE，舵机开始每 15 秒抬 2°；把板子侧过来（模拟侧卧）或停止鼾声，FSM 经 OBSERVE 回到 COOLDOWN → IDLE，舵机回 0°。`),
    pKv(`失败：`, `一直 IDLE → 看 OLED 第 0 页的 Snore/Sup 秒数，哪个不涨就回去查第 4、5 关；频繁误触发 → 调高 snore_algo.c 里的阈值余量，或把 FUSION_HOLD_MS 从 3000 加到 5000。`),

    /* ---------- 第 8 章 演示 ---------- */
    h1(`第 8 章 演示与论文数据采集`),
    h2(`8.1 鼾声音源`),
    bullet(`手机搜索「打鼾声 音效」下载一段 30 秒以上的连续鼾声，用蓝牙音箱外放，音量调到 2 米外能听清。`),
    bullet(`也可以用电脑播放：把音频文件放在 PC_Test 目录，用播放器循环播放。`),
    bullet(`环境噪声用空调声、翻书声、电视声分别录一段，用于验证抗噪能力。`),
    h2(`8.2 三分钟演示脚本`),
    table([700, 2400, 2900], [`时间`, `动作`, `讲解要点`], [
      [`0:00`, `上电，串口打印启动信息，OLED 显示 FSM: IDLE`, `介绍系统由 STM32 主控 + 四模块组成`],
      [`0:30`, `手机放鼾声，板子保持水平`, `OLED 上 Snore/Sup 计数开始累加`],
      [`1:00`, `3 秒后 FSM 变 ARMED → INTERVENE，舵机抬 2°`, `强调双条件融合：只有「仰卧 + 打鼾」同时满足才动手`],
      [`1:30`, `继续放鼾声，舵机每 15 秒再抬 2°，到 15° 停`, `强调渐进式：小步进 + 静默观察，不惊醒用户`],
      [`2:00`, `把板子侧过来（模拟侧卧）`, `FSM 进入 OBSERVE，条件消失后舵机回 0°`],
      [`2:30`, `串口输入 s，展示实时状态行`, `展示数据闭环与可观测性`],
      [`2:50`, `串口输入 a 跑全部单元测试`, `展示工程完整性与自检能力`],
    ]),
    h2(`8.3 用真实数据替换论文仿真数据`),
    p(`论文第五章目前用的是 PC 端仿真数据。做完实物后，建议补一组真实数据，答辩时更有说服力：`),
    ...stepList([
      `打开 PC_Test/serial_monitor.py，把 COM 口号改成你的 CH340 口，运行后在串口输入 r。`,
      `按「安静 / 轻度噪声 / 中度噪声 / 打鼾 / 打鼾+仰卧 / 打鼾+侧卧」各录 3 分钟日志。`,
      `统计每段日志中 snore=1 的比例、supine=1 的比例、FSM 进入 INTERVENE 的次数。`,
      `把统计结果填入论文 5.2—5.4 节的表格，并注明「实测数据，样本 N 分钟」。`,
    ]),
    note(`如果实测准确率比仿真低（很常见），不要慌，这恰恰是论文「不足与展望」的好素材：可以写「受麦克风增益与家庭噪声影响，实测识别率较仿真下降约 X 个百分点，后续可通过自适应增益与前级滤波改善」。`),

    /* ---------- 第 9 章 排查 ---------- */
    h1(`第 9 章 故障排查速查表`),
    table([700, 2400, 2900], [`编号`, `现象`, `最可能原因与处理`], [
      [`1`, `ST-Link 连不上芯片`, `线序错/松动；改 Max Clock 1.8MHz；按住复位再下载；BOOT0=1 后全片擦除`],
      [`2`, `下载成功但不运行`, `BOOT0/BOOT1 跳线不在 0；或 Reset and Run 未勾选，手动按复位`],
      [`3`, `KEIL 报 cannot access target`, `SWD 引脚被程序复用。BOOT0 跳 1 上电 → CubeProgrammer 全擦 → 跳回 0`],
      [`4`, `编译报 HAL_xxx 未定义`, `stm32f1xx_hal_conf.h 里对应模块宏没打开（ADC/I2C/TIM/UART/FLASH）`],
      [`5`, `编译报 undefined symbol huart1`, `CubeMX 没生成 USART1，或 .c 没加进工程`],
      [`6`, `printf 无输出`, `没勾 Use MicroLIB；或 fputc 没粘贴；或 TX/RX 接反`],
      [`7`, `串口乱码`, `波特率不匹配；晶振实际不是 8MHz（部分板子是 12MHz）`],
      [`8`, `OLED 全黑`, `地址不是 0x3C；SCL/SDA 反；模块坏（换一块试）`],
      [`9`, `OLED 显示花屏`, `I2C 速率过高，把 400kHz 降到 100kHz；或线太长`],
      [`10`, `MPU6050 WHO_AM_I 不是 0x68`, `模块 AD0 引脚被拉高（地址变 0x69）；或 I2C1 未上拉`],
      [`11`, `姿态角乱跳`, `加速度计量程设置错；或未做低通。检查 ACCEL_CONFIG=0x00（±2g）`],
      [`12`, `麦克风能量恒为 0`, `ADC 未启动 DMA；或 Trigger 没选 Timer2 TRGO；或 PA0 未配置为模拟输入`],
      [`13`, `麦克风能量恒为最大值`, `模块增益拧到底；或 OUT 短路到 3.3V`],
      [`14`, `舵机不动`, `没共地；5V 没接；信号接错脚（必须 PA8）`],
      [`15`, `舵机抖动/单片机复位`, `舵机从 3.3V 取电导致掉压。必须独立 5V 2A 供电`],
      [`16`, `FSM 一直 IDLE`, `看 OLED 的 Snore/Sup 秒数，哪个不涨查对应模块`],
      [`17`, `FSM 频繁误触发`, `把 FUSION_HOLD_MS 改 5000；或调高鼾声阈值；注意环境突发噪声`],
      [`18`, `干预后舵机不回位`, `OBSERVE 期间条件一直满足属正常；确认停止鼾声并侧卧后等 15 秒`],
      [`19`, `重新生成代码后自己的代码没了`, `代码没写在 USER CODE BEGIN/END 之间`],
      [`20`, `Flash 统计数据每次上电归零`, `写保护未解除；或 STATS_FLASH_BASE 与程序区重叠（本工程用的是 0x0807F000）`],
    ]),

    /* ---------- 附录 ---------- */
    h1(`附录 A 引脚速查卡（可打印贴在桌前）`),
    ...code(String.raw`PA0  ── MAX4466 OUT     (ADC1_IN0)
PA8  ── SG90 信号(橙)     (TIM1_CH1 PWM)
PA9  ── USB-TTL RXD       (USART1_TX)
PA10 ── USB-TTL TXD       (USART1_RX)
PA13 ── ST-Link SWDIO
PA14 ── ST-Link SWCLK
PB0  ── LED + 1kΩ → GND   (运行指示)
PB6  ── MPU6050 SCL       (I2C1)
PB7  ── MPU6050 SDA       (I2C1)
PB10 ── OLED SCL          (I2C2)
PB11 ── OLED SDA          (I2C2)
PC13 ── MPU6050 INT       (可选)
3.3V ── MAX4466/MPU6050/OLED 的 VCC
GND  ── 全部模块共地（含外部 5V 电源负极）`),
    h1(`附录 B 关键参数速记`),
    table([2400, 3600], [`参数`, `取值`], [
      [`系统时钟`, `HSE 8MHz → PLL×9 → 72MHz；APB1 36MHz，APB2 72MHz`],
      [`ADC 采样`, `8kHz，12 位，DMA 环形 512 个半字（2 帧），每 32ms 输出一帧 256 点`],
      [`PWM 舵机`, `50Hz（PSC=71，ARR=19999），500—2500μs 对应 0—180°`],
      [`I2C 地址`, `MPU6050 0x68，SSD1306 0x3C（HAL 里左移一位）`],
      [`融合参数`, `双条件持续 3000ms 触发；观察窗 15000ms；冷却 5000ms`],
      [`干预参数`, `每次 2°，单轮最大 15°`],
      [`Flash 存储`, `0x0807F000 起 1KB，带 CRC 校验`],
    ]),
    h1(`附录 C 一句话总结`),
    p(`先买齐 13 类物料；装好 CubeMX + Keil + 两个驱动；按 Step1—6 分组接线，每组量一次电压；CubeMX 按第 4 章参数表配置生成工程；复制 10 个 .c + 11 个 .h，粘贴 4 段代码；F7 编译、F8 下载；按 7 关逐级联调；最后手机放鼾声做演示。`,
      { indent: { firstLine: 420 } }),
  ]
};

function stepList(items) {
  return items.map((t, i) => new Paragraph({
    spacing: { after: 70, line: 320 },
    indent: { firstLine: 0, left: 520, hanging: 300 },
    children: [runH(`Step ${i + 1}. `, { bold: true }), run(t)]
  }));
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: `Heading1`, name: `Heading 1`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 30, bold: true, font: FONT_H }, paragraph: { outlineLevel: 0 } },
      { id: `Heading2`, name: `Heading 2`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 24, bold: true, font: FONT_H }, paragraph: { outlineLevel: 1 } },
      { id: `Heading3`, name: `Heading 3`, basedOn: `Normal`, next: `Normal`, quickFormat: true,
        run: { size: 21, bold: true, font: FONT_H }, paragraph: { outlineLevel: 2 } },
    ]
  },
  sections: [cover, body]
});

Packer.toBuffer(doc).then((buf) => {
  const out = `/workspace/opening/实物实现操作手册_从零到一.docx`;
  fs.writeFileSync(out, buf);
  console.log(`OK -> ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
}).catch((e) => console.error(e));
