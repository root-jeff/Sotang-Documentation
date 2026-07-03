<script setup lang="ts">
defineProps<{
  title: string
  metric: string
  before: string | number
  after: string | number
  improvement: string
  beforeDesc?: string
  afterDesc?: string
}>()
</script>

<template>
  <div class="ba">
    <div class="ba-title">{{ title }}</div>
    <div class="ba-compare">
      <div class="ba-side before">
        <div class="ba-label">Antes</div>
        <div class="ba-value">{{ before }}</div>
        <div v-if="beforeDesc" class="ba-desc">{{ beforeDesc }}</div>
      </div>
      <div class="ba-arrow">
        <span class="ba-improvement">{{ improvement }}</span>
        <span class="ba-arrow-icon">→</span>
      </div>
      <div class="ba-side after">
        <div class="ba-label">Después</div>
        <div class="ba-value">{{ after }}</div>
        <div v-if="afterDesc" class="ba-desc">{{ afterDesc }}</div>
      </div>
    </div>
    <div class="ba-metric">{{ metric }}</div>
  </div>
</template>

<style scoped>
.ba {
  margin: 20px 0;
  padding: 20px 24px;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}
.ba-title { font-weight: 800; font-size: 15px; margin-bottom: 16px; }
.ba-compare {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}
.ba-side { text-align: center; padding: 16px 12px; border-radius: 12px; }
.ba-side.before { background: rgba(239, 68, 68, 0.09); border: 1px solid rgba(239, 68, 68, 0.3); }
.ba-side.after { background: rgba(16, 185, 129, 0.09); border: 1px solid rgba(16, 185, 129, 0.35); }
.ba-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--vp-c-text-3); }
.ba-value { font-size: 30px; font-weight: 800; margin: 4px 0; }
.before .ba-value { color: #ef4444; }
.after .ba-value { color: #10b981; }
.ba-desc { font-size: 12px; color: var(--vp-c-text-2); line-height: 1.45; }
.ba-arrow { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ba-arrow-icon { font-size: 22px; color: var(--vp-c-brand-1); animation: arrow-slide 1.6s ease-in-out infinite; }
@keyframes arrow-slide {
  0%, 100% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
}
.ba-improvement {
  font-size: 12px;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 2px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.ba-metric { text-align: center; margin-top: 12px; font-size: 12.5px; color: var(--vp-c-text-3); }
@media (max-width: 560px) {
  .ba-compare { grid-template-columns: 1fr; }
  .ba-arrow-icon { transform: rotate(90deg); }
}
</style>
