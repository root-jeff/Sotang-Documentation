# Arquitectura — Visión General

<p class="section-intro">Sotang corre en una Raspberry Pi 5 como servidor personal. El acceso externo es vía <strong>Cloudflare Tunnels</strong> — sin puertos abiertos, sin IP pública. Todos los datos permanecen en la Raspi.</p>

## Diagrama de contexto del sistema (C4)

```mermaid
graph TD
    classDef person fill:#08427b,stroke:#052e51,color:#ffffff,stroke-width:2px
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff,stroke-width:2px
    classDef external fill:#999999,stroke:#666666,color:#ffffff,stroke-width:2px
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    jeff(("<b>Jefferson</b><br/>(Persona)<br/>Usuario principal")):::person

    subgraph RASPI ["<b>Raspberry Pi 5</b> — Servidor Local"]
        sotang["<b>Sotang App</b><br/>(Sistema de Software)<br/>Gestión de finanzas personales"]:::system
    end
    class RASPI boundary

    cf["<b>Cloudflare Tunnels</b><br/>(Externo)<br/>Acceso HTTPS seguro"]:::external
    telegram["<b>Telegram Bot</b><br/>(Externo)<br/>Interfaz rápida"]:::external
    gdrive["<b>Google Drive</b><br/>(Externo)<br/>Backups"]:::external
    resend["<b>Resend</b><br/>(Externo)<br/>Emails transaccionales"]:::external
    firebase["<b>Firebase FCM</b><br/>(Externo)<br/>Push notifications"]:::external
    coingecko["<b>CoinGecko</b><br/>(Externo)<br/>Precios cripto"]:::external
    github["<b>GitHub</b><br/>(Externo)<br/>CI/CD + Packages"]:::external

    jeff -->|"Mobile App / Telegram"| cf
    cf --> sotang
    jeff --> telegram
    telegram --> sotang
    sotang --> gdrive
    sotang --> resend
    sotang --> firebase
    sotang --> coingecko
    github -->|"self-hosted runner"| RASPI
```

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

## Arquitectura macro — K3s namespaces

```mermaid
graph TB
    classDef pod fill:#052e16,stroke:#16a34a,color:#bbf7d0
    classDef db fill:#1c1917,stroke:#d97706,color:#fde68a
    classDef worker fill:#1e1b4b,stroke:#7c3aed,color:#ddd6fe
    classDef infra fill:#0f172a,stroke:#6366f1,color:#c7d2fe
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    subgraph RASPI["Raspberry Pi 5 — Ubuntu 24.04 arm64"]

        subgraph K3S["K3s — Single Node"]

            subgraph SYS["kube-system"]
                TRAEFIK["Traefik v3\nIngressRoute CRD"]:::infra
                COREDNS["CoreDNS"]:::infra
            end

            subgraph SOTANG["namespace: sotang"]
                FE["Pod: frontend\nsotang-web (Fase 2)\nNginx SPA"]:::pod
                BE["Pod: backend\nsotang-api\nFastify · :3000"]:::pod
                WK["Pod: bullmq-worker\nnotif · cripto · backup"]:::worker
                BOT["Pod: telegram-bot\ngramMY · :3001"]:::pod
                PG[("Pod: postgres-0\nPostgreSQL 16")]:::db
                REDIS[("Pod: redis-0\nRedis 7")]:::db
            end
        end

        CF_DAEMON["cloudflared\nsystemd service"]:::infra
        RUNNER["GitHub Runner\nsystemd service"]:::infra
    end

    CF_DAEMON -->|"tunnel HTTPS"| TRAEFIK
    TRAEFIK --> BE & FE & BOT
    BE --> PG & REDIS
    WK --> REDIS & PG
    BOT --> BE
```

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
