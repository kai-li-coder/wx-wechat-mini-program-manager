// 埋点设备信息解析工具：只做字段读取与归一化，不依赖机型字典。
// 与机组字典解耦后，仅需要事件码/阶段格式化的页面（如埋点总览）不会加载 240KB 机型映射表。

/** 判断值是否为可读取字段的普通对象。 */
export const isTraceRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 解析设备信息对象，兼容后端直接返回 JSON 字符串的场景。 */
export const resolveTraceDeviceInfo = (deviceInfo: unknown): Record<string, unknown> | null => {
  if (isTraceRecord(deviceInfo)) {
    return deviceInfo;
  }

  if (typeof deviceInfo !== "string") {
    return null;
  }

  try {
    /** 反序列化后的设备信息。 */
    const parsedDeviceInfo: unknown = JSON.parse(deviceInfo);
    if (isTraceRecord(parsedDeviceInfo)) {
      return parsedDeviceInfo;
    }
  } catch {
    return null;
  }

  return null;
};

/** 格式化设备字段展示值。 */
export const formatTraceDeviceField = (fieldValue: unknown) => String(fieldValue ?? "").trim();

/** 格式化设备字段匹配值。 */
export const formatTraceDeviceMatchField = (fieldValue: unknown) => formatTraceDeviceField(fieldValue).toLowerCase();

/** 设备字段匹配文本。 */
export interface TraceDeviceMatchFields {
  /** 终端品牌匹配值。 */
  brand: string;
  /** 终端型号匹配值。 */
  model: string;
  /** 操作系统名称匹配值。 */
  osName: string;
  /** 运行平台匹配值。 */
  platform: string;
  /** 系统版本信息匹配值。 */
  system: string;
  /** 「品牌-型号」拼接匹配值。 */
  terminalModel: string;
}

/** 创建空设备匹配字段，供无设备信息时复用同一对象结构。 */
export const createEmptyTraceDeviceMatchFields = (): TraceDeviceMatchFields => ({
  brand: "",
  model: "",
  osName: "",
  platform: "",
  system: "",
  terminalModel: "",
});

/** 获取设备字段匹配文本。 */
export const resolveTraceDeviceMatchFields = (deviceInfo: unknown): TraceDeviceMatchFields => {
  /** 解析后的设备信息。 */
  const resolvedDeviceInfo = resolveTraceDeviceInfo(deviceInfo);
  if (!resolvedDeviceInfo) {
    return createEmptyTraceDeviceMatchFields();
  }

  /** 终端品牌。 */
  const brand = formatTraceDeviceMatchField(resolvedDeviceInfo.brand);
  /** 终端型号。 */
  const model = formatTraceDeviceMatchField(resolvedDeviceInfo.model);

  return {
    brand,
    model,
    osName: formatTraceDeviceMatchField(resolvedDeviceInfo.osName),
    platform: formatTraceDeviceMatchField(resolvedDeviceInfo.platform),
    system: formatTraceDeviceMatchField(resolvedDeviceInfo.system),
    // 表格展示的终端型号匹配文本。
    terminalModel: `${brand}-${model}`,
  };
};
