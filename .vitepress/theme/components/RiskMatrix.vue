<script setup lang="ts">
import { ref, computed } from 'vue'

interface Risk { id: string; name: string; prob: 1 | 2 | 3; impact: 1 | 2 | 3; mitigation: string }

const risks: Risk[] = [
  { id: 'R1', name: 'Falla física de la Raspberry Pi', prob: 2, impact: 3, mitigation: 'Backup diario cifrado a Google Drive + PVCs persistentes en K3s. Recuperación documentada.' },
  { id: 'R2', name: 'Caída de Cloudflare Tunnel', prob: 2, impact: 3, mitigation: 'cloudflared como pod con restartPolicy: Always. Recuperación estimada < 2 minutos.' },
  { id: 'R3', name: 'Redis pierde jobs BullMQ', prob: 2, impact: 2, mitigation: 'Persistencia AOF activada; jobs críticos con removeOnComplete: false para auditoría.' },
  { id: 'R4', name: 'JWT robado en dispositivo móvil', prob: 1, impact: 3, mitigation: 'Access token TTL 15 min; refresh token revocable al instante vía DEL en Redis.' },
  { id: 'R5', name: 'Transacción a medio ejecutar', prob: 1, impact: 3, mitigation: 'Transacciones ACID en PostgreSQL; BullMQ reintenta con backoff exponencial.' },
  { id: 'R6', name: 'Cambio de proveedor de notificaciones', prob: 1, impact: 2, mitigation: 'Patrón Adapter: cambiar de proveedor = una clase nueva, cero cambios en el worker.' },
  { id: 'R7', name: 'Deuda técnica en AccountFactory', prob: 2, impact: 1, mitigation: 'Refactorización planificada: tabla de constructores reduce V(G) de 7 a 2.' },
  { id: 'R8', name: 'Escalabilidad a múltiples usuarios', prob: 1, impact: 2, mitigation: 'Monolito Modular facilita extracción futura; K3s ya soporta réplicas del backend.' },
]

const selected = ref<Risk | null>(null)

const cellRisks = computed(() => {
  const map: Record<string, Risk[]> = {}
  for (const r of risks) {
    const key = `${r.prob}-${r.impact}`
    ;(map[key] ??= []).push(r)
  }
  return map
})

function cellColor(prob: number, impact: number) {
  const r = prob * impact
  if (r >= 6) return 'rgba(239, 68, 68, 0.28)'
  if (r >= 3) return 'rgba(245, 158, 11, 0.25)'
  return 'rgba(16, 185, 129, 0.22)'
}

function levelLabel(r: Risk) {
  const v = r.prob * r.impact
  return v >= 6 ? 'Alto' : v >= 3 ? 'Medio' : 'Bajo'
}
</script>

<template>
  <div class="risk">
    <div class="risk-matrix">
      <div class="risk-axis-y">Probabilidad →</div>
      <div class="risk-grid">
        <template v-for="prob in [3, 2, 1]" :key="prob">
          <div class="risk-row-label">{{ prob }}</div>
          <div
            v-for="impact in [1, 2, 3]"
            :key="impact"
            class="risk-cell"
            :style="{ background: cellColor(prob, impact) }"
          >
            <button
              v-for="r in cellRisks[`${prob}-${impact}`] ?? []"
              :key="r.id"
              class="risk-chip"
              :class="{ active: selected?.id === r.id }"
              @click="selected = selected?.id === r.id ? null : r"
            >
              {{ r.id }}
            </button>
          </div>
        </template>
        <div />
        <div v-for="impact in [1, 2, 3]" :key="'l' + impact" class="risk-col-label">{{ impact }}</div>
      </div>
      <div class="risk-axis-x">Impacto →</div>
    </div>

    <Transition name="risk-panel">
      <div v-if="selected" class="risk-detail">
        <div class="risk-detail-head">
          <strong>{{ selected.id }} — {{ selected.name }}</strong>
          <span class="risk-level">{{ levelLabel(selected) }} · R = {{ selected.prob * selected.impact }}</span>
        </div>
        <p class="risk-mitigation"><strong>Mitigación:</strong> {{ selected.mitigation }}</p>
      </div>
    </Transition>
    <p v-if="!selected" class="risk-hint">Haz clic en un riesgo (R1–R8) para ver su mitigación</p>
  </div>
</template>

<style scoped>
.risk { margin: 28px 0; }
.risk-matrix { display: flex; flex-direction: column; align-items: center; }
.risk-grid {
  display: grid;
  grid-template-columns: 32px repeat(3, minmax(90px, 140px));
  gap: 6px;
}
.risk-cell {
  min-height: 72px;
  border-radius: 10px;
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 6px;
  transition: transform 0.2s ease;
}
.risk-cell:hover { transform: scale(1.03); }
.risk-chip {
  font-size: 12px;
  font-weight: 800;
  padding: 5px 10px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
}
.risk-chip:hover { transform: translateY(-2px); border-color: var(--vp-c-brand-1); }
.risk-chip.active { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.risk-row-label, .risk-col-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-text-3);
}
.risk-axis-y, .risk-axis-x {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  margin: 8px 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.risk-detail {
  margin-top: 18px;
  padding: 18px 22px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}
.risk-detail-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.risk-level { font-size: 13px; font-weight: 700; }
.risk-mitigation { margin: 0; font-size: 14px; line-height: 1.6; }
.risk-hint { text-align: center; font-size: 13px; color: var(--vp-c-text-3); margin-top: 14px; }
.risk-panel-enter-active, .risk-panel-leave-active { transition: all 0.3s ease; }
.risk-panel-enter-from, .risk-panel-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
