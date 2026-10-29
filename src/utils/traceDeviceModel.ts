// 终端型号展示工具：把设备信息中的品牌与型号代码转换为可读机型名称。
// 本模块依赖机型字典（约 240KB），只应由真正展示终端型号的列表页引入。
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
