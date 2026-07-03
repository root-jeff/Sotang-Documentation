<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  unit?: string
  threshold?: number
  thresholdLabel?: string
  max?: number
  bars: { label: string; value: number; note?: string }[]
}>(), { max: 0 })

const root = ref<HTMLElement | null>(null)
const visible = ref(false)

const maxVal = props.max || Math.max(props.threshold ?? 0, ...props.bars.map(b => b.value)) * 1.15

onMounted(() => {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { visible.value = true; obs.disconnect() }
    }),
    { threshold: 0.3 }
  )
  if (root.value) obs.observe(root.value)
})

function color(v: number) {
  if (!props.threshold) return 'var(--vp-c-brand-1)'
  if (v >= props.threshold) return '#ef4444'
  if (v >= props.threshold * 0.7) return '#f59e0b'
  return '#10b981'
}
</script>

<template>
  <div ref="root" class="mbars">
    <div v-if="title" class="mbars-title">{{ title }}</div>
    <div class="mbars-chart">
      <div
        v-if="threshold"
        class="mbars-threshold"
        :style="{ left: (threshold / maxVal) * 100 + '%' }"
      >
        <span>{{ thresholdLabel ?? `umbral ${threshold}` }}</span>
      </div>
      <div v-for="(b, i) in bars" :key="b.label" class="mbars-row">
        <div class="mbars-label">{{ b.label }}</div>
        <div class="mbars-track">
          <div
            class="mbars-fill"
            :style="{
              width: visible ? (b.value / maxVal) * 100 + '%' : '0%',
              background: color(b.value),
              transitionDelay: i * 90 + 'ms',
            }"
          >
            <span class="mbars-value">{{ b.value }}{{ unit ?? '' }}</span>
          </div>
        </div>
        <div v-if="b.note" class="mbars-note">{{ b.note }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mbars { margin: 28px 0; padding: 20px; border-radius: 12px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); }
.mbars-title { font-weight: 700; font-size: 15px; margin-bottom: 16px; }
.mbars-chart { position: relative; }
.mbars-threshold {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 2px dashed #ef4444;
  z-index: 1;
  pointer-events: none;
}
.mbars-threshold span {
  position: absolute;
  top: -4px;
  left: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #ef4444;
  white-space: nowrap;
}
.mbars-row { display: grid; grid-template-columns: 190px 1fr; gap: 10px; align-items: center; margin-bottom: 10px; }
.mbars-label { font-size: 13px; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-1); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mbars-track { background: var(--vp-c-default-soft); border-radius: 6px; height: 26px; overflow: hidden; }
.mbars-fill {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  min-width: 32px;
  transition: width 0.9s cubic-bezier(0.25, 1, 0.4, 1);
}
.mbars-value { font-size: 12px; font-weight: 800; color: #fff; }
.mbars-note { grid-column: 2; font-size: 11.5px; color: var(--vp-c-text-3); margin-top: -6px; }
@media (max-width: 640px) {
  .mbars-row { grid-template-columns: 110px 1fr; }
}
</style>
