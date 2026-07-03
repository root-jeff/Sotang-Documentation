---
title: 4. Arquitectura
---

<PresHero
  badge="Acto 4"
  title="Arquitectura"
  subtitle="Un Monolito Modular sobre K3s en una Raspberry Pi 5 — explora cada capa"
/>

## El sistema completo, capa por capa

<ArchLayers />

## ¿Por qué un Monolito Modular y no microservicios?

<Reveal>

<StatGrid :stats="[
  { value: 150, suffix: ' MB', label: 'RAM del monolito Fastify' },
  { value: 900, suffix: ' MB', label: 'RAM de 6 microservicios equivalentes' },
  { value: 48, suffix: '%', label: 'Uso total de los 8 GB de la Raspi' },
  { value: 12, label: 'Módulos con fronteras explícitas' },
]"/>

Los módulos **no se llaman entre sí directamente**: toda comunicación cruzada pasa por la base de datos o por colas BullMQ. Eso mantiene las ventajas de fronteras claras (como microservicios) sin pagar el overhead de red y memoria.

</Reveal>

## Los 5 estilos y la restricción que motiva a cada uno

<Reveal>

Ningún estilo se eligió por moda — cada uno responde a una restricción concreta y medible del proyecto:

| # | Estilo arquitectónico | Alcance | Restricción que lo motiva |
|---|----------------------|---------|--------------------------|
| 1 | Monolito Modular | Backend completo (Fastify) | Un runtime Node.js consume ~150 MB vs ~1.2 GB de 6 microservicios en la Raspi |
| 2 | Layered Architecture | Interno de cada módulo | Testabilidad: el `service.ts` debe probarse sin Fastify ni PostgreSQL |
| 3 | Event-Driven / Queue-Based | Workers BullMQ | Latencia: el cliente no espera emails ni consultas a CoinGecko |
| 4 | Client-Server | Sistema completo | Multicanal: el mismo backend sirve a mobile, Telegram y web sin duplicar lógica |
| 5 | Pipes and Filters | Pipeline de requests | Composición: auth + validación se configuran una vez, aplican a todas las rutas |

</Reveal>

## Los 5 patrones arquitectónicos en acción

<Reveal>

```mermaid
graph TB
    subgraph CS["Client-Server"]
        M[Mobile] --> CF[Cloudflare]
        T[Telegram] --> CF
    end
    CF --> PF
    subgraph MM["Monolito Modular"]
        subgraph PF["Pipes & Filters (hooks Fastify)"]
            H1[Rate limit] --> H2[JWT] --> H3[TypeBox] --> H4[Handler]
        end
        subgraph LA["Layered (por módulo)"]
            R[routes.ts] --> SV[service.ts] --> D[Drizzle ORM]
        end
        H4 --> R
    end
    SV -->|"queue.add() < 1ms"| Q[(Redis · BullMQ)]
    Q --> W[Workers]
    D --> PG[(PostgreSQL)]
    W --> PG
    style Q fill:#ef444422
    style PG fill:#8b5cf622
```

**Event-Driven** es la pieza que une todo: el request nunca espera por un email, una alerta o un PDF — se encola y el worker lo resuelve en segundo plano.

</Reveal>

## El viaje de un request, en vivo

<Reveal>

Así fluye el registro de una transacción: la ruta azul es síncrona (menos de 100 ms), la verde es la respuesta al cliente, y la ámbar es todo lo que ocurre en segundo plano sin bloquear al usuario:

<FlowAnim />

</Reveal>

## Las 5 decisiones de arquitectura (ADR)

Cada decisión estructural está documentada como Architecture Decision Record: contexto, decisión, consecuencias a favor y en contra. Expande cada una:

<AdrAccordion :adrs="[
  {
    id: 'ADR-01', title: 'Auto-alojamiento en Raspberry Pi 5',
    context: 'El sistema maneja datos financieros extremadamente sensibles y se necesita un servidor de producción con costo operativo mínimo.',
    decision: 'Desplegar todo el sistema en una Raspberry Pi 5 propiedad del usuario, en su red doméstica.',
    pros: ['Costo mensual $0 en hosting', 'Privacidad total: ningún dato sale de la red doméstica', 'Latencia mínima en acceso local'],
    cons: ['Single point of failure físico', 'Sin failover automático ante falla de hardware', 'CPU limitada (ARM Cortex-A76, 4 núcleos)'],
    mitigation: 'Backup diario automático a Google Drive; K3s reinicia pods automáticamente para recuperación de software.'
  },
  {
    id: 'ADR-02', title: 'K3s como orquestador de contenedores',
    context: 'Se necesita self-healing, rolling updates y separación de responsabilidades entre servicios, sobre hardware limitado.',
    decision: 'Usar K3s (Kubernetes ligero) en lugar de Docker Compose o Kubernetes completo.',
    pros: ['~512 MB de RAM vs ~4 GB de Kubernetes completo', 'Ecosistema Kubernetes real: Helm, kubectl, pods, namespaces, PVCs', 'Rolling updates sin downtime'],
    cons: ['Curva de aprendizaje mayor que Docker Compose', 'Requiere manifiestos YAML y Helm charts'],
  },
  {
    id: 'ADR-03', title: 'Monolito Modular en Fastify vs microservicios',
    context: 'Doce módulos de negocio diferenciados sobre una Raspi de 8 GB de RAM y 4 núcleos ARM.',
    decision: 'Un Monolito Modular en Fastify (Node.js 20, TypeScript) con fronteras explícitas por módulo.',
    pros: ['Un solo proceso: ~150 MB de RAM', 'Cero overhead de comunicación inter-servicio', 'Velocidad de desarrollo sin versionado de contratos entre servicios'],
    cons: ['El proceso completo se reinicia si falla (mitigado por K3s)', 'Todos los módulos comparten el runtime (mitigado con workers BullMQ separados)'],
  },
  {
    id: 'ADR-04', title: 'Polyrepo: 6 repositorios independientes',
    context: 'Seis componentes con ciclos de despliegue distintos: API, bot, app móvil, infraestructura, web y documentación.',
    decision: 'Seis repositorios independientes en lugar de un monorepo.',
    pros: ['Despliegues independientes sin riesgo cruzado', 'CI/CD simple: un Dockerfile y un Helm chart por repo', 'Expo sin configuración especial de Metro para workspaces'],
    cons: ['Tipos TypeScript no compartidos directamente — se publica @sotang/shared en GitHub Packages'],
  },
  {
    id: 'ADR-05', title: 'Cloudflare Tunnels para acceso externo',
    context: 'La Raspi está en una red doméstica sin IP pública estática; los webhooks de Telegram y la app móvil deben alcanzar la API desde internet.',
    decision: 'Exponer el servicio mediante Cloudflare Tunnels (conexión saliente desde la Raspi).',
    pros: ['HTTPS automático + WAF incluido sin configuración', 'Cero puertos abiertos en el router', 'IP residencial nunca expuesta', 'Plan gratuito: $0'],
    cons: ['Dependencia de la disponibilidad de Cloudflare: si cae globalmente, el sistema queda inaccesible desde fuera aunque la Raspi funcione'],
  },
]" />

## Las vistas C4 — Nivel 1: Contexto

<Reveal>

El sistema como caja negra: quién lo usa, con qué externos habla y — clave para la tesis de privacidad — **qué recibe exactamente cada externo**. La IA local vía MCP aparece punteada como sistema futuro:

```mermaid
graph TD
    classDef person fill:#08427b,stroke:#052e51,color:#ffffff,stroke-width:2px
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff,stroke-width:2px
    classDef external fill:#999999,stroke:#666666,color:#ffffff,stroke-width:2px
    classDef future fill:#4c1d95,stroke:#7c3aed,color:#ddd6fe,stroke-width:2px,stroke-dasharray: 6 4
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    jeff(("<b>Jefferson</b><br/>[Persona]<br/>Único usuario del sistema:<br/>registra, consulta y planifica<br/>sus finanzas")):::person

    cf["<b>Cloudflare</b><br/>[Sistema Externo]<br/>Túnel de entrada: WAF,<br/>TLS 1.3, sin puertos abiertos"]:::external
    tg["<b>Telegram</b><br/>[Sistema Externo]<br/>Canal conversacional:<br/>comandos /gasto, /balance<br/>y entrega de alertas"]:::external

    subgraph RASPI ["<b>Raspberry Pi 5</b> — red doméstica del usuario"]
        sotang["<b>Sotang Finance</b><br/>[Sistema de Software]<br/>Registra transacciones con IVA,<br/>consolida cuentas, cupos, metas,<br/>presupuestos y patrimonio neto"]:::system
    end
    class RASPI boundary

    subgraph NOTIF ["Salida de notificaciones"]
        resend["<b>Resend</b><br/>[Sistema Externo]<br/>Email transaccional"]:::external
        fcm["<b>Firebase FCM</b><br/>[Sistema Externo]<br/>Push a la app móvil"]:::external
    end
    class NOTIF boundary

    subgraph DATA ["Datos de terceros (solo lo mínimo)"]
        gecko["<b>CoinGecko</b><br/>[Sistema Externo]<br/>Precios cripto — solo recibe<br/>IDs de monedas"]:::external
        equifax["<b>Equifax Ecuador</b><br/>[Sistema Externo]<br/>Score crediticio — JSON<br/>subido manualmente"]:::external
    end
    class DATA boundary

    subgraph OPS ["Operación"]
        gdrive["<b>Google Drive</b><br/>[Sistema Externo]<br/>Solo recibe backups cifrados"]:::external
        github["<b>GitHub</b><br/>[Sistema Externo]<br/>CI/CD, registry y<br/>paquete @sotang/shared"]:::external
    end
    class OPS boundary

    ia["<b>IA Local (futuro)</b><br/>[Sistema Planificado]<br/>LLM en la misma red,<br/>conectado vía MCP"]:::future

    jeff -->|"Registra y consulta<br/>[App Expo · HTTPS]"| cf
    jeff -->|"Envía /gasto 25.50 comida<br/>[chat de Telegram]"| tg
    cf -->|"Reenvía requests<br/>[túnel saliente]"| sotang
    tg -->|"Webhook de comandos<br/>[HTTPS vía Cloudflare]"| cf
    sotang -->|"Responde y alerta<br/>[Bot API]"| tg
    sotang -->|"Envía emails<br/>[API REST]"| resend
    sotang -->|"Envía push<br/>[FCM Admin]"| fcm
    resend -.->|entrega| jeff
    fcm -.->|entrega| jeff
    sotang -->|"Consulta precios cada 30 min<br/>[API pública]"| gecko
    jeff -->|"Sube reporte JSON<br/>[upload manual]"| sotang
    equifax -.->|"descarga del portal"| jeff
    sotang -->|"Backup nocturno cifrado<br/>[Drive API v3]"| gdrive
    github -->|"Deploy por runner<br/>self-hosted [Actions]"| RASPI
    ia -.->|"Consultas y registro<br/>[MCP · red local]"| sotang
```

</Reveal>

## Nivel 2: Aplicación / Contenedores

<Reveal>

Las unidades desplegables, cada una con su tecnología y el protocolo de cada relación. Nótese que el bot **no toca la base de datos** — es un cliente más de la API:

```mermaid
graph TB
    classDef person fill:#08427b,stroke:#052e51,color:#ffffff,stroke-width:2px
    classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff,stroke-width:2px
    classDef db fill:#1c1917,stroke:#d97706,color:#fde68a,stroke-width:2px
    classDef external fill:#999999,stroke:#666666,color:#ffffff
    classDef future fill:#4c1d95,stroke:#7c3aed,color:#ddd6fe,stroke-dasharray: 6 4
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    jeff(("<b>Jefferson</b><br/>[Persona]")):::person

    subgraph CLIENTES ["Dispositivos del usuario"]
        mobile["<b>App Móvil</b><br/>[Contenedor: React Native + Expo SDK 57]<br/>5 tabs: dashboard, cuentas, transacciones,<br/>metas, perfil · Redux Toolkit + RTK Query<br/>· tokens en SecureStore"]:::container
        webspa["<b>Web SPA</b><br/>[Contenedor: React + Nginx — Fase 2]<br/>Misma API, refresh token<br/>en Cookie HttpOnly"]:::future
    end
    class CLIENTES boundary

    tgapi["<b>Telegram</b><br/>[Sistema Externo]"]:::external
    cf["<b>Cloudflare Tunnel</b><br/>[Infraestructura]<br/>WAF · TLS 1.3 · túnel saliente"]:::external

    subgraph SISTEMA ["Sotang Finance — Raspberry Pi 5 / K3s"]
        bot["<b>Bot Conversacional</b><br/>[Contenedor: Node.js + gramMY]<br/>Parsea /gasto, /balance, /metas...<br/>y reenvía a la API como cliente REST"]:::container
        api["<b>API Backend</b><br/>[Contenedor: Fastify · Node.js 20 · TS]<br/>12 módulos de negocio · pipeline<br/>rate-limit → JWT → TypeBox → handler<br/>· transacciones ACID · OpenAPI 3.0"]:::container
        workers["<b>Workers Asíncronos</b><br/>[Contenedor: BullMQ · concurrency 4]<br/>recurrentes · notificaciones · alertas<br/>de presupuesto · precios cripto · backups"]:::container
        pg[("<b>PostgreSQL 16</b><br/>[Contenedor: StatefulSet]<br/>28 tablas · única fuente<br/>de verdad · WAL")]:::db
        redis[("<b>Redis 7</b><br/>[Contenedor: StatefulSet]<br/>colas BullMQ (AOF) · cache TTL 5 min<br/>· refresh tokens · rate limiting")]:::db
        fs[("<b>Storage NVMe</b><br/>[Filesystem]<br/>adjuntos de transacciones<br/>· dumps locales")]:::db
    end
    class SISTEMA boundary

    jeff -->|"usa [HTTPS]"| mobile
    jeff -.->|"usará [HTTPS]"| webspa
    jeff -->|"chatea"| tgapi
    mobile -->|"JSON/REST [HTTPS]"| cf
    webspa -.->|"JSON/REST [HTTPS]"| cf
    tgapi -->|"webhook [HTTPS]"| cf
    cf -->|"/api → :3000<br/>/webhook → :3001"| api
    cf -->|" "| bot
    bot -->|"REST interno<br/>[http://backend-svc:3000]"| api
    api -->|"SQL [Drizzle ORM<br/>· pool pg]"| pg
    api -->|"queue.add() < 1 ms<br/>[ioredis]"| redis
    api -->|"multipart upload"| fs
    redis -->|"consume jobs"| workers
    workers -->|"SQL [Drizzle]"| pg
    workers -->|"adapters: Resend ·<br/>FCM · Telegram · CoinGecko"| tgapi
```

Ningún cliente toca la base de datos: PostgreSQL y Redis solo son accesibles pod-a-pod dentro del cluster.

</Reveal>

## C4 Nivel 3 — Diagrama de Componentes del Backend

<Reveal>

Los 12 módulos de negocio comparten los servicios del núcleo (`core/`) pero jamás se importan entre sí — cada módulo contiene `router.ts` · `service.ts` · `schema.ts` (TypeBox) · `repository.ts` (Drizzle):

```mermaid
graph TB
    subgraph API["sotang-api — Fastify · Node.js 20"]
        subgraph CORE["core/"]
            CONFIG["config.ts — env vars + TypeBox schema"]
            DB["db.ts — DrizzleDB singleton (pool pg)"]
            AUTH_PLG["auth.plugin.ts — JWT verify decorator"]
            MIDDLEWARE["middleware.ts — CORS · Pino logger · timing"]
        end
        subgraph MODULES["modules/ — 12 módulos de negocio"]
            AUTH["auth/ — login · register · refresh · logout"]
            ACCOUNTS["accounts/ — cuentas · tarjetas · cupos · cripto"]
            TXN["transactions/ — CRUD · recurrentes · categorías · IVA"]
            BUDGETS["budgets/ — presupuestos · alertas 80 pct"]
            GOALS["goals/ — metas · aportes · progreso"]
            PATRIMONY["patrimony/ — activos · pasivos · equifax · amortización"]
            RECEIVABLES["receivables/ — cuentas x cobrar · deudas"]
            REPORTS["reports/ — PDF pdfmake · Excel exceljs"]
            STORAGE["storage/ — upload · adjuntos"]
            NOTIFICATIONS["notifications/ — preferencias · historial"]
            BACKUP["backup/ — trigger · historial"]
            USERS["users/ — perfil · settings · FCM token"]
        end
        subgraph WORKERS["workers/ (BullMQ)"]
            W1["recurring-txn.worker.ts — crea txns en fecha"]
            W2["notifications.worker.ts — email · push · telegram"]
            W3["crypto-prices.worker.ts — cada 30 min"]
            W4["backup.worker.ts — pg_dump · gzip · GDrive"]
            W5["budget-alerts.worker.ts — supera 80 pct"]
        end
    end
    MODULES --> CORE
    TXN -.->|queue.add| WORKERS
    BUDGETS -.->|queue.add| WORKERS
```

La regla se cumple por estructura: la comunicación entre módulos pasa por PostgreSQL (estado) o por BullMQ (eventos) — nunca por imports directos. El detalle vive en [Components & Modules](/arquitectura/componentes).

</Reveal>

## El contrato de la API

<Reveal>

REST versionada en `/api/v1`, con la especificación **OpenAPI 3.0 generada automáticamente** desde los schemas TypeBox — la documentación no puede desactualizarse porque sale del mismo código que valida:

| Convención | Regla |
|-----------|-------|
| Versionado | Prefijo `/api/v1` — cambios incompatibles irían a `/v2` sin romper clientes |
| Colecciones | `{ data: [...], total, page, limit }` — paginación uniforme en todos los módulos |
| Errores | Formato único: `{ error, message }` con códigos semánticos (`token_expired`, `not_found`) |
| Validación | HTTP 400/422 con el detalle del campo — TypeBox valida antes de tocar la lógica |
| Recursos ajenos | HTTP 404 (no 403) — no se revela la existencia de datos de otros usuarios |
| Documentación | Swagger UI en `/documentation`, colección Postman versionada en el repo |

13 grupos de endpoints (auth, accounts, transactions, budgets, goals, patrimony, receivables, reports, notifications, storage, backup, users, health) — el detalle completo está en [API Design](/arquitectura/api-design).

</Reveal>

## Despliegue y operación

<Reveal>

El ciclo de vida de un deploy — de `git push` a producción sin downtime:

```mermaid
graph LR
    DEV[git push a main] --> GA[GitHub Actions]
    GA --> BLD[Build imagen ARM64<br/>+ push a registry]
    BLD --> HELM[helm upgrade<br/>en la Raspi]
    HELM --> RU[Rolling update:<br/>pod nuevo arranca antes<br/>de matar el anterior]
    RU --> OK{Health check<br/>/health/ready}
    OK -->|pasa| LIVE[Tráfico al pod nuevo]
    OK -->|falla| RB[Rollback automático<br/>al pod anterior]
    style LIVE fill:#10b98122
    style RB fill:#ef444422
```

Y en operación, K3s aporta lo que un servidor casero normalmente no tiene:

| Capacidad | Cómo |
|-----------|------|
| Self-healing | `restartPolicy: Always` — un pod caído se reinicia en < 30 s |
| Datos que sobreviven a los pods | PersistentVolumeClaims para PostgreSQL y adjuntos |
| Config separada del código | Secrets y ConfigMaps de Kubernetes |
| Rate limiting de red | Middleware de Traefik a nivel de Ingress |

</Reveal>

## Vista de Despliegue completa — todo el cluster en un diagrama

<Reveal>

El mapa físico real del sistema: systemd, namespaces de K3s, Deployments, StatefulSets, CronJobs, volúmenes persistentes, secrets y servicios externos. Usa el zoom para explorarlo:

```mermaid
graph TB
    classDef pod fill:#052e16,stroke:#16a34a,color:#bbf7d0
    classDef db fill:#1c1917,stroke:#d97706,color:#fde68a
    classDef worker fill:#1e1b4b,stroke:#7c3aed,color:#ddd6fe
    classDef infra fill:#0f172a,stroke:#6366f1,color:#c7d2fe
    classDef cfg fill:#450a0a,stroke:#dc2626,color:#fca5a5
    classDef fs fill:#0c0a09,stroke:#78716c,color:#d6d3d1

    subgraph RASPI["Raspberry Pi 5 — Ubuntu Server 24.04 arm64 — 8 GB RAM / NVMe SSD"]

        subgraph SYSTEMD["Servicios systemd"]
            CF_D["cloudflared.service\ntúnel → Traefik"]:::infra
            RUNNER["actions.runner.service\nCI/CD ARM64 self-hosted"]:::infra
        end

        subgraph K3S["K3s v1.30 — Single Node Cluster"]

            subgraph KUBE_SYS["namespace: kube-system"]
                TRAEFIK_POD["Pod: traefik\nTraefik v3 · :80 :443"]:::infra
            end

            subgraph SOTANG_NS["namespace: sotang"]

                subgraph DEPLOYMENTS["Deployments — rolling update · self-healing"]
                    FE["Pod: frontend\nsotang-web (Fase 2)"]:::pod
                    BE["Pod: backend\nsotang-api · Fastify :3000\n12 módulos · TypeBox"]:::pod
                    WK["Pod: bullmq-worker\nconcurrency=4"]:::worker
                    BOT["Pod: telegram-bot\ngramMY :3001"]:::pod
                end

                subgraph STATEFULSETS["StatefulSets — identidad estable · PVC propio"]
                    PG["Pod: postgres-0\npostgres:16 · :5432"]:::db
                    REDIS["Pod: redis-0\nredis:7 · :6379"]:::db
                end

                subgraph CRONJOBS["CronJobs"]
                    BK_JOB["backup-db\n0 3 * * * → GDrive"]:::worker
                    EX_JOB["data-export\nsemanal → GDrive"]:::worker
                end

                subgraph STORAGE_K8S["PersistentVolumeClaims (NVMe)"]
                    PVC_PG["postgres-pvc · 5 Gi"]:::fs
                    PVC_ST["storage-pvc · 20 Gi"]:::fs
                    PVC_BK["backup-pvc · 10 Gi"]:::fs
                end

                subgraph CONFIG["ConfigMap + Secrets"]
                    CM["sotang-config"]:::cfg
                    SEC["sotang-secrets\nJWT · Resend · Telegram\nFirebase · GDrive"]:::cfg
                end
            end
        end
    end

    subgraph EXTERNAL["Servicios externos"]
        CF_NET["Cloudflare Network"]:::infra
        GHCR["ghcr.io — Registry"]:::infra
        RESEND["Resend"]
        FCM["Firebase FCM"]
        TG_API["Telegram API"]
        GECKO["CoinGecko"]
        GDRIVE["Google Drive"]
    end

    INTERNET(["Internet — mobile + Telegram"]) -->|HTTPS| CF_NET
    CF_NET <-->|túnel| CF_D --> TRAEFIK_POD

    TRAEFIK_POD -->|/api| BE
    TRAEFIK_POD -->|/webhook| BOT
    TRAEFIK_POD -->|/| FE

    BE --> PG
    BE --> REDIS
    WK --> REDIS
    WK --> PG
    BOT --> BE

    PG --> PVC_PG
    BE --> PVC_ST
    BK_JOB --> PVC_BK

    RUNNER -->|helm upgrade| GHCR
    GHCR -->|imagePull| BE

    WK -->|adapters| RESEND & FCM & TG_API & GECKO
    BK_JOB & EX_JOB --> GDRIVE

    SEC -.->|env vars| BE & WK & BOT
    CM -.->|env vars| BE & WK
```

Tres detalles que valen la pena señalar: los **StatefulSets** dan a PostgreSQL y Redis identidad estable y volumen propio (los datos sobreviven a cualquier reinicio de pod); los **CronJobs** de Kubernetes ejecutan el backup nocturno y el export semanal sin ningún cron externo; y el **runner de CI/CD corre dentro de la propia Raspi** — el build ARM64 se hace en el mismo hardware donde se despliega.

</Reveal>

## Estrategia de repositorios

<Reveal>

Seis repos independientes (ADR-04), unidos por dos contratos:

- **`@sotang/shared`** en GitHub Packages: los tipos TypeScript del dominio se publican como paquete — API, bot y móvil consumen la misma definición de `Transaction` sin copiar código.
- **OpenAPI autogenerada**: cualquier cliente puede regenerar sus tipos desde `GET /documentation/json` — el contrato vive en el código del backend, no en un documento aparte.

| Repo | Despliega a | CI/CD |
|------|-------------|-------|
| sotang-api | K3s (Raspi) | Actions → Docker ARM64 → Helm |
| sotang-bot | K3s (Raspi) | Mismo patrón |
| sotang-mobile | iOS / Android | EAS Build |
| sotang-infra | Cluster K3s | Manifiestos + Helm charts |
| sotang-shared | GitHub Packages | Publish on tag |
| SotangDocWeb | GitHub Pages | VitePress build — este sitio |

</Reveal>

## Diseño para entornos específicos

El diseño se adapta explícitamente a tres entornos con restricciones propias:

<Reveal>

### Entorno móvil (React Native / Expo)

| Restricción | Decisión de diseño |
|-------------|--------------------|
| Tokens sensibles en un dispositivo que se puede perder | SecureStore → iOS Keychain / Android Keystore, cifrado por hardware |
| Sesiones que expiran a mitad de uso | Silent refresh: el interceptor de RTK Query renueva el token ante HTTP 401 y reintenta transparente |
| Latencia perceptible al registrar | Optimistic UI: la transacción aparece en pantalla antes de la confirmación del servidor |
| Una sola base de código para 3 plataformas | Expo: iOS, Android y web desde el mismo repositorio |

</Reveal>

<Reveal>

### Entorno embebido (Raspberry Pi 5)

La restricción dura son los **8 GB de RAM** del nodo único — cada decisión arquitectónica pasa por ese filtro:

<StatGrid :stats="[
  { value: 8, suffix: ' GB', label: 'RAM total del nodo' },
  { value: 3.8, suffix: ' GB', label: 'Consumo en carga normal' },
  { value: 48, suffix: '%', label: 'Uso — margen para picos' },
  { value: 0, prefix: '$', label: 'Costo de hosting mensual' },
]" />

Las tareas intensivas (backup pg_dump, depreciación anual, resúmenes mensuales) se programan entre las **02:00 y 04:00 AM** para no competir con el uso interactivo.

</Reveal>

<Reveal>

### Entorno de red

Sin puertos abiertos en el router: Cloudflare Tunnel establece una conexión **saliente** desde la Raspi y publica HTTPS con WAF y TLS 1.3 gestionado. Dentro del cluster, Traefik enruta por host/path y aplica rate limiting a nivel de Kubernetes. Las 6 capas de defensa completas se recorren en el [Acto 5](./seguridad).

</Reveal>

<Reveal>

::: info Documentación completa
Los diagramas C4 de los 4 niveles, el detalle de componentes y el deployment K3s están en [Architecture → System Overview](/arquitectura/overview).
:::

</Reveal>

---

<div style="display:flex; justify-content:space-between">
  <a href="./casos-de-uso">← Casos de Uso</a>
  <a href="./seguridad">Siguiente: Seguridad →</a>
</div>
