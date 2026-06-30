# Patrones Arquitectónicos — Sotang

Sotang aplica **cinco patrones arquitectónicos** que actúan en capas complementarias: dos organizan la estructura interna del backend, uno gobierna la comunicación asíncrona, uno define el estilo de comunicación cliente-servidor y uno estructura el pipeline de procesamiento de requests. Ninguno fue elegido por moda — cada uno responde a una restricción concreta del sistema.

---

## Resumen de patrones aplicados

| # | Patrón | Alcance | Justificación principal |
|---|--------|---------|------------------------|
| 1 | **Monolito Modular** | Backend (Fastify) | Velocidad de desarrollo, bajo consumo de RAM en Raspi |
| 2 | **Layered Architecture** | Backend (estructura interna) | Separación clara entre HTTP, negocio y datos |
| 3 | **Event-Driven / Queue-Based** | Workers (BullMQ + Redis) | Desacoplar tareas lentas del ciclo request-response |
| 4 | **Client-Server** | Sistema completo | Separación móvil/bot/web del backend único |
| 5 | **Pipes & Filters** | Pipeline de requests Fastify | Composición limpia de validación, auth y logging |

---

## 1. Monolito Modular

### Descripción

El backend de Sotang (`sotang-api`) es un único proceso Fastify que agrupa **12 módulos de negocio** con fronteras explícitas. Cada módulo es autocontenido — tiene sus propias rutas, lógica de negocio y schemas — pero **comparte** la conexión a la base de datos y los servicios de infraestructura del `core/`. Los módulos **no se llaman entre sí directamente**: la comunicación cruzada ocurre exclusivamente a través de la base de datos o de colas BullMQ.

### Justificación para Sotang

| Factor | Razón |
|--------|-------|
| **Recursos limitados** | La Raspberry Pi 5 tiene 8 GB de RAM. Microservicios implicarían múltiples runtimes Node.js. El monolito consume un solo runtime. |
| **Usuario único** | No hay necesidad de escalar módulos de forma independiente. |
| **Velocidad de desarrollo** | Sin overhead de comunicación inter-servicio ni versionado de contratos. |
| **Límites claros** | Los módulos tienen fronteras definidas, lo que facilita extraerlos como microservicios en el futuro. |

### Diagrama de estructura

```plantuml
@startuml patron-monolito-modular
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Segoe UI
skinparam ArrowColor #333333
skinparam packageBorderColor #1168bd
skinparam packageBackgroundColor #EBF4FF
skinparam nodeBorderColor #555
skinparam nodeBackgroundColor #F5F5F5
skinparam linetype ortho

package "sotang-api — Proceso único Fastify" as API {

    package "core/ — Infraestructura compartida" as CORE {
        node "config.ts — Validación env (Zod)" as CONFIG
        node "db.ts — Drizzle ORM Client (Singleton)" as DB
        node "security.ts — bcrypt · JWT utils" as SEC
        node "plugins/ — CORS · Auth · Rate Limit" as PLUG
    }

    package "modules/ — Negocio (sin dependencias cruzadas)" as MODS {
        node "auth" as M1
        node "accounts" as M2
        node "transactions" as M3
        node "budgets" as M4
        node "goals" as M5
        node "patrimony" as M6
        node "receivables" as M7
        node "reports" as M8
        node "storage" as M9
        node "notifications" as M10
        node "backup" as M11
        node "users" as M12
    }

    package "workers/ — BullMQ (proceso separado, misma imagen)" as WORK {
        node "recurring_transactions" as W1
        node "notifications" as W2
        node "crypto_prices" as W3
        node "budget_alerts" as W4
    }
}

note bottom of MODS : Módulos independientes entre sí.\nSolo se comunican a través de DB o colas Redis.

CORE --> MODS : inyecta db, jwt, config
CORE --> WORK : inyecta db, redis
MODS --> WORK : enqueue jobs (via Redis)
@enduml
```

---

## 2. Layered Architecture (Arquitectura en Capas)

### Descripción

Dentro del monolito, cada módulo sigue una **arquitectura en capas de 3 niveles**. Las capas superiores pueden llamar a las inferiores, pero nunca al revés.

```
HTTP Layer  →  Service Layer  →  Data Access Layer
(routes.ts)    (service.ts)      (Drizzle + PostgreSQL)
```

### Capas y responsabilidades

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| **HTTP Layer** | `routes.ts` | Definir endpoints, validar schema TypeBox, llamar al service |
| **Service Layer** | `service.ts` | Lógica de negocio, reglas de dominio, orquestación |
| **Data Access Layer** | `db.ts` + Drizzle | Queries SQL, transacciones, stored procedures PL/pgSQL |

### Diagrama de capas

```plantuml
@startuml patron-capas
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Segoe UI
skinparam ArrowColor #1168bd
skinparam rectangleBorderColor #555
skinparam rectangleBackgroundColor #F5F5F5
skinparam linetype ortho

rectangle "Capa 1 — HTTP (routes.ts)" as L1 #EBF4FF {
    rectangle "Recibe request HTTP\nValida schema TypeBox\nExtrae parámetros" as L1a
}

rectangle "Capa 2 — Servicio (service.ts)" as L2 #E8F5E9 {
    rectangle "Aplica reglas de negocio\nOrquesta operaciones\nEncola jobs BullMQ si es necesario" as L2a
}

rectangle "Capa 3 — Datos (Drizzle + PostgreSQL)" as L3 #FFF3E0 {
    rectangle "Ejecuta queries SQL\nLlama a funciones PL/pgSQL\nGestiona transacciones ACID" as L3a
}

L1 -down-> L2 : llama service.method(dto)
L2 -down-> L3 : db.select(), db.insert()
L3 -up-> L2 : retorna filas / resultado
L2 -up-> L1 : retorna DTO de respuesta
@enduml
```

---

## 3. Event-Driven / Queue-Based Architecture

### Descripción

Toda operación que no debe bloquear el ciclo request-response se delega a una cola BullMQ sobre Redis. El backend encola un job y responde inmediatamente. Un proceso worker separado consume la cola de forma asíncrona.

**Se aplica a**: notificaciones, transacciones recurrentes, precios cripto (CoinGecko), backup diario y alertas de presupuesto.

### Justificación para Sotang

| Factor | Razón |
|--------|-------|
| **Latencia** | El cliente no espera a que se envíe un email. La API responde en < 50ms. |
| **Resiliencia** | Si el worker falla, BullMQ reintenta automáticamente (max 3 intentos, backoff exponencial). |
| **Desacoplamiento** | El módulo de `transactions` no necesita saber cómo funciona el envío de notificaciones. |

### Diagrama de flujo

```plantuml
@startuml patron-event-driven
skinparam sequenceArrowThickness 2
skinparam sequenceParticipantBorderColor #1168bd
skinparam defaultFontName Segoe UI
skinparam backgroundColor #FAFAFA

participant "Mobile App" as APP
participant "Fastify API" as API
participant "Redis (BullMQ)" as QUEUE
participant "BullMQ Worker" as WORKER
participant "Resend / FCM / Telegram" as EXT

APP -> API : POST /transactions
API -> API : Valida, INSERT en PostgreSQL
API -> QUEUE : queue.add('send-notification', { userId, monto })
API --> APP : HTTP 201 — respuesta inmediata

QUEUE -> WORKER : Entrega job (async)
WORKER -> EXT : Envía notificación
WORKER -> QUEUE : Job completado

note over APP : No esperó al envío del email.
note over QUEUE, WORKER : Reintento automático si el worker falla.
@enduml
```

---

## 4. Client-Server

### Descripción

Sotang separa estrictamente los **clientes** (Mobile App, Telegram Bot, Web SPA en Fase 2) del **servidor** (Fastify API). La comunicación ocurre exclusivamente a través de una API REST con JSON. Los clientes no tienen acceso directo a la base de datos.

### Clientes y canales de acceso

| Cliente | Canal | Autenticación |
|---------|-------|---------------|
| Mobile App (Expo) | HTTPS via Cloudflare Tunnels | JWT Bearer (SecureStore) |
| Telegram Bot (gramMY) | HTTPS Webhook via Cloudflare | API Key interna |
| Web SPA (Fase 2) | HTTPS via Cloudflare Tunnels | JWT Cookie HttpOnly |

```plantuml
@startuml patron-client-server
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Segoe UI
skinparam ArrowColor #333333
skinparam nodeBorderColor #1168bd
skinparam nodeBackgroundColor #EBF4FF
skinparam rectangleBorderColor #555
skinparam rectangleBackgroundColor #F5F5F5
skinparam linetype ortho

package "Clientes" as CLIENTS {
    node "Mobile App\nReact Native + Expo" as MOBILE
    node "Telegram Bot\ngramMY (webhook)" as BOT_CLIENT
    node "Web SPA\nReact + Vite (Fase 2)" as WEB_CLIENT
}

package "Cloudflare Edge" as CF {
    node "Tunnel HTTPS" as TUNNEL
}

package "Raspberry Pi 5 — Servidor" as SERVER {
    node "Fastify REST API\n/api/v1/*" as API_SRV
    database "PostgreSQL 16" as DB_SRV
    database "Redis 7" as REDIS_SRV
}

MOBILE --> TUNNEL : JWT Bearer
BOT_CLIENT --> TUNNEL : API Key
WEB_CLIENT --> TUNNEL : Cookie HttpOnly
TUNNEL --> API_SRV
API_SRV --> DB_SRV
API_SRV --> REDIS_SRV

note bottom of CLIENTS : Ningún cliente accede directamente\na la base de datos.
@enduml
```

---

## 5. Pipes & Filters (Pipeline de Fastify)

### Descripción

Fastify implementa un sistema de **hooks y plugins** que forma un pipeline para cada request entrante. Si cualquier etapa falla, el request se rechaza y no continúa al handler.

### Etapas del pipeline

| Etapa (Hook Fastify) | Responsabilidad | Si falla |
|----------------------|-----------------|----------|
| `onRequest` | Rate limiting, logging de entrada | HTTP 429 |
| `preValidation` | Verificación JWT | HTTP 401 |
| `validation` | Schema TypeBox | HTTP 400 |
| `preHandler` | Lógica custom pre-handler | HTTP 4xx |
| **handler** | Lógica de negocio del módulo | — |
| `onSend` | Serialización de respuesta | — |
| `onError` | Manejo centralizado de errores | HTTP 5xx |

```plantuml
@startuml patron-pipes-filters
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Segoe UI
skinparam ArrowColor #1168bd
skinparam rectangleBorderColor #555
skinparam rectangleBackgroundColor #F5F5F5

rectangle "Request entrante" as REQ #FFECB3
rectangle "onRequest\nRate Limit · Log" as P1 #EBF4FF
rectangle "preValidation\nVerifica JWT" as P2 #EBF4FF
rectangle "validation\nTypeBox schema" as P3 #EBF4FF
rectangle "handler\nLógica de negocio" as P5 #E8F5E9
rectangle "onSend\nSerializa JSON" as P6 #EBF4FF
rectangle "Response al cliente" as RES #C8E6C9
rectangle "onError\nFormato estándar" as ERR #FFCDD2

REQ -right-> P1
P1 -right-> P2 : OK
P2 -right-> P3 : OK
P3 -right-> P5 : OK
P5 -right-> P6
P6 -right-> RES

P1 -down-> ERR : 429
P2 -down-> ERR : 401
P3 -down-> ERR : 400
P5 -down-> ERR : 500
@enduml
```

---

## Relación entre los cinco patrones

```plantuml
@startuml relacion-patrones
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Segoe UI
skinparam ArrowColor #333333
skinparam rectangleBorderColor #1168bd
skinparam rectangleBackgroundColor #EBF4FF

rectangle "Client-Server\n(separación cliente / servidor)" as CS
rectangle "Monolito Modular\n(organización del servidor)" as MM
rectangle "Layered Architecture\n(estructura interna de cada módulo)" as LA
rectangle "Pipes & Filters\n(pipeline de requests)" as PF
rectangle "Event-Driven\n(operaciones asíncronas)" as ED

CS -down-> MM : El servidor es un Monolito Modular
MM -down-> LA : Cada módulo sigue arquitectura en capas
MM -right-> PF : Los requests pasan por el pipeline
LA -right-> ED : La capa de servicio encola jobs BullMQ
@enduml
```
