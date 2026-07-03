<script setup lang="ts">
// Animación SVG de un registro rápido vía Telegram: /gasto 15 Alimentación Almuerzo.
import { ref } from 'vue'

const details: Record<string, { title: string; text: string }> = {
  user: { title: 'Jefferson (Telegram)', text: 'Escribe /gasto 15 Alimentación Almuerzo directo en el chat — sin abrir la app.' },
  tg: { title: 'Telegram Servers', text: 'Reenvía el mensaje como webhook HTTPS a través del túnel de Cloudflare hacia el bot.' },
  bot: { title: 'sotang-bot (gramMY)', text: 'Parsea el comando y llama a la API interna con X-Internal-Key — un secreto que solo conocen el bot y el backend, válido únicamente dentro de la red K3s.' },
  api: { title: 'Fastify API', text: 'Recibe POST /api/v1/transactions como cualquier otro cliente autenticado, solo que el "usuario" aquí es el propio bot.' },
  db: { title: 'PostgreSQL', text: 'INSERT transactions + UPDATE accounts.balance en una sola transacción Drizzle — atómico, igual que desde la app.' },
  confirm: { title: 'Confirmación en el chat', text: '"✅ Gasto $15.00 — Saldo Bco. Guayaquil: $1,219.56" llega de vuelta al mismo chat, en menos de un segundo.' },
  worker: { title: 'Worker BullMQ', text: 'En paralelo, sin bloquear la respuesta, se encola check_budget_alert(userId, categoryId) para revisar el presupuesto de la categoría.' },
  alert: { title: 'Alerta de presupuesto', text: 'Si Alimentación superó el 80% del presupuesto mensual, llega un segundo mensaje: "⚠️ Alimentación al 85% del presupuesto".' },
}
const active = ref<string | null>(null)
function toggle(id: string) {
  active.value = active.value === id ? null : id
}
</script>

<template>
  <div class="flow">
    <svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" class="flow-svg">
      <defs>
        <marker id="tf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--vp-c-text-3)" />
        </marker>
      </defs>

      <path id="tf-p1" d="M 110 80 H 140" class="flow-path" marker-end="url(#tf-arrow)" />
      <path id="tf-p2" d="M 270 80 H 300" class="flow-path" marker-end="url(#tf-arrow)" />
      <path id="tf-p3" d="M 410 80 H 440" class="flow-path" marker-end="url(#tf-arrow)" />
      <path id="tf-p4" d="M 560 80 H 590" class="flow-path" marker-end="url(#tf-arrow)" />
      <path id="tf-p5" d="M 640 105 V 170 H 450 V 220" class="flow-path dashed-response" marker-end="url(#tf-arrow)" />
      <path id="tf-p6" d="M 500 105 V 135 H 680 V 150" class="flow-path async" marker-end="url(#tf-arrow)" />
      <path id="tf-p7" d="M 745 205 V 235 H 600 V 258" class="flow-path async" marker-end="url(#tf-arrow)" />

      <g class="flow-node" :class="{ active: active === 'user' }" tabindex="0" role="button" @click="toggle('user')" @keydown.enter="toggle('user')">
        <rect x="20" y="55" width="90" height="50" rx="10" class="node-box client" />
        <text x="65" y="76" class="node-title">Jefferson</text>
        <text x="65" y="92" class="node-sub">Telegram</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'tg' }" tabindex="0" role="button" @click="toggle('tg')" @keydown.enter="toggle('tg')">
        <rect x="140" y="55" width="130" height="50" rx="10" class="node-box edge" />
        <text x="205" y="76" class="node-title">Telegram Servers</text>
        <text x="205" y="92" class="node-sub">webhook HTTPS</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'bot' }" tabindex="0" role="button" @click="toggle('bot')" @keydown.enter="toggle('bot')">
        <rect x="300" y="55" width="110" height="50" rx="10" class="node-box worker" />
        <text x="355" y="76" class="node-title">sotang-bot</text>
        <text x="355" y="92" class="node-sub">gramMY</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'api' }" tabindex="0" role="button" @click="toggle('api')" @keydown.enter="toggle('api')">
        <rect x="440" y="55" width="120" height="50" rx="10" class="node-box api" />
        <text x="500" y="76" class="node-title">Fastify API</text>
        <text x="500" y="92" class="node-sub">X-Internal-Key</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'db' }" tabindex="0" role="button" @click="toggle('db')" @keydown.enter="toggle('db')">
        <rect x="590" y="55" width="100" height="50" rx="10" class="node-box db" />
        <text x="640" y="76" class="node-title">PostgreSQL</text>
        <text x="640" y="92" class="node-sub">INSERT + UPDATE</text>
      </g>

      <g class="flow-node" :class="{ active: active === 'confirm' }" tabindex="0" role="button" @click="toggle('confirm')" @keydown.enter="toggle('confirm')">
        <rect x="280" y="220" width="170" height="40" rx="9" class="node-box notify" />
        <text x="365" y="245" class="node-sub strong">✅ confirmación al chat</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'worker' }" tabindex="0" role="button" @click="toggle('worker')" @keydown.enter="toggle('worker')">
        <rect x="680" y="150" width="130" height="55" rx="10" class="node-box worker-alt" />
        <text x="745" y="172" class="node-title">Worker BullMQ</text>
        <text x="745" y="189" class="node-sub">check_budget_alert</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'alert' }" tabindex="0" role="button" @click="toggle('alert')" @keydown.enter="toggle('alert')">
        <rect x="440" y="258" width="160" height="40" rx="9" class="node-box notify" />
        <text x="520" y="283" class="node-sub strong">⚠️ alerta 80% presupuesto</text>
      </g>

      <circle r="5" class="dot sync">
        <animateMotion dur="4.5s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1"><mpath href="#tf-p1" /></animateMotion>
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="0.6s" repeatCount="indefinite"><mpath href="#tf-p2" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="1.2s" repeatCount="indefinite"><mpath href="#tf-p3" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="1.2s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="1.8s" repeatCount="indefinite"><mpath href="#tf-p4" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="1.8s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot response" opacity="0">
        <animateMotion dur="4.5s" begin="2.4s" repeatCount="indefinite"><mpath href="#tf-p5" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.7;0.8" dur="4.5s" begin="2.4s" repeatCount="indefinite" />
      </circle>
      <circle r="4" class="dot async-dot" opacity="0">
        <animateMotion dur="4.5s" begin="2.4s" repeatCount="indefinite"><mpath href="#tf-p6" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.6;0.7" dur="4.5s" begin="2.4s" repeatCount="indefinite" />
      </circle>
      <circle r="4" class="dot async-dot" opacity="0">
        <animateMotion dur="4.5s" begin="3.2s" repeatCount="indefinite"><mpath href="#tf-p7" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.6;0.7" dur="4.5s" begin="3.2s" repeatCount="indefinite" />
      </circle>
    </svg>
    <div class="flow-legend">
      <span><i class="leg sync" /> Request síncrono</span>
      <span><i class="leg response" /> Confirmación al chat</span>
      <span><i class="leg async-dot" /> Chequeo de presupuesto (no bloquea)</span>
    </div>
    <p class="flow-hint">Toca un nodo del diagrama para ver qué ocurre en esta etapa.</p>
    <Transition name="flow-fade">
      <div v-if="active" class="flow-detail">
        <strong>{{ details[active].title }}</strong>
        <p>{{ details[active].text }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.flow { margin: 28px 0; }
.flow-svg { width: 100%; height: auto; }
.flow-path { fill: none; stroke: var(--vp-c-divider); stroke-width: 2; }
.flow-path.dashed-response { stroke-dasharray: 6 5; stroke: rgba(16, 185, 129, 0.55); }
.flow-path.async { stroke-dasharray: 6 5; stroke: rgba(245, 158, 11, 0.55); }
.node-box { stroke-width: 1.5; transition: filter 0.2s ease, stroke-width 0.2s ease; }
.node-box.client { fill: rgba(59,130,246,0.12); stroke: #3b82f6; }
.node-box.edge { fill: rgba(245,158,11,0.12); stroke: #f59e0b; }
.node-box.worker { fill: rgba(139,92,246,0.12); stroke: #8b5cf6; }
.node-box.worker-alt { fill: rgba(245,158,11,0.1); stroke: #f59e0b; }
.node-box.api { fill: rgba(16,185,129,0.12); stroke: #10b981; }
.node-box.db { fill: rgba(139,92,246,0.12); stroke: #8b5cf6; }
.node-box.notify { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); }
.node-title { text-anchor: middle; font-size: 13px; font-weight: 700; fill: var(--vp-c-text-1); }
.node-sub { text-anchor: middle; font-size: 10px; fill: var(--vp-c-text-3); }
.node-sub.strong { font-size: 11px; fill: var(--vp-c-text-2); font-weight: 600; }
.dot.sync { fill: #3b82f6; }
.dot.response { fill: #10b981; }
.dot.async-dot { fill: #f59e0b; }
.flow-legend {
  display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;
  font-size: 12px; color: var(--vp-c-text-2); margin-top: 6px;
}
.leg { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.leg.sync { background: #3b82f6; }
.leg.response { background: #10b981; }
.leg.async-dot { background: #f59e0b; }

.flow-node { cursor: pointer; outline: none; }
.flow-node:hover .node-box, .flow-node:focus-visible .node-box { filter: brightness(1.12); }
.flow-node.active .node-box { stroke-width: 3; filter: drop-shadow(0 0 6px rgba(16,185,129,0.45)); }

.flow-hint { text-align: center; font-size: 12px; color: var(--vp-c-text-3); margin-top: 4px; }
.flow-detail {
  margin: 12px auto 0; max-width: 560px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 10px; padding: 10px 16px;
  font-size: 13.5px; line-height: 1.6;
}
.flow-detail strong { color: var(--vp-c-brand-1); }
.flow-detail p { margin: 4px 0 0; color: var(--vp-c-text-2); }
.flow-fade-enter-active, .flow-fade-leave-active { transition: opacity 0.2s ease; }
.flow-fade-enter-from, .flow-fade-leave-to { opacity: 0; }
</style>
