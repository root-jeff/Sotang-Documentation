<script setup lang="ts">
import { ref } from 'vue'

const layers = [
  { n: 1, name: 'Red', desc: 'Cloudflare Tunnel: sin puertos abiertos en el router. WAF filtra SQLi, XSS y DDoS antes de llegar a la Raspberry Pi.' },
  { n: 2, name: 'Transporte', desc: 'TLS 1.3 gestionado por Cloudflare, extremo a extremo. Ningún dato viaja en claro.' },
  { n: 3, name: 'Autenticación', desc: 'JWT: access token de 15 minutos + refresh token de 7 días revocable en Redis. bcrypt para contraseñas. Rate limit de 5 intentos / 15 min.' },
  { n: 4, name: 'Autorización', desc: 'Cada endpoint verifica userId === recurso.userId. Se responde 404 (no 403) para no revelar la existencia de recursos ajenos.' },
  { n: 5, name: 'Validación', desc: 'Schemas TypeBox validan body, params y query antes de llegar a la lógica de negocio. Fail-fast en la capa HTTP.' },
  { n: 6, name: 'Datos', desc: 'Transacciones ACID en PostgreSQL: el estado nunca queda a medias. Backups cifrados fuera del dispositivo.' },
]

const open = ref<number | null>(null)
</script>

<template>
  <div class="sec">
    <div class="sec-attacker">Atacante</div>
    <div
      v-for="(l, i) in layers"
      :key="l.n"
      class="sec-layer"
      :class="{ open: open === l.n }"
      :style="{ '--i': i }"
      @click="open = open === l.n ? null : l.n"
    >
      <div class="sec-layer-head">
        <span class="sec-num">Capa {{ l.n }}</span>
        <span class="sec-name">{{ l.name }}</span>
        <span class="sec-chevron">{{ open === l.n ? '▲' : '▼' }}</span>
      </div>
      <div v-if="open === l.n" class="sec-desc">{{ l.desc }}</div>
    </div>
    <div class="sec-core">Datos financieros del usuario</div>
  </div>
</template>

<style scoped>
.sec { max-width: 560px; margin: 28px auto; display: flex; flex-direction: column; gap: 8px; }
.sec-attacker, .sec-core {
  text-align: center;
  font-weight: 800;
  font-size: 14px;
  padding: 10px;
}
.sec-attacker { color: #ef4444; }
.sec-core {
  color: var(--vp-c-brand-1);
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 12px;
  background: var(--vp-c-brand-soft);
  animation: core-glow 3s ease-in-out infinite;
}
@keyframes core-glow {
  0%, 100% { box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
  50% { box-shadow: 0 0 24px rgba(16, 185, 129, 0.35); }
}
.sec-layer {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  padding: 12px 18px;
  transition: all 0.25s ease;
  animation: layer-in 0.5s ease both;
  animation-delay: calc(var(--i) * 90ms);
}
@keyframes layer-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.sec-layer:hover { border-color: var(--vp-c-brand-1); transform: scale(1.02); }
.sec-layer.open { border-color: var(--vp-c-brand-1); }
.sec-layer-head { display: flex; align-items: center; gap: 10px; }
.sec-num { font-size: 11px; font-weight: 700; color: var(--vp-c-text-3); text-transform: uppercase; letter-spacing: 1px; min-width: 52px; }
.sec-name { font-weight: 700; font-size: 14.5px; flex: 1; }
.sec-chevron { font-size: 10px; color: var(--vp-c-text-3); }
.sec-desc {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  animation: layer-in 0.3s ease;
}
</style>
