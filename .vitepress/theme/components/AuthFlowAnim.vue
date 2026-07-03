<script setup lang="ts">
// Animación SVG de una petición autenticada real vs. un intento malicioso.
// La rama verde llega hasta la respuesta; la rama roja se corta antes de tocar datos.
import { ref } from 'vue'

const details: Record<string, { title: string; text: string }> = {
  client: { title: 'Cliente legítimo', text: 'Mobile App o webhook de Telegram envían el request con Authorization: Bearer {accessToken} (o credenciales, si es login).' },
  edge: { title: 'Cloudflare', text: 'WAF + TLS 1.3 + protección DDoS de serie. Filtra tráfico malicioso antes de que exista siquiera un puerto abierto en el router.' },
  traefik: { title: 'Traefik v3', text: 'Dentro del cluster K3s: fuerza HTTPS y enruta el request al pod correcto (API o Bot).' },
  fastify: { title: 'Fastify — pipeline', text: 'Rate limit (10 req/min en /auth/login) → verifyJWT o bcrypt.compare en login → validación TypeBox. Todo esto corre antes de tocar la lógica de negocio.' },
  redis: { title: 'Redis — sesiones', text: 'Los refresh tokens viven aquí. Un DEL revoca una sesión al instante desde cualquier dispositivo, sin esperar los 7 días de expiración natural.' },
  db: { title: 'PostgreSQL', text: 'Guarda el hash bcrypt (cost=12) — nunca la contraseña. Cada query filtra por userId === resource.userId antes de devolver nada.' },
  response: { title: 'Respuesta', text: '200 con los datos si todo es válido. Si el recurso no es tuyo: 404, no 403 — un 403 confirmaría que el recurso existe.' },
  attacker: { title: 'Intento malicioso', text: 'Fuerza bruta de login o intento de leer un recurso ajeno. Se corta en rate limit (5 intentos / 15 min) o en la verificación de userId — nunca llega a los datos.' },
}
const active = ref<string | null>(null)
function toggle(id: string) {
  active.value = active.value === id ? null : id
}
</script>

<template>
  <div class="flow">
    <svg viewBox="0 0 820 340" xmlns="http://www.w3.org/2000/svg" class="flow-svg">
      <defs>
        <marker id="af-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--vp-c-text-3)" />
        </marker>
        <marker id="af-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
      </defs>

      <!-- rutas: camino legítimo -->
      <path id="af-p1" d="M 110 135 H 150" class="flow-path" marker-end="url(#af-arrow)" />
      <path id="af-p2" d="M 260 135 H 290" class="flow-path" marker-end="url(#af-arrow)" />
      <path id="af-p3" d="M 380 135 H 410" class="flow-path" marker-end="url(#af-arrow)" />
      <path id="af-p4" d="M 540 120 C 570 90, 590 80, 610 65" class="flow-path dashed" marker-end="url(#af-arrow)" />
      <path id="af-p5" d="M 540 150 C 570 185, 590 195, 610 205" class="flow-path dashed" marker-end="url(#af-arrow)" />
      <path id="af-p6" d="M 540 135 H 700" class="flow-path response-path" marker-end="url(#af-arrow)" />

      <!-- ruta: intento malicioso, se corta antes de Fastify -->
      <path id="af-atk" d="M 110 250 H 300" class="flow-path attack" marker-end="url(#af-arrow-red)" />

      <!-- nodos: camino legítimo -->
      <g class="flow-node" :class="{ active: active === 'client' }" tabindex="0" role="button" @click="toggle('client')" @keydown.enter="toggle('client')">
        <rect x="20" y="110" width="90" height="50" rx="10" class="node-box client" />
        <text x="65" y="131" class="node-title">Cliente</text>
        <text x="65" y="147" class="node-sub">Mobile / Telegram</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'edge' }" tabindex="0" role="button" @click="toggle('edge')" @keydown.enter="toggle('edge')">
        <rect x="150" y="110" width="110" height="50" rx="10" class="node-box edge" />
        <text x="205" y="131" class="node-title">Cloudflare</text>
        <text x="205" y="147" class="node-sub">WAF + TLS 1.3</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'traefik' }" tabindex="0" role="button" @click="toggle('traefik')" @keydown.enter="toggle('traefik')">
        <rect x="290" y="110" width="90" height="50" rx="10" class="node-box traefik" />
        <text x="335" y="131" class="node-title">Traefik</text>
        <text x="335" y="147" class="node-sub">HTTPS interno</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'fastify' }" tabindex="0" role="button" @click="toggle('fastify')" @keydown.enter="toggle('fastify')">
        <rect x="410" y="95" width="130" height="80" rx="10" class="node-box api" />
        <text x="475" y="120" class="node-title">Fastify</text>
        <text x="475" y="136" class="node-sub">rate limit</text>
        <text x="475" y="150" class="node-sub">JWT / bcrypt</text>
        <text x="475" y="164" class="node-sub">TypeBox</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'redis' }" tabindex="0" role="button" @click="toggle('redis')" @keydown.enter="toggle('redis')">
        <rect x="610" y="40" width="110" height="50" rx="10" class="node-box worker" />
        <text x="665" y="61" class="node-title">Redis</text>
        <text x="665" y="77" class="node-sub">refresh tokens</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'db' }" tabindex="0" role="button" @click="toggle('db')" @keydown.enter="toggle('db')">
        <rect x="610" y="180" width="110" height="50" rx="10" class="node-box db" />
        <text x="665" y="201" class="node-title">PostgreSQL</text>
        <text x="665" y="217" class="node-sub">hash + userId</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'response' }" tabindex="0" role="button" @click="toggle('response')" @keydown.enter="toggle('response')">
        <rect x="700" y="110" width="100" height="50" rx="10" class="node-box notify-solid" />
        <text x="750" y="131" class="node-title">200 / 404</text>
        <text x="750" y="147" class="node-sub">nunca 403</text>
      </g>

      <!-- atacante -->
      <g class="flow-node attacker-node" :class="{ active: active === 'attacker' }" tabindex="0" role="button" @click="toggle('attacker')" @keydown.enter="toggle('attacker')">
        <rect x="20" y="225" width="90" height="50" rx="10" class="node-box attacker" />
        <text x="65" y="246" class="node-title">Atacante</text>
        <text x="65" y="262" class="node-sub">fuerza bruta / IDOR</text>
      </g>
      <text x="290" y="290" class="block-label">✕ bloqueado — rate limit / 404</text>

      <!-- puntos animados: camino legítimo -->
      <circle r="5" class="dot sync">
        <animateMotion dur="4.5s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1"><mpath href="#af-p1" /></animateMotion>
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="0.7s" repeatCount="indefinite"><mpath href="#af-p2" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="0.7s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="1.4s" repeatCount="indefinite"><mpath href="#af-p3" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="1.4s" repeatCount="indefinite" />
      </circle>
      <circle r="4" class="dot async-dot" opacity="0">
        <animateMotion dur="4.5s" begin="2.1s" repeatCount="indefinite"><mpath href="#af-p4" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.7;0.8" dur="4.5s" begin="2.1s" repeatCount="indefinite" />
      </circle>
      <circle r="4" class="dot async-dot" opacity="0">
        <animateMotion dur="4.5s" begin="2.1s" repeatCount="indefinite"><mpath href="#af-p5" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.7;0.8" dur="4.5s" begin="2.1s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot response" opacity="0">
        <animateMotion dur="4.5s" begin="2.9s" repeatCount="indefinite"><mpath href="#af-p6" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.85;0.9" dur="4.5s" begin="2.9s" repeatCount="indefinite" />
      </circle>

      <!-- punto animado: atacante, se desvanece antes de llegar -->
      <circle r="5" class="dot attack-dot">
        <animateMotion dur="3s" repeatCount="indefinite" keyPoints="0;0.72" keyTimes="0;1"><mpath href="#af-atk" /></animateMotion>
        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.75;1" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
    <div class="flow-legend">
      <span><i class="leg sync" /> Petición autenticada</span>
      <span><i class="leg response" /> Respuesta</span>
      <span><i class="leg attack-dot" /> Intento bloqueado</span>
    </div>
    <p class="flow-hint">Toca un nodo del diagrama para ver qué verifica en esta etapa.</p>
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
.flow-path.dashed { stroke-dasharray: 6 5; stroke: rgba(16, 185, 129, 0.55); }
.flow-path.response-path { stroke: rgba(16, 185, 129, 0.55); }
.flow-path.attack { stroke-dasharray: 6 5; stroke: rgba(239, 68, 68, 0.55); }
.node-box { stroke-width: 1.5; transition: filter 0.2s ease, stroke-width 0.2s ease; }
.node-box.client { fill: rgba(59,130,246,0.12); stroke: #3b82f6; }
.node-box.edge { fill: rgba(245,158,11,0.12); stroke: #f59e0b; }
.node-box.traefik { fill: rgba(245,158,11,0.1); stroke: #f59e0b; }
.node-box.api { fill: rgba(16,185,129,0.12); stroke: #10b981; }
.node-box.worker { fill: rgba(139,92,246,0.12); stroke: #8b5cf6; }
.node-box.db { fill: rgba(139,92,246,0.12); stroke: #8b5cf6; }
.node-box.notify-solid { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); }
.node-box.attacker { fill: rgba(239,68,68,0.12); stroke: #ef4444; }
.node-title { text-anchor: middle; font-size: 13px; font-weight: 700; fill: var(--vp-c-text-1); }
.node-sub { text-anchor: middle; font-size: 10px; fill: var(--vp-c-text-3); }
.block-label { text-anchor: middle; font-size: 11px; font-weight: 700; fill: #ef4444; }
.dot.sync { fill: #3b82f6; }
.dot.response { fill: #10b981; }
.dot.async-dot { fill: #8b5cf6; }
.dot.attack-dot { fill: #ef4444; }
.flow-legend {
  display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;
  font-size: 12px; color: var(--vp-c-text-2); margin-top: 6px;
}
.leg { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.leg.sync { background: #3b82f6; }
.leg.response { background: #10b981; }
.leg.attack-dot { background: #ef4444; }

.flow-node { cursor: pointer; outline: none; }
.flow-node:hover .node-box, .flow-node:focus-visible .node-box { filter: brightness(1.12); }
.flow-node.active .node-box { stroke-width: 3; filter: drop-shadow(0 0 6px rgba(16,185,129,0.45)); }
.flow-node.attacker-node.active .node-box { filter: drop-shadow(0 0 6px rgba(239,68,68,0.5)); }

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
