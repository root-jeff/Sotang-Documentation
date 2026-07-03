<script setup lang="ts">
import { ref } from 'vue'

interface Adr {
  id: string
  title: string
  context: string
  decision: string
  pros: string[]
  cons: string[]
  mitigation?: string
}

defineProps<{ adrs: Adr[] }>()

const open = ref<string | null>(null)
function toggle(id: string) {
  open.value = open.value === id ? null : id
}
</script>

<template>
  <div class="adr">
    <div
      v-for="(a, i) in adrs"
      :key="a.id"
      class="adr-item"
      :class="{ open: open === a.id }"
      :style="{ '--i': i }"
    >
      <button class="adr-head" @click="toggle(a.id)">
        <span class="adr-id">{{ a.id }}</span>
        <span class="adr-title">{{ a.title }}</span>
        <span class="adr-status">Aprobado</span>
        <span class="adr-chevron">{{ open === a.id ? '−' : '+' }}</span>
      </button>
      <div v-if="open === a.id" class="adr-body">
        <p class="adr-context"><strong>Contexto.</strong> {{ a.context }}</p>
        <p class="adr-decision"><strong>Decisión.</strong> {{ a.decision }}</p>
        <div class="adr-cols">
          <div class="adr-col pros">
            <div class="adr-col-label">A favor</div>
            <ul><li v-for="p in a.pros" :key="p">{{ p }}</li></ul>
          </div>
          <div class="adr-col cons">
            <div class="adr-col-label">En contra</div>
            <ul><li v-for="c in a.cons" :key="c">{{ c }}</li></ul>
          </div>
        </div>
        <p v-if="a.mitigation" class="adr-mitigation"><strong>Mitigación.</strong> {{ a.mitigation }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adr { margin: 28px 0; display: flex; flex-direction: column; gap: 10px; }
.adr-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  transition: border-color 0.2s ease;
  animation: adr-in 0.5s ease both;
  animation-delay: calc(var(--i) * 90ms);
}
@keyframes adr-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.adr-item:hover, .adr-item.open { border-color: var(--vp-c-brand-1); }
.adr-head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}
.adr-id {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
.adr-title { flex: 1; font-weight: 700; font-size: 14.5px; color: var(--vp-c-text-1); }
.adr-status {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #10b981;
  border: 1px solid #10b98155;
  padding: 2px 8px;
  border-radius: 999px;
}
.adr-chevron { font-size: 18px; font-weight: 700; color: var(--vp-c-text-3); width: 20px; text-align: center; }
.adr-body { padding: 0 18px 18px; animation: adr-in 0.3s ease; }
.adr-context, .adr-decision { font-size: 13.5px; line-height: 1.6; margin: 0 0 10px; color: var(--vp-c-text-1); }
.adr-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
.adr-col { border-radius: 10px; padding: 12px 14px; }
.adr-col.pros { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); }
.adr-col.cons { background: rgba(239, 68, 68, 0.07); border: 1px solid rgba(239, 68, 68, 0.22); }
.adr-col-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.pros .adr-col-label { color: #10b981; }
.cons .adr-col-label { color: #ef4444; }
.adr-col ul { margin: 0; padding-left: 18px; }
.adr-col li { font-size: 13px; line-height: 1.55; margin: 4px 0; color: var(--vp-c-text-1); }
.adr-mitigation { font-size: 13px; margin: 0; color: var(--vp-c-text-2); }
@media (max-width: 560px) {
  .adr-cols { grid-template-columns: 1fr; }
}
</style>
