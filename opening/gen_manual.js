/**
 * gen_manual.js v2 —— 《智能止鼾枕 实物实现操作手册》详细版
 * 运行: cd /workspace/opening && node gen_manual.js
 * 约定: JS 字符串用反引号; 中文引号用「」; 代码块用 String.raw
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
    spacing: { before: 200, after: 220 }, children: [runH(t, { size: 30, bold: true })] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 140 },
    children: [runH(t, { size: 24, bold: true })] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 100 },
    children: [runH(t, { size: 21, bold: true })] });
}
function code(src) {
  return src.replace(/\t/g, `    `).split(`\n`).map((ln) => new Paragraph({
    spacing: { line: 235, after: 0, before: 0 },
    indent: { firstLine: 0, left: 220 },
    shading: { fill: `F4F4F4`, type: ShadingType.CLEAR },
    children: [new TextRun({ text: ln.length ? ln : ` `, font: FONT_CODE, size: 17 })]
  }));
}
function note(text, fill = `FFF7E6`) {
  return new Paragraph({ spacing: { before: 80, after: 120, line: 320 },
    indent: { firstLine: 0, left: 200, right: 200 },
    shading: { fill, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: `E0A040` } },
    children: [run(text, { size: 19 })] });
}
function bullet(text) {
  return new Paragraph({ spacing: { after: 60, line: 320 },
    indent: { firstLine: 0, left: 420, hanging: 240 },
    children: [run(`• ` + text)] });
}
function stepList(items) {
  return items.map((t, i) => new Paragraph({
    spacing: { after: 70, line: 320 }, indent: { firstLine: 0, left: 520, hanging: 300 },
    children: [runH(`第 ${i + 1} 步：`, { bold: true }), run(t)]
  }));
}
const BD = { style: BorderStyle.SINGLE, size: 1, color: `888888` };
function cell(t, w, { bold = false, fill = null, align = AlignmentType.LEFT, size = 18 } = {}) {
  return new TableCell({
    borders: { top: BD, bottom: BD, left: BD, right: BD },
    width: { size: w, type: WidthType.DXA },
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ alignment: align, spacing: { line: 255 }, indent: { firstLine: 0 },
      children: [run(t, { bold, size })] })]
  });
}
function table(widths, header, rows, opts = {}) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((t, i) =>
        cell(t, widths[i], { bold: true, fill: `E9EEF6`, align: AlignmentType.CENTER })) }),
      ...rows.map((r) => new TableRow({ children: r.map((t, i) =>
        cell(String(t), widths[i], { align: opts.firstLeft === false || i > 0 ? AlignmentType.LEFT : AlignmentType.LEFT })) }))
    ] });
}
function cap(t) {
  return new Paragraph({ spacing: { before: 80, after: 160 }, alignment: AlignmentType.CENTER,
    indent: { firstLine: 0 }, children: [run(t, { size: 17, italics: true })] });
}
function img(path, w, h, caption) {
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 },
      children: [new ImageRun({ type: `png`, data: fs.readFileSync(path), transformation: { width: w, height: h } })] }),
    cap(caption)
  ];
}

/* ================= 封面 ================= */
const cover = {
  properties: { page: { margin: { top: convertMillimetersToTwip(25), bottom: convertMillimetersToTwip(25),
    left: convertMillimetersToTwip(28), right: convertMillimetersToTwip(24) } } },
  children: [
    new Paragraph({ spacing: { before: 1700 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runH(`智能止鼾枕系统`, { size: 44, bold: true })] }),
    new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [runH(`实物实现操作手册`, { size: 40, bold: true })] }),
    new Paragraph({ spacing: { before: 260 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`采购 → 装软件 → 接线 → 建工程 → 集成源码 → 烧录 → 七关联调 → 演示`, { size: 21 })] }),
    new Paragraph({ spacing: { before: 900 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`硬件：STM32F103C8T6（Blue Pill）+ MAX4466 + MPU6050 + SG90 + SSD1306`, { size: 19 })] }),
    new Paragraph({ spacing: { before: 80 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`软件：STM32CubeMX 6.x + Keil MDK 5（AC5）+ ST-Link 驱动 + CH340 驱动`, { size: 19 })] }),
    new Paragraph({ spacing: { before: 80 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`对应工程：11 个头文件 + 10 个源文件 + AntiSnore.ioc（另附 main.h / main.c 参考）`, { size: 19 })] }),
    new Paragraph({ spacing: { before: 1400 }, alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
      children: [run(`医学信息工程 · 本科毕业设计 · 2026 年 12 月`, { size: 21 })] }),
  ]
};

/* ================= 正文 ================= */
const body = {
  properties: { page: { margin: { top: convertMillimetersToTwip(24), bottom: convertMillimetersToTwip(24),
    left: convertMillimetersToTwip(28), right: convertMillimetersToTwip(24) } } },
  children: [
    /* ---------- 第 0 章 ---------- */
    h1(`第 0 章 开工前必读`),
    h2(`0.1 你需要准备的东西`),
    table([1400, 4000], [`类别`, `清单`], [
      [`电脑`, `Windows 10/11 64 位，至少 2 个可用 USB 口（一个接 ST-Link，一个接 CH340）`],
      [`工具`, `数字万用表（必须）、小一字螺丝刀、镊子（可选）`],
      [`耗材`, `面包板 830 孔、公对母与母对母杜邦线各 40 根`],
      [`演示`, `手机（播放鼾声）、蓝牙音箱（可选，音量更足）`],
      [`心态`, `按顺序做，不要跳步；每次只改一个变量`],
    ]),
    cap(`表 0-1 开工准备`),

    h2(`0.2 全流程与验收标准`),
    p(`本项目的验收标准不是「能亮灯」，而是下面 7 关全部通过。每一关都在第 7 章有明确的操作、预期输出和失败分支。`),
    table([700, 2400, 2600], [`关卡`, `能力`, `通过标准`], [
      [`第 1 关`, `供电与 GPIO`, `3.3V 在 3.25—3.35V；PB0 外接 LED 每 500ms 翻转`],
      [`第 2 关`, `USART1 串口`, `能看到启动横幅；输入 r 进入主循环后，发送 s 回一行状态`],
      [`第 3 关`, `OLED（I2C2）`, `屏幕显示 OLED Test 与 Hello STM32!`],
      [`第 4 关`, `MPU6050（I2C1）`, `WHO_AM_I=0x68，静止 |a|≈1.00g，翻转板子 pitch/roll 变化`],
      [`第 5 关`, `麦克风（ADC-DMA）`, `安静 pk-pk 数十，说话 pk-pk>200`],
      [`第 6 关`, `舵机（TIM1 PWM）`, `0→45→90→135→180→90 平滑扫描`],
      [`第 7 关`, `整体融合`, `放鼾声+保持水平 → FSM 走 IDLE→ARMED→INTERVENE，舵机每 15s 抬 2°`],
    ]),
    cap(`表 0-2 七关验收标准`),

    h2(`0.3 安全与三个「绝对不能」`),
    bullet(`绝对不能把 5V 接到 3.3V 引脚或模块 VCC（MAX4466、MPU6050、OLED 统一 3.3V）。`),
    bullet(`绝对不能从 STM32 的 3.3V 给舵机供电（SG90 堵转电流可达 700mA，会把单片机拉复位）。`),
    bullet(`绝对不能在通电状态下插拔杜邦线（先断电，改完线，量完电压，再上电）。`),
    note(`每次上电前，用万用表蜂鸣档量三组：5V—GND、3.3V—GND、5V—3.3V。前两组不响（不短路）才可上电；第三组响说明电源短路，必须查线。`),

    h2(`0.4 名词速查（看不懂时回来查）`),
    table([1500, 4200], [`名词`, `一句话解释`], [
      [`GPIO`, `单片机的普通输入/输出引脚，可输出高/低电平`],
      [`ADC`, `模拟量转数字量。麦克风输出连续电压，ADC 把它变成 0—4095 的数字`],
      [`DMA`, `不经过 CPU、由硬件自动搬运数据的通道，保证 8kHz 采样不丢点`],
      [`I²C`, `两根线（SCL 时钟、SDA 数据）连接多个芯片的总线，本工程接 OLED 与 MPU6050`],
      [`PWM`, `用高低电平的占空比模拟“中间电压”，舵机靠 50Hz PWM 的脉宽定位`],
      [`HAL`, `ST 官方硬件抽象库，把寄存器操作封装成 HAL_xxx() 函数`],
      [`中断 / 回调`, `硬件事件发生时自动跳去执行的函数，如 DMA 传完一半数据`],
      [`上拉`, `用电阻把信号线默认拉到 3.3V，I²C 总线必须上拉才能通信`],
      [`共地`, `所有模块的 GND 连在一起，否则信号没有共同参考点`],
      [`FSM`, `有限状态机，本工程用它描述 待机→待触发→干预→观察→冷却 的流程`],
    ]),
    cap(`表 0-3 名词速查`),

    h2(`0.5 等快递期间：先跑一遍离线仿真`),
    p(`工具包里带了一套与固件逻辑一致的 PC 仿真程序，不需要任何硬件就能看到整套算法跑起来，也能提前生成论文用的图表。`),
    ...stepList([
      `把 智能止鼾枕_一键工具包.zip 解压到 D:\\work（不要放桌面、不要含中文）。`,
      `双击 02_检查环境.bat：它会显示 Python 版本与当前串口列表。若提示找不到 python，按窗口里的提示先装 Python 3.9+（安装时务必勾 Add python.exe to PATH）。`,
      `双击 04_本地仿真演示.bat：第一次会自动安装 numpy / matplotlib / scikit-learn / pyserial（需要联网，约 1—2 分钟）。`,
      `运行结束后，打开 源码\\stm32-antisnore\\hardware\\figures，应看到 8 张 PNG；控制台同时打印各场景识别率与融合误触发率（融合应比单传感器低 2—3 个数量级）。`,
      `随时可双击 05_查看操作手册.bat 或 06_查看毕业论文.bat 打开对应文档。`,
    ]),
    note(`这一步只验证算法，不替代实物。仿真给出的数值是合成信号下的结果，论文第 5 章最终要用实测数据替换或对照说明。`),

    /* ---------- 第 1 章 ---------- */
    h1(`第 1 章 物料采购`),
    h2(`1.1 采购清单`),
    table([320, 1900, 600, 800, 2000], [`序号`, `搜索关键词 / 型号`, `数量`, `参考价`, `下单备注`], [
      [`1`, `STM32F103C8T6 最小系统板`, `2`, `¥12`, `要 C8T6 主控、板载 8MHz 晶振；买 2 块备用`],
      [`2`, `ST-Link V2 下载器`, `1`, `¥12`, `要带 4 根杜邦线；认准 SWD 接口`],
      [`3`, `MAX4466 声音传感器模块`, `1`, `¥7`, `模拟输出 OUT，带可调增益电位器`],
      [`4`, `MPU6050 GY-521 六轴模块`, `1`, `¥7`, `GY-521 版，VCC 支持 3.3—5V`],
      [`5`, `SG90 9g 舵机`, `2`, `¥6`, `配 3 根杜邦线；备用 1 个`],
      [`6`, `0.96 寸 OLED SSD1306 I2C 4 针`, `1`, `¥11`, `必须 4 针 I2C（VCC/GND/SCL/SDA），不要 SPI 7 针`],
      [`7`, `面包板 830 孔`, `1`, `¥8`, `带红蓝电源轨`],
      [`8`, `杜邦线 公对母 + 母对母`, `各 40 根`, `¥9`, `20cm 最合适`],
      [`9`, `USB 转 TTL CH340`, `1`, `¥7`, `CH340C/G 均可`],
      [`10`, `5V 2A USB 电源适配器 + Micro USB 线`, `1`, `¥12`, `舵机专用供电`],
      [`11`, `4.7kΩ 电阻`, `4`, `¥1`, `I2C 上拉备用（模块多自带，可不焊）`],
      [`12`, `3mm LED + 1kΩ 电阻`, `2`, `¥1`, `PB0 运行指示`],
      [`13`, `泡沫板/小枕头 + 硬纸板`, `1`, `¥10`, `做支撑片，演示舵机抬升`],
    ]),
    cap(`表 1-1 采购清单（合计约 120—140 元）`),
    h3(`可直接复制的下单清单`),
    ...code(String.raw`STM32F103C8T6 最小系统板 ×2（C8T6，8M 晶振）
ST-Link V2 下载器 ×1（带 4 根杜邦线）
MAX4466 声音传感器模块 ×1（模拟输出）
MPU6050 GY-521 模块 ×1
SG90 9g 舵机 ×2
0.96 寸 OLED SSD1306 I2C 4 针 ×1（不要 SPI 7 针）
830 孔面包板 ×1
杜邦线 公对母 40 根 + 母对母 40 根
USB 转 TTL CH340 ×1
5V 2A USB 电源适配器 + Micro USB 线 ×1
4.7kΩ 电阻 ×4
3mm LED ×2 + 1kΩ 电阻 ×2
泡沫板/小枕头 + 硬纸板`),

    h2(`1.2 到货核对（这一步别省）`),
    table([2900, 1100, 1200], [`核对项`, `正常表现`, `异常处理`], [
      [`Blue Pill 丝印`, `STM32F103C8T6、8.000MHz 晶振`, `F103C6 是 32KB，需换货`],
      [`OLED 针脚`, `4 针且标 VCC/GND/SCL/SDA`, `7 针 SPI 版不能用本工程`],
      [`MPU6050 丝印`, `GY-521`, `其它版可能引脚顺序不同`],
      [`SG90 线色`, `棕/红/橙 三线`, `四线版（带反馈）不适用`],
      [`ST-Link 丝印`, `3.3V / SWDIO / SWCLK / GND`, `只有 JTAG 20 针的老款需转接板`],
    ]),
    cap(`表 1-2 到货核对`),

    /* ---------- 第 2 章 ---------- */
    h1(`第 2 章 软件安装（每一步都可验证）`),
    p(`按顺序安装下列软件。每个小节末尾都有「怎么确认装好了」，不通过就不要进入下一节。`),
    h2(`2.0 下载入口（可直接复制到浏览器）`),
    table([1900, 4600], [`软件`, `地址`], [
      [`STM32CubeMX`, `https://www.st.com/en/development-tools/stm32cubemx.html`],
      [`Keil MDK-ARM`, `https://www.keil.com/download/product/`],
      [`STM32F1xx_DFP`, `https://www.keil.arm.com/packs/ （搜 STM32F1xx_DFP）`],
      [`ARM Compiler 5`, `https://developer.arm.com/ （搜 Arm Compiler 5，或 Keil 官网 Legacy）`],
      [`ST-Link 驱动`, `https://www.st.com/en/development-tools/stsw-link009.html`],
      [`STM32CubeProgrammer`, `https://www.st.com/en/development-tools/stm32cubeprog.html`],
      [`CH340 驱动`, `https://www.wch.cn/downloads/CH341SER_EXE.html`],
    ]),
    cap(`表 2-0 软件下载入口`),
    note(`ST 官网需要注册 myST 账号才能下载，建议先在 2.1 之前注册好。所有安装路径都不能含中文和空格，这是后面 90% 怪问题的根源。`),
    table([1700, 1300, 2100, 1700], [`软件`, `版本`, `用途`, `下载入口`], [
      [`STM32CubeMX`, `6.8—6.14`, `配外设、生成 Keil 工程`, `st.com → STM32CubeMX`],
      [`Keil MDK-ARM`, `5.36—5.38`, `编译 / 下载 / 调试`, `keil.com → MDK-Arm`],
      [`STM32F1xx_DFP`, `2.4.0`, `F1 器件支持包`, `Keil Pack Installer`],
      [`ARM Compiler 5`, `5.06u7`, `HAL 库推荐编译器`, `Keil 官网 Legacy 下载`],
      [`ST-Link 驱动`, `STSW-LINK009`, `识别下载器`, `st.com → STSW-LINK009`],
      [`CH340 驱动`, `CH341SER`, `识别串口`, `wch.cn 下载中心`],
    ]),
    cap(`表 2-1 软件清单`),

    h2(`2.1 STM32CubeMX`),
    ...stepList([
      `浏览器打开 st.com，注册并登录 myST 账号（免费）。搜索 STM32CubeMX，点 Get Software，下载 Windows 版压缩包。`,
      `解压后运行 SetupSTM32CubeMX-6.x.x.exe。安装路径用默认或 D:\\STM32CubeMX，不要含中文和空格。`,
      `首次启动若提示需要 Java，按提示安装（安装包通常已内置 JRE）。`,
      `菜单 Help → Manage embedded software packages → 展开 STM32F1 → 选 STM32Cube FW_F1 V1.8.x → Install，等待下载完成（约 200MB）。`,
      `确认：新建工程时能在 Part Number 里搜到 STM32F103C8Tx。`,
    ]),
    note(`若新建工程时弹窗提示 “the firmware package is not installed” 或点 GENERATE CODE 报缺 .c 文件，说明第 4 步没装完。重新打开 Manage embedded software packages，确认 STM32Cube FW_F1 前面的圆点变成绿色实心。`),

    h2(`2.2 Keil MDK-ARM`),
    ...stepList([
      `keil.com 下载 MDK-Arm 安装包（需填邮箱），运行 MDK5xx.exe。安装路径用 D:\\Keil_v5，不要含中文。`,
      `安装结束时勾选 Pack Installer 自动打开；若没打开，从开始菜单手动启动。`,
      `Pack Installer 左侧 Devices → STMicroelectronics → STM32F1 Series → STM32F103 → STM32F103C8，右侧 Packs 选 Keil::STM32F1xx_DFP，点 Install。`,
      `国内网络慢时可离线安装：下载 Keil.STM32F1xx_DFP.2.4.0.pack，双击即可安装。`,
      `确认：Pack Installer 里该包显示 Up to date。`,
    ]),
    h3(`安装 ARM Compiler 5（关键）`),
    p(`Keil 5.37 之后默认只带 AC6，而 STM32F1 的 HAL 库用 AC5 最稳。若跳过这一步，编译会报大量与编译器相关的错误。`),
    ...stepList([
      `Keil 官网搜索 Arm Compiler 5，下载 ARMCompiler5.06u7.exe（Legacy 页面）。`,
      `安装到 C:\\Keil_v5\\ARM\\ARMCC（如果你把 Keil 装在 D 盘，就装到 D:\\Keil_v5\\ARM\\ARMCC）。`,
      `打开 Keil → Project → Options for Target → Target 页 → ARM Compiler 下拉框选 Use default compiler version 5。`,
      `若下拉框里没有 v5：点下拉框右侧的 ...，手动指向 C:\\Keil_v5\\ARM\\ARMCC\\bin。`,
    ]),
    note(`如果你已经装的是 Keil 5.36 或更早版本，自带 AC5，可跳过本节。`),

    h2(`2.3 ST-Link 驱动`),
    ...stepList([
      `下载 STSW-LINK009，解压后右键 dpinst_amd64.exe → 以管理员身份运行（32 位系统用 dpinst_x86.exe）。`,
      `插入 ST-Link。按 Win+X → 设备管理器；Win11 也可右键开始菜单 → 设备管理器。`,
      `展开“通用串行总线设备”，应出现 STMicroelectronics STLink dongle；若有黄色感叹号说明驱动没装好。`,
      `有感叹号时：右键该设备 → 更新驱动程序 → 浏览我的电脑 → 指向解压出来的 STSW-LINK009 目录 → 下一步。`,
      `确认：设备管理器里没有任何黄色感叹号，且插拔 ST-Link 时该设备会消失/出现。`,
    ]),

    h2(`2.4 CH340 驱动`),
    ...stepList([
      `wch.cn 下载中心搜索 CH341SER，下载 CH341SER.EXE，右键以管理员身份运行，点“安装”。`,
      `插入 USB 转 TTL，按 Win+X → 设备管理器 → 展开“端口（COM 和 LPT）”，出现 USB-SERIAL CH340 (COMx)。`,
      `记下这个 COM 号（例如 COM5）。拔掉再插，COM 号通常会变，每次换 USB 口都要重新确认。`,
      `若显示黄色感叹号：右键 → 卸载设备 → 勾“删除此设备的驱动程序软件” → 重新插拔 → 重装驱动。`,
      `若端口被占用（串口助手提示“串口已被打开”）：关掉其它串口软件、Keil 的 Debug 会话、Arduino IDE 等。`,
    ]),

    h2(`2.5 串口助手与 Python（可选）`),
    ...stepList([
      `下载 SSCOM（绿色版解压即用），或使用 XCOM。`,
      `（可选）安装 Python 3.9+，安装时勾选 Add python.exe to PATH；命令行执行 pip install pyserial matplotlib numpy。`,
    ]),

    h2(`2.6 STM32CubeProgrammer（强烈建议装）`),
    p(`它用于三件事：确认芯片被识别、解除读保护、在 Keil 下载失败时做全片擦除。体积约 200MB，安装一路默认即可。`),
    ...stepList([
      `st.com 搜索 STM32CubeProgrammer，下载 Windows 版并安装（需要 myST 账号）。`,
      `打开后右上角选 ST-LINK，Port 选 SWD，点 Connect。`,
      `能读出 Device: STM32F103C8、Flash size 64KBytes，说明下载链路完全正常。`,
      `若提示读保护：点左侧 OB（Option Bytes）→ Read Out Protection 选 AA → Apply，即可解除。`,
    ]),
    note(`不需要 CubeProgrammer 也能下载程序，但遇到“Cannot access target”“Flash Download failed”时，它是唯一能救回芯片的工具，建议提前装好。`),

    h2(`2.7 软件自检表`),
    table([5200, 1100], [`检查项`, `打勾`], [
      [`CubeMX 能新建工程并搜到 STM32F103C8Tx`, `□`],
      [`CubeMX 的 F1 固件包已 Installed`, `□`],
      [`Keil Pack Installer 里 STM32F1xx_DFP 显示 Up to date`, `□`],
      [`Keil 的 ARM Compiler 能选到 version 5`, `□`],
      [`设备管理器有 STLink dongle`, `□`],
      [`设备管理器有 USB-SERIAL CH340 (COMx)`, `□`],
      [`串口助手能打开该 COM 口`, `□`],
    ]),
    cap(`表 2-2 软件自检`),

    /* ---------- 第 3 章 ---------- */
    h1(`第 3 章 硬件接线`),
    h2(`3.1 面包板布局（先摆位，再插线）`),
    p(`不要把 Blue Pill 直接插在面包板中央（引脚跨距不匹配容易歪针），用母对母杜邦线从它的排针引到面包板。面包板上边两条电源轨作为 3.3V 与 GND，下边两条作为舵机专用的 5V 与 GND，两条 GND 轨用一根短线连通。`),
    ...code(String.raw`面包板布局示意（俯视）

上轨：  3.3V(+) ──────── 各模块 VCC        GND(-) ──────── 各模块 GND
        │                                            │
        │        [Blue Pill 放在面包板外侧]            │
        │        用母对母杜邦线引出如下信号            │
        │                                            │
        PA0  ──→ MAX4466 OUT      PB6/PB7  ──→ MPU6050 SCL/SDA
        PB10/PB11 ──→ OLED SCL/SDA PA8     ──→ SG90 橙线
        PA9  ──→ CH340 RXD        PA10     ──→ CH340 TXD   (TX/RX 必须交叉)
        PA13/PA14 ──→ ST-Link SWDIO/SWCLK
        │                                            │
下轨：  5V(+)  ──────── SG90 红线(独立适配器)   GND(-) ── 与上轨 GND 连通`),
    note(`上轨 3.3V 由 Blue Pill 的 3.3V 引脚提供；下轨 5V 由 5V 2A 适配器提供。两套电源的 GND 必须连通——这是全系统唯一必须「共地」的地方。`),
    h3(`新手最容易搞错的四个地方`),
    bullet(`面包板的红蓝电源轨在正中间是断开的。左右两半的 3.3V 并不相通，必须用一根短线把左红和右红、左蓝和右蓝各连起来，否则会出现“左半边模块有电、右半边没电”。`),
    bullet(`杜邦线颜色没有任何含义，红黑只是习惯。判断通断只能用万用表通断档：两根表笔各点线两端，蜂鸣器响才是通的。`),
    bullet(`公母方向：Blue Pill 的排针是「公」，面包板孔要「公针」插入，所以从主板到面包板用「公对母」线（母头插板子，公头插面包板）；模块到面包板若模块也是公针，同样用公对母。`),
    bullet(`Micro USB 线分「充电线」和「数据线」。只有数据线插上电脑才会出现串口/能下载，充电线只能供电。怀疑时换一根手机数据线试。`),
    note(`整板只能有一个 5V 来源。CH340 的 5V、Micro USB、ST-Link 的 3.3V 三者最多同时用一个；两个 5V 同时接会互相倒灌，轻则下载器发烫，重则烧稳压芯片。`, `FFF0F0`),

    h2(`3.2 完整接线表`),
    table([1100, 1400, 1500, 2900], [`模块`, `模块引脚`, `STM32 引脚`, `说明`], [
      [`MAX4466`, `VCC`, `3.3V`, `不要接 5V，否则输出会超过 ADC 量程`],
      [`MAX4466`, `GND`, `GND`, `共地`],
      [`MAX4466`, `OUT`, `PA0`, `ADC1_IN0`],
      [`MPU6050`, `VCC`, `3.3V`, `GY-521 板内有 LDO`],
      [`MPU6050`, `GND`, `GND`, `共地`],
      [`MPU6050`, `SCL`, `PB6`, `I2C1_SCL`],
      [`MPU6050`, `SDA`, `PB7`, `I2C1_SDA`],
      [`MPU6050`, `INT`, `PC13`, `可选，不接也能跑`],
      [`OLED`, `VCC`, `3.3V`, `4 针 I2C 版`],
      [`OLED`, `GND`, `GND`, `共地`],
      [`OLED`, `SCL`, `PB10`, `I2C2_SCL`],
      [`OLED`, `SDA`, `PB11`, `I2C2_SDA`],
      [`SG90`, `红（VCC）`, `5V（适配器）`, `严禁接 3.3V`],
      [`SG90`, `棕（GND）`, `GND（共地）`, `必须与主板共地`],
      [`SG90`, `橙（信号）`, `PA8`, `TIM1_CH1`],
      [`ST-Link`, `3.3V`, `3.3V（可选）`, `主板已供电时不接，避免双电源`],
      [`ST-Link`, `GND`, `GND`, `必须接`],
      [`ST-Link`, `SWDIO`, `PA13`, `下载数据`],
      [`ST-Link`, `SWCLK`, `PA14`, `下载时钟`],
      [`CH340`, `TXD`, `PA10`, `交叉：模块 TX 接板子 RX`],
      [`CH340`, `RXD`, `PA9`, `模块 RX 接板子 TX`],
      [`CH340`, `GND`, `GND`, `必须接`],
      [`CH340`, `5V`, `5V`, `可作为主板供电（与 Micro USB 二选一）`],
    ]),
    cap(`表 3-1 完整接线表`),
    ...img(`/workspace/stm32-antisnore/hardware/schematic.png`, 640, 214, `图 3-1 系统连接原理图（与表 3-1 一致）`),

    h2(`3.3 分步接线（每步上电验证）`),
    h3(`Step 1：只接供电`),
    ...stepList([
      `Blue Pill 上两个跳线帽 BOOT0、BOOT1 都插在 0 侧（靠近板边标 0 的一端）。`,
      `CH340 模块上通常有一个 3V3/5V 跳线帽，确认它插在 5V 档（否则 5V 引脚没有输出）。`,
      `CH340 的 5V 接 Blue Pill 的 5V（标着 5V 的排针，不是 3.3V），GND 接 GND；CH340 插入电脑。`,
      `此时 Micro USB 口不要插线，避免两个 5V 同时供电。`,
      `上电后电源 LED 常亮。万用表直流 20V 档，红表笔点 Blue Pill 的 3.3V 排针，黑表笔点 GND：读数应在 3.25—3.35V。`,
      `若读数 < 3.1V 或板子发烫，立刻断电，检查 5V 与 3.3V 是否接反、模块是否短路。`,
    ]),
    h3(`Step 2：接 ST-Link 并确认识别`),
    ...stepList([
      `只接 SWDIO→PA13、SWCLK→PA14、GND→GND（主板已由 CH340 供电，3.3V 可不接）。`,
      `打开 STM32CubeProgrammer，右上角选 ST-LINK，Port 选 SWD，点 Connect。`,
      `正常显示 Device: STM32F103C8，Flash Size 64KBytes。识别不到不要往下做，查第 10 章 10.2 节前三条。`,
    ]),
    h3(`Step 3：接 OLED`),
    ...stepList([
      `VCC→3.3V、GND→GND、SCL→PB10、SDA→PB11。`,
      `此刻屏幕不亮属正常（程序还没跑）。用手背轻触模块，不应有明显发热。`,
    ]),
    h3(`Step 4：接 MPU6050`),
    ...stepList([
      `VCC→3.3V、GND→GND、SCL→PB6、SDA→PB7，INT 先不接。`,
      `注意：OLED 与 MPU6050 分别走 I2C2 和 I2C1，两组 SCL/SDA 不能并在一起。`,
    ]),
    h3(`Step 5：接 MAX4466`),
    ...stepList([
      `VCC→3.3V、GND→GND、OUT→PA0。`,
      `模块上的蓝色电位器先旋到中间位置，联调时再调。`,
    ]),
    h3(`Step 6：最后接舵机`),
    ...stepList([
      `红线→5V 适配器正极，棕线→适配器负极；再把适配器负极与面包板 GND 轨连一根线。`,
      `橙线→PA8。通电瞬间舵机轻微抖一下是正常的。`,
      `重要：舵机必须用独立 5V 电源，不能从 Blue Pill 取电。`,
    ]),

    h2(`3.4 三个供电方案（任选其一，不可混用）`),
    table([1600, 2400, 2400], [`方案`, `接法`, `适用场景`], [
      [`A（推荐）`, `CH340 的 5V→板子 5V，GND 相连`, `调试阶段，一根 USB 全搞定`],
      [`B`, `Micro USB 直接插 Blue Pill`, `板子独立运行`],
      [`C`, `ST-Link 的 3.3V→板子 3.3V`, `仅识别芯片时临时用，不建议带模块`],
    ]),
    p(`舵机的 5V 始终来自独立适配器，不参与以上三选一。`),

    h2(`3.5 I2C 上拉电阻要不要加`),
    p(`GY-521 模块板上已带 4.7kΩ 上拉到 3.3V，常见 4 针 OLED 模块也自带 10kΩ 上拉，因此本工程通常不需要外接电阻。只有出现「OLED 或 MPU6050 时好时坏、示波器看 SDA 上升沿很缓」时，才在 SCL/SDA 与 3.3V 之间各加一个 4.7kΩ。`),

    h2(`3.6 上电后 30 秒体检（不用写代码）`),
    p(`接完线、程序还没下载时，就可以用万用表判断 80% 的接线错误。下表全部是直流电压档对 GND 测量：`),
    table([1900, 1500, 2900], [`测量点`, `正常值`, `异常说明`], [
      [`3.3V 排针`, `3.25—3.35V`, `偏低：供电不足或某模块短路`],
      [`PB6、PB7（I2C1）`, `静态约 3.3V`, `0V：该线对地短路或模块未上电`],
      [`PB10、PB11（I2C2）`, `静态约 3.3V`, `同上；若只有 1.5V 说明上拉不足`],
      [`PA0（麦克风输出）`, `1.4—1.8V`, `0V 或 3.3V：模块没供电/输出饱和`],
      [`PA8（舵机信号）`, `90° 时约 0.25V`, `0V：程序未运行或 TIM1 未启动`],
      [`舵机 5V 轨`, `4.75—5.25V`, `低于 4.5V：适配器功率不够`],
    ]),
    cap(`表 3-2 上电体检表`),
    note(`PA8 的平均电压 = 3.3V × 脉宽 / 20ms。90° 时脉宽 1.5ms，所以约 0.25V；舵机转到 0° 时约 0.08V，180° 时约 0.41V。没有示波器时，用这个值就能判断 PWM 是否真的输出。`),

    /* ---------- 第 4 章 ---------- */
    h1(`第 4 章 STM32CubeMX 建工程（逐屏参数）`),
    p(`本章参数与工程代码严格对应。任何一项改了，代码里的引脚/时序就对不上，所以请按表填写。`),
    h2(`4.0 界面导航（第一次打开先认路）`),
    p(`CubeMX 只有四个页签，从左上角切换。本章的所有设置都只在这四个页签里完成：`),
    table([1600, 4800], [`页签`, `在里面做什么`], [
      [`Pinout & Configuration`, `点芯片引脚分配功能；左侧列表里展开外设改参数（ADC/TIM/I2C/USART/GPIO 全在这里）`],
      [`Clock Configuration`, `画时钟树，填 8 → 72MHz 的倍频与分频`],
      [`Project Manager`, `填工程名、保存路径、选 MDK-ARM、点 GENERATE CODE`],
      [`Tools`, `一般不用`],
    ]),
    cap(`表 4-1 CubeMX 四个页签`),
    p(`操作方式记住三条：① 想用某个引脚，直接在芯片图上左键点它，弹出菜单里选功能；② 想改详细参数，点左侧外设名（如 ADC1），右侧出现 Parameter Settings 表格；③ 想给引脚起名字，右键引脚 → Enter User Label。`),
    p(`本章表格里写的路径（如 System Core → SYS）就是左侧列表的层级：先展开 System Core，再点 SYS。`),
    h2(`4.1 新建工程`),
    h3(`方式 A：直接打开现成的 AntiSnore.ioc（推荐，约 1 分钟）`),
    p(`源码包里已带一份配好全部参数的 AntiSnore.ioc，等价于把 4.2—4.8 的表格一次性填完。零基础请先走这条路线：`),
    ...stepList([
      `新建空文件夹 D:\\work\\AntiSnore（不要中文、不要空格）。`,
      `把 源码\\stm32-antisnore\\AntiSnore.ioc 复制进这个空文件夹。`,
      `双击 AntiSnore.ioc。CubeMX 打开后先看芯片图：PA0、PA8、PA9、PA10、PB0、PB6、PB7、PB10、PB11、PC13 应都有颜色标记。`,
      `直接跳到 4.9 点 GENERATE CODE；4.2—4.8 只看不填，用作核对。`,
    ]),
    note(`.ioc 由 CubeMX 6.x 保存。若你的 CubeMX 是 5.x 或提示“无法打开工程”，走方式 B，参数完全等价。无论哪条路线，生成后都要做 4.9 后面的「生成后 30 秒核对」。`),
    h3(`方式 B：从零新建（.ioc 打不开时）`),
    p(`先建一个空工程，再按 4.2—4.8 的表格逐项填写。`),
    ...stepList([
      `File → New Project。`,
      `Part Number 搜索框输入 STM32F103C8，列表选 STM32F103C8Tx，点右上角 Start Project。`,
      `弹窗 Initialize all peripherals with their default Mode? 选 No。`,
      `此时界面左侧是 Pinout & Configuration，右侧是芯片引脚图。`,
    ]),
    note(`如果 New Project 里搜不到 STM32F103C8，或打开工程时 Keil 报 “Device not found”，都是固件包/器件包没装好，回到 2.1 第 4 步与 2.2 第 3 步。`),
    h2(`4.2 系统与时钟`),
    table([1900, 2200, 2800], [`位置`, `设置`, `说明`], [
      [`System Core → SYS`, `Debug = Serial Wire`, `不开启会锁死 SWD`],
      [`System Core → SYS`, `Timebase Source = SysTick`, `HAL 时基`],
      [`System Core → RCC`, `HSE = Crystal/Ceramic Resonator`, `使用板载 8MHz`],
      [`Clock Configuration 页`, `HSE 8 → PLLMul ×9 → SYSCLK 72`, `AHB/1=72，APB1/2=36，APB2/1=72`],
      [`Clock Configuration 页`, `ADC Prescaler = /6`, `ADCCLK=12MHz（上限 14MHz）`],
    ]),
    h2(`4.3 ADC1 + DMA（麦克风）`),
    table([2200, 2200, 2300], [`参数`, `取值`, `所在页签`], [
      [`引脚 PA0`, `ADC1_IN0`, `Pinout 视图直接点 PA0 选择`],
      [`Mode`, `Independent mode`, `ADC_Settings`],
      [`Continuous Conversion Mode`, `Disabled`, `由 TIM2 触发`],
      [`DMA Continuous Requests`, `Enabled`, `循环搬运`],
      [`External Trigger Conversion Source`, `Timer 2 Trigger Out event`, `Regular Conversion`],
      [`External Trigger Conversion Edge`, `Rising edge`, `Regular Conversion`],
      [`Number Of Conversion`, `1`, `Regular Conversion`],
      [`Rank 1 Channel`, `Channel 0，Sampling 71.5 Cycles`, `Regular Conversion`],
      [`DMA Settings`, `Add → ADC1；Mode Circular；`, `DMA Settings`],
      [`DMA 数据宽度`, `Peripheral Half Word / Memory Half Word`, `DMA Settings`],
      [`DMA 地址自增`, `Memory 勾选，Peripheral 不勾`, `DMA Settings`],
    ]),
    h2(`4.4 TIM2（8kHz 触发源）`),
    table([2200, 2000, 2400], [`参数`, `取值`, `计算/说明`], [
      [`Clock Source`, `Internal Clock`, `TIM2 在 APB1，定时器时钟 72MHz`],
      [`Prescaler (PSC)`, `71`, `72MHz/(71+1)=1MHz`],
      [`Counter Period (ARR)`, `124`, `1MHz/(124+1)=8kHz`],
      [`auto-reload preload`, `Enable`, `默认`],
      [`Trigger Event Selection`, `Update Event`, `TRGO 触发 ADC`],
    ]),
    h2(`4.5 TIM1 CH1（舵机 PWM）`),
    table([2200, 2000, 2400], [`参数`, `取值`, `说明`], [
      [`Channel1`, `PWM Generation CH1`, `对应 PA8`],
      [`Prescaler`, `71`, `1 计数 = 1μs`],
      [`Counter Period (ARR)`, `19999`, `20000μs = 20ms = 50Hz`],
      [`Pulse`, `1500`, `上电默认 90°（中位）`],
      [`CH Polarity`, `High`, `高有效`],
    ]),
    h2(`4.6 I2C1 / I2C2`),
    table([1600, 2200, 2600], [`参数`, `取值`, `说明`], [
      [`I2C1 引脚`, `PB6=SCL，PB7=SDA`, `默认引脚，不需要重映射`],
      [`I2C1 Speed Mode`, `Fast Mode，400000 Hz`, `MPU6050 支持 400kHz`],
      [`I2C2 引脚`, `PB10=SCL，PB11=SDA`, `默认引脚`],
      [`I2C2 Speed Mode`, `Fast Mode，400000 Hz`, `SSD1306 支持 400kHz`],
    ]),
    h2(`4.7 USART1`),
    table([2000, 2000, 2400], [`参数`, `取值`, `说明`], [
      [`Mode`, `Asynchronous`, `PA9=TX，PA10=RX`],
      [`Baud Rate`, `115200`, `与串口助手一致`],
      [`Word Length`, `8 Bits`, `8N1`],
      [`Parity`, `None`, `—`],
      [`Stop Bits`, `1`, `—`],
      [`Hardware Flow Control`, `None`, `不要开 RTS/CTS`],
    ]),
    h2(`4.8 GPIO`),
    table([1200, 2000, 3000], [`引脚`, `设置`, `用途`], [
      [`PB0`, `GPIO_Output；Low；Push Pull；Low speed；Label=LED`, `运行指示灯`],
      [`PC13`, `GPIO_Input；Pull-up；Label=MPU_INT`, `MPU6050 中断（可选）`],
    ]),
    h2(`4.9 生成 Keil 工程`),
    ...stepList([
      `切到 Project Manager 页。Project Name 填 AntiSnore，Project Location 选 D:\\work（不要中文、不要空格）。`,
      `Toolchain / IDE 选 MDK-ARM，Min Version 选 V5。`,
      `Code Generator 页：勾 Copy only the necessary library files；并保持勾选 Generate peripheral initialization as a pair of .c/.h files（生成 adc.c / i2c.c / tim.c / usart.c / gpio.c，对应 4.10 的目录）。`,
      `点右上角 GENERATE CODE，等进度条结束，弹窗点 Open Project，Keil 自动打开工程。`,
    ]),
    note(`GENERATE CODE 报红：先看下方 Messages 窗口的第一条。常见是路径含中文、目标目录无写权限、或固件包缺失。改完再点一次 GENERATE CODE 即可，不需要重建工程。`),
    h3(`生成后 30 秒核对（方式 A / B 都要做）`),
    p(`CubeMX 生成的是「骨架」，下面 6 项决定后面能不能跑起来。花 30 秒在 Keil 或记事本里核对一遍，比事后查一天快得多。`),
    table([2300, 2700, 1800], [`检查位置`, `应看到`, `不对怎么办`], [
      [`Core\\Src\\stm32f1xx_it.c`, `存在函数 DMA1_Channel1_IRQHandler，函数体为 HAL_DMA_IRQHandler(&hdma_adc1);`, `按下面的代码手工补上`],
      [`Core\\Src\\main.c`, `MX_DMA_Init(); 出现在 MX_ADC1_Init(); 之前`, `把这两行调换顺序`],
      [`Core\\Src\\tim.c`, `TIM2 的 Prescaler=71、Period=124`, `回 CubeMX 的 TIM2 页改`],
      [`Core\\Src\\tim.c`, `TIM1 的 Period=19999、Pulse=1500`, `回 CubeMX 的 TIM1 页改`],
      [`Core\\Src\\i2c.c`, `两处 Init.ClockSpeed = 400000`, `回 CubeMX 的 I2C1/I2C2 页改`],
      [`Core\\Src\\usart.c`, `Init.BaudRate = 115200`, `回 CubeMX 的 USART1 页改`],
    ]),
    cap(`表 4-2 生成后核对表`),
    p(`若 stm32f1xx_it.c 里没有 DMA1_Channel1_IRQHandler，打开该文件，在 USER CODE BEGIN 1 与 USER CODE END 1 之间粘贴：`),
    ...code(String.raw`extern DMA_HandleTypeDef hdma_adc1;

void DMA1_Channel1_IRQHandler(void)
{
  HAL_DMA_IRQHandler(&hdma_adc1);
}`),
    note(`为什么必须补：ADC 的 DMA 传输完成/半完成中断靠这个函数转发给 HAL。缺了它，中断会落到默认死循环，现象是「上电打印完启动横幅就卡住」或「麦克风数据永不更新」。`, `FFF0F0`),
    h2(`4.10 生成目录核对`),
    ...code(String.raw`D:\work\AntiSnore\
├── AntiSnore.ioc                 ← 以后改配置双击它
├── Core\Inc\    main.h  stm32f1xx_hal_conf.h  adc.h i2c.h tim.h usart.h gpio.h ...
├── Core\Src\    main.c  adc.c i2c.c tim.c usart.c gpio.c stm32f1xx_it.c ...
├── Drivers\     STM32F1xx_HAL_Driver\  CMSIS\
└── MDK-ARM\     AntiSnore.uvprojx  ← Keil 工程文件`),
    note(`先按 F7 编译一次空工程，必须 0 Error 再继续。这一步只验证工具链，不涉及我们的代码。`),
    note(`以后如果改了 .ioc 并重新生成代码，CubeMX 会重写 main.c 的外设初始化部分，但 USER CODE 区域的内容会保留。回到 Keil 直接按 F7 重新编译即可，不要手动删除工程。`),

    /* ---------- 第 5 章 ---------- */
    h1(`第 5 章 源码集成（最容易出错的一章）`),
    h2(`5.1 复制文件`),
    p(`把源码包里的 10 个 .c 与 11 个 .h 复制到 CubeMX 工程，共 21 个文件。main.h 与 stm32f1xx_hal_conf.h 一定要用 CubeMX 生成的，不要覆盖。`),
    note(`动手前先把 智能止鼾枕_一键工具包.zip 解压到 D:\\work（得到 D:\\work\\智能止鼾枕_一键工具包\\），源码在其中的 源码\\stm32-antisnore。不要解压到桌面、下载文件夹或含中文的路径。本章下面提到的“左边窗口”就是解压后的 源码\\stm32-antisnore 目录。`),
    ...stepList([
      `打开两个资源管理器窗口：左边是 源码\\stm32-antisnore\\Core\\Inc，右边是 D:\\work\\AntiSnore\\Core\\Inc。`,
      `在左边按住 Ctrl 选中 11 个 .h（不要选 main.h、stm32f1xx_hal_conf.h），Ctrl+C，到右边 Ctrl+V。`,
      `若弹出“目标包含同名文件”，说明你误选了 main.h 或 stm32f1xx_hal_conf.h，点取消后重新只选我们提供的文件。`,
      `同样把 Core\\Src 下 10 个 .c 复制到 D:\\work\\AntiSnore\\Core\\Src；遇到 main.c 一律选“跳过”。`,
      `复制完成后数一遍：Inc 目录应比原来多 11 个 .h，Src 目录多 10 个 .c。`,
    ]),
    note(`为什么不用改 main.h：CubeMX 生成的 main.h 只包含 HAL 头文件，并不声明 hadc1/hi2c1 这些句柄。我们把 6 个 extern 声明放在了 pinout.h 里（app.c、unit_test.c 都会包含它），所以你不需要动 CubeMX 的 main.h，也不会在下次重新生成代码时被覆盖。`),
    ...code(String.raw`源: Core\Inc\  →  目标: AntiSnore\Core\Inc\
    app.h  pinout.h  mic.h  mpu6050.h  oled.h  servo.h
    flash_store.h  snore_algo.h  posture_algo.h  fusion_fsm.h  unit_test.h

源: Core\Src\  →  目标: AntiSnore\Core\Src\
    app.c  mic.c  mpu6050.c  oled.c  servo.c  flash_store.c
    snore_algo.c  posture_algo.c  fusion_fsm.c  unit_test.c

【绝对不要复制】Core\Src\main.c（用 CubeMX 生成的那个）
【绝对不要覆盖】Core\Inc\main.h、Core\Inc\stm32f1xx_hal_conf.h`),
    h2(`5.2 在 Keil 里添加文件`),
    ...stepList([
      `左侧 Project 树展开 Target 1 → Application/User/Core 分组。`,
      `右键该分组 → Add Existing Files to Group 'Application/User/Core'。`,
      `文件类型下拉选 All files (*.*)，进入 AntiSnore\\Core\\Src，按住 Ctrl 选中上面 10 个 .c，点 Add，再点 Close。`,
      `展开分组确认 10 个文件都在，且没有 main.c 的重复项。`,
    ]),
    h2(`5.3 必须改的五项设置（Options for Target，快捷键 Alt+F7）`),
    table([1500, 1800, 3300], [`页签`, `项目`, `填写内容`], [
      [`Target`, `ARM Compiler`, `Use default compiler version 5`],
      [`Target`, `Use MicroLIB`, `勾选`],
      [`C/C++`, `Define`, `USE_HAL_DRIVER,STM32F103xB`],
      [`C/C++`, `Include Paths`, `Core\\Inc；Drivers\\STM32F1xx_HAL_Driver\\Inc；Drivers\\CMSIS\\Device\\ST\\STM32F1xx\\Include；Drivers\\CMSIS\\Include`],
      [`C/C++`, `Misc Controls`, `--c99`],
    ]),
    cap(`表 5-1 Keil 必改设置`),
    note(`--c99 必须加：本工程大量使用 for (int i = 0; ...) 这类 C99 写法，Keil AC5 默认 C90 会直接报错。`),
    note(`MicroLIB 的 printf 不支持 %f：本工程所有浮点输出都用 pinout.h 里的 fmt_f() 先转成字符串再打印（如 angle=92.5），所以串口和 OLED 都能正常显示小数。你自己加打印时也请照这个写法，不要直接写 %.1f。`, `F0FFF4`),
    h2(`5.4 在 main.c 里粘贴 4 段代码`),
    p(`打开 Core\\Src\\main.c，只改 CubeMX 用注释标出的 USER CODE 区域。这四段区域在重新生成代码时不会被清空。`),
    p(`先认清 main.c 的结构（外设初始化函数的先后顺序以 CubeMX 实际生成的为准，你只需要找 USER CODE 标记）：`),
    ...code(String.raw`int main(void)
{
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_ADC1_Init();
  MX_I2C1_Init();  MX_I2C2_Init();
  MX_TIM1_Init();  MX_TIM2_Init();
  MX_USART1_UART_Init();
  /* USER CODE BEGIN 2 */      ← 粘 APP_Init(); APP_Console();
  /* USER CODE END 2 */

  while (1)
  {
    /* USER CODE BEGIN WHILE */ ← 粘 APP_Loop(); 的位置
    /* USER CODE END WHILE */
    /* USER CODE BEGIN 3 */
  }
}`),
    h3(`① USER CODE BEGIN Includes`),
    ...code(String.raw`/* USER CODE BEGIN Includes */
#include "app.h"
#include <stdio.h>
/* USER CODE END Includes */`),
    h3(`② USER CODE BEGIN 0 —— Keil 的 printf 重定向`),
    ...code(String.raw`/* USER CODE BEGIN 0 */
int fputc(int ch, FILE *f)
{
    HAL_UART_Transmit(&huart1, (uint8_t *)&ch, 1, HAL_MAX_DELAY);
    return ch;
}
/* USER CODE END 0 */`),
    h3(`③ USER CODE BEGIN 2 —— 初始化并进入菜单`),
    ...code(String.raw`/* USER CODE BEGIN 2 */
APP_Init();       /* 模块初始化 + ADC 校准 */
APP_Console();    /* 串口菜单: 1/2/3/4/a 单元测试, r 进入主循环 */
/* USER CODE END 2 */`),
    h3(`④ USER CODE BEGIN WHILE —— 主循环`),
    ...code(String.raw`/* USER CODE BEGIN WHILE */
while (1)
{
    APP_Loop();   /* 内含 5ms 延时与全部业务逻辑 */
    /* USER CODE END WHILE */
    /* USER CODE BEGIN 3 */
}
/* USER CODE END 3 */`),
    note(`注意：while(1) 内原本就有 USER CODE BEGIN WHILE 和 BEGIN 3 两段注释，APP_Loop(); 要放在两者之间，不要删掉注释标记。`),
    h2(`5.5 编译`),
    ...stepList([
      `按 F7（Build），或点工具栏带箭头的 Build 图标。`,
      `底部 Build Output 窗口最后一行应为 0 Error(s), 0 Warning(s)（少量 Warning 可忽略）。`,
      `生成的文件在 MDK-ARM\\AntiSnore\\AntiSnore.hex。`,
      `若报错，先看第 10 章「编译类报错」表，80% 是 Include Paths 或 --c99 漏了。`,
    ]),
    note(`编译成功后看 Build Output 最后一行 “Program Size: Code=xxxxx RO-data=xxxx RW-data=xxx ZI-data=xxx”。Code + RO-data 就是占用的 Flash，必须远小于 63KB（因为最后 1KB 被统计存储占用）。超过 60KB 时应把 flash_store.h 的 STATS_FLASH_BASE 改到更靠前的空闲页。`),

    /* ---------- 第 6 章 ---------- */
    h1(`第 6 章 烧录与首次上电`),
    h2(`6.1 Keil 下载配置`),
    ...stepList([
      `Alt+F7 打开 Options → Debug 页，左上角下拉选 ST-Link Debugger，点右侧 Settings。`,
      `Debug 子页：Port 选 SW，Max Clock 选 1.8MHz；右侧 SW Device 应显示 IDCODE 0x1BA01477、Device Name ARM CoreSight SW-DP。`,
      `ST-Link 与板子的四根线按丝印对应：3.3V→3.3V（可不接）、GND→GND、SWDIO→PA13、SWCLK→PA14。杜邦线颜色各厂家不同，只认丝印。`,
      `Flash Download 子页：勾 Reset and Run；Programming Algorithm 列表应含 STM32F10x Med-density Flash 128KB。没有就点 Add 添加。`,
      `Utilities 页：勾 Use Debug Driver；确认 Update Target before Debugging 勾选。`,
      `点 OK 保存，按 F8（Load）下载。`,
    ]),
    note(`下载器不要升级固件（尤其是国产克隆版 ST-Link V2），升级失败会变砖。`),
    note(`按 F8 提示 Cannot access target 时：按住板子复位键 → 点 F8 → 看到 “Programming…” 立刻松开复位，成功率很高。仍不行就用 CubeProgrammer 全片擦除（见 2.6）。`),
    h2(`6.2 首次上电应看到什么`),
    p(`按 Blue Pill 的复位键（或重新上电），串口助手应输出：`),
    ...code(String.raw`========== 智能止鼾枕 启动 ==========
输入: '1'=MPU自检  '2'=OLED自检  '3'=舵机自检  '4'=麦克风采样
      'a'=全部单元测试  'r'=运行主循环
> `),
    bullet(`先不要急着输入 r。按顺序输入 1、2、3、4，逐项确认屏幕、姿态、舵机、麦克风都正常；最后输入 a 应看到 5/5 PASS。`),
    bullet(`PB0 外接 LED 点亮，OLED 此时可能还是黑的（要等菜单里 r 之后才刷新）。`),
    bullet(`串口发送 r，打印「系统就绪, 进入主循环」，OLED 显示 System Ready，随后每 500ms 轮播 3 页。`),
    bullet(`LED 每 500ms 翻转一次，表示主循环在跑。`),
    note(`串口命令只认小写：'1''2''3''4''a''r''s'。输入 'A' 或 'R' 不会有反应。进入主循环后菜单就不再出现，想重新做单元测试必须按一下板子上的复位键（RESET）。`),

    /* ---------- 第 7 章 ---------- */
    h1(`第 7 章 七关联调`),
    p(`每关只关注自己那部分。上电前先确认这一关涉及的四根线已按表 3-1 接好。`),

    h2(`第 1 关：供电与 GPIO`),
    pKv(`操作：`, `上电，串口输入 r。`),
    pKv(`预期：`, `3.3V 实测 3.25—3.35V；LED 每 500ms 亮灭一次。`),
    pKv(`失败分支：`, `LED 不亮 → 检查 LED 极性（长脚接 PB0，短脚经 1kΩ 接 GND）；常亮不闪 → 程序没进主循环，确认已输入 r。`),

    h2(`第 2 关：USART1`),
    pKv(`操作：`, `串口助手选 CH340 的 COM 口，波特率 115200、数据位 8、停止位 1、校验 None、流控 None，打开串口。先确认能收到启动横幅；本关不需要接任何模块。`),
    pKv(`发送设置：`, `不要勾“发送新行/加回车换行”，也不要勾“HEX 发送”；波特率下拉框必须正好是 115200，不要选 115200 之外的近似值。`),
    pKv(`预期：`, `在发送框输入小写 r 并点“发送”，打印“系统就绪, 进入主循环”，OLED 无显示属正常（本关还没接屏幕）。随后输入 s，回显 snore=0 supine=0 angle=90.0。`),
    pKv(`失败分支：`, `乱码 → 波特率或晶振配置不对；无任何输出 → TX/RX 接反（CH340 的 TXD 必须接 PA10）；输入 r 无反应 → 确认是小写 r 且串口助手确实发送了出去（看发送字节数）；一直停在菜单 → 说明字符没有送到 PA10。`),
    note(`'s' 只在主循环里有效，在启动菜单里按 s 不会打印状态，这是正常的。`),

    h2(`第 3 关：OLED（I2C2）`),
    pKv(`操作：`, `串口输入 2。`),
    pKv(`预期：`, `屏幕连续 10 帧显示 OLED Test #0…#9、Hello STM32!、1234567890；串口打印 PASS: OLED drew 10 frames。字号为 8×16，一屏可放 16 字符 × 4 行。`),
    pKv(`失败分支：`, `全黑 → 先确认 VCC=3.3V；再查 SCL/SDA 是否接到 PB10/PB11（不是 PB6/PB7）；模块地址可能为 0x3D，改 pinout.h 的 OLED_I2C_ADDR 为 (0x3D<<1)。`),
    pKv(`花屏/雪花：`, `I2C 速率降到 100kHz（CubeMX 里改），或缩短杜邦线。`),
    pKv(`字母显示不全（如只出现 H 和 STM32）：`, `说明烧的是旧版 oled.c（旧字库只有大写和数字）。用源码包里的最新 oled.c 覆盖后重新编译；新版字库覆盖 0x20—0x7E，小写和 : . % 都能正常显示。`),

    h2(`第 4 关：MPU6050（I2C1）`),
    pKv(`操作：`, `串口输入 1，保持板子静止 2 秒。`),
    pKv(`预期：`, `打印 PASS: WHO_AM_I=0x68, PLL OK；均值 ax≈0、ay≈0、az≈1.00；PASS: accel magnitude≈1.00 g。`),
    pKv(`动态验证：`, `把板子前后倾，pitch 变化；左右翻，roll 变化。`),
    pKv(`失败分支：`, `WHO_AM_I 读到 0x00/0xFF → I2C 未通，查 PB6/PB7 与上拉；读到 0x69 → AD0 被拉高；|a| 明显不是 1g → 供电不稳或量程配置错误。`),

    h2(`第 5 关：麦克风（ADC-DMA）`),
    pKv(`操作：`, `串口输入 4，先安静 2 秒，再对着麦克风说话。`),
    pKv(`预期：`, `打印 min/max/avg，avg 在 2048 附近；安静时 pk-pk 数十，说话时 pk-pk 大于 200 并打印 PASS。`),
    pKv(`失败分支：`, `pk-pk=0 且 avg≈0 → ADC 没转换，检查 CubeMX 的 Trigger 是否选了 Timer2 TRGO、DMA 是否 Circular、stm32f1xx_it.c 是否有 DMA1_Channel1_IRQHandler（见 4.9 核对表）；pk-pk 很小 → 拧大 MAX4466 增益电位器；avg 恒为 4095 → 接了 5V 供电导致输出饱和。`),
    pKv(`输入 4 后板子卡死、串口断掉：`, `多半是 HardFault（默认栈只有 1KB，旧版 unit_test.c 把 1KB 缓冲放在栈上）。用最新 unit_test.c（已改为 static）重新编译即可。`),
    h3(`增益调节（做到这一步才算过关）`),
    ...stepList([
      `安静环境运行测试 4，读 pk-pk 值；用小螺丝刀缓慢顺时针拧 MAX4466 上的蓝色电位器。`,
      `目标：安静时 pk-pk 在 100—400 之间（能看见底噪，但不饱和）。`,
      `对着麦克风正常说话，pk-pk 应达到 1500—3500；若接近 4095 说明增益过大，回调一点。`,
      `设定完成后不要再动电位器，否则之前记录的噪声底会失效。`,
    ]),

    h2(`第 6 关：舵机（TIM1 PWM）`),
    pKv(`操作：`, `先空载（舵机不装到枕头上），串口输入 3。`),
    pKv(`预期：`, `舵机依次转到 0→45→90→135→180→90，每个位置停 0.5 秒，动作平滑；串口逐行打印 angle → xx deg，最后 PASS。`),
    pKv(`失败分支：`, `完全不动 → 查独立 5V、共地、信号线是否 PA8；抖动或单片机复位 → 5V 电源电流不足，换 2A；只往一个方向撞 → 脉宽范围不匹配，个别舵机是 500—2500μs 之外的行程。`),
    note(`装到枕头上之前一定要空载跑这一关。全行程 0—180° 会把支撑片顶到极限，可能损坏结构或舵机齿轮。`),

    h2(`第 7 关：整体融合`),
    pKv(`操作：`, `输入 r；手机循环播放鼾声，音量调到 2 米外能听清；把板子平放（模拟仰卧）。`),
    pKv(`预期（OLED 第 0 页）：`, `FSM: IDLE → Snore/Sup 秒数同步增长 → 约 3 秒后 ARMED → INTERVENE，舵机从 90° 抬到 92°；之后每 15 秒再抬 2°，到 105° 后保持不再抬升。`),
    pKv(`复位验证：`, `停止鼾声或把板子侧翻（roll>25°），15 秒内 FSM 进入 OBSERVE→COOLDOWN，舵机回 90°。`),
    pKv(`失败分支：`, `一直 IDLE → 看第 0 页哪个秒数不涨，回到第 4/5 关；一放鼾声就连续抬升不观察 → 确认烧的是最新 fusion_fsm.c；误触发频繁 → 把 FUSION_HOLD_MS 从 3000 调到 5000。`),
    pKv(`卡在 ARMED：`, `说明双条件成立后又被清零。检查播放的鼾声是否断续（每断一次 Snore 计时归零），换成连续音频；或板子是否被手碰得 roll 超过 20°。`),
    pKv(`舵机只动一次：`, `正常现象——之后每次动作间隔 15 秒 OBSERVE。耐心等，或把 fusion_fsm.h 的 FUSION_OBSERVE_MS 临时改为 3000 加快演示。`),
    pKv(`OLED 显示 INTERVENE 但舵机不动：`, `先单独跑第 6 关；若第 6 关正常，检查 PA8 是否被其它线压住、舵机 5V 是否掉到 4.5V 以下。`),
    pKv(`计时偏大（3 秒变 4—5 秒、15 秒变 20 秒）：`, `说明烧的是旧版 fusion_fsm.c（按固定 5ms 累加，OLED 刷新拖慢主循环就会偏大）。最新版已改用 HAL_GetTick() 真实毫秒计时，误差小于 1%。`),

    /* ---------- 第 8 章 ---------- */
    h1(`第 8 章 机械组装与整机装配`),
    p(`电路跑通后，把舵机装到枕头上才算“实物”。本章的结构全部用硬纸板、泡沫板和扎带完成，不需要 3D 打印，30 分钟可做完，答辩时演示效果比裸舵机直观得多。`),
    h2(`8.1 材料与工具`),
    table([2200, 1300, 2400], [`材料`, `规格`, `用途`], [
      [`硬纸板`, `A3 两张`, `底座 + 抬升臂`],
      [`泡沫板或薄枕头`, `30×20cm`, `枕面，直接接触头部`],
      [`SG90 舵机`, `1 个`, `已通过第 6 关测试`],
      [`舵盘`, `一字或十字，舵机附带`, `与抬升臂连接`],
      [`M2 自攻螺丝`, `2 颗，舵机附带`, `固定舵机`],
      [`双面胶 + 扎带`, `若干`, `固定舵盘与抬升臂`],
      [`美工刀、直尺、记号笔`, `—`, `裁切与划线`],
    ]),
    h2(`8.2 五步装配`),
    ...stepList([
      `做底座：把硬纸板裁成 20×20cm，在正中偏后开一个 6×6cm 方孔，用于舵机线和电源线穿过。`,
      `固定舵机：舵机两侧的安装耳用 M2 螺丝拧在底座上，输出轴朝上，并让输出轴位于底座中心线上（用记号笔先画十字定位）。`,
      `装摆臂：把舵盘压到输出轴上（先不要拧死）；裁一条 15×8cm 硬纸板作为抬升臂，一端与舵盘重叠 3cm，用双面胶粘牢后再用扎带穿孔绑紧——只靠双面胶会在反复抬升中脱落。`,
      `装枕面：泡沫板裁成 30×20cm，放在抬升臂上方，四角用小块双面胶“点粘”，方便答辩后拆开。`,
      `理线：舵机线从底座方孔穿到下方，预留 15cm 余量并用手轻拉确认不会在抬升时被扯紧；线用胶带固定在底座背面。`,
    ]),
    h2(`8.3 角度标定（必做）`),
    ...stepList([
      `上电，串口输入 3 让舵机走到 90°，观察抬升臂是否水平。`,
      `不水平就断电，拔下舵盘重新对齿（转动一个齿位再压回），不要用代码加偏移量去凑——机械对中更可靠。`,
      `再输入 3 走完整行程，确认 0° 与 180° 都不会把纸板顶到桌面。`,
      `用量角器或手机水平仪测 90°→105° 的实际抬升角，并量臂端抬起的毫米数（2° 约对应臂端 3—4mm），记下来写进论文 4.5 节。`,
    ]),
    note(`安全：抬升臂运动范围内不要放手；首次通电把手放在电源开关旁；舵机被卡住超过 2 秒会堵转发热，立即断电检查。整机结构总重控制在 300g 以内，SG90 的 1.6kg·cm 扭矩足够。`),

    /* ---------- 第 9 章 ---------- */
    h1(`第 9 章 演示与论文数据采集`),
    h2(`9.1 鼾声音源准备`),
    bullet(`手机搜索「打鼾声 音效」，选一段 30 秒以上、节奏连续的，存到本地循环播放。`),
    bullet(`用蓝牙音箱外放，音量以 2 米外清晰可闻为准；手机扬声器音量通常不够触发。`),
    bullet(`另准备空调声、翻书声、电视声各一段，用于演示抗噪与误触发对比。`),
    h2(`9.2 三分钟演示脚本`),
    table([700, 2500, 2700], [`时间`, `操作`, `讲解词要点`], [
      [`0:00`, `上电，串口显示启动横幅，OLED 显示 System Ready`, `系统由 STM32 主控 + 声音/姿态/显示/执行四模块组成`],
      [`0:30`, `输入 r，OLED 进入 FSM 页，LED 心跳`, `主循环 5ms 节拍，500ms 刷新页面`],
      [`0:50`, `播放鼾声，板子保持水平`, `OLED 上 Snore/Sup 秒数开始累加`],
      [`1:10`, `约 3 秒后进入 ARMED→INTERVENE，舵机抬到 92°`, `双条件融合：必须「仰卧 + 打鼾」同时满足 3 秒`],
      [`1:40`, `继续播放，每 15 秒再抬 2°，到 105° 后保持`, `渐进式：小步进 + 15 秒静默观察，不惊醒用户`],
      [`2:10`, `把板子侧翻 3 秒以上`, `体位条件消失，进入 OBSERVE，随后舵机回中位`],
      [`2:30`, `输入 s，展示一行实时状态`, `数据可观测、可记录`],
      [`2:45`, `输入 a，跑全部单元测试`, `工程具备自检能力，5/5 PASS`],
    ]),
    h3(`上台前 10 分钟检查清单`),
    ...stepList([
      `手机音频已下载到本地并设为循环，不依赖网络。`,
      `蓝牙音箱电量充足、已配对；没有音箱就用手机最大音量贴近平放。`,
      `板子、舵机、电源全部接好，先跑一次 1/2/3/4，确认 5/5 PASS。`,
      `OLED 亮度足够（深色背景板前演示），串口窗口已打开并调到 115200。`,
      `抬升臂空载手动转一圈，确认不会蹭到线或卡住。`,
      `准备一句话解释“为什么必须仰卧+打鼾同时满足才干预”——这是评委最常问的点。`,
    ]),
    h2(`9.3 采集真实数据写进论文`),
    ...stepList([
      `打开 PC_Test/serial_monitor.py，把 COM 口改成你的 CH340 口，运行。`,
      `输入 r 进入主循环，然后按场景各录 3 分钟：安静 / 轻度噪声 / 中度噪声 / 打鼾 / 打鼾+仰卧 / 打鼾+侧卧。`,
      `统计每段日志里 snore=1 的比例、supine=1 的比例、INTERVENE 出现次数。`,
      `把结果填入论文 5.2—5.4 的表格，注明「实测，样本 N 分钟」。`,
    ]),
    note(`实测指标低于仿真是正常现象，导师也更认可真实数据。可以在「不足与展望」里写明：受麦克风增益与家庭噪声影响，实测识别率较仿真下降 X 个百分点，后续通过自适应增益与前级滤波改善。`),

    /* ---------- 第 10 章 ---------- */
    h1(`第 10 章 真实报错对照表`),
    h3(`10.1 编译类`),
    table([2400, 2800, 1600], [`Build Output 里的原文`, `原因`, `处理`], [
      [`Error: L6218E: Undefined symbol HAL_ADC_Init`, `hal_conf 未启用 ADC 模块`, `CubeMX 里确认 ADC1 已配置并重新生成`],
      [`error: #5: cannot open source input file "app.h"`, `Include Paths 缺 Core\\Inc`, `5.3 补路径`],
      [`error: #20: identifier "huart1" is undefined`, `main.c 未包含 CubeMX 的 main.h`, `确认 main.c 顶部 #include "main.h"`],
      [`error: #20: identifier "hadc1" is undefined（或 hi2c1/hi2c2/htim1/htim2）`, `pinout.h 是旧版，或没把 pinout.h 复制进工程`, `用源码包最新 pinout.h 覆盖（其中已含 6 个 extern 句柄声明）`],
      [`error: #268 / expected a ";"（for 循环处）`, `AC5 默认 C90`, `Misc Controls 加 --c99`],
      [`Error: L6200E: Symbol HAL_ADC_ConvCpltCallback multiply defined`, `我们的 main.c 也被加进工程了`, `从工程移除 Core\\Src\\main.c`],
      [`warning: #223-D: function "printf" declared implicitly`, `缺 #include <stdio.h>`, `在 USER CODE Includes 加上`],
      [`Error: L6915E: Library reports error: __use_no_semihosting`, `未勾 Use MicroLIB`, `Target 页勾选 Use MicroLIB`],
      [`*** Target uses ARM-Compiler 'Default Compiler Version 5' which is not available`, `AC5 未安装或路径未指定`, `按 2.2 节安装 AC5，并在 Target 页选中 version 5`],
      [`error: #5: cannot open source input file "stm32f1xx_hal.h"`, `Include Paths 缺 Drivers 目录`, `补 Drivers\\STM32F1xx_HAL_Driver\\Inc 与 CMSIS 两个路径`],
      [`Error: L6218E: Undefined symbol FLASH_PageErase`, `hal_conf 未启用 FLASH 模块`, `CubeMX 生成工程默认已启用，检查是否误用了自定义 hal_conf.h`],
      [`Error: L6406E: No space in execution regions`, `程序超过 64KB Flash`, `Target 页 Optimization 选 Level 1 或 Level 2 重新编译`],
    ]),
    h3(`10.2 下载与调试类`),
    table([2400, 2800, 1600], [`报错原文`, `原因`, `处理`], [
      [`No ST-LINK detected`, `驱动未装/USB 线坏`, `重装 STSW-LINK009，换 USB 口`],
      [`Cannot access target. Shutting down debug session.`, `SWD 引脚被复用或线松`, `按住复位再下载；BOOT0=1 上电后全片擦除`],
      [`Error: Flash Download failed - "Cortex-M3"`, `Flash 算法未选或芯片被读保护`, `Flash Download 页 Add 算法；CubeProgrammer 解除读保护`],
      [`Cannot Load Flash Programming Algorithm!`, `算法文件缺失`, `重新安装 DFP 包`],
      [`st-link usb communication error`, `克隆版固件异常`, `换一个 USB 口；不要升级固件`],
      [`Programming Done 但程序不跑`, `BOOT0 不在 0 或未勾 Reset and Run`, `跳线改 0；勾 Reset and Run 后重新下载`],
      [`No target connected`, `3.3V/GND 未接或板子没供电`, `补接 GND，确认 3.3V 排针有 3.3V`],
      [`SWD/JTAG Communication Failure`, `SWD 速率过高或线接触不良`, `Max Clock 降为 1.8MHz；缩短杜邦线；按住复位再下载`],
      [`Programming error @ 0x08000000`, `芯片被读保护或 Flash 算法不匹配`, `CubeProgrammer 解除读保护 / 全片擦除后重下`],
      [`RDDI-DAP Error`, `下载线过长或 GND 未共地`, `换短杜邦线，确保 GND 直连`],
      [`Flash Download failed - Target DLL has been cancelled`, `调试会话被占用`, `关闭所有 Keil 调试窗口，重新进入 Debug 再 F8`],
    ]),
    h3(`10.3 运行现象类`),
    table([2400, 2800, 1600], [`现象`, `最可能原因`, `处理`], [
      [`串口全是乱码`, `波特率不是 115200`, `CubeMX 与串口助手都改成 115200`],
      [`OLED 全黑`, `VCC 错/地址错/线反`, `量 3.3V；查 PB10/PB11；试 0x3D`],
      [`MPU 读到 0xFF`, `I2C1 未上拉或线松`, `紧线；必要时加 4.7kΩ 上拉`],
      [`麦克风 pk-pk=0`, `TIM2 未启动或 Trigger 未选`, `确认烧的是最新 app.c（含 HAL_TIM_Base_Start）`],
      [`舵机一转就复位`, `从 3.3V 取电`, `改独立 5V 2A`],
      [`FSM 停 IDLE`, `某个条件秒数不涨`, `看 OLED 第 0 页定位到具体模块`],
      [`重新生成代码后自己的代码消失`, `代码没写在 USER CODE 区域内`, `把代码移进 BEGIN/END 之间`],
      [`Flash 计数每次归零`, `写保护或地址冲突`, `确认 STATS 地址 0x0800FC00（第 63 页）未被程序占用`],
      [`Keil 里中文注释变乱码`, `编辑器编码不是 UTF-8`, `Edit → Configuration → Editor → Encoding 选 UTF-8 后重开文件`],
      [`上电直接卡住、串口无横幅`, `某个模块初始化死等（多为 I2C）`, `拔掉 MPU6050 或 OLED 再上电，若恢复说明该模块接线错`],
      [`打印完启动横幅、按 r 后立刻卡死`, `stm32f1xx_it.c 缺 DMA1_Channel1_IRQHandler`, `按 4.9 核对表补 5 行中断函数后重编`],
      [`输入 4 时板子卡死或复位`, `旧版 unit_test.c 把 1KB 缓冲放在 1KB 栈上`, `用最新 unit_test.c（缓冲已改 static）`],
      [`OLED 只显示大写、小写字母处空白`, `旧版 oled.c 字库只有大写和数字`, `用最新 oled.c（0x20—0x7E 全字符）覆盖`],
      [`3 秒实际要等 4—5 秒`, `旧版 fusion_fsm.c 按固定 5ms 累加`, `用最新 fusion_fsm.c（HAL_GetTick 真实计时）`],
      [`串口只能收不能发`, `CH340 的 RXD 没接 PA9`, `按表 3-1 补接，注意 TX/RX 交叉`],
      [`OLED 出现方块`, `字库只支持 ASCII`, `不要显示中文，改用英文或数字`],
    ]),

    /* ---------- 附录 ---------- */
    h1(`附录 A 引脚速查卡`),
    ...code(String.raw`PA0   MAX4466 OUT        ADC1_IN0
PA8   SG90 橙线(信号)      TIM1_CH1  PWM 50Hz
PA9   CH340 RXD            USART1_TX
PA10  CH340 TXD            USART1_RX
PA13  ST-Link SWDIO
PA14  ST-Link SWCLK
PB0   LED + 1kΩ → GND      运行指示
PB6   MPU6050 SCL          I2C1
PB7   MPU6050 SDA          I2C1
PB10  OLED SCL             I2C2
PB11  OLED SDA             I2C2
PC13  MPU6050 INT          可选
3.3V  MAX4466 / MPU6050 / OLED 的 VCC
GND   所有模块 + 外部 5V 电源负极（必须共地）`),
    h1(`附录 B 关键参数速记`),
    table([2200, 3800], [`参数`, `取值`], [
      [`系统时钟`, `HSE 8MHz → PLL×9 → 72MHz；APB1 36MHz、APB2 72MHz`],
      [`ADC`, `12 位，8kHz，DMA 环形 512 半字（2 帧），每 32ms 一帧 256 点`],
      [`PWM`, `50Hz（PSC=71，ARR=19999），500—2500μs 对应 0—180°`],
      [`I2C 地址`, `MPU6050 0x68；SSD1306 0x3C（HAL 传 0x78）`],
      [`融合触发`, `双条件各持续 3000ms；观察 15000ms；冷却 5000ms`],
      [`干预角度`, `中位 90°，每次 +2°，最大 105°（相对 +15°）`],
      [`Flash 统计`, `0x0800FC00 起 1KB（第 63 页），异或校验和`],
    ]),
    h1(`附录 C 最终验收清单`),
    table([5000, 900], [`项目`, `打勾`], [
      [`7 个模块全部按表 3-1 接好，3.3V 与 5V 未混接`, `□`],
      [`Keil 编译 0 Error，AC5 + MicroLIB + --c99 已设置`, `□`],
      [`下载后串口有启动横幅，输入 r 能进主循环`, `□`],
      [`第 1—6 关单元测试全部 PASS`, `□`],
      [`第 7 关：放鼾声能在 3 秒后抬升 2°，侧翻能回位`, `□`],
      [`舵机已装到硬纸板底座，90° 时抬升臂水平，全行程不顶死`, `□`],
      [`OLED 三页轮播正常，Flash 计数掉电不丢`, `□`],
      [`已用 serial_monitor.py 采到至少 6 组真实数据`, `□`],
    ]),
    h1(`附录 D 出问题时先做这四件事`),
    ...stepList([
      `断电，用万用表蜂鸣档量 5V—GND、3.3V—GND 是否短路。`,
      `重新上电，量 3.3V 是否在 3.25—3.35V。`,
      `打开串口助手，确认能收到启动横幅（收不到就是供电/串口问题，不是代码问题）。`,
      `输入 a 跑全部单元测试，看哪一项 FAIL，只查那一项对应的四根线。`,
    ]),
  ]
};

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
