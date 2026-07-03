<script setup lang="ts">
import { ref } from 'vue'

interface Node { id: string; label: string; sub: string; detail: string; tech: string[] }
interface Layer { name: string; color: string; nodes: Node[] }

const layers: Layer[] = [
  {
    name: 'Clientes',
    color: '#3b82f6',
    nodes: [
      { id: 'mobile', label: 'App Móvil', sub: 'Expo SDK 57', detail: 'iOS, Android y web desde una sola base de código. Redux Toolkit + RTK Query, tokens en SecureStore (Keychain/Keystore), silent refresh ante HTTP 401 y actualizaciones optimistas en transacciones.', tech: ['React Native', 'Expo Router', 'NativeWind v4', 'RTK Query'] },
      { id: 'bot', label: 'Bot Telegram', sub: 'gramMY', detail: 'Registro conversacional de gastos y consultas rápidas: 8 comandos (/gasto, /saldo, /metas...). Recibe también las alertas de presupuesto y recordatorios de recurrentes.', tech: ['gramMY', 'Webhook HTTPS', 'API Key interna'] },
      { id: 'web', label: 'Web SPA', sub: 'Fase 2', detail: 'Aplicación web planificada para la segunda fase. Autenticación con refresh token en Cookie HttpOnly como protección contra XSS.', tech: ['Vue/React', 'Cookie HttpOnly'] },
    ],
  },
  {
    name: 'Borde de red',
    color: '#f59e0b',
    nodes: [
      { id: 'cf', label: 'Cloudflare Tunnel', sub: 'WAF + TLS 1.3', detail: 'Acceso público HTTPS sin abrir puertos del router. El WAF filtra SQLi, XSS y DDoS L3/L4 antes de que el tráfico toque la Raspberry Pi. Certificados TLS gestionados automáticamente.', tech: ['cloudflared', 'WAF', 'Zero Trust'] },
      { id: 'traefik', label: 'Traefik Ingress', sub: 'K3s routing', detail: 'Ingress Controller dentro del cluster: enruta por host/path hacia los pods del backend y aplica rate limiting a nivel de Kubernetes.', tech: ['Ingress', 'Rate limiting'] },
    ],
  },
  {
    name: 'Aplicación — Monolito Modular',
    color: '#10b981',
    nodes: [
      { id: 'api', label: 'API Fastify', sub: '12 módulos', detail: 'Un solo proceso Node.js (~150 MB RAM) con 12 módulos de fronteras explícitas: auth, cuentas, transacciones, categorías, presupuestos, metas, patrimonio, cobros, dashboard, reportes, storage y notificaciones. Pipeline de hooks: rate limit → JWT → TypeBox → handler.', tech: ['Fastify', 'TypeScript', 'TypeBox', 'Drizzle ORM'] },
      { id: 'workers', label: 'Workers BullMQ', sub: 'Async jobs', detail: 'Consumen colas de Redis: notificaciones multicanal, alertas de presupuesto, ejecución de recurrentes, precios cripto (CoinGecko cada 30 min), reportes PDF/Excel y backup nocturno con backoff exponencial.', tech: ['BullMQ', 'Cron 02:00-04:00', 'Idempotencia por jobId'] },
    ],
  },
  {
    name: 'Datos',
    color: '#8b5cf6',
    nodes: [
      { id: 'pg', label: 'PostgreSQL 16', sub: '28 tablas', detail: 'Única fuente de verdad. Transacciones ACID garantizan que el INSERT de una transacción y el UPDATE del saldo ocurren atómicamente o se revierten juntos. PVC persistente en K3s.', tech: ['ACID', 'PL/pgSQL', 'Drizzle migrations'] },
      { id: 'redis', label: 'Redis 7', sub: 'Cache + colas', detail: 'Cache del dashboard (TTL 5 min), colas BullMQ con persistencia AOF, refresh tokens revocables y contadores de rate limiting.', tech: ['AOF', 'TTL 5min', 'maxmemory 256MB'] },
    ],
  },
  {
    name: 'Infraestructura física',
    color: '#64748b',
    nodes: [
      { id: 'raspi', label: 'Raspberry Pi 5', sub: 'K3s · 8GB RAM', detail: 'Todo el sistema corre en un solo nodo: ARM Cortex-A76 de 4 núcleos. K3s orquesta los pods con self-healing (<30s de recuperación). Consumo total ~3.8 GB de 8 GB (48%). Costo de hosting: $0.', tech: ['Ubuntu Server 24.04', 'K3s', 'Helm', 'PVCs'] },
    ],
  },
]

const selected = ref<Node | null>(null)
const selectedColor = ref('')

function pick(node: Node, color: string) {
  if (selected.value?.id === node.id) {
    selected.value = null
    return
  }
  selected.value = node
  selectedColor.value = color
}
</script>

<template>
  <div class="arch">
    <div v-for="(layer, li) in layers" :key="layer.name" class="arch-layer">
      <div class="arch-layer-label" :style="{ color: layer.color }">{{ layer.name }}</div>
      <div class="arch-nodes">
        <button
          v-for="node in layer.nodes"
          :key="node.id"
          class="arch-node"
          :class="{ active: selected?.id === node.id }"
          :style="{ '--node-color': layer.color }"
          @click="pick(node, layer.color)"
        >
          <span class="arch-node-label">{{ node.label }}</span>
          <span class="arch-node-sub">{{ node.sub }}</span>
        </button>
      </div>
      <div v-if="li < layers.length - 1" class="arch-arrow">▼</div>
    </div>

    <Transition name="panel">
      <div v-if="selected" class="arch-detail" :style="{ borderColor: selectedColor }">
        <div class="arch-detail-title" :style="{ color: selectedColor }">{{ selected.label }}</div>
        <p class="arch-detail-text">{{ selected.detail }}</p>
        <div class="arch-detail-tags">
          <span v-for="t in selected.tech" :key="t" class="arch-tag">{{ t }}</span>
        </div>
      </div>
    </Transition>
    <p v-if="!selected" class="arch-hint">Haz clic en cualquier componente para ver su detalle</p>
  </div>
</template>

<style scoped>
.arch { margin: 28px 0; }
.arch-layer { text-align: center; }
.arch-layer-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}
.arch-nodes {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.arch-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 14px 22px;
  border-radius: 12px;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}
.arch-node:hover {
  border-color: var(--node-color);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px -8px var(--node-color);
}
.arch-node.active {
  border-color: var(--node-color);
  background: color-mix(in srgb, var(--node-color) 12%, var(--vp-c-bg-soft));
}
.arch-node-label { font-weight: 700; font-size: 15px; color: var(--vp-c-text-1); }
.arch-node-sub { font-size: 12px; color: var(--vp-c-text-2); }
.arch-arrow {
  color: var(--vp-c-text-3);
  font-size: 12px;
  margin: 6px 0;
  animation: arrow-bob 2s ease-in-out infinite;
}
@keyframes arrow-bob {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(4px); opacity: 1; }
}
.arch-detail {
  margin-top: 20px;
  padding: 20px 24px;
  border-radius: 12px;
  border: 2px solid;
  background: var(--vp-c-bg-soft);
}
.arch-detail-title { font-weight: 800; font-size: 17px; margin-bottom: 8px; }
.arch-detail-text { margin: 0 0 12px; font-size: 14.5px; line-height: 1.65; color: var(--vp-c-text-1); }
.arch-detail-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.arch-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
.arch-hint { text-align: center; font-size: 13px; color: var(--vp-c-text-3); margin-top: 16px; }
.panel-enter-active, .panel-leave-active { transition: all 0.3s ease; }
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
