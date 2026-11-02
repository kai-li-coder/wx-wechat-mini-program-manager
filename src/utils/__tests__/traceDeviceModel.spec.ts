// 终端型号展示与筛选工具单元测试。
import { describe, expect, it } from "vitest";

import type { TraceEventItem } from "@/api/trace";
import {
  collectTraceTerminalModels,
  filterEventItemsByTerminalModels,
  formatTraceTerminalModel,
} from "@/utils/traceDeviceModel";

/** 构造只包含设备信息的事件记录，其余字段不参与本模块逻辑。 */
const createEventItem = (deviceInfo: unknown): TraceEventItem => ({ deviceInfo }) as TraceEventItem;

/** 未命中机型字典时的展示值，用于验证兜底格式。 */
const unknownDeviceInfo = { brand: "测试品牌", model: "X1" };
/** 命中机型字典的苹果设备。 */
const appleDeviceInfo = { brand: "Apple", model: "iPhone15,2" };
/** 无设备信息的记录，表格展示为占位符。 */
const emptyDeviceInfo = {};

describe("collectTraceTerminalModels", () => {
  it("uses the table display value, dedupes identical models and keeps a stable order", () => {
    /** 测试事件列表：包含重复型号与无设备信息记录。 */
    const eventItems = [
      createEventItem(unknownDeviceInfo),
      createEventItem(appleDeviceInfo),
      createEventItem(appleDeviceInfo),
      createEventItem(emptyDeviceInfo),
    ];

    /** 机型选项。 */
    const terminalModelOptions = collectTraceTerminalModels(eventItems);

    expect(terminalModelOptions).toHaveLength(3);
    expect(terminalModelOptions).toContain("测试品牌-X1");
    expect(terminalModelOptions).toContain("-");
    expect(terminalModelOptions).toContain(formatTraceTerminalModel(appleDeviceInfo));
    // 选项按中文排序输出，保证下拉顺序稳定。
    expect(terminalModelOptions).toEqual(
      [...terminalModelOptions].sort((leftModel, rightModel) => leftModel.localeCompare(rightModel, "zh-Hans-CN")),
    );
  });

  it("returns an empty option list for an empty page", () => {
    expect(collectTraceTerminalModels([])).toEqual([]);
  });
});

describe("filterEventItemsByTerminalModels", () => {
  /** 测试事件列表。 */
  const eventItems = [
    createEventItem(unknownDeviceInfo),
    createEventItem(appleDeviceInfo),
    createEventItem(appleDeviceInfo),
    createEventItem(emptyDeviceInfo),
  ];

  it("keeps every record when nothing is selected", () => {
    // 空选择等价于「全部机型」，直接复用原数组避免多余的复制开销。
    expect(filterEventItemsByTerminalModels(eventItems, [])).toBe(eventItems);
  });

  it("keeps only the records whose terminal model is selected", () => {
    /** 筛选结果。 */
    const filteredEventItems = filterEventItemsByTerminalModels(eventItems, ["测试品牌-X1"]);

    expect(filteredEventItems).toHaveLength(1);
    expect(filteredEventItems[0].deviceInfo).toBe(unknownDeviceInfo);
  });

  it("matches the display value exactly instead of by prefix", () => {
    // 终端型号展示值包含原始型号代码，前缀匹配会把相邻型号一起带出。
    expect(filterEventItemsByTerminalModels(eventItems, ["测试品牌-X"])).toEqual([]);
  });

  it("shows all records again when every option is selected", () => {
    /** 全选条件。 */
    const allTerminalModels = collectTraceTerminalModels(eventItems);

    expect(filterEventItemsByTerminalModels(eventItems, allTerminalModels)).toHaveLength(eventItems.length);
  });
});
