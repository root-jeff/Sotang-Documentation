# Arquitectura — Despliegue

<p class="section-intro">Un push a <code>main</code> dispara el pipeline en el self-hosted runner de la Raspi. Helm gestiona el rollout con <code>--atomic</code>: si el pod no pasa el readiness check, hace rollback automático.</p>

## C4 Deployment — Capas de infraestructura

```mermaid
graph TD
    classDef container fill:#438dd5,stroke:#316497,color:#ffffff,stroke-width:2px
    classDef db fill:#d97706,stroke:#92400e,color:#ffffff,stroke-width:2px
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    subgraph DEV ["Estación de Desarrollo"]
        vscode["VSCode + Git"]:::container
    end
    class DEV boundary

    subgraph CLOUD ["GitHub Cloud"]
        repo["Repositorios\n(6 polyrepos)"]:::container
        ghcr["ghcr.io\nContainer Registry"]:::container
        gha["GitHub Actions\nworkflow orchestration"]:::container
    end
    class CLOUD boundary

    subgraph CF ["Cloudflare"]
        cft["Cloudflare Tunnels\nHTTPS sin puertos abiertos"]:::container
    end
    class CF boundary

    subgraph RASPI ["Raspberry Pi 5"]
        runner["GitHub Runner\nsystemd service"]:::container
        cfd["cloudflared\nsystemd service"]:::container
        subgraph K3S ["K3s Cluster"]
            traefik["Traefik v3\nIngress"]:::container
            be["Backend\nFastify :3000"]:::container
            wk["BullMQ Worker"]:::container
            bot["Telegram Bot\ngramMY :3001"]:::container
            pg[("PostgreSQL 16")]:::db
            redis[("Redis 7")]:::db
        end
    end
    class RASPI boundary
    class K3S boundary

    vscode --> repo
    repo --> gha --> runner
    runner --> ghcr
    runner --> K3S
    ghcr --> K3S
    cft <--> cfd --> traefik
    traefik --> be & bot
    be --> pg & redis
    wk --> redis & pg
```

## Diagrama de despliegue completo

```mermaid
graph TB
    classDef pod fill:#052e16,stroke:#16a34a,color:#bbf7d0
    classDef db fill:#1c1917,stroke:#d97706,color:#fde68a
    classDef worker fill:#1e1b4b,stroke:#7c3aed,color:#ddd6fe
    classDef infra fill:#0f172a,stroke:#6366f1,color:#c7d2fe
    classDef cfg fill:#450a0a,stroke:#dc2626,color:#fca5a5
    classDef fs fill:#0c0a09,stroke:#78716c,color:#d6d3d1
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    subgraph RASPI["Raspberry Pi 5 — Ubuntu Server 24.04 arm64 — 8 GB RAM / NVMe SSD"]

        subgraph SYSTEMD["Servicios systemd"]
            CF_D["cloudflared.service\ntúnel sotang.example.com → Traefik"]:::infra
            RUNNER["actions.runner.service\nCI/CD ARM64 self-hosted"]:::infra
        end

        subgraph K3S["K3s v1.30 — Single Node Cluster"]

            subgraph KUBE_SYS["namespace: kube-system"]
                TRAEFIK_POD["Pod: traefik\nTraefik v3 · :80 :443\nIngressRoute CRD"]:::infra
                COREDNS_POD["Pod: coredns\nDNS interno K3s"]:::infra
            end

            subgraph SOTANG_NS["namespace: sotang"]

                subgraph DEPLOYMENTS["Deployments — rolling update · self-healing"]
                    FE["Pod: frontend\nsotang-web:sha\nNginx · React SPA (Fase 2)"]:::pod
                    BE["Pod: backend\nsotang-api:sha\nFastify · :3000\n12 módulos · TypeBox"]:::pod
                    WK["Pod: bullmq-worker\nsotang-api:sha\nBullMQ workers · concurrency=4"]:::worker
                    BOT["Pod: telegram-bot\nsotang-bot:sha\ngramMY · :3001\n/gasto /ingreso /balance"]:::pod
                end

                subgraph STATEFULSETS["StatefulSets — identidad estable · PVC propio"]
                    PG["Pod: postgres-0\npostgres:16\n:5432 · WAL habilitado"]:::db
                    REDIS["Pod: redis-0\nredis:7-alpine\n:6379 · broker BullMQ"]:::db
                end

                subgraph CRONJOBS["CronJobs"]
                    BK_JOB["Job: backup-db\nschedule: 0 3 * * *\npg_dump → gzip → GDrive"]:::worker
                    EX_JOB["Job: data-export\nschedule: 0 4 * * 0\nCSV + JSON → zip → GDrive"]:::worker
                end

                subgraph STORAGE_K8S["PersistentVolumeClaims (hostPath NVMe)"]
                    PVC_PG["postgres-pvc · 5 Gi"]:::fs
                    PVC_ST["storage-pvc · 20 Gi"]:::fs
                    PVC_BK["backup-pvc · 10 Gi"]:::fs
                end

                subgraph CONFIG["ConfigMap + Secrets"]
                    CM["sotang-config\nAPP_ENV · DATABASE_URL · REDIS_URL"]:::cfg
                    SEC["sotang-secrets\nJWT_SECRET · RESEND_KEY\nTELEGRAM_TOKEN · FIREBASE_KEY\nGDRIVE_SA_JSON"]:::cfg
                    GSEC["ghcr-secret\ndocker-registry credentials"]:::cfg
                end
            end
        end

        subgraph FS["Filesystem: /data/sotang/ (NVMe)"]
            FS_PG["/postgres/ — WAL + data"]:::fs
            FS_ST["/storage/{año}/{mes}/ — adjuntos"]:::fs
            FS_BK["/backups/ — dumps locales"]:::fs
        end
    end

    subgraph EXTERNAL["Servicios externos"]
        CF_NET["Cloudflare Network"]:::infra
        GHCR["ghcr.io — Container Registry"]:::infra
        GH_ACTIONS["GitHub Actions"]:::infra
        RESEND["Resend API"]
        FCM["Firebase FCM"]
        TG_API["Telegram Bot API"]
        GECKO["CoinGecko API"]
        GDRIVE["Google Drive API"]
    end

    INTERNET(["Internet\n(Jeff — mobile + Telegram)"]) -->|"HTTPS"| CF_NET
    CF_NET <-->|"túnel"| CF_D --> TRAEFIK_POD

    TRAEFIK_POD -->|"Host: sotang.example.com /api"| BE
    TRAEFIK_POD -->|"Host: sotang.example.com /webhook"| BOT
    TRAEFIK_POD -->|"Host: sotang.example.com /"| FE

    BE -->|"postgres-svc:5432"| PG
    BE -->|"redis-svc:6379"| REDIS
    WK -->|"redis-svc:6379"| REDIS
    WK -->|"postgres-svc:5432"| PG
    BOT -->|"http://backend-svc:3000"| BE

    PG --> PVC_PG --> FS_PG
    BE --> PVC_ST --> FS_ST
    BK_JOB --> PVC_BK --> FS_BK

    RUNNER -->|"helm upgrade + docker push"| GHCR
    GH_ACTIONS -->|"notify runner"| RUNNER
    GHCR -->|"imagePull"| FE & BE & WK & BOT & BK_JOB

    WK -->|"adapters"| RESEND & FCM & TG_API & GECKO
    BK_JOB & EX_JOB -->|"Drive API v3"| GDRIVE

    SEC -.->|"env vars"| BE & WK & BOT & BK_JOB
    CM -.->|"env vars"| BE & WK
    GSEC -.->|"imagePullSecrets"| DEPLOYMENTS & STATEFULSETS & CRONJOBS
```

## Traefik — Routing rules

```mermaid
graph LR
    subgraph ENTRADA["Entrada (Cloudflare Tunnel)"]
        APP["Mobile App\nsotang.example.com"]
        TGWEBHOOK["Telegram Servers\nwebhook POST"]
    end

    subgraph TRAEFIK_RULES["Traefik IngressRoute"]
        R1["PathPrefix: /api\n→ backend-svc:3000"]
        R2["PathPrefix: /webhook\n→ telegram-bot-svc:3001"]
        R3["PathPrefix: /\n→ frontend-svc:80"]
        TLS["TLS terminado en Cloudflare"]
    end

    APP -->|":443 HTTPS"| TRAEFIK_RULES
    TGWEBHOOK -->|":443 HTTPS"| TRAEFIK_RULES
    R1 --> BE_SVC["backend-svc (ClusterIP)"]
    R2 --> BOT_SVC["telegram-bot-svc (ClusterIP)"]
    R3 --> FE_SVC["frontend-svc (ClusterIP)"]
```

## Ciclo de vida de un deploy

```mermaid
sequenceDiagram
    participant DEV as Jefferson (PC)
    participant GH as GitHub
    participant RUNNER as Runner (Raspi)
    participant GHCR as ghcr.io
    participant HELM as Helm CLI
    participant K3S as K3s API Server
    participant POD as Pod nuevo

    DEV->>GH: git push origin main
    GH->>RUNNER: trigger deploy.yml (self-hosted)
    RUNNER->>RUNNER: npm ci + npm test
    RUNNER->>RUNNER: docker build --platform linux/arm64
    RUNNER->>GHCR: docker push sotang-api:{sha} + :latest
    RUNNER->>HELM: helm upgrade --install --atomic --set image.tag={sha}
    HELM->>K3S: apply Deployment con nueva imagen
    K3S->>GHCR: imagePull sotang-api:{sha}
    K3S->>POD: crear pod nuevo (rolling update)
    POD->>K3S: readinessProbe GET /health → 200
    K3S->>K3S: terminar pod anterior
    RUNNER->>K3S: kubectl exec backend -- npm run db:migrate
    RUNNER->>GH: deploy exitoso

    alt readiness timeout o error
        HELM->>K3S: helm rollback (--atomic)
        K3S->>POD: restaurar versión anterior
    end
```

## Decisiones clave

| Decisión | Motivo |
|----------|--------|
| **Runner fuera del cluster** | El runner necesita Docker daemon — K3s usa containerd, no Docker. Corre como systemd service en el host. |
| **StatefulSets para Postgres y Redis** | Identidad de pod estable (`postgres-0`) + PVC propio. Necesario para datos persistentes. |
| **hostPath para PVCs** | Single-node cluster — no hay necesidad de NFS. Más simple, máximo throughput directo al NVMe. |
| **Helm `--atomic`** | Si el deploy falla (readiness timeout, imagen corrupta), Helm hace rollback automático. |
| **Cloudflare Tunnels** | No hay puertos públicos expuestos. TLS terminado en Cloudflare. Telegram Webhooks funcionan sin IP pública. |
| **Namespace único `sotang`** | Un solo usuario, un solo entorno. Sin necesidad de separar por ambiente en K3s. |
