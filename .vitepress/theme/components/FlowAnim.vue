<script setup lang="ts">
// Animación SVG del flujo de un request: cliente → borde → API → DB / cola → worker.
// Los puntos viajan por las rutas en loop; la rama asíncrona va con retraso.
import { ref } from 'vue'

const details: Record<string, { title: string; text: string }> = {
  client: { title: 'Cliente — App / Bot', text: 'El usuario toca "+ Nueva transacción" en la app, o envía /gasto 25.50 comida al bot de Telegram. Ambos caminos terminan en el mismo endpoint.' },
  edge: { title: 'Cloudflare', text: 'WAF + TLS 1.3 terminan la conexión. No hay puertos abiertos en el router: todo entra por un túnel saliente hacia la Raspberry Pi.' },
  api: { title: 'API Fastify', text: 'Pipeline: rate limit → verifyJWT → schema TypeBox → handler. Calcula el desglose de IVA (monto / 1.15) antes de tocar la base de datos.' },
  db: { title: 'PostgreSQL', text: 'BEGIN → INSERT transacción + UPDATE saldo → COMMIT. Atomicidad ACID: el saldo nunca queda a medias, ni siquiera si algo falla a mitad de camino.' },
  worker: { title: 'Worker BullMQ', text: 'Toma el job de la cola (queue.add() tardó menos de 1 ms) y procesa notificaciones y presupuesto en segundo plano, sin que el usuario espere.' },
  notify: { title: 'Notificación multicanal', text: 'Según notification_preferences del usuario: push (Firebase FCM), email (Resend) y/o Telegram (gramMY), en paralelo.' },
}
const active = ref<string | null>(null)
function toggle(id: string) {
  active.value = active.value === id ? null : id
}
</script>

<template>
  <div class="flow">
    <svg viewBox="0 0 760 300" xmlns="http://www.w3.org/2000/svg" class="flow-svg">
      <defs>
        <marker id="fa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--vp-c-text-3)" />
        </marker>
      </defs>

      <!-- rutas -->
      <path id="fa-p1" d="M 120 80 H 240" class="flow-path" marker-end="url(#fa-arrow)" />
      <path id="fa-p2" d="M 360 80 H 470" class="flow-path" marker-end="url(#fa-arrow)" />
      <path id="fa-p3" d="M 590 80 H 650" class="flow-path" marker-end="url(#fa-arrow)" />
      <path id="fa-p4" d="M 530 110 V 165 H 160 V 100" class="flow-path dashed" marker-end="url(#fa-arrow)" />
      <path id="fa-p5" d="M 560 110 V 210 H 620" class="flow-path async" marker-end="url(#fa-arrow)" />
      <path id="fa-p6" d="M 680 240 V 265 H 380 V 245" class="flow-path async" marker-end="url(#fa-arrow)" />

      <!-- nodos -->
      <g class="flow-node" :class="{ active: active === 'client' }" tabindex="0" role="button" :aria-pressed="active === 'client'" @click="toggle('client')" @keydown.enter="toggle('client')">
        <rect x="30" y="55" width="90" height="50" rx="10" class="node-box client" />
        <text x="75" y="76" class="node-title">Cliente</text>
        <text x="75" y="92" class="node-sub">App / Bot</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'edge' }" tabindex="0" role="button" :aria-pressed="active === 'edge'" @click="toggle('edge')" @keydown.enter="toggle('edge')">
        <rect x="240" y="55" width="120" height="50" rx="10" class="node-box edge" />
        <text x="300" y="76" class="node-title">Cloudflare</text>
        <text x="300" y="92" class="node-sub">WAF + TLS 1.3</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'api' }" tabindex="0" role="button" :aria-pressed="active === 'api'" @click="toggle('api')" @keydown.enter="toggle('api')">
        <rect x="470" y="55" width="120" height="50" rx="10" class="node-box api" />
        <text x="530" y="76" class="node-title">API Fastify</text>
        <text x="530" y="92" class="node-sub">pipeline + ACID</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'db' }" tabindex="0" role="button" :aria-pressed="active === 'db'" @click="toggle('db')" @keydown.enter="toggle('db')">
        <rect x="650" y="55" width="90" height="50" rx="10" class="node-box db" />
        <text x="695" y="76" class="node-title">PostgreSQL</text>
        <text x="695" y="92" class="node-sub">28 tablas</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'worker' }" tabindex="0" role="button" :aria-pressed="active === 'worker'" @click="toggle('worker')" @keydown.enter="toggle('worker')">
        <rect x="620" y="185" width="120" height="55" rx="10" class="node-box worker" />
        <text x="680" y="207" class="node-title">Worker BullMQ</text>
        <text x="680" y="224" class="node-sub">notificaciones</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'notify' }" tabindex="0" role="button" :aria-pressed="active === 'notify'" @click="toggle('notify')" @keydown.enter="toggle('notify')">
        <rect x="320" y="215" width="120" height="30" rx="8" class="node-box notify" />
        <text x="380" y="234" class="node-sub strong">push / email / telegram</text>
      </g>

      <!-- etiquetas de tiempo -->
      <text x="180" y="68" class="flow-time">HTTPS</text>
      <text x="415" y="68" class="flow-time">&lt; 100 ms</text>
      <text x="345" y="158" class="flow-time green">201 Created</text>
      <text x="585" y="150" class="flow-time amber">queue.add() &lt; 1 ms</text>

      <!-- puntos animados: request síncrono -->
      <circle r="5" class="dot sync">
        <animateMotion dur="4s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1">
          <mpath href="#fa-p1" />
        </animateMotion>
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4s" begin="0.8s" repeatCount="indefinite"><mpath href="#fa-p2" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4s" begin="1.6s" repeatCount="indefinite"><mpath href="#fa-p3" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.35;0.4" dur="4s" begin="1.6s" repeatCount="indefinite" />
      </circle>
      <!-- respuesta -->
      <circle r="5" class="dot response" opacity="0">
        <animateMotion dur="4s" begin="2.2s" repeatCount="indefinite"><mpath href="#fa-p4" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.55;0.6" dur="4s" begin="2.2s" repeatCount="indefinite" />
      </circle>
      <!-- rama asíncrona -->
      <circle r="5" class="dot async-dot" opacity="0">
        <animateMotion dur="4s" begin="2.4s" repeatCount="indefinite"><mpath href="#fa-p5" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.45;0.5" dur="4s" begin="2.4s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot async-dot" opacity="0">
        <animateMotion dur="4s" begin="3.2s" repeatCount="indefinite"><mpath href="#fa-p6" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.5;0.55" dur="4s" begin="3.2s" repeatCount="indefinite" />
      </circle>
    </svg>
    <div class="flow-legend">
      <span><i class="leg sync" /> Request síncrono</span>
      <span><i class="leg response" /> Respuesta al cliente</span>
      <span><i class="leg async-dot" /> Procesamiento asíncrono (no bloquea)</span>
    </div>
    <p class="flow-hint">Toca un nodo del diagrama para ver qué hace en esta etapa.</p>
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
.flow-path {
  fill: none;
  stroke: var(--vp-c-divider);
  stroke-width: 2;
}
.flow-path.dashed { stroke-dasharray: 6 5; stroke: rgba(16, 185, 129, 0.55); }
.flow-path.async { stroke-dasharray: 6 5; stroke: rgba(245, 158, 11, 0.55); }
.node-box { stroke-width: 1.5; }
.node-box.client { fill: rgba(59,130,246,0.12); stroke: #3b82f6; }
.node-box.edge { fill: rgba(245,158,11,0.12); stroke: #f59e0b; }
.node-box.api { fill: rgba(16,185,129,0.12); stroke: #10b981; }
.node-box.db { fill: rgba(139,92,246,0.12); stroke: #8b5cf6; }
.node-box.worker { fill: rgba(245,158,11,0.1); stroke: #f59e0b; }
.node-box.notify { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); }
.node-title {
  text-anchor: middle;
  font-size: 13px;
  font-weight: 700;
  fill: var(--vp-c-text-1);
}
.node-sub { text-anchor: middle; font-size: 10px; fill: var(--vp-c-text-3); }
.node-sub.strong { font-size: 11px; fill: var(--vp-c-text-2); font-weight: 600; }
.flow-time { font-size: 10px; font-weight: 700; fill: var(--vp-c-text-3); text-anchor: middle; }
.flow-time.green { fill: #10b981; }
.flow-time.amber { fill: #f59e0b; }
.dot.sync { fill: #3b82f6; }
.dot.response { fill: #10b981; }
.dot.async-dot { fill: #f59e0b; }
.flow-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-top: 6px;
}
.leg {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}
.leg.sync { background: #3b82f6; }
.leg.response { background: #10b981; }
.leg.async-dot { background: #f59e0b; }

.flow-node { cursor: pointer; outline: none; }
.flow-node .node-box { transition: filter 0.2s ease, stroke-width 0.2s ease; }
.flow-node:hover .node-box, .flow-node:focus-visible .node-box { filter: brightness(1.12); }
.flow-node.active .node-box { stroke-width: 3; filter: drop-shadow(0 0 6px rgba(16,185,129,0.45)); }

.flow-hint { text-align: center; font-size: 12px; color: var(--vp-c-text-3); margin-top: 4px; }
.flow-detail {
  margin: 12px auto 0;
  max-width: 560px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13.5px;
  line-height: 1.6;
}
.flow-detail strong { color: var(--vp-c-brand-1); }
.flow-detail p { margin: 4px 0 0; color: var(--vp-c-text-2); }
.flow-fade-enter-active, .flow-fade-leave-active { transition: opacity 0.2s ease; }
.flow-fade-enter-from, .flow-fade-leave-to { opacity: 0; }
</style>
