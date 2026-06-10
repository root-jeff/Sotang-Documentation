# Arquitectura — Despliegue (Deployment)

## C4 Deployment — Capas de infraestructura

```mermaid
graph TD
    classDef node fill:#ffffff,stroke:#444444,color:#000000,stroke-width:2px
    classDef container fill:#438dd5,stroke:#316497,color:#ffffff,stroke-width:2px
    classDef db fill:#438dd5,stroke:#316497,color:#ffffff,stroke-width:2px
    classDef boundary fill:none,stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5

    subgraph DEV_NODE ["<b>Estación de Desarrollo</b>"]
        vscode["<b>VSCode + Git</b><br/>(Herramienta)<br/>IDE Principal"]:::container
    end
    class DEV_NODE boundary

    subgraph CLOUD ["<b>GitHub Cloud</b>"]
        repo["<b>Repositorios</b><br/>GitHub"]:::container
        ghcr["<b>Registry</b><br/>ghcr.io"]:::container
    end
    class CLOUD boundary

    subgraph RASPI_NODE ["<b>Raspberry Pi 5</b>"]
        subgraph K3S ["<b>Cluster K3s</b>"]
            traefik["<b>Traefik v3</b><br/>(Ingress)"]:::container
            pod_fe["<b>Frontend</b><br/>(React)"]:::container
            pod_be["<b>Backend</b><br/>(FastAPI)"]:::container
            pod_db[("<b>Postgres</b><br/>(DB)")]:::db
        end
        runner["<b>GitHub Runner</b><br/>Self-hosted"]:::container
    end
    class RASPI_NODE boundary
    class K3S boundary

    vscode --> repo
    repo --> runner
    runner --> ghcr
    runner --> K3S
    ghcr --> K3S
    traefik --> pod_fe
    traefik --> pod_be
    pod_be --> pod_db
```

## Diagrama de despliegue estructural

```mermaid
graph TB
    classDef node fill:#1e293b,stroke:#475569,color:#e2e8f0
    classDef ns fill:#0f172a,stroke:#1d4ed8,color:#93c5fd
    classDef pod fill:#052e16,stroke:#16a34a,color:#bbf7d0
    classDef db fill:#1c1917,stroke:#d97706,color:#fde68a
    classDef job fill:#1e1b4b,stroke:#7c3aed,color:#ddd6fe
    classDef cfg fill:#450a0a,stroke:#dc2626,color:#fca5a5
    classDef fs fill:#0c0a09,stroke:#78716c,color:#d6d3d1
    classDef ext fill:#0f172a,stroke:#6366f1,color:#c7d2fe

    subgraph RASPI["Raspberry Pi 5 — Ubuntu Server 24.04 arm64 — 8GB RAM / NVMe SSD"]

        subgraph SYSTEMD["Servicios systemd"]
            TAILSCALE["tailscale.service\n100.73.218.19 (WireGuard)"]
            RUNNER["actions.runner.service\nCI/CD ARM64 self-hosted"]
        end

        subgraph K3S["K3s v1.34 — Single Node Cluster"]

            subgraph KUBE_SYS["namespace: kube-system"]
                TRAEFIK_POD["Pod: traefik\nTraefik v3\n:80 :443\nTLS termination\nIngressRoute CRD"]
                COREDNS_POD["Pod: coredns\nDNS interno\nsotang-api-svc.sotang.svc.cluster.local"]
            end

            subgraph SOTANG_NS["namespace: sotang"]

                subgraph DEPLOYMENTS["Deployments — rolling update · self-healing"]
                    FE["Pod: frontend\nsotang-web:latest\nNginx · :80\nReact SPA (build estático)"]
                    BE["Pod: backend\nsotang-api:latest\nUvicorn · FastAPI · :8000\n12 módulos · Pydantic v2"]
                    WK["Pod: celery-worker\nsotang-api:latest\nCelery 5 · concurrency=2\nnotificaciones · cripto · backup"]
                    BT["Pod: celery-beat\nsotang-api:latest\nCelery Beat\nscheduler de tareas cron"]
                    BOT["Pod: telegram-bot\nsotang-bot:latest\npython-telegram-bot · :8080\nhandlers: /gasto /ingreso /balance"]
                end

                subgraph STATEFULSETS["StatefulSets — identidad estable · volumen propio"]
                    PG["Pod: postgres-0\npostgres:16\n:5432\n26 tablas · WAL habilitado"]
                    REDIS["Pod: redis-0\nredis:7-alpine\n:6379\nbroker Celery + cache API"]
                end

                subgraph CRONJOBS["CronJobs"]
                    BK_JOB["Job: backup-db\nsotang-api:latest\nschedule: 0 3 * * *\npg_dump → gzip → GDrive"]
                    EX_JOB["Job: data-export\nsotang-api:latest\nschedule: 0 4 * * 0\nCSV + JSON → zip → GDrive"]
                end

                subgraph STORAGE_K8S["PersistentVolumeClaims"]
                    PVC_PG["postgres-pvc\n5Gi · ReadWriteOnce\nhostPath"]
                    PVC_ST["storage-pvc\n20Gi · ReadWriteOnce\nhostPath"]
                    PVC_BK["backup-pvc\n10Gi · ReadWriteOnce\nhostPath"]
                end

                subgraph CONFIG["ConfigMap + Secrets"]
                    CM["sotang-config (ConfigMap)\nAPP_ENV · DOMAIN\nCELERY_BROKER_URL"]
                    SEC["sotang-secrets (Secret)\nDB_PASSWORD · JWT_SECRET\nRESEND_KEY · TELEGRAM_TOKEN\nFIREBASE_KEY · GDRIVE_SA_JSON"]
                    GSEC["ghcr-secret (docker-registry)\nghcr.io credentials"]
                end
            end
        end

        subgraph FS["Filesystem: /data/sotang/ (NVMe)"]
            FS_PG["/postgres/\nWAL + data files"]
            FS_ST["/storage/{user}/{año}/{mes}/\nadjuntos + reportes"]
            FS_BK["/backups/db/ · /backups/exports/\ndumps locales antes de GDrive"]
        end
    end

    subgraph EXTERNAL["Servicios externos"]
        TAILNET["Tailscale Network\ncoordination server"]
        GHCR["ghcr.io/jeff\nContainer Registry"]
        GH_ACTIONS["GitHub Actions\nworkflow orchestration"]
        RESEND["Resend API"]
        FCM["Firebase FCM"]
        TG_API["Telegram Bot API"]
        GECKO["CoinGecko API"]
        GDRIVE["Google Drive API"]
    end

    INTERNET(["Internet\n(dispositivos de Jefferson)"]) -->|"Tailscale WireGuard"| TAILSCALE
    TAILSCALE --> TRAEFIK_POD

    TRAEFIK_POD -->|"/ Host: sotang.domain"| FE
    TRAEFIK_POD -->|"/api Host: sotang.domain"| BE
    TRAEFIK_POD -->|"/webhook Host: sotang.domain"| BOT

    BE -->|"postgres-svc:5432"| PG
    BE -->|"redis-svc:6379"| REDIS
    WK -->|"redis-svc:6379"| REDIS
    WK -->|"postgres-svc:5432"| PG
    BT -->|"redis-svc:6379"| REDIS
    BOT -->|"http://backend-svc:8000"| BE

    PG --> PVC_PG --> FS_PG
    BE --> PVC_ST --> FS_ST
    BK_JOB --> PVC_BK --> FS_BK

    RUNNER -->|"docker pull + helm upgrade"| GHCR
    GH_ACTIONS -->|"notify runner"| RUNNER
    GHCR -->|"imagePull"| FE & BE & WK & BT & BOT & BK_JOB

    WK -->|"SDK"| RESEND & FCM & TG_API & GECKO
    BK_JOB & EX_JOB -->|"Drive API v3"| GDRIVE
    TAILSCALE <-->|"WireGuard handshake"| TAILNET

    SEC -.->|"env vars"| BE & WK & BT & BOT & BK_JOB
    CM -.->|"env vars"| BE & WK & BT
    GSEC -.->|"imagePullSecrets"| DEPLOYMENTS & STATEFULSETS & CRONJOBS
```

## Traefik — Routing rules

```mermaid
graph LR
    subgraph ENTRADA["Entrada (Tailscale)"]
        BROWSER["Browser\nsotang.domain.com"]
        TGWEBHOOK["Telegram Servers\nwebhook POST"]
    end

    subgraph TRAEFIK_RULES["Traefik IngressRoute"]
        R1["Host: sotang.domain.com\nPath prefix: /\n→ frontend-svc:80"]
        R2["Host: sotang.domain.com\nPath prefix: /api\n→ backend-svc:8000"]
        R3["Host: sotang.domain.com\nPath prefix: /webhook\n→ telegram-bot-svc:8080"]
        HTTPS["HTTP → HTTPS\nRedirect Middleware"]
        TLS["TLS\ncert-manager\nLet's Encrypt"]
    end

    BROWSER -->|":443 HTTPS"| TRAEFIK_RULES
    TGWEBHOOK -->|":443 HTTPS"| TRAEFIK_RULES
    R1 --> FE_SVC["frontend-svc (ClusterIP)"]
    R2 --> BE_SVC["backend-svc (ClusterIP)"]
    R3 --> BOT_SVC["telegram-bot-svc (ClusterIP)"]
```

## Ciclo de vida de un deploy

```mermaid
sequenceDiagram
    participant DEV as Jefferson (PC)
    participant GH as GitHub
    participant RUNNER as Runner (Raspi, fuera del cluster)
    participant GHCR as ghcr.io
    participant HELM as Helm CLI
    participant K3S as K3s API Server
    participant POD as Pod nuevo

    DEV->>GH: git push origin main
    GH->>RUNNER: trigger deploy.yml (self-hosted)
    RUNNER->>RUNNER: pytest / npm test
    RUNNER->>RUNNER: docker build --platform linux/arm64
    RUNNER->>GHCR: docker push sotang-api:{sha} + :latest
    RUNNER->>HELM: helm upgrade --install --atomic --set image.tag={sha}
    HELM->>K3S: apply Deployment con nueva imagen
    K3S->>GHCR: imagePull sotang-api:{sha}
    K3S->>POD: crear pod nuevo (rolling update)
    POD->>K3S: readinessProbe OK
    K3S->>K3S: terminar pod anterior
    RUNNER->>K3S: kubectl exec backend -- alembic upgrade head
    RUNNER->>GH: deploy exitoso

    alt deploy falla o readiness timeout
        HELM->>K3S: helm rollback (--atomic)
        K3S->>POD: restaurar versión anterior
    end
```

## Decisiones clave

| Decisión                               | Motivo                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Runner fuera del cluster**           | El runner necesita Docker daemon — en K3s no hay Docker, solo containerd. Corre como systemd service en el host.       |
| **StatefulSets para Postgres y Redis** | Identidad de pod estable (postgres-0) + PVC propio. Los Deployments reinician con nombre aleatorio.                    |
| **hostPath para PVCs**                 | Single-node cluster — no hay necesidad de NFS ni distributed storage. Más simple, máximo throughput.                   |
| **Helm --atomic**                      | Si el deploy falla (readiness timeout, imagen corrupta), Helm hace rollback automático. Zero-downtime garantizado.     |
| **Tailscale como única entrada**       | No hay puertos públicos expuestos. Todo el tráfico pasa por el túnel WireGuard. Sin IP pública, sin firewall complejo. |
| **Namespace único `sotang`**           | Un solo usuario, un solo entorno. No hay necesidad de separar por ambiente en K3s.                                     |
