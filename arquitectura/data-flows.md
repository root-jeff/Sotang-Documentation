# Flujos de Datos Clave

## 1. Request HTTP general

```mermaid
sequenceDiagram
    participant C as Cliente
    participant T as Traefik
    participant BE as FastAPI
    participant CACHE as Redis
    participant DB as PostgreSQL

    C->>T: GET /api/v1/transactions?month=2026-04
    T->>BE: proxy + headers
    BE->>BE: verificar JWT
    BE->>CACHE: ¿cache hit?
    alt Hit
        CACHE-->>BE: datos cacheados (TTL 5min)
    else Miss
        BE->>DB: SELECT ...
        DB-->>BE: rows
        BE->>CACHE: SET cache (TTL 5min)
    end
    BE-->>C: JSON response
```

## 2. Ciclo de vida de transacciones recurrentes

```mermaid
stateDiagram-v2
    [*] --> Configurada: Usuario crea recurrente
    Configurada --> Pendiente: Sistema agenda para fecha X
    Pendiente --> Notificada: 1 día antes — Celery Beat
    Notificada --> Confirmada: Usuario no hace nada (default)
    Notificada --> Cancelada: Usuario cancela
    Confirmada --> Ejecutada: Llega la fecha — Celery crea txn
    Ejecutada --> Pendiente: Se agenda siguiente ocurrencia
    Cancelada --> [*]
    Ejecutada --> [*]: Fecha fin o recurrencia eliminada
```

## 3. Corte de tarjeta de crédito

```mermaid
sequenceDiagram
    participant BEAT as Celery Beat
    participant DB as PostgreSQL
    participant NOTIF as Notification Worker
    participant USER as Jefferson

    Note over BEAT: 1 día antes del corte (ej: día 14)
    BEAT->>DB: buscar tarjetas con fecha_corte = mañana
    loop Por cada tarjeta
        BEAT->>DB: SELECT txns WHERE estado='en_proceso'
        BEAT->>NOTIF: enviar_alerta_corte(tarjeta, txns_en_proceso)
        NOTIF->>USER: Email + Telegram con lista pendiente
    end

    Note over BEAT: Día del corte (día 15)
    BEAT->>DB: mover txns confirmadas → completada
    BEAT->>DB: calcular total del corte
    BEAT->>NOTIF: enviar_resumen_corte(tarjeta, total)
    NOTIF->>USER: "Corte Diners: $250.00 — Pago hasta el 5 de mayo"
```

## 4. Actualización de precios cripto

```mermaid
sequenceDiagram
    participant BEAT as Celery Beat (cada 30min)
    participant WORKER as Celery Worker
    participant GECKO as CoinGecko API
    participant DB as PostgreSQL
    participant CACHE as Redis

    BEAT->>WORKER: task update_crypto_prices()
    WORKER->>DB: SELECT DISTINCT simbolo FROM cuentas WHERE tipo='cripto'
    WORKER->>GECKO: GET /simple/price?ids=bitcoin,ethereum&vs_currencies=usd
    alt API responde OK
        GECKO-->>WORKER: {bitcoin: {usd: 95000}, ...}
        WORKER->>DB: UPDATE cuentas SET precio_actual_usd=X
        WORKER->>DB: INSERT cripto_precios_historico
        WORKER->>CACHE: SET crypto_prices (TTL 35min)
    else API falla
        WORKER->>DB: UPDATE cuentas SET precio_desactualizado=true
    end
```

## 5. Backup automático

```mermaid
sequenceDiagram
    participant K3S as K3s CronJob (3AM)
    participant JOB as Backup Job Pod
    participant DB as PostgreSQL
    participant FS as Filesystem Raspi
    participant GD as Google Drive

    K3S->>JOB: crear pod backup-db
    JOB->>DB: pg_dump → sotang_backup_YYYY-MM-DD.dump.gz
    JOB->>FS: guardar en /data/sotang/backups/db/
    JOB->>GD: upload via Drive API
    JOB->>GD: eliminar backups > 30 días
    JOB->>DB: INSERT backup_log (estado, tamaño, gdrive_file_id)
```

## 6. Notificaciones multi-canal

```mermaid
graph TD
    EVENT["⚡ Evento (presupuesto 80%, corte próximo...)"]
    WORKER["Notification Worker (Celery)"]
    DB_NOTIF["notification_preferences del usuario"]

    EVENT --> WORKER --> DB_NOTIF

    DB_NOTIF -->|"email habilitado"| RESEND["Resend → 📧 Inbox"]
    DB_NOTIF -->|"telegram habilitado"| TGAPI["Bot API → 📱 Telegram"]
    DB_NOTIF -->|"push habilitado"| FCM["Firebase → 🔔 Browser"]

    WORKER -->|"INSERT"| LOG["notificaciones_log (historial)"]
```

## 7. Transacción desde Telegram

```mermaid
sequenceDiagram
    participant J as Jefferson (Telegram)
    participant TG as Telegram Servers
    participant BOT as sotang-bot pod
    participant BE as FastAPI
    participant DB as PostgreSQL
    participant CEL as Celery

    J->>TG: /gasto 15 Alimentación Almuerzo
    TG->>BOT: webhook POST
    BOT->>BE: POST /api/v1/transactions (X-Internal-Key)
    BE->>DB: INSERT transaccion + UPDATE cuenta saldo
    BE-->>BOT: {id, monto, categoria, saldo_nuevo}
    BOT->>TG: "✅ Gasto $15.00 — Saldo Bco. Guayaquil: $1,219.56"
    TG-->>J: confirmación

    BE->>CEL: task check_budget_alert(user_id, categoria_id)
    alt Presupuesto > 80%
        CEL->>J: "⚠️ Alimentación al 85%"
    end
```

## 8. Upload de JSON de Equifax

```mermaid
sequenceDiagram
    participant USER as Jefferson (Browser)
    participant FE as Frontend React
    participant BE as FastAPI
    participant DB as PostgreSQL

    USER->>FE: arrastra equifax_report.json
    FE->>BE: POST /api/v1/patrimony/equifax/upload
    BE->>BE: parsear + validar JSON
    alt JSON válido
        BE->>DB: INSERT equifax_reportes (score, capacidad_pago, raw_json...)
        BE-->>FE: {score: 862, fecha_consulta}
        FE-->>USER: "✅ Score actualizado: 862/999"
    else Inválido
        BE-->>FE: 422 — "Archivo no válido"
    end
```
