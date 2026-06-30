# Patrones de Diseño (GoF) — Sotang

Sotang aplica **8 patrones de diseño GoF** distribuidos en 4 grupos de módulos. Cada patrón responde a un problema concreto del sistema — no son decorativos. Se presenta el problema, la solución aplicada y el diagrama de clases UML.

---

## Índice de patrones

| # | Patrón | Categoría GoF | Módulo / Capa |
|---|--------|:---:|---|
| 1 | **Singleton** | Creacional | `core/db.ts` |
| 2 | **Factory Method** | Creacional | `modules/accounts/` |
| 3 | **Decorator** | Estructural | `plugins/auth.ts` |
| 4 | **Adapter** | Estructural | `workers/notifications.ts` |
| 5 | **Composite** | Estructural | `modules/accounts/` (cupos compartidos) |
| 6 | **Observer** | Comportamiento | `workers/` (BullMQ + Redis) |
| 7 | **Strategy** | Comportamiento | `modules/auth/` |
| 8 | **State** | Comportamiento | `modules/transactions/` |

---

## Patrón 1 — Singleton (`core/db.ts`)

**Problema**: Si cada módulo creara su propia instancia del pool de conexiones a PostgreSQL, se abrirían decenas de pools simultáneos, agotando la memoria de la Raspberry Pi.

**Solución**: `db.ts` crea el pool **una sola vez** al arrancar el proceso y lo exporta como objeto inmutable. Todos los módulos importan la misma referencia.

```typescript
// core/db.ts
const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });
// Los módulos hacen: import { db } from '@/core/db'
```

```plantuml
@startuml patron-singleton
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333

class DrizzleClient {
    - instance: DrizzleClient
    - pool: Pool
    - db: DrizzleDB
    --
    - constructor(connectionString: string)
    + {static} getInstance(): DrizzleDB
}

class TransactionsService {
    - db: DrizzleDB
}

class AccountsService {
    - db: DrizzleDB
}

class BudgetAlertWorker {
    - db: DrizzleDB
}

DrizzleClient ..> TransactionsService : «instancia única»
DrizzleClient ..> AccountsService : «instancia única»
DrizzleClient ..> BudgetAlertWorker : «instancia única»
@enduml
```

---

## Patrón 2 — Factory Method (`modules/accounts/`)

**Problema**: Sotang maneja 6 tipos de cuenta con comportamientos distintos (bancaria, tarjeta de crédito, ahorro virtual, efectivo, criptowallet, inversión). Crear cada tipo con condicionales en el servicio mezcla responsabilidades.

**Solución**: `AccountFactory` decide qué objeto Account instanciar según el `tipo`, devolviendo siempre una interfaz común `IAccount`.

```plantuml
@startuml patron-factory-method
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333
skinparam linetype ortho

interface IAccount {
    + id: string
    + name: string
    + balance: number
    --
    + getBalance(): number
    + getDisplayType(): string
    + validateTransaction(amount: number): boolean
}

class AccountFactory {
    + {static} create(dto: CreateAccountDto): IAccount
}

class BankAccount {
    + bankName: string
    --
    + getBalance(): number
    + getDisplayType(): string
    + validateTransaction(amount: number): boolean
}

class CreditCardAccount {
    + creditLimit: number
    + cutoffDay: number
    --
    + getBalance(): number
    + getRemainingCredit(): number
    + getDisplayType(): string
    + validateTransaction(amount: number): boolean
}

class CryptoWallet {
    + network: string
    --
    + getBalance(): number
    + getBalanceInUSD(price: number): number
    + getDisplayType(): string
    + validateTransaction(amount: number): boolean
}

IAccount <|.. BankAccount
IAccount <|.. CreditCardAccount
IAccount <|.. CryptoWallet

AccountFactory ..> IAccount : «crea»
@enduml
```

---

## Patrón 3 — Decorator (`plugins/auth.ts`)

**Problema**: La verificación JWT no debe repetirse en cada handler de cada módulo — sería duplicación masiva y un riesgo de seguridad.

**Solución**: El plugin de autenticación de Fastify actúa como Decorator: envuelve el routing y añade verificación JWT a cualquier ruta que declare `{ onRequest: [fastify.authenticate] }`, sin modificar el handler original.

```plantuml
@startuml patron-decorator
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333

interface IRouteHandler {
    + handle(request: Request, reply: Reply): Promise<void>
}

class AuthDecorator {
    - wrappedHandler: IRouteHandler
    - jwtService: JwtService
    --
    + handle(request: Request, reply: Reply): Promise<void>
    - verifyToken(request: Request): User
}

class TransactionsHandler {
    + handle(request: Request, reply: Reply): Promise<void>
}

class AccountsHandler {
    + handle(request: Request, reply: Reply): Promise<void>
}

IRouteHandler <|.. AuthDecorator
IRouteHandler <|.. TransactionsHandler
IRouteHandler <|.. AccountsHandler
AuthDecorator o--> IRouteHandler : wraps

note bottom of AuthDecorator : Verifica JWT e inyecta user\nantes de delegar al handler real.
@enduml
```

---

## Patrón 4 — Adapter (`workers/notifications.ts`)

**Problema**: Sotang usa tres proveedores de notificaciones (Resend, Firebase FCM, Telegram Bot API) con SDKs e interfaces incompatibles entre sí.

**Solución**: Se define una interfaz interna `INotificationProvider` y se crea un Adapter por cada proveedor. El worker solo conoce `INotificationProvider`.

```plantuml
@startuml patron-adapter
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333
skinparam linetype ortho

interface INotificationProvider {
    + send(notification: Notification): Promise<void>
    + isAvailable(): boolean
}

class NotificationWorker {
    - providers: INotificationProvider[]
    --
    + process(job: NotificationJob): Promise<void>
}

class ResendAdapter {
    - resendClient: ResendSDK
    --
    + send(notification: Notification): Promise<void>
    + isAvailable(): boolean
}

class FirebaseAdapter {
    - firebaseAdmin: FirebaseAdmin
    --
    + send(notification: Notification): Promise<void>
    + isAvailable(): boolean
}

class TelegramAdapter {
    - bot: GrammyBot
    --
    + send(notification: Notification): Promise<void>
    + isAvailable(): boolean
}

INotificationProvider <|.. ResendAdapter
INotificationProvider <|.. FirebaseAdapter
INotificationProvider <|.. TelegramAdapter
NotificationWorker --> INotificationProvider : usa
@enduml
```

---

## Patrón 5 — Composite (`modules/accounts/` — cupos compartidos)

**Problema**: Las tarjetas Diners Club y Titanium comparten un cupo único de $900. Un modelo plano de cuentas independientes no puede expresar esta relación.

**Solución**: `AccountGroup` contiene sub-cuentas y delega `getRemainingCredit()` al grupo, que suma el uso de todas sus hijas.

```plantuml
@startuml patron-composite
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333

interface IAccountComponent {
    + getBalance(): number
    + getRemainingCredit(): number
    + getDisplayType(): string
}

class CreditCardAccount {
    + creditLimit: number
    + usedAmount: number
    --
    + getBalance(): number
    + getRemainingCredit(): number
    + getDisplayType(): string
}

class AccountGroup {
    - children: IAccountComponent[]
    - sharedLimit: number
    --
    + add(account: IAccountComponent): void
    + remove(account: IAccountComponent): void
    + getRemainingCredit(): number
    + getTotalUsed(): number
    + getDisplayType(): string
}

IAccountComponent <|.. CreditCardAccount
IAccountComponent <|.. AccountGroup
AccountGroup o--> IAccountComponent : children

note right of AccountGroup : Diners + Titanium = $900 compartidos\nRemainingCredit = 900 - Σ usado
@enduml
```

---

## Patrón 6 — Observer (`workers/` — BullMQ)

**Problema**: Cuando se registra una transacción, múltiples partes del sistema deben reaccionar (presupuesto, notificación, metas). Llamar directamente a cada servicio genera acoplamiento fuerte.

**Solución**: BullMQ + Redis actúan como bus de eventos. El servicio publica un job; los workers son suscriptores independientes que reaccionan sin que el servicio los conozca.

```plantuml
@startuml patron-observer
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333
skinparam linetype ortho

interface IJobObserver {
    + process(job: Job): Promise<void>
    + getQueueName(): string
}

class TransactionsService {
    - notificationsQueue: Queue
    - budgetQueue: Queue
    --
    + create(dto: CreateTxnDto): Promise<Transaction>
}

class RedisQueue {
    + add(name: string, data: object): Promise<Job>
    + process(name: string, handler: Function): void
}

class NotificationWorker {
    + process(job: Job): Promise<void>
    + getQueueName(): string
}

class BudgetAlertWorker {
    + process(job: Job): Promise<void>
    + getQueueName(): string
}

IJobObserver <|.. NotificationWorker
IJobObserver <|.. BudgetAlertWorker

TransactionsService --> RedisQueue : «publica eventos»
RedisQueue --> NotificationWorker : «entrega job»
RedisQueue --> BudgetAlertWorker : «entrega job»

note bottom of RedisQueue : BullMQ + Redis = Event Bus\nentre Subject y Observers.
@enduml
```

---

## Patrón 7 — Strategy (`modules/auth/`)

**Problema**: La autenticación necesita dos comportamientos distintos: móvil (tokens en body JSON, guardados en SecureStore) y web (refresh token en Cookie HttpOnly, nunca accesible desde JS).

**Solución**: Cada estrategia se encapsula en su clase. El servicio de auth delega a la estrategia correcta según el parámetro `client` del request.

```plantuml
@startuml patron-strategy
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333

interface IAuthStrategy {
    + issueTokens(user: User, reply: Reply): Promise<AuthResponse>
    + validateRefresh(token: string): Promise<User>
    + revokeTokens(token: string, reply: Reply): Promise<void>
}

class AuthService {
    - strategy: IAuthStrategy
    --
    + login(dto: LoginDto, reply: Reply): Promise<AuthResponse>
    + refresh(token: string): Promise<AuthResponse>
    + logout(token: string, reply: Reply): Promise<void>
}

class MobileAuthStrategy {
    + issueTokens(user: User, reply: Reply): Promise<AuthResponse>
    + validateRefresh(token: string): Promise<User>
    + revokeTokens(token: string, reply: Reply): Promise<void>
}

class WebAuthStrategy {
    + issueTokens(user: User, reply: Reply): Promise<AuthResponse>
    + validateRefresh(token: string): Promise<User>
    + revokeTokens(token: string, reply: Reply): Promise<void>
}

IAuthStrategy <|.. MobileAuthStrategy
IAuthStrategy <|.. WebAuthStrategy
AuthService --> IAuthStrategy : delega según client=

note right of MobileAuthStrategy : Tokens en body JSON.\nCliente guarda en SecureStore.
note right of WebAuthStrategy : refreshToken en Cookie HttpOnly.\nNo accesible desde JavaScript.
@enduml
```

---

## Patrón 8 — State (`modules/transactions/` — recurrentes)

**Problema**: Las transacciones recurrentes pasan por múltiples estados con reglas estrictas de transición. Sin un modelo de estados, el código acumula condicionales complejos dispersos.

**Solución**: Cada estado es una clase que define qué transiciones son válidas. `RecurringTransaction` delega el comportamiento a su estado actual.

```plantuml
@startuml patron-state
skinparam backgroundColor #FAFAFA
skinparam classBackgroundColor #EBF4FF
skinparam classBorderColor #1168bd
skinparam ArrowColor #333333
skinparam linetype ortho

interface IRecurringState {
    + schedule(txn: RecurringTransaction): void
    + notify(txn: RecurringTransaction): void
    + execute(txn: RecurringTransaction): void
    + cancel(txn: RecurringTransaction): void
    + getStatus(): string
}

class RecurringTransaction {
    - id: string
    - amount: number
    - nextDate: Date
    - state: IRecurringState
    --
    + schedule(): void
    + notify(): void
    + execute(): void
    + cancel(): void
    + setState(state: IRecurringState): void
}

class ConfiguredState { + getStatus(): string }
class PendingState    { + getStatus(): string }
class NotifiedState   { + getStatus(): string }
class ExecutedState   { + getStatus(): string }
class CancelledState  { + getStatus(): string }

IRecurringState <|.. ConfiguredState
IRecurringState <|.. PendingState
IRecurringState <|.. NotifiedState
IRecurringState <|.. ExecutedState
IRecurringState <|.. CancelledState

RecurringTransaction --> IRecurringState : estado actual

ConfiguredState ..> PendingState  : schedule()
PendingState    ..> NotifiedState : notify() — 1 día antes
NotifiedState   ..> ExecutedState : execute() — en fecha
NotifiedState   ..> CancelledState : cancel()
ExecutedState   ..> PendingState  : siguiente ocurrencia
@enduml
```

---

## Mapa de patrones sobre la arquitectura

```plantuml
@startuml mapa-patrones
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Segoe UI
skinparam ArrowColor #333333
skinparam packageBorderColor #1168bd
skinparam packageBackgroundColor #EBF4FF
skinparam nodeBorderColor #555
skinparam nodeBackgroundColor #F5F5F5
skinparam linetype ortho

package "core/" {
    node "db.ts\n«Singleton» [1]" as P1
}
package "plugins/" {
    node "auth.ts\n«Decorator» [3]" as P3
}
package "modules/auth/" {
    node "AuthService\n«Strategy» [7]" as P7
}
package "modules/accounts/" {
    node "AccountFactory\n«Factory Method» [2]" as P2
    node "AccountGroup\n«Composite» [5]" as P5
}
package "modules/transactions/" {
    node "RecurringTransaction\n«State» [8]" as P8
}
package "workers/" {
    node "Queue + Workers\n«Observer» [6]" as P6
    node "NotificationWorker\n«Adapter» [4]" as P4
}

P1 --> "modules/auth/"
P1 --> "modules/accounts/"
P1 --> "modules/transactions/"
P1 --> "workers/"
P3 --> "modules/auth/"
@enduml
```
