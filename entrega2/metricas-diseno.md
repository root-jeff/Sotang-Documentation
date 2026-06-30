# Evaluación del Diseño — Métricas

La evaluación del diseño de Sotang aplica **métricas cuantitativas** sobre los modelos de clases de los patrones de diseño, permitiendo detectar riesgos antes de escribir código. Se aplican métricas de la **CK Metrics Suite** (Chidamber & Kemerer) complementadas con métricas de tamaño y complejidad ciclomática de McCabe.

---

## 1. Métricas de tamaño (NC y WMC)

### NC — Número de Clases

| Capa / Módulo | Clases estimadas |
|---------------|:---:|
| Patrones creacionales (Singleton, Factory) | 7 |
| Patrones estructurales (Decorator, Adapter, Composite) | 10 |
| Patrones de comportamiento (Observer, Strategy, State) | 13 |
| Módulos de negocio (routes + service × 12) | 24 |
| **Total estimado** | **~54** |

**Interpretación**: 54 clases es razonable para un monolito con 12 módulos y 8 patrones. Un sistema con < 20 clases sería insuficiente; > 150 sin organización indicaría complejidad incontrolada.

### WMC — Weighted Methods per Class

Cuenta los métodos públicos por clase (complejidad uniforme = 1 por método). **Umbral de alerta: WMC > 14 (God Class)**.

| Clase | WMC | Evaluación |
|-------|:---:|---|
| `RecurringTransaction` | 6 | Aceptable — clase central del dominio |
| `AuthService` | 4 | Bajo — bien delimitada |
| `AccountFactory` | 1 | Muy bajo — responsabilidad única |
| `NotificationWorker` | 2 | Bajo — delega en adapters |
| `AccountGroup` | 6 | Aceptable — complejidad de negocio (cupo compartido) |
| `AuthDecorator` | 2 | Bajo — hace una sola cosa |

**Ninguna clase supera el umbral de 14.**

---

## 2. Complejidad ciclomática de McCabe — V(G)

**V(G) = 1 + número de decisiones lógicas** (`if`, `else if`, `case`, `while`, `for`).

> Escala: V(G) 1-4 → bajo riesgo · 5-10 → moderado · > 10 → alto riesgo

| Función | Cálculo | V(G) | Evaluación |
|---------|---------|:---:|---|
| `AccountFactory.create()` | 6 casos `switch` + 1 default | **7** | Moderado. Acción correctiva: tabla de constructores |
| `AuthDecorator.handle()` | 1 bloque `try/catch` | **2** | Bajo ✅ |
| `NotificationWorker.selectProvider()` | 3 tipos de notificación | **4** | Bajo ✅ |
| `RecurringTransaction.execute()` | Verifica estado + fecha + siguiente ocurrencia | **4** | Bajo ✅ — el patrón State absorbe la complejidad |

**El patrón State** es especialmente efectivo: sin él, `execute()` tendría una cadena de `if (estado === X)` que elevaría V(G) a ~10.

---

## 3. CK Suite — Acoplamiento (CBO)

**CBO** mide cuántas clases externas usa una clase dada. **CBO bajo = mayor independencia y facilidad de cambio.**

| Clase | Dependencias externas | CBO | Evaluación |
|-------|---|:---:|---|
| `TransactionsService` | `DrizzleDB`, `RedisQueue` ×2, `IRecurringState` | **4** | Aceptable |
| `NotificationWorker` | `INotificationProvider`, `RedisQueue`, `DrizzleDB` | **3** | Bajo ✅ |
| `AuthService` | `IAuthStrategy`, `JwtService`, `Redis` | **3** | Bajo ✅ |
| `AccountGroup` | `IAccountComponent` | **1** | Muy bajo ✅ |
| `AuthDecorator` | `IRouteHandler`, `JwtService` | **2** | Bajo ✅ |
| `AccountFactory` | `IAccount` + 4 subclases | **5** | Moderado — esperado en un Factory |

> **Umbral de alerta: CBO > 7.** Ninguna clase lo supera.

**Observación**: El `TransactionsService` tiene CBO = 4 porque encola en dos colas distintas. Sin el patrón Observer, el CBO sería aún mayor (llamaría directamente a los workers).

---

## 4. CK Suite — Cohesión (LCOM)

**LCOM** mide si los métodos de una clase comparten los mismos atributos. **LCOM = 0** indica cohesión perfecta.

| Clase | Atributo central | LCOM | Evaluación |
|-------|-----------------|:---:|---|
| `RecurringTransaction` | `state` — todos los métodos delegan en él | **0** | Alta cohesión ✅ |
| `AccountGroup` | `children` — todos los métodos operan sobre él | **0** | Alta cohesión ✅ |
| `AuthService` | `strategy` — todos los métodos delegan en ella | **0** | Alta cohesión ✅ |
| `AccountFactory` | Sin estado (factory estático) | **N/A** | — |

LCOM = 0 en todas las clases de comportamiento es resultado directo de los patrones State, Composite y Strategy.

---

## 5. Métricas de herencia (DIT y NOC)

### DIT — Depth of Inheritance Tree

**DIT alto complica la comprensión.** En Sotang todas las jerarquías son planas:

| Jerarquía | DIT |
|-----------|:---:|
| `IAccount` → `CreditCardAccount` | **1** |
| `IRecurringState` → `PendingState` | **1** |
| `IAuthStrategy` → `MobileAuthStrategy` | **1** |
| `IRouteHandler` → `AuthDecorator` → handler concreto | **2** |

El diseño favorece **composición sobre herencia** — DIT = 1 en todas las jerarquías principales.

### NOC — Number of Children

| Interface | NOC |
|-----------|:---:|
| `IAccount` | 4 |
| `IRecurringState` | 5 (un estado por etapa del dominio) |
| `IAuthStrategy` | 2 |
| `INotificationProvider` | 3 |

`IRecurringState` con NOC = 5 es el valor más alto, pero cada estado representa una etapa real del ciclo de vida — no es inflación artificial.

---

## 6. Encapsulamiento (IHF)

**IHF = % de atributos privados** sobre el total de atributos del sistema.

| Clase | Atributos privados / Total | IHF |
|-------|:---:|:---:|
| `DrizzleClient` | 3/3 | 100% |
| `AuthDecorator` | 2/2 | 100% |
| `AccountGroup` | 2/2 | 100% |
| `AuthService` | 1/1 | 100% |
| **Promedio** | — | **~100%** |

IHF = 100% refleja que todos los patrones siguen encapsulamiento estricto — los clientes solo interactúan con la interfaz pública.

---

## 7. Resumen consolidado

| Clase | WMC | CBO | LCOM | DIT | V(G) | Riesgo |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| `DrizzleClient` | 2 | 0 | 0 | 0 | 1 | 🟢 Bajo |
| `AccountFactory` | 1 | 5 | N/A | 0 | 7 | 🟡 Moderado |
| `AuthDecorator` | 2 | 2 | 0 | 1 | 2 | 🟢 Bajo |
| `NotificationWorker` | 2 | 3 | 0 | 0 | 4 | 🟢 Bajo |
| `AccountGroup` | 6 | 1 | 0 | 1 | 2 | 🟢 Bajo |
| `AuthService` | 4 | 3 | 0 | 0 | 2 | 🟢 Bajo |
| `RecurringTransaction` | 6 | 1 | 0 | 0 | 4 | 🟢 Bajo |
| `TransactionsService` | 6 | 4 | 0 | 0 | 3 | 🟢 Bajo |

### Acciones correctivas identificadas

| Hallazgo | Métrica | Propuesta |
|----------|---------|-----------|
| `AccountFactory.create()` V(G) = 7, crecerá con cada tipo nuevo | V(G), CBO | Reemplazar `switch` por tabla de constructores `Record<AccountType, Constructor>` → V(G) baja a 2 |
| `TransactionsService` CBO = 4 por dos colas | CBO | Ya mitigado por el patrón Observer; no requiere acción inmediata |
