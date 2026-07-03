<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  stats: { value: number; suffix?: string; prefix?: string; label: string }[]
}>()

const root = ref<HTMLElement | null>(null)
const displayed = ref(props.stats.map(() => 0))
let started = false

function animate() {
  if (started) return
  started = true
  const duration = 1400
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    displayed.value = props.stats.map(s => Math.round(s.value * eased))
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => e.isIntersecting && animate()),
    { threshold: 0.3 }
  )
  if (root.value) obs.observe(root.value)
})
</script>

<template>
  <div ref="root" class="stat-grid">
    <div v-for="(s, i) in stats" :key="s.label" class="stat-card">
      <div class="stat-value">{{ s.prefix ?? '' }}{{ displayed[i] }}{{ s.suffix ?? '' }}</div>
      <div class="stat-label">{{ s.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin: 28px 0;
}
.stat-card {
  text-align: center;
  padding: 24px 12px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--vp-c-brand-1);
}
.stat-value {
  font-size: 34px;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.stat-label {
  margin-top: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
</style>
