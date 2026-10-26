// 机型名称解析工具：把终端型号代码转换为可读的机型名称。
import { DEVICE_MODEL_BASE_MAP } from "@/constants/deviceModelBase.generated";
import { DEVICE_MODEL_NAME_OVERRIDES } from "@/constants/deviceModelNames";

/** 机型名称来源：自建字典 / 基础映射表 / 未命中。 */
export type DeviceModelNameSource = "dictionary" | "base" | "none";

/** 机型解析结果。 */
export interface DeviceModelResolution {
  /** 原始品牌展示值。 */
  brand: string;
  /** 归一化后的型号代码。 */
  model: string;
  /** 解析得到的营销名，未命中时为空串。 */
  marketingName: string;
  /** 表格展示文本。 */
  displayName: string;
  /** 名称来源。 */
  source: DeviceModelNameSource;
}

/** 品牌别名，统一映射到字典键使用的品牌标识。 */
const DEVICE_BRAND_ALIAS_MAP = new Map<string, string>([
  ["华为", "HUAWEI"],
  ["荣耀", "HONOR"],
  ["小米", "XIAOMI"],
  ["红米", "REDMI"],
  ["苹果", "APPLE"],
  ["三星", "SAMSUNG"],
  ["欧珀", "OPPO"],
  ["维沃", "VIVO"],
  ["真我", "REALME"],
  ["一加", "ONEPLUS"],
  ["魅族", "MEIZU"],
  ["努比亚", "NUBIA"],
  ["中兴", "ZTE"],
]);

/** 品牌在营销名中可能出现的写法，用于避免展示时重复拼接品牌。 */
const DEVICE_BRAND_NAME_TOKENS: Record<string, string[]> = {
  HUAWEI: ["huawei", "honor"],
  HONOR: ["honor", "huawei"],
  XIAOMI: ["xiaomi", "redmi", "poco"],
  REDMI: ["redmi", "xiaomi"],
  OPPO: ["oppo", "realme", "oneplus"],
  VIVO: ["vivo", "iqoo"],
  APPLE: ["apple", "iphone", "ipad"],
  SAMSUNG: ["samsung"],
  ONEPLUS: ["oneplus"],
  REALME: ["realme"],
};

/** 归一化型号代码：去空白并转大写，兼容后端返回的大小写与空格差异。 */
export const normalizeDeviceModelCode = (model: unknown) => String(model ?? "").trim().replace(/\s+/g, "").toUpperCase();

/** 归一化品牌：去空白、转大写，并把中文品牌名映射为英文标识。 */
export const normalizeDeviceBrand = (brand: unknown) => {
  /** 去掉空白后的原始品牌。 */
  const rawBrand = String(brand ?? "").trim().replace(/\s+/g, "");
  if (!rawBrand) {
    return "";
  }

  /** 大写品牌标识。 */
  const upperBrand = rawBrand.toUpperCase();

  return DEVICE_BRAND_ALIAS_MAP.get(rawBrand) ?? DEVICE_BRAND_ALIAS_MAP.get(upperBrand) ?? upperBrand;
};

/** 判断营销名中是否已包含品牌，避免出现「XIAOMI Redmi K40」这类重复前缀。 */
const hasBrandToken = (marketingName: string, brand: string) => {
  /** 小写营销名。 */
  const lowerName = marketingName.toLowerCase();
  /** 品牌对应写法集合。 */
  const brandTokens = DEVICE_BRAND_NAME_TOKENS[brand] ?? [];

  return lowerName.includes(brand.toLowerCase()) || brandTokens.some((token) => lowerName.includes(token));
};

/** 型号代码到自建字典营销名的索引，用于品牌缺失时按型号兜底解析。 */
const DEVICE_MODEL_NAME_BY_CODE = new Map<string, string>();

for (const [dictionaryKey, dictionaryName] of Object.entries(DEVICE_MODEL_NAME_OVERRIDES)) {
  /** 字典键中的型号部分。 */
  const dictionaryModel = dictionaryKey.split("|")[1];
  if (dictionaryModel && !DEVICE_MODEL_NAME_BY_CODE.has(dictionaryModel)) {
    DEVICE_MODEL_NAME_BY_CODE.set(dictionaryModel, dictionaryName);
  }
}

/** 判断品牌是否包含中文，中文品牌无需转大写展示。 */
const hasChineseBrand = (brand: string) => /[\u4e00-\u9fa5]/.test(brand);

/** 解析机型名称，优先命中自建字典，其次命中基础映射表。 */
export const resolveDeviceModelName = (brand: unknown, model: unknown): DeviceModelResolution => {
  /** 原始品牌展示值。 */
  const rawBrand = String(brand ?? "").trim();
  /** 原始型号展示值。 */
  const rawModel = String(model ?? "").trim();
  /** 归一化品牌标识。 */
  const normalizedBrand = normalizeDeviceBrand(rawBrand);
  /** 归一化型号代码。 */
  const normalizedModel = normalizeDeviceModelCode(rawModel);

  if (!normalizedModel) {
    return {
      brand: rawBrand,
      model: "",
      marketingName: "",
      displayName: rawBrand,
      source: "none",
    };
  }

  /** 自建字典中的营销名，品牌缺失时按型号兜底。 */
  const dictionaryName =
    DEVICE_MODEL_NAME_OVERRIDES[`${normalizedBrand}|${normalizedModel}`] ?? DEVICE_MODEL_NAME_BY_CODE.get(normalizedModel);
  /** 基础映射表中的营销名。 */
  const baseName = DEVICE_MODEL_BASE_MAP[normalizedModel];
  /** 最终命中的营销名。 */
  const marketingName = dictionaryName || baseName || "";

  if (!marketingName) {
    // 未命中时保持原有「品牌-型号」展示，确保排查信息不丢失。
    return {
      brand: rawBrand,
      model: normalizedModel,
      marketingName: "",
      displayName: rawBrand ? `${rawBrand}-${rawModel}` : rawModel,
      source: "none",
    };
  }

  /** 展示用品牌，英文品牌统一大写，中文品牌保留原值。 */
  const displayBrand = normalizedBrand && !hasChineseBrand(rawBrand) ? normalizedBrand : rawBrand;
  /** 展示用品牌前缀，营销名已含品牌时不再重复拼接。 */
  const brandPrefix = rawBrand && !hasBrandToken(marketingName, normalizedBrand) ? `${displayBrand} ` : "";

  return {
    brand: rawBrand,
    model: normalizedModel,
    marketingName,
    displayName: `${brandPrefix}${marketingName}（${rawModel}）`,
    source: dictionaryName ? "dictionary" : "base",
  };
};

/** 格式化机型展示文本，空型号返回空串由调用方决定占位符。 */
export const formatDeviceModelDisplay = (brand: unknown, model: unknown) => resolveDeviceModelName(brand, model).displayName;
