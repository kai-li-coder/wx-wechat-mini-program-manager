// 机型名称自建字典（当前埋点数据的补充映射）。
// 维护方式：按「品牌|型号」增加条目，键统一大写；值为营销名，不带品牌前缀。
// 优先级高于 deviceModelBase.generated.ts，用于补充新机型或修正基础数据的偏差。
export const DEVICE_MODEL_NAME_OVERRIDES: Record<string, string> = {
  // 华为 Mate 80 系列（来源：华为商城参数页、华为官网支持页）
  "HUAWEI|VYG-AL00": "Mate 80",
  "HUAWEI|VYG-AL30": "Mate 80",
  "HUAWEI|SGT-AL00": "Mate 80 Pro",
  "HUAWEI|SGT-AL50": "Mate 80 Pro",
  "HUAWEI|SGT-AL10": "Mate 80 Pro Max",
  "HUAWEI|SGU-AL10": "Mate 80 RS 非凡大师",

  // 华为 Mate 70 系列
  "HUAWEI|CLS-AL00": "Mate 70",
  "HUAWEI|CLS-AL30": "Mate 70",
  "HUAWEI|PLR-AL00": "Mate 70 Pro",
  "HUAWEI|PLR-AL80": "Mate 70 Pro 优享版",
  "HUAWEI|PLA-AL10": "Mate 70 Pro+",
  "HUAWEI|PLU-AL10": "Mate 70 RS 非凡大师",
  "HUAWEI|SUP-AL90": "Mate 70 Air",

  // 华为 Pura 系列
  "HUAWEI|HED-AL00": "Pura 80",
  "HUAWEI|LMR-AL00": "Pura 80 Pro",
  "HUAWEI|ADY-AL00": "Pura 70",
  "HUAWEI|ADY-AL10": "Pura 70",
  "HUAWEI|HBN-AL00": "Pura 70 Pro",
  "HUAWEI|HBN-AL10": "Pura 70 Pro+",
  "HUAWEI|HBP-AL00": "Pura 70 Ultra",
  "HUAWEI|VDE-AL00": "Pura X",
  "HUAWEI|VDE-AL10": "Pura X 典藏版",

  // 华为折叠屏
  "HUAWEI|DEL-AL10": "Mate X7",
  "HUAWEI|DEL-AL20": "Mate X7 典藏版",
  "HUAWEI|GRL-AL20": "Mate XTs",
  "HUAWEI|LAP-AL10": "Mate XT 2",

  // 修正基础数据偏差：VOG-AL00 属于 P30 Pro
  "HUAWEI|VOG-AL00": "P30 Pro",
};
