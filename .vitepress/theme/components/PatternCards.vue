<script setup lang="ts">
import { ref } from 'vue'

interface Pattern {
  name: string
  category: string
  icon: string
  problem: string
  solution: string
  location: string
}

defineProps<{ patterns: Pattern[] }>()

const flipped = ref<Set<string>>(new Set())

function toggle(name: string) {
  const next = new Set(flipped.value)
  next.has(name) ? next.delete(name) : next.add(name)
  flipped.value = next
}

const catColors: Record<string, string> = {
  Creacional: '#f59e0b',
  Estructural: '#3b82f6',
  Comportamiento: '#10b981',
  Arquitectónico: '#8b5cf6',
}
</script>

<template>
  <div class="pat-grid">
    <div
      v-for="p in patterns"
      :key="p.name"
      class="pat-card"
      :class="{ flipped: flipped.has(p.name) }"
      @click="toggle(p.name)"
    >
      <div class="pat-inner">
        <div class="pat-face pat-front">
          <div class="pat-icon">{{ p.icon }}</div>
          <span class="pat-cat" :style="{ background: (catColors[p.category] ?? '#64748b') + '22', color: catColors[p.category] ?? '#64748b' }">{{ p.category }}</span>
          <div class="pat-name">{{ p.name }}</div>
          <div class="pat-problem">{{ p.problem }}</div>
          <div class="pat-flip-hint">Clic para ver la solución ↻</div>
        </div>
        <div class="pat-face pat-back">
          <div class="pat-back-label">Solución</div>
          <div class="pat-solution">{{ p.solution }}</div>
          <code class="pat-location">{{ p.location }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin: 28px 0;
}
.pat-card {
  perspective: 1200px;
  cursor: pointer;
  min-height: 250px;
}
.pat-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 250px;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}
.pat-card.flipped .pat-inner { transform: rotateY(180deg); }
.pat-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.pat-card:hover .pat-face { border-color: var(--vp-c-brand-1); }
.pat-back { transform: rotateY(180deg); justify-content: center; }
.pat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 800;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  margin-bottom: 10px;
}
.pat-cat {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  margin-bottom: 8px;
}
.pat-name { font-weight: 800; font-size: 17px; margin-bottom: 8px; color: var(--vp-c-text-1); }
.pat-problem { font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2); flex: 1; }
.pat-flip-hint { font-size: 11px; color: var(--vp-c-text-3); margin-top: 12px; }
.pat-back-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--vp-c-brand-1);
  margin-bottom: 10px;
}
.pat-solution { font-size: 13.5px; line-height: 1.6; color: var(--vp-c-text-1); }
.pat-location {
  margin-top: 14px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--vp-c-default-soft);
  align-self: flex-start;
}
</style>
