// ECharts 图表统一视觉主题：与全局设计令牌共用同一套配色、字体与线条规格。

/** 图表基础配色。 */
export const chartColors = {
  /** 失败 / 错误。 */
  fail: "#ef4444",
  /** 警告。 */
  warning: "#f59e0b",
  /** 成功。 */
  success: "#22c55e",
  /** 主色：候选人趋势等中性数据系列，与全局青蓝主色一致。 */
  accent: "#0a90a1",
  /** 坐标轴标签。 */
  axisLabel: "#6e8087",
  /** 坐标轴线与刻度。 */
  axisLine: "#e2ebed",
  /** 网格分隔线。 */
  splitLine: "#edf3f4",
  /** 主文本。 */
  ink: "#1d2b33",
  /** 画布白。 */
  surface: "#ffffff",
  /** 描边。 */
  border: "#eff4f5",
} as const;

/** 图表字体栈，与页面正文保持一致。 */
export const chartFontFamily =
  '"HarmonyOS Sans SC", "MiSans", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

/** 统一提示框样式。 */
export const chartTooltip = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderColor: chartColors.border,
  borderWidth: 1,
  padding: [10, 12],
  textStyle: {
    color: chartColors.ink,
    fontSize: 12,
    fontFamily: chartFontFamily,
  },
  extraCssText: "border-radius: 10px; box-shadow: 0 12px 32px rgba(23, 48, 56, 0.10);",
};

/** 统一坐标轴标签样式。 */
export const chartAxisLabel = {
  color: chartColors.axisLabel,
  fontSize: 11,
  fontFamily: chartFontFamily,
};

/** 统一坐标轴轴线样式（弱化轴线，突出数据）。 */
export const chartAxisLine = {
  lineStyle: {
    color: chartColors.axisLine,
  },
};

/** 统一网格分隔线样式。 */
export const chartSplitLine = {
  lineStyle: {
    color: chartColors.splitLine,
    type: "dashed",
  },
};

/** 统一图例样式。 */
export const chartLegend = {
  icon: "circle",
  itemWidth: 7,
  itemHeight: 7,
  itemGap: 16,
  textStyle: {
    color: chartColors.axisLabel,
    fontSize: 11,
    fontFamily: chartFontFamily,
  },
};

/** 统一坐标轴指示器样式。 */
export const chartAxisPointer = {
  type: "line",
  lineStyle: {
    color: chartColors.axisLine,
    width: 1,
    type: "dashed",
  },
};

/**
 * 系统「减少动态效果」媒体查询，模块级只创建一次。
 * 每次图表渲染都调用 window.matchMedia 会重复解析媒体查询并新建 MediaQueryList，属纯浪费。
 */
const reducedMotionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

/** 读取系统「减少动态效果」偏好，用于关闭图表入场动画。 */
export const prefersReducedMotion = () => Boolean(reducedMotionQuery?.matches);
