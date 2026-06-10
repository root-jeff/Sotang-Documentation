# Patrones de Diseño — Módulo de Cuentas
### Proyecto Sotang · Arquitectura de Software

> Este documento aplica **5 patrones GoF**al módulo `accounts/` de Sotang, un backend de finanzas personales construido con **FastAPI + Python**. Para cada patrón se muestra el problema real, el código problemático *antes* del patrón, y la solución implementada.



## Contexto del Problema

El módulo de cuentas no es trivial. La base de datos usa una arquitectura de **composición relacional**:

```
┌─────────────────────────────────────────────────────┐
│                  TABLA BASE: cuentas                │
│   id | usuario_id | tipo | saldo_actual | ...       │
└──────────────┬──────────────────────────────────────┘
               │
       ┌───────┼──────────────────────┐
       ▼       ▼                      ▼
┌──────────┐ ┌─────────────┐ ┌───────────────────────┐
│tarjetas_ │ │cripto_      │ │ahorro_virtual_        │
│config    │ │config       │ │config                 │
│          │ │             │ │                       │
│fecha_    │ │simbolo      │ │meta_monto             │
│corte     │ │cantidad     │ │fecha_objetivo         │
│limite    │ │precio_usd   │ │...                    │
└──────────┘ └─────────────┘ └───────────────────────┘
```

Cada tipo de cuenta tiene **tablas satélite distintas**. Eso complica la creación, el cálculo y la comunicación entre módulos — exactamente el escenario que los patrones de diseño están hechos para resolver.



## Resumen de los 5 Patrones

| # | Patrón | Categoría | Problema que resuelve |
|---|---------|------------|----------------------|
| 1 | Factory Method | Creacional | Crear distintos tipos de cuenta sin acoplar el controlador |
| 2 | Strategy | Comportamiento | Calcular el patrimonio neto con lógica distinta por tipo |
| 3 | Facade | Estructural | Simplificar el endpoint del dashboard para el frontend |
| 4 | Adapter | Estructural | Aislar la dependencia con APIs externas de precios cripto |
| 5 | Observer | Comportamiento | Desacoplar módulos que reaccionan a nuevas transacciones |



## 1. Factory Method — Patrón Creacional

### Concepto
> Define una interfaz para crear un objeto, pero **deja que las subclases decidan qué clase instanciar**. Extrae la lógica de creación fuera del código cliente.

### El problema real

Cuando el usuario registra una cuenta nueva, el `POST /api/v1/accounts/` recibe un payload distinto según el tipo:

- **banco**→ solo insertar en `cuentas`
- **tarjeta**→ insertar en `cuentas` + `tarjetas_config`
- **cripto**→ insertar en `cuentas` + `cripto_config` + obtener UUID con `flush()`

**Sin patrón — el controlador sabe demasiado:**

```python
# router.py — ANTES (código acoplado y frágil)
@router.post("/")
def create_new_account(payload: AccountCreateSchema, db: Session = Depends(get_db)):
    if payload.tipo == "banco":
        db_account = Cuenta(usuario_id=user.id, tipo="banco", saldo_actual=payload.saldo)
        db_session.add(db_account)

    elif payload.tipo == "cripto":
        db_account = Cuenta(usuario_id=user.id, tipo="cripto")
        db_session.add(db_account)
        db_session.flush()  # ← El router ahora sabe de flush() y de UUIDs
        db_crypto = CriptoConfig(cuenta_id=db_account.id, simbolo=payload.simbolo)
        db_session.add(db_crypto)

    elif payload.tipo == "tarjeta":
        # ... más lógica acoplada
        pass

    # Cada nuevo tipo de cuenta → modificar este archivo
    db.commit()
    return db_account
```

> **El problema:**El controlador viola el *Single Responsibility Principle*. Conoce las tablas, el orden de los inserts, y el `flush()`. Agregar un nuevo tipo de cuenta obliga a editar el router.



**Con Factory Method — el router queda limpio:**

```python
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session

# 1. Interfaz del Creador
class AccountCreator(ABC):
    @abstractmethod
    def create_account(self, db_session: Session, account_data: dict, user_id: str):
        """Crea la cuenta y sus dependencias en la base de datos"""
        pass

# 2. Creadores Concretos
class BankAccountCreator(AccountCreator):
    def create_account(self, db_session: Session, account_data: dict, user_id: str):
        db_account = Cuenta(
            usuario_id=user_id,
            tipo="banco",
            saldo_actual=account_data.get('saldo', 0)
        )
        db_session.add(db_account)
        return db_account

class CryptoAccountCreator(AccountCreator):
    def create_account(self, db_session: Session, account_data: dict, user_id: str):
        # Paso 1: insertar cuenta base
        db_account = Cuenta(usuario_id=user_id, tipo="cripto")
        db_session.add(db_account)
        db_session.flush()  # ← la complejidad queda AQUÍ, no en el router

        # Paso 2: insertar config específica
        db_crypto = CriptoConfig(
            cuenta_id=db_account.id,
            simbolo=account_data['simbolo'],
            cantidad=account_data['cantidad']
        )
        db_session.add(db_crypto)
        return db_account

# 3. La Fábrica
class AccountFactory:
    @staticmethod
    def get_creator(account_type: str) -> AccountCreator:
        creators = {
            "banco":          BankAccountCreator(),
            "cripto":         CryptoAccountCreator(),
            # "tarjeta":      CreditCardAccountCreator(),   ← agregar tipo nuevo = una línea
            # "ahorro_virtual": VirtualSavingsCreator()
        }
        creator = creators.get(account_type)
        if not creator:
            raise ValueError(f"Tipo de cuenta no soportado: {account_type}")
        return creator

# Router — ahora ignora completamente cómo se crea cada cuenta
@router.post("/")
def create_new_account(payload: AccountCreateSchema, db: Session = Depends(get_db)):
    creator = AccountFactory.get_creator(payload.tipo)   # ← una línea
    account = creator.create_account(db, payload.model_dump(), current_user.id)
    db.commit()
    return account
```

### Flujo visual

```
POST /accounts  {tipo: "cripto", simbolo: "BTC", ...}
       │
       ▼
AccountFactory.get_creator("cripto")
       │
       ▼
CryptoAccountCreator.create_account(db, data, user_id)
       │
       ├── INSERT → tabla "cuentas"  (id: uuid-123)
       ├── flush() → obtiene UUID
       └── INSERT → tabla "cripto_config" (cuenta_id: uuid-123)
```

### Por qué no Abstract Factory
> Abstract Factory crea **familias**de objetos relacionados. Aquí solo hay un producto: la cuenta. No necesitamos un factory para la cuenta + su repositorio + su validador al mismo tiempo. Factory Method es la solución más simple que resuelve el problema.



## 2. Strategy — Patrón de Comportamiento

### Concepto
> Define una **familia de algoritmos**, encapsula cada uno como un objeto y los hace **intercambiables**. El algoritmo varía independientemente del cliente que lo usa.

### El problema real

El Dashboard necesita calcular el **Patrimonio Neto**sumando todas las cuentas del usuario. Pero cada tipo tiene una lógica distinta:

| Tipo de cuenta | Lógica de cálculo |
|----------------|-------------------|
| Banco / ahorro | `+saldo_actual` (valor positivo) |
| Tarjeta de crédito | `-saldo_actual` (es una deuda) |
| Cripto | `cantidad × precio_actual_usd` |

**Sin patrón — lógica mezclada:**

```python
# ANTES — difícil de testear, difícil de extender
def calculate_net_worth(accounts: list) -> float:
    total = 0
    for acc in accounts:
        if acc.tipo == 'banco':
            total += float(acc.saldo_actual)
        elif acc.tipo == 'tarjeta':
            total += float(-acc.saldo_actual)   # ← lógica embebida
        elif acc.tipo == 'cripto':
            total += float(acc.cripto_config.cantidad * acc.cripto_config.precio_actual_usd)
        # agregar tipo nuevo = modificar esta función
    return total
```



**Con Strategy — cada algoritmo es un objeto independiente y testeable:**

```python
from abc import ABC, abstractmethod

# 1. Interfaz de Estrategia
class BalanceCalculationStrategy(ABC):
    @abstractmethod
    def calculate_balance_in_usd(self, account_model) -> float:
        """Calcula el balance real estandarizado a USD"""
        pass

# 2. Estrategias Concretas
class StandardBalanceStrategy(BalanceCalculationStrategy):
    def calculate_balance_in_usd(self, account_model) -> float:
        return float(account_model.saldo_actual)        #  dinero a favor

class CreditCardBalanceStrategy(BalanceCalculationStrategy):
    def calculate_balance_in_usd(self, account_model) -> float:
        return float(-account_model.saldo_actual)       #  deuda = negativo

class CryptoBalanceStrategy(BalanceCalculationStrategy):
    def calculate_balance_in_usd(self, account_model) -> float:
        cantidad = account_model.cripto_config.cantidad
        precio   = account_model.cripto_config.precio_actual_usd
        return float(cantidad * precio)                 #  valor de mercado

# 3. Contexto — recibe cualquier estrategia
class AccountBalanceContext:
    def __init__(self, strategy: BalanceCalculationStrategy):
        self._strategy = strategy

    def get_usd_balance(self, account_model) -> float:
        return self._strategy.calculate_balance_in_usd(account_model)

# Uso — cada cuenta selecciona su estrategia
STRATEGY_MAP = {
    'banco':   StandardBalanceStrategy(),
    'tarjeta': CreditCardBalanceStrategy(),
    'cripto':  CryptoBalanceStrategy(),
}

def calculate_net_worth(accounts: list) -> float:
    total = 0
    for acc in accounts:
        ctx = AccountBalanceContext(STRATEGY_MAP[acc.tipo])
        total += ctx.get_usd_balance(acc)
    return total
```

### Ventaja clave: testeabilidad

```python
# Puedo testear cada estrategia de forma AISLADA
def test_credit_card_is_negative():
    mock_account = MagicMock()
    mock_account.saldo_actual = 500.0

    strategy = CreditCardBalanceStrategy()
    result = strategy.calculate_balance_in_usd(mock_account)

    assert result == -500.0   #  la deuda resta al patrimonio
```

> **La diferencia con un if/else:**cada estrategia es una clase independiente, inyectable y testeable por separado. La estrategia también puede cambiar **en runtime**— por ejemplo, si el usuario cambia la moneda base del dashboard de USD a EUR.



## 3. Facade — Patrón Estructural

### Concepto
> Proporciona una **interfaz unificada**a un conjunto de interfaces de un subsistema. Hace el subsistema más fácil de usar desde afuera.

### El problema real

Cuando el frontend navega a `/accounts`, necesita un JSON complejo con todo:

```json
{
  "liquidez": { "total": 4500.0, "items": [...] },
  "tarjetas":  { "grupo_1": [...], "grupo_2": [...] },
  "cripto":    [{ "simbolo": "BTC", "valor_usd": 32000 }, ...]
}
```

Eso requiere **4 o 5 consultas SQL**a repositorios distintos.

**Sin patrón — el router hace demasiado:**

```python
# ANTES — el controlador viola Single Responsibility
@router.get("/summary")
def get_account_summary(db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Consulta 1
    liquid_accounts = db.query(Cuenta).filter(
        Cuenta.usuario_id == user.id,
        Cuenta.tipo.in_(["banco", "ahorro"])
    ).all()

    # Consulta 2
    cards = db.query(Cuenta, TarjetaConfig).join(...).filter(...).all()

    # Consulta 3
    crypto = db.query(Cuenta, CriptoConfig).join(...).filter(...).all()

    # Lógica de agrupación embebida en el controlador
    grouped_cards = {}
    for card in cards:
        key = card.TarjetaConfig.cupo_grupo_id or card.Cuenta.id
        grouped_cards.setdefault(key, []).append(card)

    # Mezcla manual de resultados
    return {
        "liquidez": { "total": sum(a.saldo_actual for a in liquid_accounts), "items": liquid_accounts },
        "tarjetas": grouped_cards,
        "cripto": crypto
    }
    # → Este controlador es imposible de testear unitariamente
```



**Con Facade — el router tiene una sola responsabilidad:**

```python
class AccountDashboardFacade:
    """
    Fachada que oculta la complejidad de múltiples repositorios.
    El controlador no sabe cuántas consultas hay detrás.
    """
    def __init__(self, db_session):
        self.account_repo = AccountRepository(db_session)
        self.card_repo    = CardRepository(db_session)
        self.crypto_repo  = CryptoRepository(db_session)

    def get_full_account_summary(self, user_id: str) -> dict:
        liquid_accounts    = self.account_repo.get_liquid_accounts(user_id)
        cards_with_groups  = self.card_repo.get_cards_with_groups(user_id)
        grouped_cards      = self._format_card_groups(cards_with_groups)  # lógica interna
        crypto_assets      = self.crypto_repo.get_crypto_portfolio(user_id)

        return {
            "liquidez": {
                "total": sum(a.saldo_actual for a in liquid_accounts),
                "items": liquid_accounts
            },
            "tarjetas": grouped_cards,
            "cripto":   crypto_assets
        }

    def _format_card_groups(self, raw_data):
        # Lógica de agrupación encapsulada — invisible para el controlador
        grouped = {}
        for card in raw_data:
            key = card.cupo_grupo_id or card.id
            grouped.setdefault(key, []).append(card)
        return grouped

# Router — una sola línea de lógica
@router.get("/summary")
def get_account_summary(db: Session = Depends(get_db), user = Depends(get_current_user)):
    facade = AccountDashboardFacade(db)
    return facade.get_full_account_summary(user.id)   # ← eso es todo
```

### Lo que la Facade oculta

```
Frontend  →  GET /accounts/summary
                    │
                    ▼
         AccountDashboardFacade          ← interfaz simple
         ┌──────────────────────────┐
         │  AccountRepository       │  → SELECT * FROM cuentas WHERE tipo IN (...)
         │  CardRepository          │  → SELECT c.*, tc.* FROM cuentas JOIN tarjetas_config
         │    + _format_card_groups │  → agrupación por cupo_grupo_id
         │  CryptoRepository        │  → SELECT c.*, cc.* FROM cuentas JOIN cripto_config
         └──────────────────────────┘
                    │
                    ▼
         { liquidez: {...}, tarjetas: {...}, cripto: [...] }
```



## 4. Adapter — Patrón Estructural

### Concepto
> **Convierte la interfaz**de una clase en otra que los clientes esperan. Permite que clases con interfaces incompatibles trabajen juntas.

### El problema real

El worker de Celery (`workers/crypto_prices.py`) actualiza precios cripto periódicamente usando la API de CoinGecko. Pero CoinGecko tiene su propia estructura de respuesta:

```json
{ "bitcoin": { "usd": 65000.5 } }
```

**Sin patrón — acoplado a CoinGecko:**

```python
# ANTES — el worker conoce los detalles de CoinGecko
def update_crypto_prices_task():
    cryptos = db.query(CriptoConfig).all()
    for crypto in cryptos:
        # URL hardcodeada de CoinGecko
        url = f"https://api.coingecko.com/v3/simple/price?ids={crypto.simbolo}&vs_currencies=usd"
        response = requests.get(url)
        data = response.json()

        # Estructura JSON específica de CoinGecko hardcodeada
        price = data[crypto.simbolo.lower()]["usd"]   # ← frágil
        crypto.precio_actual_usd = price

    db.commit()
    # Si CoinGecko cambia su API → reescribir este worker completo
```



**Con Adapter — el worker solo conoce la interfaz interna:**

```python
from abc import ABC, abstractmethod
import httpx

# 1. Interfaz Objetivo — lo que SOTANG necesita
class CryptoPriceProvider(ABC):
    @abstractmethod
    def get_price_in_usd(self, symbol: str) -> float:
        """Retorna el precio en USD para un símbolo (ej: 'bitcoin')"""
        pass

# 2. Adaptador — traduce CoinGecko a nuestra interfaz
class CoinGeckoAdapter(CryptoPriceProvider):
    def __init__(self):
        self.base_url = "https://api.coingecko.com/v3"
        self.client = httpx.Client()

    def get_price_in_usd(self, symbol: str) -> float:
        try:
            url = f"{self.base_url}/simple/price?ids={symbol.lower()}&vs_currencies=usd"
            response = self.client.get(url)
            response.raise_for_status()
            data = response.json()

            # CoinGecko devuelve: {"bitcoin": {"usd": 65000.5}}
            # El adaptador extrae el float limpio ← complejidad encapsulada aquí
            return float(data.get(symbol.lower(), {}).get('usd', 0.0))
        except Exception as e:
            print(f"Error en CoinGeckoAdapter: {e}")
            return 0.0

# 3. Futuro adaptador si migramos a Binance (el worker no cambia)
class BinanceAdapter(CryptoPriceProvider):
    def get_price_in_usd(self, symbol: str) -> float:
        # Binance devuelve: {"symbol": "BTCUSDT", "price": "65000.50"}
        # ... lógica específica de Binance aquí
        pass

# Worker de Celery — solo conoce CryptoPriceProvider
def update_crypto_prices_task():
    provider = CoinGeckoAdapter()   # ← cambiar a BinanceAdapter() = UNA línea
    # provider = BinanceAdapter()

    cryptos = db.query(CriptoConfig).all()
    for crypto in cryptos:
        new_price = provider.get_price_in_usd(crypto.simbolo)
        crypto.precio_actual_usd = new_price
    db.commit()
```

### Comparación de interfaces

```
Sotang necesita:          CoinGecko devuelve:
─────────────────         ─────────────────────────────────
get_price_in_usd("btc")   GET /simple/price?ids=btc&vs_currencies=usd
→ 65000.5  (float)        → {"bitcoin": {"usd": 65000.5}}

         CoinGeckoAdapter traduce entre los dos mundos
```



## 5. Observer — Patrón de Comportamiento

### Concepto
> Define una dependencia **uno-a-muchos**entre objetos: cuando un objeto cambia de estado, **todos sus dependientes son notificados automáticamente**.

### El problema real

Al registrar una nueva transacción, múltiples cosas deben ocurrir:

1. El **saldo**de la cuenta debe actualizarse (`accounts` module)
2. Si la cuenta tiene una **meta de ahorro**, el progreso se recalcula (`goals` module)
3. (futuro) Enviar una **notificación push**al usuario

**Sin patrón — alto acoplamiento inter-módulo:**

```python
# transactions/service.py — ANTES
# Este módulo importa y llama a otros módulos directamente
from accounts.service import AccountService    # ← acoplamiento explícito
from goals.service import GoalService          # ← acoplamiento explícito

def create_transaction(db_session, txn_data: dict):
    db_session.add(Transaccion(**txn_data))
    db_session.commit()

    # Llamadas directas a otros módulos
    AccountService.update_balance(txn_data['cuenta_id'], txn_data['monto'])
    GoalService.update_progress(txn_data['cuenta_id'])
    # Para agregar notificaciones → modificar este archivo
    # NotificationService.send(...)   ← hay que agregar otro import
```

> **El problema:**El módulo `transactions` depende explícitamente de `accounts` y `goals`. Cualquier cambio en esos módulos puede romper este archivo.



**Con Observer — los módulos no se conocen entre sí:**

```python
# 1. El Gestor de Eventos (Event Bus)
class EventManager:
    def __init__(self):
        self._listeners = {}    # { "TRANSACTION_CREATED": [observer1, observer2, ...] }

    def subscribe(self, event_type: str, listener):
        self._listeners.setdefault(event_type, []).append(listener)

    def notify(self, event_type: str, data: dict):
        for listener in self._listeners.get(event_type, []):
            listener.update(data)

event_manager = EventManager()   # instancia global (singleton de facto)

# 2. Los Observadores (cada uno vive en su propio módulo)

# accounts/observers.py
class AccountBalanceUpdater:
    def update(self, transaction_data: dict):
        cuenta_id = transaction_data['cuenta_id']
        monto     = transaction_data['monto']
        # lógica real: db.query(Cuenta).filter(...).update(saldo += monto)
        print(f"[Accounts] Actualizando saldo de cuenta {cuenta_id}")

# goals/observers.py
class GoalProgressUpdater:
    def update(self, transaction_data: dict):
        cuenta_id = transaction_data['cuenta_id']
        # lógica real: verificar si la cuenta pertenece a una meta
        print(f"[Goals] Verificando meta para cuenta {cuenta_id}")

# 3. Suscripción — en main.py al iniciar FastAPI
event_manager.subscribe("TRANSACTION_CREATED", AccountBalanceUpdater())
event_manager.subscribe("TRANSACTION_CREATED", GoalProgressUpdater())
# Agregar notificaciones en el futuro → una línea aquí, nada más
# event_manager.subscribe("TRANSACTION_CREATED", PushNotificationSender())

# 4. Emisión — transactions/service.py
def create_transaction(db_session, txn_data: dict):
    db_session.add(Transaccion(**txn_data))
    db_session.commit()

    # Una sola línea. No sabe quién escucha, ni cuántos son.
    event_manager.notify("TRANSACTION_CREATED", txn_data)
    return True
```

### Comparación de dependencias

```
ANTES (acoplado):                    DESPUÉS (Observer):
─────────────────────────────        ─────────────────────────────
transactions ──► accounts            transactions ──► EventManager
transactions ──► goals                                     │
transactions ──► notifications                    ┌────────┼────────┐
                                                  ▼        ▼        ▼
                                               accounts  goals  notifications
                                             (cada uno se suscribe solo)
```

> **¿Observer no es solo un callback?**Un callback es una referencia directa al receptor. Observer es un sistema de suscripción formal donde el emisor **no conoce**a los receptores. Puedes agregar o quitar observadores sin tocar el código que emite el evento.

> **Desventaja real:**el flujo es menos visible al debuggear. Mitigación: el `EventManager` debe registrar logs de qué observadores notificó y en qué orden.



## Resumen Final

```
                    FLUJO DE VIDA DE UNA CUENTA EN SOTANG
                    ──────────────────────────────────────

  [1] POST /accounts          [4] GET /accounts/summary
         │                              │
         ▼                              ▼
  AccountFactory          AccountDashboardFacade
  (Factory Method)              (Facade)
         │                              │
         ▼                              ▼
  CryptoAccountCreator     AccountRepo + CardRepo + CryptoRepo
         │
         ▼
  [2] Worker Celery          [3] GET /dashboard (Net Worth)
         │                              │
         ▼                              ▼
  CoinGeckoAdapter        AccountBalanceContext + Strategy
      (Adapter)             (Strategy: banco / tarjeta / cripto)

  [5] POST /transactions
         │
         ▼
  EventManager.notify("TRANSACTION_CREATED")
         │
    ┌────┴────┐
    ▼         ▼
 Accounts   Goals
 (Observer) (Observer)
```

| Categoría GoF | Patrones aplicados |
|---------------|-------------------|
| Creacional | Factory Method |
| Estructural | Facade · Adapter |
| Comportamiento | Strategy · Observer |
