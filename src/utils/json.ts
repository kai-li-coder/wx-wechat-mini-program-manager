// JSON 展示工具：统一 JSON 文本格式化与空值判断，保证复制内容与面板展示内容一致。

/** 空数据占位文本，供 JSON 面板展示复用。 */
export const EMPTY_JSON_TEXT = "-";

/** 判断值是否为空（null / undefined / 空字符串）。 */
export const isJsonValueEmpty = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

/** 将任意值格式化为 2 空格缩进的 JSON 文本，无法序列化时回退为字符串。 */
export const formatJsonText = (value: unknown): string => {
  if (isJsonValueEmpty(value)) {
    return EMPTY_JSON_TEXT;
  }

  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

/** 生成可直接复制的 JSON 文本；空数据返回空字符串，供复制按钮判定禁用态。 */
export const formatJsonTextForCopy = (value: unknown): string =>
  isJsonValueEmpty(value) ? "" : formatJsonText(value);
