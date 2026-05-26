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
});
