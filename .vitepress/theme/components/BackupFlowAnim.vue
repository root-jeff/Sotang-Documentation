<script setup lang="ts">
// Animación SVG del backup nocturno automático: CronJob → dump → disco local → Google Drive → registro.
import { ref } from 'vue'

const details: Record<string, { title: string; text: string }> = {
  cron: { title: 'K3s CronJob — 3 AM', text: 'Se dispara todas las noches sin intervención manual. Crea un pod efímero solo para esta tarea.' },
  pod: { title: 'Pod backup-db', text: 'Vive solo mientras dura el backup. Ejecuta pg_dump y luego desaparece — no consume recursos el resto del día.' },
  db: { title: 'pg_dump', text: 'Vuelca las 28 tablas de PostgreSQL a sotang_backup_AAAA-MM-DD.dump.gz, comprimido.' },
  fs: { title: 'NVMe local', text: 'El dump se guarda primero en /data/sotang/backups/ — la primera línea de defensa si algo falla en la subida.' },
  drive: { title: 'Google Drive API v3', text: 'El backup cifrado se sube fuera del dispositivo físico. Si la Raspberry Pi falla, los datos sobreviven.' },
  log: { title: 'backup_log', text: 'Se registra estado, tamaño y driveFileId en la base de datos, y se eliminan automáticamente los backups con más de 30 días.' },
}
const active = ref<string | null>(null)
function toggle(id: string) {
  active.value = active.value === id ? null : id
}
</script>

<template>
  <div class="flow">
    <svg viewBox="0 0 820 260" xmlns="http://www.w3.org/2000/svg" class="flow-svg">
      <defs>
        <marker id="bf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--vp-c-text-3)" />
        </marker>
      </defs>

      <path id="bf-p1" d="M 110 135 H 140" class="flow-path" marker-end="url(#bf-arrow)" />
      <path id="bf-p2" d="M 250 135 H 280" class="flow-path" marker-end="url(#bf-arrow)" />
      <path id="bf-p3" d="M 380 135 H 410" class="flow-path" marker-end="url(#bf-arrow)" />
      <path id="bf-p4" d="M 520 135 H 550" class="flow-path" marker-end="url(#bf-arrow)" />
      <path id="bf-p5" d="M 670 135 H 700" class="flow-path response-path" marker-end="url(#bf-arrow)" />
      <path id="bf-loop" d="M 760 160 C 800 190, 800 220, 750 225 C 720 228, 700 210, 700 195" class="flow-path dashed" marker-end="url(#bf-arrow)" />

      <g class="flow-node" :class="{ active: active === 'cron' }" tabindex="0" role="button" @click="toggle('cron')" @keydown.enter="toggle('cron')">
        <rect x="20" y="110" width="90" height="50" rx="10" class="node-box client" />
        <text x="65" y="128" class="node-title">CronJob</text>
        <text x="65" y="144" class="node-sub">K3s · 3 AM</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'pod' }" tabindex="0" role="button" @click="toggle('pod')" @keydown.enter="toggle('pod')">
        <rect x="140" y="110" width="110" height="50" rx="10" class="node-box edge" />
        <text x="195" y="128" class="node-title">backup-db</text>
        <text x="195" y="144" class="node-sub">pod efímero</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'db' }" tabindex="0" role="button" @click="toggle('db')" @keydown.enter="toggle('db')">
        <rect x="280" y="110" width="100" height="50" rx="10" class="node-box db" />
        <text x="330" y="128" class="node-title">PostgreSQL</text>
        <text x="330" y="144" class="node-sub">pg_dump</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'fs' }" tabindex="0" role="button" @click="toggle('fs')" @keydown.enter="toggle('fs')">
        <rect x="410" y="110" width="110" height="50" rx="10" class="node-box worker" />
        <text x="465" y="128" class="node-title">NVMe local</text>
        <text x="465" y="144" class="node-sub">.dump.gz</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'drive' }" tabindex="0" role="button" @click="toggle('drive')" @keydown.enter="toggle('drive')">
        <rect x="550" y="110" width="120" height="50" rx="10" class="node-box api" />
        <text x="610" y="128" class="node-title">Google Drive</text>
        <text x="610" y="144" class="node-sub">upload cifrado</text>
      </g>
      <g class="flow-node" :class="{ active: active === 'log' }" tabindex="0" role="button" @click="toggle('log')" @keydown.enter="toggle('log')">
        <rect x="700" y="110" width="100" height="50" rx="10" class="node-box notify-solid" />
        <text x="750" y="128" class="node-title">backup_log</text>
        <text x="750" y="144" class="node-sub">+ limpieza 30d</text>
      </g>

      <circle r="5" class="dot sync">
        <animateMotion dur="4.5s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1"><mpath href="#bf-p1" /></animateMotion>
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="0.6s" repeatCount="indefinite"><mpath href="#bf-p2" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="1.2s" repeatCount="indefinite"><mpath href="#bf-p3" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="1.2s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot sync" opacity="0">
        <animateMotion dur="4.5s" begin="1.8s" repeatCount="indefinite"><mpath href="#bf-p4" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4.5s" begin="1.8s" repeatCount="indefinite" />
      </circle>
      <circle r="5" class="dot response" opacity="0">
        <animateMotion dur="4.5s" begin="2.4s" repeatCount="indefinite"><mpath href="#bf-p5" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.85;0.9" dur="4.5s" begin="2.4s" repeatCount="indefinite" />
      </circle>
      <circle r="4" class="dot async-dot" opacity="0">
        <animateMotion dur="4.5s" begin="3s" repeatCount="indefinite"><mpath href="#bf-loop" /></animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;0.9" dur="4.5s" begin="3s" repeatCount="indefinite" />
      </circle>
    </svg>
    <div class="flow-legend">
      <span><i class="leg sync" /> Ejecución del backup</span>
      <span><i class="leg response" /> Registro final</span>
      <span><i class="leg async-dot" /> Limpieza (&gt; 30 días)</span>
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
.flow-path.dashed { stroke-dasharray: 6 5; stroke: rgba(245, 158, 11, 0.55); }
.flow-path.response-path { stroke: rgba(16, 185, 129, 0.55); }
.node-box { stroke-width: 1.5; transition: filter 0.2s ease, stroke-width 0.2s ease; }
.node-box.client { fill: rgba(59,130,246,0.12); stroke: #3b82f6; }
.node-box.edge { fill: rgba(245,158,11,0.12); stroke: #f59e0b; }
.node-box.api { fill: rgba(16,185,129,0.12); stroke: #10b981; }
.node-box.db { fill: rgba(139,92,246,0.12); stroke: #8b5cf6; }
.node-box.worker { fill: rgba(245,158,11,0.1); stroke: #f59e0b; }
.node-box.notify-solid { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); }
.node-title { text-anchor: middle; font-size: 13px; font-weight: 700; fill: var(--vp-c-text-1); }
.node-sub { text-anchor: middle; font-size: 10px; fill: var(--vp-c-text-3); }
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
