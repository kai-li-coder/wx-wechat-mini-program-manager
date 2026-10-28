<!-- 埋点总览指标卡片组件：主指标 + 分类指标，结果构成条与占比条 -->
<template>
  <!-- 指标卡片列表 -->
  <section aria-label="埋点指标汇总" class="metric-summary">
    <!-- 主指标卡：事件总数与结果构成 -->
    <article class="metric-card metric-card--lead">
      <header class="metric-card__head">
        <span class="metric-card__label">事件总数</span>
      </header>

      <p class="metric-card__value-row">
        <strong class="metric-card__value">{{ formatCount(summary.eventCount) }}</strong>
        <span class="metric-card__unit">条</span>
      </p>

      <!-- 结果构成条：成功 / 警告 / 失败占比 -->
      <div :aria-label="ratioAriaLabel" class="metric-card__ratio" role="img">
        <span
          v-for="ratioItem in resultRatios"
          :key="ratioItem.key"
          :class="['metric-card__ratio-segment', `metric-card__ratio-segment--${ratioItem.tone}`]"
          :style="{ width: `${ratioItem.percent}%` }"
        />
      </div>

      <div class="metric-card__legend">
        <span
          v-for="ratioItem in resultRatios"
          :key="ratioItem.key"
          class="metric-card__legend-item"
        >
          <i :class="['metric-card__legend-dot', `metric-card__legend-dot--${ratioItem.tone}`]" />
          {{ ratioItem.label }} {{ formatPercent(ratioItem.percent) }}
        </span>
      </div>
    </article>

    <!-- 分类指标卡 -->
    <article
      v-for="metricCard in metricCards"
      :key="metricCard.key"
      :class="['metric-card', `metric-card--${metricCard.tone}`]"
    >
      <header class="metric-card__head">
        <span class="metric-card__label">{{ metricCard.label }}</span>
      </header>

      <p class="metric-card__value-row">
        <strong class="metric-card__value">{{ formatCount(metricCard.value) }}</strong>
        <span class="metric-card__unit">{{ metricCard.unit }}</span>
      </p>

      <!-- 底部：占比条与说明 -->
      <div class="metric-card__footer">
        <div
          v-if="metricCard.percent !== null"
          :aria-label="`${metricCard.label}占比 ${formatPercent(metricCard.percent)}`"
          class="metric-card__track"
          role="img"
        >
          <span
            class="metric-card__fill"
            :style="{ width: `${Math.min(metricCard.percent, 100)}%` }"
          />
        </div>

        <p class="metric-card__note">
          {{
            metricCard.percent === null
              ? metricCard.note
              : `占比 ${formatPercent(metricCard.percent)}`
          }}
        </p>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { TraceDashboardSummary } from "@/api/trace";

/** 埋点总览摘要展示数据。 */
interface MetricSummaryDisplayData extends TraceDashboardSummary {
  /** 成功事件数。 */
  successCount: number;
  /** 警告事件数。 */
  warningCount: number;
  /** 失败事件数。 */
  failCount: number;
}

/** 指标卡色调。 */
type MetricTone = "neutral" | "success" | "warning" | "danger";

/** 分类指标卡数据。 */
interface MetricCardItem {
  /** 卡片唯一标识。 */
  key: string;
  /** 指标名称。 */
  label: string;
  /** 指标数值。 */
  value: number;
  /** 数值单位。 */
  unit: string;
  /** 数值色调。 */
  tone: MetricTone;
  /** 占全部事件的比例，null 表示不适用。 */
  percent: number | null;
  /** 无占比时的说明文案。 */
  note: string;
}

const { summary } = defineProps<{
  /** 埋点聚合摘要。 */
  summary: MetricSummaryDisplayData;
}>();

/** 千分位数字格式化器。 */
const countFormatter = new Intl.NumberFormat("zh-CN");

/** 格式化指标数值。 */
const formatCount = (countValue: number) => countFormatter.format(countValue);

/** 格式化百分比。 */
const formatPercent = (percentValue: number) => `${percentValue.toFixed(1)}%`;

/** 计算某类事件占全部事件的比例。 */
const toPercent = (countValue: number) =>
  summary.eventCount > 0 ? (countValue / summary.eventCount) * 100 : 0;

/** 结果构成数据：用于主卡的堆叠条与图例。 */
const resultRatios = computed(() => [
  {
    key: "success",
    label: "成功",
    tone: "success" as const,
    percent: toPercent(summary.successCount),
  },
  {
    key: "warning",
    label: "警告",
    tone: "warning" as const,
    percent: toPercent(summary.warningCount),
  },
  { key: "danger", label: "失败", tone: "danger" as const, percent: toPercent(summary.failCount) },
]);

/** 主卡构成条的读屏文案。 */
const ratioAriaLabel = computed(() =>
  resultRatios.value
    .map((ratioItem) => `${ratioItem.label} ${formatPercent(ratioItem.percent)}`)
    .join("，"),
);

/** 分类指标卡列表。 */
const metricCards = computed<MetricCardItem[]>(() => [
  {
    key: "success",
    label: "成功数",
    value: summary.successCount,
    unit: "条",
    tone: "success",
    percent: toPercent(summary.successCount),
    note: "占全部事件",
  },
  {
    key: "warning",
    label: "警告数",
    value: summary.warningCount,
    unit: "条",
    tone: "warning",
    percent: toPercent(summary.warningCount),
    note: "占全部事件",
  },
  {
    key: "fail",
    label: "错误数",
    value: summary.failCount,
    unit: "条",
    tone: "danger",
    percent: toPercent(summary.failCount),
    note: "占全部事件",
  },
  {
    key: "flow",
    label: "涉及链路",
    value: summary.flowCount,
    unit: "条",
    tone: "neutral",
    percent: null,
    note: "链路维度",
  },
  {
    key: "candidate",
    label: "涉及候选人",
    value: summary.candidateCount,
    unit: "人",
    tone: "neutral",
    percent: null,
    note: "候选人维度",
  },
]);
</script>

<style scoped lang="scss">
.metric-summary {
  display: grid;
  grid-template-columns: 1.45fr repeat(5, minmax(0, 1fr));
  gap: $space-4;
  margin: $space-5 0;
}

.metric-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 140px;
  flex-direction: column;
  padding: $space-5;
  overflow: hidden;
  border: 1px solid #eff4f5;
  border-radius: $radius-md;
  background: $color-surface;
  box-shadow: $shadow-panel;
}

.metric-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.metric-card__label {
  overflow: hidden;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 10px;
}

.metric-card__value {
  color: $color-text-primary;
  font-family: $font-sans;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.metric-card__unit {
  color: $color-text-muted;
  font-size: $font-size-xs;
}

/* 底部区域统一底对齐，保证六张卡片视觉基线一致 */
.metric-card__footer {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-top: auto;
  padding-top: $space-3;
}

/* 占比轨道 */
.metric-card__track {
  height: 4px;
  overflow: hidden;
  border-radius: $radius-pill;
  background: #edf3f4;
}

.metric-card__fill {
  display: block;
  height: 100%;
  border-radius: $radius-pill;
  background: $color-text-secondary;
  transition: width $dur-slow $ease-out;
}

.metric-card__note {
  color: $color-text-muted;
  font-size: $font-size-xs;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.metric-card--success .metric-card__value {
  color: $color-success;
}

.metric-card--success .metric-card__fill {
  background: #22c55e;
}

.metric-card--warning .metric-card__value {
  color: $color-warning;
}

.metric-card--warning .metric-card__fill {
  background: #f59e0b;
}

.metric-card--danger .metric-card__value {
  color: $color-danger;
}

.metric-card--danger .metric-card__fill {
  background: #ef4444;
}

/* 主指标卡：浅青渐变高亮，呼应参考图的青蓝主色 */
.metric-card--lead {
  border-color: $color-accent-tint;
  background: linear-gradient(135deg, #e2f4f5 0%, #ffffff 62%);
}

.metric-card--lead .metric-card__label {
  color: $color-accent-strong;
}

.metric-card--lead .metric-card__value {
  color: $color-accent-strong;
  font-size: 34px;
}

.metric-card__ratio {
  display: flex;
  height: 6px;
  margin-top: auto;
  gap: 3px;
  overflow: hidden;
  border-radius: $radius-pill;
  background: #edf3f4;
}

.metric-card__ratio-segment {
  display: block;
  height: 100%;
  transition: width $dur-slow $ease-out;
}

.metric-card__ratio-segment--success {
  background: #22c55e;
}

.metric-card__ratio-segment--warning {
  background: #f59e0b;
}

.metric-card__ratio-segment--danger {
  background: #ef4444;
}

.metric-card__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin-top: 10px;
  color: $color-text-secondary;
  font-size: $font-size-xs;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
}

.metric-card__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.metric-card__legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.metric-card__legend-dot--success {
  background: #22c55e;
}

.metric-card__legend-dot--warning {
  background: #f59e0b;
}

.metric-card__legend-dot--danger {
  background: #ef4444;
}

@media (max-width: 1440px) {
  .metric-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .metric-card--lead {
    grid-column: span 3;
  }

  .metric-card--lead .metric-card__ratio {
    margin-top: $space-5;
  }
}

@include screen-sm {
  .metric-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-3;
    margin: $space-4 0;
  }

  .metric-card {
    min-height: 124px;
    padding: $space-4;
  }

  .metric-card--lead {
    grid-column: span 2;
  }

  .metric-card__value {
    font-size: 24px;
  }

  .metric-card--lead .metric-card__value {
    font-size: 28px;
  }

  .metric-card__note {
    font-size: $font-size-2xs;
  }
}
</style>
