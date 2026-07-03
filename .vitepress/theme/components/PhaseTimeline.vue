<script setup lang="ts">
defineProps<{
  phases: { name: string; period: string; deliverable: string; done?: boolean; current?: boolean }[]
}>()
</script>

<template>
  <div class="ptl">
    <div v-for="(p, i) in phases" :key="p.name" class="ptl-item" :style="{ '--i': i }">
      <div class="ptl-marker" :class="{ done: p.done, current: p.current }">
        <span v-if="p.done">✓</span>
        <span v-else>{{ i + 1 }}</span>
      </div>
      <div v-if="i < phases.length - 1" class="ptl-line" :class="{ done: p.done }" />
      <div class="ptl-content" :class="{ current: p.current }">
        <div class="ptl-period">{{ p.period }}</div>
        <div class="ptl-name">{{ p.name }} <span v-if="p.current" class="ptl-badge">actual</span></div>
        <div class="ptl-deliverable">{{ p.deliverable }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ptl { margin: 28px 0; }
.ptl-item {
  position: relative;
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 16px;
  padding-bottom: 26px;
  animation: ptl-in 0.5s ease both;
  animation-delay: calc(var(--i) * 120ms);
}
@keyframes ptl-in {
  from { opacity: 0; transform: translateX(-14px); }
  to { opacity: 1; transform: translateX(0); }
}
.ptl-marker {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  z-index: 1;
}
.ptl-marker.done { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-1); color: #fff; }
.ptl-marker.current {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  animation: marker-pulse 2s ease-in-out infinite;
}
@keyframes marker-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
.ptl-line {
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: 0;
  width: 2px;
  background: var(--vp-c-divider);
}
.ptl-line.done { background: var(--vp-c-brand-1); }
.ptl-content {
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s ease;
}
.ptl-content:hover { border-color: var(--vp-c-brand-1); }
.ptl-content.current { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.ptl-period { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vp-c-text-3); }
.ptl-name { font-weight: 800; font-size: 15px; margin: 2px 0 4px; }
.ptl-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--vp-c-brand-1);
  color: #fff;
  vertical-align: middle;
}
.ptl-deliverable { font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; }
</style>
