<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  tracks: {
    name: string
    progress: number
    status: string
    detail: string
    color?: string
  }[]
}>()

const root = ref<HTMLElement | null>(null)
const visible = ref(false)
const displayed = ref(props.tracks.map(() => 0))

onMounted(() => {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        visible.value = true
        const start = performance.now()
        const dur = 1300
        const tick = (now: number) => {
          const t = Math.min((now - start) / dur, 1)
          const eased = 1 - Math.pow(1 - t, 3)
          displayed.value = props.tracks.map(tr => Math.round(tr.progress * eased))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }),
    { threshold: 0.25 }
  )
  if (root.value) obs.observe(root.value)
})
</script>

<template>
  <div ref="root" class="tb">
    <div v-for="(t, i) in tracks" :key="t.name" class="tb-track" :style="{ '--i': i, '--c': t.color ?? 'var(--vp-c-brand-1)' }" :class="{ visible }">
      <div class="tb-head">
        <span class="tb-name">{{ t.name }}</span>
        <span class="tb-status">{{ t.status }}</span>
        <span class="tb-pct">{{ displayed[i] }}%</span>
      </div>
      <div class="tb-bar">
        <div class="tb-fill" :style="{ width: (visible ? t.progress : 0) + '%' }" />
      </div>
      <div class="tb-detail">{{ t.detail }}</div>
    </div>
  </div>
</template>

<style scoped>
.tb { margin: 28px 0; display: flex; flex-direction: column; gap: 18px; }
.tb-track {
  padding: 18px 22px;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.55s ease, transform 0.55s ease, border-color 0.25s ease;
  transition-delay: calc(var(--i) * 110ms);
}
.tb-track.visible { opacity: 1; transform: translateY(0); }
.tb-track:hover { border-color: var(--c); }
.tb-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
.tb-name { font-weight: 800; font-size: 15px; }
.tb-status {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 12%, transparent);
  padding: 2px 10px;
  border-radius: 999px;
}
.tb-pct {
  margin-left: auto;
  font-size: 20px;
  font-weight: 800;
  color: var(--c);
  font-variant-numeric: tabular-nums;
}
.tb-bar { height: 10px; border-radius: 999px; background: var(--vp-c-default-soft); overflow: hidden; }
.tb-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--c) 70%, transparent), var(--c));
  transition: width 1.3s cubic-bezier(0.25, 1, 0.4, 1);
  transition-delay: calc(var(--i) * 110ms);
  position: relative;
  overflow: hidden;
}
.tb-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  animation: tb-shine 2.4s ease-in-out infinite;
}
@keyframes tb-shine {
  0% { transform: translateX(-100%); }
  60%, 100% { transform: translateX(100%); }
}
.tb-detail { margin-top: 10px; font-size: 13px; line-height: 1.55; color: var(--vp-c-text-2); }
</style>
