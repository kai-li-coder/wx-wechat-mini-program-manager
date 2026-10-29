// 图表尺寸自适应：统一处理 ResizeObserver 节流与首帧冗余回调跳过。
import { useResizeObserver, useThrottleFn } from "@vueuse/core";
import type { Ref } from "vue";

/** 可 resize 的图表实例最小契约。 */
interface ResizableChartInstance {
  /** 重新计算尺寸并重绘。 */
  resize: () => void;
}

/**
 * 绑定图表容器尺寸变化。
 * - 拖拽窗口时按 100ms 节流，避免每个 resize 事件都触发 ECharts 全量布局与重绘；
 * - 以「最近一次绘制尺寸」去重，跳过 ResizeObserver 注册后必然派发的首帧回调。
 */
export const useChartResize = (
  target: Readonly<Ref<HTMLElement | null | undefined>>,
  getChartInstance: () => ResizableChartInstance | null,
) => {
  /** 最近一次参与绘制的容器宽高。 */
  let lastWidth = 0;
  let lastHeight = 0;

  /** 记录当前容器尺寸；在 init 与每次 setOption 之后调用，使紧随的首帧回调被判为无变化。 */
  const markRendered = () => {
    /** 图表容器元素。 */
    const containerElement = target.value;
    if (!containerElement) {
      return;
    }
    lastWidth = containerElement.clientWidth;
    lastHeight = containerElement.clientHeight;
  };

  /** 仅在容器尺寸确实变化时才重绘。 */
  const resizeIfNeeded = () => {
    /** 图表容器元素。 */
    const containerElement = target.value;
    if (!containerElement) {
      return;
    }

    /** 当前容器宽度。 */
    const currentWidth = containerElement.clientWidth;
    /** 当前容器高度。 */
    const currentHeight = containerElement.clientHeight;
    if (currentWidth === lastWidth && currentHeight === lastHeight) {
      return;
    }

    lastWidth = currentWidth;
    lastHeight = currentHeight;
    getChartInstance()?.resize();
  };

  /** 节流后的尺寸处理：保留 trailing，确保拖拽结束后的最终尺寸一定会生效。 */
  const handleResize = useThrottleFn(resizeIfNeeded, 100);

  useResizeObserver(target, handleResize);

  return { markRendered };
};
