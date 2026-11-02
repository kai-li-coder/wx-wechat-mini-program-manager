// 埋点查询选项单元测试。
import { describe, expect, it } from "vitest";

import { useTraceOptions } from "@/modules/trace/composables/useTraceOptions";
import { traceEventCodes, traceStageCodes } from "@/utils/trace";

describe("useTraceOptions", () => {
  it("builds event code and stage options from all known trace codes", () => {
    /** 埋点查询选项。 */
    const { eventCodeOptions, stageOptions } = useTraceOptions();

    expect(eventCodeOptions.map((eventCodeOption) => eventCodeOption.value)).toEqual(traceEventCodes);
    expect(stageOptions.map((stageOption) => stageOption.value)).toEqual(traceStageCodes);
  });

  it("builds dashboard date range shortcuts", () => {
    /** 埋点查询选项。 */
    const { dashboardDateRangeShortcuts } = useTraceOptions();

    expect(dashboardDateRangeShortcuts.map((shortcut) => shortcut.text)).toEqual([
      "本年",
      "本季度",
      "本月",
      "本周",
      "本日",
    ]);
  });

  it("builds error log quick filter options", () => {
    /** 埋点查询选项。 */
    const { errorBrandFilterOptions, errorBrandQuickFilterOptions, errorDeviceQuickFilterOptions } = useTraceOptions();

    expect(errorDeviceQuickFilterOptions.map((deviceQuickOption) => deviceQuickOption.label)).toEqual([
      "全部机型",
      "iOS设备",
      "Android设备",
    ]);
    expect(errorBrandQuickFilterOptions.map((brandQuickOption) => brandQuickOption.label)).toEqual([
      "全部品牌",
      "iPhone",
      "非iPhone",
    ]);
    // 品牌下拉固定三档，顺序即展示顺序。
    expect(errorBrandFilterOptions).toEqual([
      { label: "iPhone", value: "iphone" },
      { label: "Android", value: "android" },
      { label: "其他", value: "other" },
    ]);
  });
});
