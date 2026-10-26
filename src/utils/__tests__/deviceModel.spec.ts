// 机型名称解析工具单元测试。
import { describe, expect, it } from "vitest";

import { normalizeDeviceBrand, normalizeDeviceModelCode, resolveDeviceModelName } from "@/utils/deviceModel";

describe("normalizeDeviceModelCode", () => {
  it("去空白并转大写", () => {
    expect(normalizeDeviceModelCode(" vyg-al00 ")).toBe("VYG-AL00");
    expect(normalizeDeviceModelCode("VOG AL10")).toBe("VOGAL10");
    expect(normalizeDeviceModelCode(undefined)).toBe("");
  });
});

describe("normalizeDeviceBrand", () => {
  it("统一品牌写法并映射中文品牌", () => {
    expect(normalizeDeviceBrand("Huawei")).toBe("HUAWEI");
    expect(normalizeDeviceBrand("华为")).toBe("HUAWEI");
    expect(normalizeDeviceBrand("小米")).toBe("XIAOMI");
    expect(normalizeDeviceBrand("")).toBe("");
  });
});

describe("resolveDeviceModelName", () => {
  it("命中自建字典时返回营销名", () => {
    const result = resolveDeviceModelName("HUAWEI", "VYG-AL00");

    expect(result.marketingName).toBe("Mate 80");
    expect(result.displayName).toBe("HUAWEI Mate 80（VYG-AL00）");
    expect(result.source).toBe("dictionary");
  });

  it("自建字典优先于基础映射表", () => {
    const result = resolveDeviceModelName("HUAWEI", "VOG-AL00");

    expect(result.marketingName).toBe("P30 Pro");
    expect(result.source).toBe("dictionary");
  });

  it("未命中字典时回落到基础映射表", () => {
    const result = resolveDeviceModelName("HUAWEI", "VOG-AL10");

    expect(result.marketingName).toBe("P30 Pro");
    expect(result.displayName).toBe("HUAWEI P30 Pro（VOG-AL10）");
    expect(result.source).toBe("base");
  });

  it("营销名已含子品牌时不再拼接品牌", () => {
    const result = resolveDeviceModelName("XIAOMI", "M2012K11C");

    expect(result.marketingName).toBe("Redmi K40 Pro");
    expect(result.displayName).toBe("Redmi K40 Pro（M2012K11C）");
  });

  it("型号大小写与中文品牌不影响命中", () => {
    expect(resolveDeviceModelName("huawei", "vyg-al00").displayName).toBe("HUAWEI Mate 80（vyg-al00）");
    expect(resolveDeviceModelName("华为", "VYG-AL00").displayName).toBe("华为 Mate 80（VYG-AL00）");
  });

  it("品牌为空时只展示营销名", () => {
    expect(resolveDeviceModelName("", "VYG-AL00").displayName).toBe("Mate 80（VYG-AL00）");
  });

  it("未收录型号保持原有品牌与型号拼接格式", () => {
    const result = resolveDeviceModelName("HUAWEI", "ABC-001");

    expect(result.marketingName).toBe("");
    expect(result.displayName).toBe("HUAWEI-ABC-001");
    expect(result.source).toBe("none");
  });

  it("空型号按品牌或空串展示", () => {
    expect(resolveDeviceModelName("HUAWEI", "").displayName).toBe("HUAWEI");
    expect(resolveDeviceModelName("", "").displayName).toBe("");
  });
});
