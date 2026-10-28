// 剪贴板工具：统一复制入口，兼容非安全上下文（如内网 http 部署）的降级方案。

/** 使用 execCommand 方案写入剪贴板，作为 Clipboard API 不可用时的回退。 */
const copyByExecCommand = (text: string): boolean => {
  /** 临时文本域：仅用于承载待复制文本，不参与页面布局。 */
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  /** 复制前的用户选区，复制结束后需要还原。 */
  const selection = document.getSelection();
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);

  // 还原原有选区，避免复制动作打断用户已选中的文本
  if (selection && previousRange) {
    selection.removeAllRanges();
    selection.addRange(previousRange);
  }

  return copied;
};

/**
 * 复制文本到剪贴板。
 * 优先使用异步 Clipboard API（要求安全上下文），失败或不可用时回退到 execCommand。
 * 返回是否复制成功，供调用方决定是否提示用户。
 */
export const copyText = async (text: string): Promise<boolean> => {
  if (!text) {
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 权限被拒或浏览器策略限制时继续走回退方案
    }
  }

  return copyByExecCommand(text);
};
