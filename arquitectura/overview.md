# Arquitectura — Visión General

<p class="section-intro">Sotang corre en una Raspberry Pi 5 como servidor personal. El acceso externo es vía <strong>Cloudflare Tunnels</strong> — sin puertos abiertos, sin IP pública. Todos los datos permanecen en la Raspi.</p>

## Diagrama de contexto del sistema (C4 — Nivel 1)

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

**Lectura del contexto:** Sotang es el único sistema con acceso a los datos financieros — cada externo recibe exclusivamente el mínimo para su función (CoinGecko: IDs de monedas; Drive: backups cifrados; Resend/FCM: el contenido del mensaje a entregar). El reporte Equifax nunca se consulta en línea: el usuario lo descarga del portal oficial y lo sube manualmente. La IA local vía MCP (punteada) es el único cliente futuro planificado — y por diseño operará dentro de la red doméstica.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Mobile** | React Native + Expo · NativeWind · Redux Toolkit + RTK Query · Expo Router |
| **Backend** | Fastify 4 · TypeBox · Drizzle ORM · BullMQ 5 · Node.js 20 LTS |
| **Datos** | PostgreSQL 16 · Redis 7 · Filesystem NVMe |
| **Auth** | JWT access (15 min) + refresh (30 días) · bcrypt · SecureStore (mobile) |
| **Infra** | K3s · Traefik v3 · Helm · GitHub Actions self-hosted runner |
| **Acceso** | Cloudflare Tunnels (sin puertos expuestos) |
| **Notif** | Resend · Firebase FCM · gramMY (Telegram) |
| **Exports** | pdfmake · exceljs · CoinGecko API · Google Drive API |

## Diagrama de aplicación / contenedores (C4 — Nivel 2)

Descompone el sistema en sus unidades desplegables. Cada contenedor declara su tecnología, su responsabilidad y el protocolo de cada relación:

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

**Decisiones visibles en este nivel:** el bot no toca la base de datos — es *un cliente más* de la API (Client-Server estricto); la API nunca envía notificaciones directamente — encola y responde (Event-Driven); y PostgreSQL/Redis solo son alcanzables pod-a-pod dentro del cluster.

## Diagrama de componentes (C4 — Nivel 3)

Dentro del contenedor **API Backend**: el núcleo compartido, los 12 módulos de negocio (cada uno con `router.ts · service.ts · schema.ts · repository.ts`) y los 5 workers. Los módulos dependen del core pero **jamás se importan entre sí** — la comunicación cruzada pasa por PostgreSQL (estado) o BullMQ (eventos):

```mermaid
graph TB
    classDef core fill:#052e16,stroke:#16a34a,color:#bbf7d0
    classDef mod fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef wrk fill:#1e1b4b,stroke:#7c3aed,color:#ddd6fe
    classDef ext fill:#1c1917,stroke:#d97706,color:#fde68a
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    subgraph API["Contenedor: API Backend — sotang-api (Fastify · Node.js 20)"]

        subgraph CORE["core/ — infraestructura compartida"]
            CFG["config.ts<br/>[Componente]<br/>env vars validadas con TypeBox<br/>+ parámetros globales (IVA %, SRI %)"]:::core
            DB["db.ts<br/>[Componente — patrón Singleton]<br/>pool pg único · cliente Drizzle"]:::core
            JWTP["auth.plugin.ts<br/>[Componente — patrón Decorator]<br/>verifyJWT reutilizable por ruta"]:::core
            MW["middleware.ts<br/>[Componente — Pipes & Filters]<br/>CORS · rate limit · Pino · timing"]:::core
        end

        subgraph MODS["modules/ — 12 módulos de negocio"]
            AUTH["auth<br/>login · register · refresh<br/>· logout — patrón Strategy"]:::mod
            ACC["accounts<br/>6 tipos de cuenta — Factory<br/>· cupos compartidos — Composite"]:::mod
            TXN["transactions<br/>CRUD ACID · modo IVA (incluido/<br/>adicional) · recurrentes — State"]:::mod
            CAT["categories<br/>árbol jerárquico<br/>padre/subcategoría"]:::mod
            BUD["budgets<br/>límites por periodo<br/>· umbrales 80/100%"]:::mod
            GOL["goals<br/>metas · aportes ·<br/>fecha estimada"]:::mod
            PAT["patrimony<br/>activos/pasivos · depreciación<br/>· amortización · Equifax · pólizas SRI"]:::mod
            REC["receivables<br/>cuentas por cobrar · deudas<br/>· 4 estados · recordatorios 24h"]:::mod
            REP["reports<br/>PDF (pdfmake)<br/>· Excel (exceljs)"]:::mod
            STO["storage<br/>upload multipart<br/>· adjuntos"]:::mod
            NOT["notifications<br/>preferencias 17 eventos<br/>× 3 canales · historial"]:::mod
            USR["users<br/>perfil · settings<br/>· FCM token · link Telegram"]:::mod
        end

        subgraph WRKS["workers/ — consumidores BullMQ (patrón Observer)"]
            W1["recurring-txn.worker<br/>ejecuta recurrentes en fecha"]:::wrk
            W2["notifications.worker<br/>patrón Adapter: Resend ·<br/>FCM · Telegram"]:::wrk
            W3["crypto-prices.worker<br/>CoinGecko cada 30 min"]:::wrk
            W4["backup.worker<br/>pg_dump · gzip · Drive"]:::wrk
            W5["budget-alerts.worker<br/>evalúa umbrales por categoría"]:::wrk
        end
    end

    PG[("PostgreSQL 16")]:::ext
    RD[("Redis 7")]:::ext

    MODS -->|"import"| DB
    MODS -->|"onRequest"| JWTP
    MODS -->|"parámetros"| CFG
    TXN -->|"queue.add()"| RD
    BUD -->|"queue.add()"| RD
    DB -->|"SQL"| PG
    RD -->|"jobs"| WRKS
    WRKS -->|"SQL vía Drizzle"| PG
```

**Trazabilidad con los patrones:** cada componente del core y varios módulos anotan el patrón GoF que los estructura — Singleton (db), Decorator (auth.plugin), Factory y Composite (accounts), State (transactions), Strategy (auth), Observer (workers) y Adapter (notifications.worker). El detalle con código está en [GoF Design Patterns](/entrega2/patrones-diseno).

## Diagrama de despliegue (C4 — Nivel 4 / infraestructura física)

El mapa físico completo: servicios systemd, el cluster K3s con sus namespaces, Deployments vs StatefulSets vs CronJobs, volúmenes persistentes, configuración y servicios externos:

```mermaid
graph TB
    classDef pod fill:#052e16,stroke:#16a34a,color:#bbf7d0
    classDef db fill:#1c1917,stroke:#d97706,color:#fde68a
    classDef worker fill:#1e1b4b,stroke:#7c3aed,color:#ddd6fe
    classDef infra fill:#0f172a,stroke:#6366f1,color:#c7d2fe
    classDef cfg fill:#450a0a,stroke:#dc2626,color:#fca5a5
    classDef fs fill:#0c0a09,stroke:#78716c,color:#d6d3d1

    subgraph RASPI["Nodo físico: Raspberry Pi 5 — Ubuntu Server 24.04 arm64 · 8 GB RAM · NVMe SSD"]

        subgraph SYSTEMD["Servicios systemd (fuera del cluster)"]
            CF_D["cloudflared.service<br/>túnel saliente → Traefik"]:::infra
            RUNNER["actions.runner.service<br/>CI/CD ARM64 self-hosted"]:::infra
        end

        subgraph K3S["K3s v1.30 — Single Node Cluster"]

            subgraph KUBE_SYS["namespace: kube-system"]
                TRAEFIK["Pod: traefik — Traefik v3<br/>:80 :443 · IngressRoute CRD"]:::infra
                DNS["Pod: coredns<br/>DNS interno"]:::infra
            end

            subgraph SOTANG_NS["namespace: sotang"]

                subgraph DEP["Deployments — rolling update · self-healing"]
                    FE["Pod: frontend<br/>sotang-web:sha · Nginx (Fase 2)"]:::pod
                    BE["Pod: backend<br/>sotang-api:sha · Fastify :3000"]:::pod
                    WK["Pod: bullmq-worker<br/>sotang-api:sha · concurrency 4"]:::worker
                    BOT["Pod: telegram-bot<br/>sotang-bot:sha · gramMY :3001"]:::pod
                end

                subgraph STS["StatefulSets — identidad estable + PVC propio"]
                    PG["Pod: postgres-0<br/>postgres:16 · :5432 · WAL"]:::db
                    RD["Pod: redis-0<br/>redis:7-alpine · :6379 · AOF"]:::db
                end

                subgraph CRON["CronJobs"]
                    BK["backup-db · 0 3 * * *<br/>pg_dump → gzip → Drive"]:::worker
                    EX["data-export · semanal<br/>CSV + JSON → zip → Drive"]:::worker
                end

                subgraph PVCS["PersistentVolumeClaims (hostPath NVMe)"]
                    PVC1["postgres-pvc · 5 Gi"]:::fs
                    PVC2["storage-pvc · 20 Gi"]:::fs
                    PVC3["backup-pvc · 10 Gi"]:::fs
                end

                subgraph CFGS["ConfigMap + Secrets"]
                    CM["sotang-config<br/>APP_ENV · DATABASE_URL · REDIS_URL"]:::cfg
                    SEC["sotang-secrets<br/>JWT · Resend · Telegram ·<br/>Firebase · GDrive SA"]:::cfg
                end
            end
        end

        subgraph DISK["Filesystem /data/sotang/ (NVMe)"]
            F1["/postgres/ — WAL + data"]:::fs
            F2["/storage/{año}/{mes}/ — adjuntos"]:::fs
            F3["/backups/ — dumps locales"]:::fs
        end
    end

    subgraph EXT["Servicios externos"]
        CFNET["Cloudflare Network"]:::infra
        GHCR["ghcr.io — Container Registry"]:::infra
        GHA["GitHub Actions"]:::infra
        SVC["Resend · FCM · Telegram ·<br/>CoinGecko · Google Drive"]
    end

    NET(["Internet — app móvil + Telegram"]) -->|HTTPS| CFNET
    CFNET <-->|túnel| CF_D --> TRAEFIK
    TRAEFIK -->|/api| BE
    TRAEFIK -->|/webhook| BOT
    TRAEFIK -->|/| FE
    BE -->|postgres-svc:5432| PG
    BE -->|redis-svc:6379| RD
    WK --> RD
    WK --> PG
    BOT -->|backend-svc:3000| BE
    PG --> PVC1 --> F1
    BE --> PVC2 --> F2
    BK --> PVC3 --> F3
    GHA -->|notifica| RUNNER
    RUNNER -->|build + push| GHCR
    GHCR -->|imagePull| DEP
    WK -->|adapters| SVC
    BK & EX -->|Drive API v3| SVC
    SEC -.->|env| BE & WK & BOT
    CM -.->|env| BE & WK
```

**Lectura del despliegue:** lo que necesita identidad y disco propio (PostgreSQL, Redis) vive en StatefulSets; lo sin estado (API, bot, workers) en Deployments con rolling update; lo periódico (backup, export) en CronJobs de Kubernetes — sin cron externo. Los secrets nunca están en las imágenes: se inyectan como variables de entorno desde el Secret de K3s. Y el runner de CI/CD corre en la propia Raspi: el build ARM64 ocurre en el mismo hardware donde se despliega.

## Decisiones arquitectónicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Patrón backend | Monolito Modular | Velocidad de desarrollo, límites claros entre módulos, un solo proceso Node.js |
| Repos | Polyrepo (6 repos) | CI/CD independiente, versionado autónomo, sin problemas Metro/symlinks |
| Background jobs | BullMQ + Redis | Colas persistentes, reintentos automáticos, UI Bull Board |
| Acceso externo | Cloudflare Tunnels | Sin puertos expuestos, HTTPS automático, funciona sin IP pública |
| Ingress | Traefik v3 (K3s built-in) | Routing por host/path, TLS, IngressRoute CRD |
| ORM | Drizzle ORM | Type-safe, sin runtime overhead, queries SQL explícitas |
| Orquestación | K3s | Self-healing, rolling updates, ~512 MB RAM — ideal Raspi |

## RAM estimada en Raspi (8 GB)

```mermaid
pie title Uso estimado de RAM (MB)
    "K3s control plane" : 512
    "OS Ubuntu" : 512
    "PostgreSQL" : 256
    "Redis" : 64
    "Traefik" : 64
    "Backend Fastify" : 192
    "BullMQ Worker" : 192
    "Telegram Bot" : 128
    "Frontend Nginx" : 32
```

**Total estimado: ~1.95 GB / 8 GB — más de 6 GB de margen libre.**

## Principios de diseño

1. **Privacy by default** — datos en Raspi, sin nube para datos propios
2. **Self-healing** — K3s reinicia pods caídos automáticamente
3. **Zero-downtime deploy** — rolling updates vía Helm `--atomic`
4. **Modular pero cohesivo** — 12 módulos de negocio con interfaces explícitas
5. **Observable** — logs estructurados Pino, health checks en todos los pods
6. **Backup-first** — dos capas (local NVMe + Google Drive) antes de cualquier feature
