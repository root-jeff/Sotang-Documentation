<script setup lang="ts">
import { ref, computed } from 'vue'

type Mode = 'incluido' | 'adicional'
const mode = ref<Mode>('incluido')
const monto = ref(57.5)

const presets: Record<Mode, { monto: number; hint: string }> = {
  incluido: { monto: 57.5, hint: 'Factura de restaurante: el precio ya trae el IVA adentro' },
  adicional: { monto: 59, hint: 'Juego de Steam: el precio es la base y la tarjeta te cobra el IVA encima' },
}

function setMode(m: Mode) {
  mode.value = m
  monto.value = presets[m].monto
}

const neto = computed(() => (mode.value === 'incluido' ? monto.value / 1.15 : monto.value))
const iva = computed(() => (mode.value === 'incluido' ? monto.value - neto.value : monto.value * 0.15))
const total = computed(() => (mode.value === 'incluido' ? monto.value : monto.value * 1.15))
const netoPct = computed(() => (neto.value / (total.value || 1)) * 100)

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="ivac">
    <div class="ivac-head">
      <span class="ivac-title">Los dos modos de IVA — pruébalos</span>
      <span class="ivac-formula">{{ mode === 'incluido' ? 'neto = monto / 1.15' : 'total = base × 1.15' }}</span>
    </div>

    <div class="ivac-modes">
      <button class="ivac-mode" :class="{ active: mode === 'incluido' }" @click="setMode('incluido')">
        <span class="ivac-mode-name">El precio incluye IVA</span>
        <span class="ivac-mode-sub">desglosar hacia adentro</span>
      </button>
      <button class="ivac-mode" :class="{ active: mode === 'adicional' }" @click="setMode('adicional')">
        <span class="ivac-mode-name">Aplica IVA</span>
        <span class="ivac-mode-sub">el precio es la base, el IVA se suma encima</span>
      </button>
    </div>
    <p class="ivac-hint">{{ presets[mode].hint }}</p>

    <div class="ivac-input-row">
      <label class="ivac-label" for="ivac-monto">{{ mode === 'incluido' ? 'Monto de la factura' : 'Precio mostrado (base)' }}</label>
      <div class="ivac-field">
        <span class="ivac-currency">$</span>
        <input
          id="ivac-monto"
          v-model.number="monto"
          type="number"
          min="0"
          step="0.5"
          class="ivac-input"
        />
      </div>
      <input v-model.number="monto" type="range" min="1" max="500" step="0.5" class="ivac-slider" />
    </div>

    <div class="ivac-bar">
      <div class="ivac-seg neto" :style="{ width: netoPct + '%' }">
        <span class="ivac-seg-label">{{ mode === 'incluido' ? 'Gasto real' : 'Precio base' }}</span>
        <span class="ivac-seg-value">${{ fmt(neto) }}</span>
      </div>
      <div class="ivac-seg iva" :style="{ width: (100 - netoPct) + '%' }">
        <span class="ivac-seg-label">IVA 15%</span>
        <span class="ivac-seg-value">${{ fmt(iva) }}</span>
      </div>
    </div>

    <div class="ivac-total">
      <span class="ivac-total-label">{{ mode === 'incluido' ? 'Cargado a la cuenta' : 'Cargo real a la tarjeta' }}</span>
      <span class="ivac-total-value" :class="{ warn: mode === 'adicional' }">${{ fmt(total) }}</span>
    </div>

    <p class="ivac-note">
      <template v-if="mode === 'incluido'">
        De los <strong>${{ fmt(monto) }}</strong> facturados, solo
        <strong class="ivac-green">${{ fmt(neto) }}</strong> es consumo real —
        <strong class="ivac-amber">${{ fmt(iva) }}</strong> es impuesto que ya venía dentro del precio.
      </template>
      <template v-else>
        El precio decía <strong>${{ fmt(monto) }}</strong>, pero la tarjeta recibe un cargo de
        <strong class="ivac-red">${{ fmt(total) }}</strong> — el IVA de servicios digitales se cobra
        <em>encima</em>. Sin este modo, registrarías ${{ fmt(monto) }} y subestimarías tu gasto en
        <strong class="ivac-amber">${{ fmt(iva) }}</strong>. El cupo se descuenta por el total real.
      </template>
    </p>
  </div>
</template>

<style scoped>
.ivac {
  margin: 28px 0;
  padding: 24px 28px;
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}
.ivac-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.ivac-title { font-weight: 800; font-size: 16px; }
.ivac-formula {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 3px 10px;
  border-radius: 6px;
}
.ivac-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ivac-mode {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
  text-align: left;
  transition: all 0.22s ease;
  font-family: inherit;
}
.ivac-mode:hover { border-color: var(--vp-c-brand-1); transform: translateY(-2px); }
.ivac-mode.active { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.ivac-mode-name { font-weight: 800; font-size: 14px; color: var(--vp-c-text-1); }
.ivac-mode-sub { font-size: 11.5px; color: var(--vp-c-text-3); }
.ivac-hint { margin: 10px 0 16px; font-size: 12.5px; color: var(--vp-c-text-3); font-style: italic; }
.ivac-input-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.ivac-label { font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); }
.ivac-field {
  display: flex;
  align-items: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  padding: 0 12px;
}
.ivac-field:focus-within { border-color: var(--vp-c-brand-1); }
.ivac-currency { font-weight: 700; color: var(--vp-c-text-3); }
.ivac-input {
  width: 90px;
  padding: 9px 6px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ivac-input:focus { outline: none; }
.ivac-slider { flex: 1; min-width: 160px; accent-color: var(--vp-c-brand-1); }
.ivac-bar {
  display: flex;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}
.ivac-seg {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 14px;
  min-width: 88px;
  transition: width 0.45s cubic-bezier(0.25, 1, 0.4, 1);
  white-space: nowrap;
}
.ivac-seg.neto { background: linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.12)); }
.ivac-seg.iva { background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.15)); }
.ivac-seg-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vp-c-text-3); }
.ivac-seg-value { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
.neto .ivac-seg-value { color: #10b981; }
.iva .ivac-seg-value { color: #f59e0b; }
.ivac-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 14px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  border: 1px dashed var(--vp-c-divider);
}
.ivac-total-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vp-c-text-3); }
.ivac-total-value {
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-brand-1);
  transition: color 0.3s ease;
}
.ivac-total-value.warn { color: #ef4444; }
.ivac-note { margin: 14px 0 0; font-size: 13.5px; line-height: 1.6; color: var(--vp-c-text-2); }
.ivac-green { color: #10b981; }
.ivac-amber { color: #f59e0b; }
.ivac-red { color: #ef4444; }
@media (max-width: 520px) {
  .ivac-modes { grid-template-columns: 1fr; }
}
</style>
