<script setup lang="ts">
import { ref } from 'vue'

interface Step { actor: 'user' | 'system'; text: string }

const props = defineProps<{
  title: string
  precondition?: string
  postcondition?: string
  steps: Step[]
}>()

const current = ref(0)

function next() { if (current.value < props.steps.length - 1) current.value++ }
function prev() { if (current.value > 0) current.value-- }
</script>

<template>
  <div class="ucs">
    <div class="ucs-head">
      <span class="ucs-title">{{ title }}</span>
      <span class="ucs-progress">Paso {{ current + 1 }} / {{ steps.length }}</span>
    </div>
    <div v-if="precondition" class="ucs-cond"><strong>Precondición:</strong> {{ precondition }}</div>

    <div class="ucs-track">
      <div class="ucs-bar" :style="{ width: ((current + 1) / steps.length) * 100 + '%' }" />
    </div>

    <div class="ucs-steps">
      <TransitionGroup name="ucs-step">
        <div
          v-for="(s, i) in steps.slice(0, current + 1)"
          :key="i"
          class="ucs-step"
          :class="s.actor"
        >
          <span class="ucs-actor">{{ s.actor === 'user' ? 'Usuario' : 'Sistema' }}</span>
          <span class="ucs-text">{{ s.text }}</span>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="current === steps.length - 1 && postcondition" class="ucs-cond ucs-post">
      <strong>Postcondición:</strong> {{ postcondition }}
    </div>

    <div class="ucs-controls">
      <button class="ucs-btn" :disabled="current === 0" @click="prev">← Anterior</button>
      <button class="ucs-btn primary" :disabled="current === steps.length - 1" @click="next">Siguiente →</button>
    </div>
  </div>
</template>

<style scoped>
.ucs { margin: 28px 0; padding: 22px; border-radius: 14px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); }
.ucs-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.ucs-title { font-weight: 800; font-size: 16px; }
.ucs-progress { font-size: 12px; font-weight: 700; color: var(--vp-c-brand-1); }
.ucs-cond { font-size: 13px; color: var(--vp-c-text-2); margin-bottom: 12px; }
.ucs-post { margin-top: 14px; color: var(--vp-c-text-1); animation: ucs-in 0.4s ease; }
.ucs-track { height: 5px; border-radius: 999px; background: var(--vp-c-default-soft); overflow: hidden; margin-bottom: 18px; }
.ucs-bar { height: 100%; background: linear-gradient(90deg, var(--vp-c-brand-1), #3b82f6); transition: width 0.4s ease; border-radius: 999px; }
.ucs-steps { display: flex; flex-direction: column; gap: 8px; }
.ucs-step {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 82%;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.ucs-step.user { align-self: flex-start; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); }
.ucs-step.system { align-self: flex-end; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); }
.ucs-actor { font-size: 11px; font-weight: 700; color: var(--vp-c-text-3); }
.ucs-controls { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
.ucs-btn {
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
}
.ucs-btn.primary { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.ucs-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ucs-btn:not(:disabled):hover { transform: translateY(-1px); }
.ucs-step-enter-active { transition: all 0.4s ease; }
.ucs-step-enter-from { opacity: 0; transform: translateY(10px); }
@keyframes ucs-in { from { opacity: 0; } to { opacity: 1; } }
</style>
