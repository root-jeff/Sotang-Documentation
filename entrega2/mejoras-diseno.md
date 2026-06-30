# Técnicas para Mejorar el Diseño — Sotang

Las técnicas propuestas están **directamente motivadas** por los hallazgos del análisis de métricas y el análisis formal. Cada mejora responde a un problema concreto identificado en el diseño actual.

---

## Resumen

| # | Técnica | Problema que resuelve | Mejora principal |
|---|---------|----------------------|-----------------|
| 1 | **Refactorización del Factory** | `AccountFactory.create()` con V(G) = 7 | Complejidad ciclomática ↓ |
| 2 | **Capa de Adapters explícita** | SDKs externos acoplados al worker | Acoplamiento ↓, testabilidad ↑ |
| 3 | **Principio Abierto/Cerrado (OCP)** | Agregar funcionalidad modifica clases existentes | Extensibilidad ↑ |
| 4 | **Inyección de dependencias** | Servicios no probables sin infraestructura real | Testabilidad ↑ |
| 5 | **SRP en workers** | Un método hace todo en el worker | Cohesión ↑, V(G) ↓ |

---

## Técnica 1 — Refactorización: tabla de constructores en AccountFactory

### Problema

`AccountFactory.create()` usa un `switch/case` con 6 ramas → **V(G) = 7**. Cada tipo de cuenta nuevo exige **modificar** el factory, violando el Principio Abierto/Cerrado.

```typescript
// ❌ Antes — V(G) sube con cada tipo nuevo
static create(dto: CreateAccountDto): IAccount {
  switch (dto.type) {
    case 'bank':        return new BankAccount(dto);
    case 'credit_card': return new CreditCardAccount(dto);
    case 'savings':     return new SavingsAccount(dto);
    case 'cash':        return new CashAccount(dto);
    case 'crypto':      return new CryptoWallet(dto);
    case 'investment':  return new InvestmentAccount(dto);
  }
}
```

### Técnica: tabla de constructores (registro declarativo)

```typescript
// ✅ Después — extensión sin modificación
type AccountConstructor = new (dto: CreateAccountDto) => IAccount;

const ACCOUNT_REGISTRY: Record<AccountType, AccountConstructor> = {
  bank:        BankAccount,
  credit_card: CreditCardAccount,
  savings:     SavingsAccount,
  cash:        CashAccount,
  crypto:      CryptoWallet,
  investment:  InvestmentAccount,
  // Nuevo tipo: solo agregar aquí
};

export class AccountFactory {
  static create(dto: CreateAccountDto): IAccount {
    const Constructor = ACCOUNT_REGISTRY[dto.type];
    if (!Constructor) throw new Error(`Tipo desconocido: ${dto.type}`);
    return new Constructor(dto);
  }
}
```

### Impacto

| Métrica | Antes | Después |
|---------|:---:|:---:|
| V(G) de `create()` | 7 | **2** |
| Modificaciones al factory por tipo nuevo | 1 | **0** |
| ¿Tipo mock en tests? | No | **Sí** |

---

## Técnica 2 — Capa `adapters/` explícita

### Problema

El worker llama directamente a los SDKs externos (Resend, Firebase, Telegram), generando **CBO elevado** y haciendo imposible probarlo sin conectarse a esos servicios.

```typescript
// ❌ Antes — acoplado a SDKs concretos
class NotificationWorker {
  async process(job: Job) {
    if (job.data.channel === 'email') {
      await resend.emails.send({ ... });        // SDK directo
    } else if (job.data.channel === 'push') {
      await admin.messaging().send({ ... });    // SDK directo
    }
  }
}
```

### Técnica: encapsular SDKs en carpeta `adapters/`

```
workers/
├── notifications.worker.ts     ← solo lógica de orquestación
└── adapters/
    ├── resend.adapter.ts       ← encapsula Resend SDK
    ├── firebase.adapter.ts     ← encapsula Firebase Admin
    └── telegram.adapter.ts     ← encapsula gramMY Bot API
```

```typescript
// ✅ Después — worker desacoplado
class NotificationWorker {
  constructor(private providers: Map<string, INotificationProvider>) {}

  async process(job: Job) {
    const provider = this.providers.get(job.data.channel);
    await provider.send(job.data);  // contrato único
  }
}
```

### Impacto

| Métrica | Antes | Después |
|---------|:---:|:---:|
| CBO del NotificationWorker | 4 | **1** |
| ¿Testeable sin enviar emails reales? | No | **Sí** |
| ¿Cambiar Resend por SendGrid toca el worker? | Sí | **No** |

---

## Técnica 3 — Principio Abierto/Cerrado (OCP) en módulos

### Problema

Agregar un nuevo tipo de reporte (ej: "reporte de patrimonio en PDF") exige **modificar** `ReportsService` para añadir un nuevo bloque condicional.

### Técnica: interfaces + registro de generadores

```typescript
// Interfaz cerrada a modificación
interface IReportGenerator {
  generate(userId: string, params: ReportParams): Promise<Buffer>;
  getType(): ReportType;
}

// Nuevo reporte = nueva clase, sin tocar el servicio
class TransactionsPdfGenerator implements IReportGenerator { ... }
class BudgetExcelGenerator   implements IReportGenerator { ... }
class PatrimonyPdfGenerator  implements IReportGenerator { ... }

// Servicio cerrado a modificación, abierto a extensión
class ReportsService {
  private generators = new Map<ReportType, IReportGenerator>();

  register(generator: IReportGenerator) {
    this.generators.set(generator.getType(), generator);
  }

  async generate(type: ReportType, userId: string, params: ReportParams) {
    return this.generators.get(type)!.generate(userId, params);
  }
}
```

Esta técnica es la extensión natural del patrón **Strategy** y **Factory Method** ya documentados: los patrones proveen la estructura; OCP establece el principio que los motiva.

---

## Técnica 4 — Inyección de dependencias en servicios

### Problema

Si `TransactionsService` instancia internamente su cliente de BD (`const db = DrizzleClient.getInstance()`), es **imposible reemplazarla por un mock** en pruebas unitarias.

```typescript
// ❌ Antes — dependencia interna, no reemplazable
class TransactionsService {
  private db = DrizzleClient.getInstance(); // acoplado al Singleton
}
```

### Técnica: inyección por constructor

```typescript
// ✅ Después — dependencia inyectada, reemplazable en tests
class TransactionsService {
  constructor(
    private db: DrizzleDB,         // producción: instancia real
    private notifQueue: Queue,     // tests: mock de Queue
    private budgetQueue: Queue,
  ) {}
}

// En producción (Fastify plugin):
fastify.decorate('transactionsService',
  new TransactionsService(db, notifQueue, budgetQueue)
);

// En tests:
const service = new TransactionsService(mockDb, mockQueue, mockQueue);
```

### Impacto

| Aspecto | Antes | Después |
|---------|:---:|:---:|
| ¿Testeable sin PostgreSQL? | No | **Sí** |
| Dependencias visibles | Ocultas | **Explícitas en constructor** |

---

## Técnica 5 — Separación de responsabilidades (SRP) en workers

### Problema

`RecurringTxnWorker.process()` mezcla tres responsabilidades: leer la transacción, decidir si ejecutarla y crearla. Esto genera **V(G) ≈ 6** y hace el método difícil de probar.

```typescript
// ❌ Antes — un método hace todo
async process(job: Job) {
  const txn = await db.query(...);          // responsabilidad 1: leer
  if (txn.nextDate <= new Date()) {          // responsabilidad 2: decidir
    await db.insert(transactions, { ... }); // responsabilidad 3: ejecutar
    await db.update(accounts, { ... });
    txn.nextDate = calcNext(txn.frequency);
    await db.update(recurring, { nextDate });
  }
}
```

### Técnica: descomposición en métodos cohesivos

```typescript
// ✅ Después — cada método tiene una sola razón de cambio
async process(job: Job) {
  const txn = await this.fetchRecurring(job.data.txnId);  // 1. leer
  if (!this.isDue(txn)) return;                            // 2. decidir
  await this.executeTransaction(txn);                      // 3. ejecutar
}

private fetchRecurring(id: string): Promise<RecurringTxn> { ... }
private isDue(txn: RecurringTxn): boolean { ... }
private executeTransaction(txn: RecurringTxn): Promise<void> { ... }
```

### Impacto

| Métrica | Antes | Después |
|---------|:---:|:---:|
| V(G) de `process()` | ~6 | **2** |
| ¿`isDue()` testeable aislado? | No | **Sí** |

---

## Síntesis: atributos de calidad mejorados

| Atributo de calidad | T1 | T2 | T3 | T4 | T5 |
|---------------------|:---:|:---:|:---:|:---:|:---:|
| Mantenibilidad | ✅ | ✅ | ✅ | | ✅ |
| Extensibilidad | ✅ | ✅ | ✅ | | |
| Testabilidad | ✅ | ✅ | | ✅ | ✅ |
| Acoplamiento ↓ | | ✅ | ✅ | ✅ | |
| Cohesión ↑ | | | | | ✅ |
