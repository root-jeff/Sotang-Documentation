# Componentes — Backend y Clientes

<p class="section-intro">El backend es un <strong>Monolito Modular</strong> Fastify con 12 módulos de negocio independientes. Tres clientes consumen el mismo REST API: la app mobile React Native, el bot Telegram, y la SPA web (Fase 2).</p>

## Módulos del backend

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
```

Cada módulo contiene: `router.ts` · `service.ts` · `schema.ts` (TypeBox) · `repository.ts` (Drizzle)

## Estructura de carpetas

```
sotang-api/src/
├── core/
│   ├── config.ts          TypeBox env schema + dotenv
│   ├── db.ts              DrizzleDB pool singleton
│   ├── auth.plugin.ts     Fastify decorator: verifyJWT
│   └── middleware.ts      CORS, Pino, timing
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
│   ├── backup/
│   └── users/
├── workers/
│   ├── queues.ts              BullMQ Queue instances
│   ├── recurring-txn.worker.ts
│   ├── notifications.worker.ts
│   ├── crypto-prices.worker.ts
│   ├── backup.worker.ts
│   └── budget-alerts.worker.ts
├── integrations/
│   ├── resend.adapter.ts
│   ├── firebase.adapter.ts
│   ├── telegram.adapter.ts
│   ├── coingecko.adapter.ts
│   └── gdrive.adapter.ts
└── app.ts
```

## Navegación mobile (React Native + Expo Router)

```mermaid
graph LR
    subgraph AUTH_SCREENS["Auth (sin tab bar)"]
        LOGIN["(auth)/login"]
        REGISTER["(auth)/register"]
        RESET["(auth)/reset-password"]
    end

    subgraph TABS["(tabs)/ — Bottom Tab Navigator"]
        DASH["index — Dashboard"]
        TXN["transactions — Movimientos"]
        ACC["accounts — Cuentas"]
        BUDGETS_S["budgets — Presupuestos"]
        MORE["more — Más opciones"]
    end

    subgraph MORE_STACK["Stack bajo 'Más'"]
        GOALS_S["goals"]
        PATRIMONY_S["patrimony"]
        RECEIVABLES_S["receivables"]
        REPORTS_S["reports"]
        SETTINGS_S["settings"]
    end

    LOGIN --> TABS
    MORE --> MORE_STACK
```

## Flujo de autenticación JWT

```mermaid
sequenceDiagram
    participant APP as Mobile App
    participant BE as Fastify API
    participant DB as PostgreSQL
    participant SS as SecureStore (device)

    APP->>BE: POST /api/v1/auth/login { email, password }
    BE->>DB: SELECT user WHERE email = X
    BE->>BE: bcrypt.compare(password, hash)
    BE->>BE: sign access_token (15 min) + refresh_token (30 días)
    BE-->>APP: { accessToken, refreshToken, user }
    APP->>SS: SecureStore.setItem('tokens', ...)

    Note over APP,BE: access_token expirado
    APP->>BE: POST /auth/refresh { refreshToken }
    BE->>DB: SELECT refresh_tokens WHERE token = hash
    BE-->>APP: { accessToken nuevo }

    Note over APP,BE: Logout
    APP->>BE: POST /auth/logout { refreshToken }
    BE->>DB: DELETE FROM refresh_tokens WHERE token = hash
    BE-->>APP: 204 No Content
    APP->>SS: SecureStore.deleteItem('tokens')
```

## Estado global mobile (Redux Toolkit)

```mermaid
graph TB
    subgraph RTK["Redux Toolkit Store"]
        AUTH_S["authSlice\nuser · accessToken · isAuthenticated"]
        UI_S["uiSlice\ntheme · activeModal"]
        SETTINGS_S["settingsSlice\ncurrency · timezone · IVA rate"]
    end

    subgraph RTK_QUERY["RTK Query — API cache"]
        TXN_Q["transactionsApi\nuseGetTransactionsQuery · cache 5min"]
        ACC_Q["accountsApi\nuseGetAccountsQuery · invalidation"]
        DASH_Q["dashboardApi\nuseGetDashboardQuery · polling 5min"]
    end

    AUTH_S -->|"Bearer token en baseQuery"| TXN_Q & ACC_Q & DASH_Q
```
