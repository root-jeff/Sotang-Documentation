# Componentes — Backend y Frontend

## Módulos del backend (Monolito Modular)

```mermaid
graph TB
    subgraph API["FastAPI — sotang-api"]
        subgraph CORE["core/"]
            CONFIG["config.py — Settings / .env"]
            DB["database.py — Session factory"]
            SECURITY["security.py — JWT · bcrypt"]
            DEPS["dependencies.py — get_current_user · get_db"]
            MIDDLEWARE["middleware.py — CORS · logging · timing"]
        end
        subgraph MODULES["modules/"]
            AUTH["auth/ — login · register · refresh · reset"]
            ACCOUNTS["accounts/ — cuentas · tarjetas · cupos · cripto"]
            TXN["transactions/ — CRUD · recurrentes · categorías · IVA"]
            BUDGETS["budgets/ — presupuestos · alertas"]
            GOALS["goals/ — metas · aportes · progreso"]
            PATRIMONY["patrimony/ — activos · pasivos · equifax · amortización"]
            RECEIVABLES["receivables/ — cuentas x cobrar · deudas"]
            REPORTS["reports/ — PDF · Excel"]
            STORAGE["storage/ — upload · download · adjuntos"]
            NOTIFICATIONS["notifications/ — config · historial · templates"]
            BACKUP["backup/ — trigger · historial"]
        end
        subgraph WORKERS["workers/ (Celery)"]
            W1["recurring_transactions.py"]
            W2["notifications.py — email · push · telegram"]
            W3["crypto_prices.py — cada 30min"]
            W4["backup.py — pg_dump · gdrive"]
            W5["budget_alerts.py"]
        end
    end
```

Cada módulo tiene: `router.py` · `service.py` · `schemas.py` · `models.py`

## Estructura de carpetas del backend

```
sotang-api/app/
├── core/
│   ├── config.py          pydantic-settings
│   ├── database.py        SQLAlchemy engine + session
│   ├── security.py        JWT, bcrypt, tokens
│   └── dependencies.py    FastAPI Depends()
├── modules/
│   ├── auth/
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   ├── goals/
│   ├── patrimony/
│   ├── receivables/
│   ├── reports/
│   ├── storage/
│   ├── notifications/
│   └── backup/
├── workers/
│   ├── celery_app.py
│   ├── recurring_transactions.py
│   ├── notifications.py
│   ├── crypto_prices.py
│   ├── backup.py
│   └── budget_alerts.py
├── integrations/
│   ├── resend_client.py
│   ├── firebase_client.py
│   ├── telegram_client.py
│   ├── coingecko_client.py
│   └── gdrive_client.py
└── main.py
```

## Navegación del frontend

```mermaid
graph LR
    subgraph AUTH_PAGES["Auth (sin layout)"]
        LOGIN["/login"]
        REGISTER["/register"]
        RESET["/reset-password"]
    end

    subgraph APP["App (con layout Sidebar + Header)"]
        DASH["/ Dashboard"]
        TXN["/ transactions"]
        FIN["/ finance"]
        ACC["/ accounts"]
        PAT["/ patrimony"]
        BUD["/ budgets"]
        GOA["/ goals"]
        REC["/ receivables"]
        SET["/ settings"]
    end
```

## Flujo de autenticación JWT

```mermaid
sequenceDiagram
    participant FE as Frontend React
    participant BE as FastAPI
    participant DB as PostgreSQL
    participant R as Redis

    FE->>BE: POST /api/v1/auth/login {email, password}
    BE->>DB: SELECT usuario WHERE email=X
    BE->>BE: bcrypt.verify(password, hash)
    BE->>BE: generar access_token (15min) + refresh_token (7d)
    BE->>R: SET refresh:{token} = user_id (TTL 7d)
    BE-->>FE: {access_token, refresh_token, user}

    Note over FE,BE: Auto-refresh cuando access_token expira
    FE->>BE: POST /auth/refresh {refresh_token}
    BE->>R: verificar token existe
    BE-->>FE: {access_token nuevo}

    Note over FE,BE: Logout
    FE->>BE: POST /auth/logout {refresh_token}
    BE->>R: DEL refresh:{token}
    BE-->>FE: 204
```

## Estado global del frontend

```mermaid
graph TB
    subgraph ZUSTAND["Zustand (estado del cliente)"]
        AUTH_S["authStore — user · accessToken · isAuthenticated"]
        UI_S["uiStore — theme · sidebarOpen · activeModal"]
        SETTINGS_S["settingsStore — currency · timezone · IVA"]
    end

    subgraph REACT_QUERY["TanStack Query (estado del servidor)"]
        TXN_Q["useTransactions() — cache + refetch"]
        ACC_Q["useAccounts() — cache + invalidación"]
        DASH_Q["useDashboard() — polling cada 5min"]
    end

    AUTH_S -->|"token en headers"| TXN_Q & ACC_Q & DASH_Q
```
