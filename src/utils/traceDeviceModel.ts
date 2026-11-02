// 终端型号展示工具：把设备信息中的品牌与型号代码转换为可读机型名称。
// 本模块依赖机型字典（约 240KB），只应由真正展示终端型号的列表页引入。
import type { TraceEventItem } from "@/api/trace";
import { formatDeviceModelDisplay } from "@/utils/deviceModel";
import { formatTraceDeviceField, resolveTraceDeviceInfo } from "@/utils/traceDevice";

/** 格式化终端型号，优先展示机型名称并保留原始型号代码。 */
export const formatTraceTerminalModel = (deviceInfo: unknown) => {
  /** 解析后的设备信息。 */
  const resolvedDeviceInfo = resolveTraceDeviceInfo(deviceInfo);
  if (!resolvedDeviceInfo) {
    return "-";
  }

  /** 终端型号展示文本。 */
  const terminalModel = formatDeviceModelDisplay(
    formatTraceDeviceField(resolvedDeviceInfo.brand),
    formatTraceDeviceField(resolvedDeviceInfo.model),
  );

  return terminalModel || "-";
};

/**
 * 收集事件列表里出现的终端型号展示值。
 * 选项直接复用表格「终端型号」列的格式化结果，保证选项与列取值一一对应，
 * 不会因为营销名相同但原始型号不同而误合并。
 */
export const collectTraceTerminalModels = (eventItems: TraceEventItem[]): string[] => {
  /** 去重后的终端型号展示值。 */
  const terminalModelSet = new Set<string>();

  eventItems.forEach((eventItem) => {
    terminalModelSet.add(formatTraceTerminalModel(eventItem.deviceInfo));
  });

  return [...terminalModelSet].sort((leftModel, rightModel) => leftModel.localeCompare(rightModel, "zh-Hans-CN"));
};

/**
 * 按终端型号展示值筛选事件。
 * 未选择任何型号时原样返回，即「全部机型」不做任何过滤。
 */
export const filterEventItemsByTerminalModels = (
  eventItems: TraceEventItem[],
  selectedTerminalModels: readonly string[],
): TraceEventItem[] => {
  if (selectedTerminalModels.length === 0) {
    return eventItems;
  }

  /** 选中型号集合：按展示值精确匹配，避免子串匹配把相邻型号一起带出。 */
  const selectedTerminalModelSet = new Set(selectedTerminalModels);

  return eventItems.filter((eventItem) =>
    selectedTerminalModelSet.has(formatTraceTerminalModel(eventItem.deviceInfo)),
  );
};
