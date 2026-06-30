# Flujos de Datos Clave

<p class="section-intro">Los flujos más importantes del sistema: desde un request HTTP hasta las tareas asíncronas BullMQ que manejan notificaciones, transacciones recurrentes y backups.</p>

## 1. Request HTTP general

```mermaid
sequenceDiagram
    participant C as Cliente (Mobile)
    participant CF as Cloudflare
    participant T as Traefik
    participant BE as Fastify
    participant CACHE as Redis
    participant DB as PostgreSQL

    C->>CF: GET /api/v1/transactions?month=2026-06
    CF->>T: tunnel HTTPS
    T->>BE: proxy + X-Forwarded-For
    BE->>BE: verifyJWT (preHandler)
    BE->>CACHE: ¿cache hit? "txns:{userId}:2026-06"
    alt Hit
        CACHE-->>BE: datos cacheados (TTL 5 min)
    else Miss
        BE->>DB: SELECT ... WHERE user_id = X (Drizzle)
        DB-->>BE: rows
        BE->>CACHE: SET cache TTL 5 min
    end
    BE-->>C: 200 JSON
```

## 2. Ciclo de vida de transacciones recurrentes

```mermaid
stateDiagram-v2
    [*] --> Configurada: Usuario crea recurrente
    Configurada --> Pendiente: Sistema agenda para fecha X
    Pendiente --> Notificada: 1 día antes — BullMQ job
    Notificada --> Ejecutada: Llega la fecha — BullMQ crea txn
    Notificada --> Cancelada: Usuario cancela via app o Telegram
    Ejecutada --> Pendiente: Se agenda siguiente ocurrencia
    Cancelada --> [*]
    Ejecutada --> [*]: Fecha fin o recurrencia eliminada
```

## 3. Corte de tarjeta de crédito

```mermaid
sequenceDiagram
    participant SCHED as BullMQ Scheduler
    participant DB as PostgreSQL
    participant NOTIF as Notification Worker
    participant USER as Jefferson

    Note over SCHED: 1 día antes del corte (ej: día 14)
    SCHED->>DB: buscar tarjetas con fecha_corte = mañana
    loop Por cada tarjeta
        SCHED->>DB: SELECT txns WHERE estado='en_proceso'
        SCHED->>NOTIF: job: enviar_alerta_corte(tarjeta, txns)
        NOTIF->>USER: Email Resend + Telegram con lista pendiente
    end

    Note over SCHED: Día del corte (día 15)
    SCHED->>DB: mover txns confirmadas → completada
    SCHED->>DB: calcular total del corte
    SCHED->>NOTIF: job: enviar_resumen_corte(tarjeta, total)
    NOTIF->>USER: "Corte Diners: $250.00 — Pago hasta el 5 de julio"
```

## 4. Actualización de precios cripto

```mermaid
sequenceDiagram
    participant SCHED as BullMQ Repeatable (cada 30 min)
    participant WORKER as crypto-prices.worker
    participant GECKO as CoinGecko API
    participant DB as PostgreSQL
    participant CACHE as Redis

    SCHED->>WORKER: job: update_crypto_prices
    WORKER->>DB: SELECT DISTINCT symbol FROM accounts WHERE type='crypto'
    WORKER->>GECKO: GET /simple/price?ids=bitcoin,ethereum&vs_currencies=usd
    alt API responde OK
        GECKO-->>WORKER: { bitcoin: { usd: 95000 }, ... }
        WORKER->>DB: UPDATE accounts SET currentPriceUsd = X (Drizzle)
        WORKER->>DB: INSERT crypto_price_history
        WORKER->>CACHE: SET crypto_prices TTL 35 min
    else API falla — reintento automático BullMQ
        WORKER->>DB: UPDATE accounts SET priceStale = true
    end
```

## 5. Backup automático

```mermaid
sequenceDiagram
    participant K3S as K3s CronJob (3AM)
    participant JOB as backup-db pod
    participant DB as PostgreSQL
    participant FS as NVMe /data/sotang/backups/
    participant GD as Google Drive API

    K3S->>JOB: crear pod backup-db
    JOB->>DB: pg_dump → sotang_backup_2026-06-29.dump.gz
    JOB->>FS: guardar backup local
    JOB->>GD: upload via Drive API v3
    JOB->>GD: eliminar backups > 30 días
    JOB->>DB: INSERT backup_log { status, size, driveFileId }
```

## 6. Notificaciones multi-canal

```mermaid
graph TD
    EVENT["Evento disparador\n(presupuesto 80%, corte próximo, txn recurrente...)"]
    QUEUE["BullMQ — notifications queue"]
    WORKER["notifications.worker.ts"]
    PREFS["notification_preferences del usuario"]

    EVENT --> QUEUE --> WORKER --> PREFS

    PREFS -->|"email = true"| RESEND["Resend API → Email"]
    PREFS -->|"telegram = true"| TGAPI["gramMY Bot API → Telegram"]
    PREFS -->|"push = true"| FCM["Firebase FCM → Push notification"]

    WORKER -->|"INSERT"| LOG["notifications_log (historial auditable)"]
```

## 7. Transacción rápida desde Telegram

```mermaid
sequenceDiagram
    participant J as Jefferson (Telegram)
    participant TG as Telegram Servers
    participant BOT as sotang-bot (gramMY)
    participant BE as Fastify API
    participant DB as PostgreSQL
    participant BULL as BullMQ

    J->>TG: /gasto 15 Alimentación Almuerzo
    TG->>BOT: webhook POST (Cloudflare Tunnel)
    BOT->>BE: POST /api/v1/transactions { X-Internal-Key }
    BE->>DB: INSERT transactions + UPDATE accounts.balance (Drizzle tx)
    BE-->>BOT: { id, amount, category, newBalance }
    BOT->>TG: "✅ Gasto $15.00 — Saldo Bco. Guayaquil: $1,219.56"
    TG-->>J: mensaje de confirmación

    BE->>BULL: job: check_budget_alert(userId, categoryId)
    alt Presupuesto > 80%
        BULL->>J: "⚠️ Alimentación al 85% del presupuesto"
    end
```

## 8. Upload de reporte Equifax

```mermaid
sequenceDiagram
    participant USER as Jefferson (Mobile)
    participant APP as React Native App
    participant BE as Fastify API
    participant DB as PostgreSQL

    USER->>APP: selecciona equifax_report.json
    APP->>BE: POST /api/v1/patrimony/equifax/upload\n{ multipart/form-data }
    BE->>BE: parsear + validar TypeBox schema
    alt JSON válido
        BE->>DB: INSERT equifax_reports\n{ score, paymentCapacity, rawJson, ... }
        BE-->>APP: { score: 862, consultedAt: "2026-06-29" }
        APP-->>USER: "✅ Score actualizado: 862/999"
    else Inválido
        BE-->>APP: 422 "Archivo no reconocido como reporte Equifax"
    end
```
