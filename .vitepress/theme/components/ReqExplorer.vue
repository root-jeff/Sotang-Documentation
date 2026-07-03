<script setup lang="ts">
import { ref, computed } from 'vue'

interface Req { id: string; module: string; text: string; priority: 'Alta' | 'Media' | 'Baja' }

const props = defineProps<{ requirements: Req[] }>()

const activeModule = ref('Todos')
const search = ref('')

const modules = computed(() => ['Todos', ...new Set(props.requirements.map(r => r.module))])

const filtered = computed(() =>
  props.requirements.filter(r =>
    (activeModule.value === 'Todos' || r.module === activeModule.value) &&
    (search.value === '' || (r.id + ' ' + r.text).toLowerCase().includes(search.value.toLowerCase()))
  )
)

const prioColor: Record<string, string> = { Alta: '#ef4444', Media: '#f59e0b', Baja: '#10b981' }
</script>

<template>
  <div class="reqx">
    <div class="reqx-toolbar">
      <div class="reqx-filters">
        <button
          v-for="m in modules"
          :key="m"
          class="reqx-filter"
          :class="{ active: activeModule === m }"
          @click="activeModule = m"
        >
          {{ m }}
        </button>
      </div>
      <input v-model="search" class="reqx-search" placeholder="Buscar requerimiento..." />
    </div>
    <div class="reqx-count">{{ filtered.length }} requerimiento(s)</div>
    <TransitionGroup name="reqx-item" tag="div" class="reqx-list">
      <div v-for="r in filtered" :key="r.id" class="reqx-item">
        <span class="reqx-id">{{ r.id }}</span>
        <span class="reqx-text">{{ r.text }}</span>
        <span class="reqx-prio" :style="{ color: prioColor[r.priority], borderColor: prioColor[r.priority] }">{{ r.priority }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.reqx { margin: 28px 0; }
.reqx-toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between; }
.reqx-filters { display: flex; gap: 6px; flex-wrap: wrap; }
.reqx-filter {
  font-size: 12.5px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}
.reqx-filter:hover { border-color: var(--vp-c-brand-1); }
.reqx-filter.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.reqx-search {
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
  min-width: 220px;
}
.reqx-search:focus { outline: none; border-color: var(--vp-c-brand-1); }
.reqx-count { font-size: 12px; color: var(--vp-c-text-3); margin: 10px 0; }
.reqx-list { display: flex; flex-direction: column; gap: 6px; }
.reqx-item {
  display: grid;
  grid-template-columns: 64px 1fr 60px;
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.reqx-item:hover { border-color: var(--vp-c-brand-1); transform: translateX(4px); }
.reqx-id { font-family: var(--vp-font-family-mono); font-size: 12.5px; font-weight: 800; color: var(--vp-c-brand-1); }
.reqx-text { font-size: 13.5px; line-height: 1.5; }
.reqx-prio {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid;
}
.reqx-item-enter-active, .reqx-item-leave-active { transition: all 0.25s ease; }
.reqx-item-enter-from, .reqx-item-leave-to { opacity: 0; transform: translateY(8px); }
.reqx-item-move { transition: transform 0.25s ease; }
</style>
