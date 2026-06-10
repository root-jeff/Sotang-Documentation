# Arquitectura — Visión General

Sotang corre en una Raspberry Pi 5 como servidor personal. El acceso es exclusivamente vía Tailscale VPN. Todos los datos son locales.

## Diagrama de Nivel Superior (IcePanel)

<iframe src='https://s.icepanel.io/HJNfFYeBu6z5ry/zY0u' height='800' width='100%' title='Sotang Landscape' style='border-radius: 16px; border: none; margin-bottom: 2rem;'></iframe>

## Diagrama de contexto del sistema (C4 - Mermaid)

```mermaid
graph TD
    %% Definición de Estilos C4
    classDef person fill:#08427b,stroke:#052e51,color:#ffffff,stroke-width:2px
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff,stroke-width:2px
    classDef external fill:#999999,stroke:#666666,color:#ffffff,stroke-width:2px
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    %% Elementos con etiquetas entre comillas para evitar errores de parseo
    jeff(("<b>Jefferson</b><br/>(Persona)<br/>Usuario principal")):::person

    subgraph RASPI [<b>Raspberry Pi 5</b><br/>Servidor Local]
        sotang["<b>Sotang App</b><br/>(Sistema de Software)<br/>Gestión de finanzas"]:::system
    end
    class RASPI boundary

    tailscale["<b>Tailscale VPN</b><br/>(Externo)<br/>Acceso seguro"]:::external
    telegram["<b>Telegram Bot</b><br/>(Externo)<br/>Interfaz rápida"]:::external
    gmail["<b>Google Drive</b><br/>(Externo)<br/>Backups"]:::external
    resend["<b>Resend</b><br/>(Externo)<br/>Emails"]:::external
    firebase["<b>Firebase</b><br/>(Externo)<br/>Push Notif"]:::external
    coingecko["<b>CoinGecko</b><br/>(Externo)<br/>Precios Cripto"]:::external
    github["<b>GitHub</b><br/>(Externo)<br/>CI/CD"]:::external

    %% Relaciones
    jeff --- tailscale
    tailscale --- sotang
    jeff --- telegram
    telegram --- sotang
    sotang --- gmail
    sotang --- resend
    sotang --- firebase
    sotang --- coingecko
    github --- RASPI
```

## Decisiones arquitectónicas

| Decisión        | Elección                            | Razón                                                        |
| --------------- | ----------------------------------- | ------------------------------------------------------------ |
| Patrón backend  | Monolito Modular                    | Velocidad de desarrollo, límites claros por módulo           |
| Orquestación    | K3s                                 | Aprender K8s real, self-healing, rolling updates, ~512MB RAM |
| Background jobs | Celery + Redis                      | Reintentos automáticos, scheduling preciso                   |
| Deploy          | GitHub Actions + self-hosted runner | Push → deploy automático sin exponer puertos                 |
| Acceso externo  | Tailscale VPN                       | Sin puertos abiertos, seguro, desde cualquier dispositivo    |
| Ingress         | Traefik (built-in K3s)              | HTTPS automático, routing por path/host                      |
| DB              | PostgreSQL puro                     | Privacidad total, datos en Raspi                             |

## Stack tecnológico

| Capa     | Tecnología                                                                       |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React 18 + Vite + Tailwind + Zustand + TanStack Query + Recharts                 |
| Backend  | FastAPI + Pydantic v2 + SQLAlchemy 2 + Alembic + Celery 5                        |
| Datos    | PostgreSQL 16 + Redis 7 + Filesystem local                                       |
| Auth     | python-jose (JWT) + bcrypt                                                       |
| Infra    | K3s + Traefik v3 + Docker + GitHub Container Registry                            |
| Externas | Resend + firebase-admin + python-telegram-bot + httpx + google-api-python-client |
| Exports  | WeasyPrint (PDF) + openpyxl (Excel)                                              |

## RAM estimada en Raspi (8GB)

```mermaid
pie title Uso estimado de RAM (MB)
    "K3s control plane" : 512
    "OS Ubuntu" : 512
    "PostgreSQL" : 256
    "Redis" : 64
    "Traefik" : 128
    "Backend FastAPI" : 256
    "Celery Worker" : 256
    "Celery Beat" : 64
    "Frontend Nginx" : 32
    "Telegram Bot" : 128
```

**Total estimado: ~2.2 GB / 8 GB — 5.8 GB de margen libre.**

## Principios

1. **Privacy by default** — datos en Raspi, sin cloud para datos propios
2. **Self-healing** — K3s reinicia pods caídos automáticamente
3. **Zero-downtime deploy** — rolling updates vía K3s Deployments
4. **Modular pero cohesivo** — módulos internos en FastAPI con interfaces claras
5. **Observable** — logs estructurados, health checks en todos los pods
6. **Backup-first** — dos capas de backup antes de cualquier feature
