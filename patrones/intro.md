# Patrones de Diseño\n\n**Módulo de Cuentas: Ejemplos Prácticos y Casos de Uso.**

Este documento detalla la aplicación teórica y práctica de 5 patrones de diseño (GoF) sobre el ecosistema del proyecto **Sotang**, específicamente enfocados en el **Módulo de Cuentas**. Este análisis sirve como puente entre la teoría académica de Arquitectura de Software y la implementación real en un backend con FastAPI y Python.



## Contexto del Problema

El módulo de cuentas (`accounts/`) en Sotang no es trivial. El diseño de base de datos (`00-erd.md`) establece una arquitectura basada en composición/herencia a nivel relacional:
*   Una tabla base `cuentas`.
*   Tablas satélite de configuración específica que extienden la cuenta base: `tarjetas_config`, `cripto_config`, y `ahorro_virtual_config`.

Esta complejidad relacional es el escenario ideal para aplicar patrones de diseño orientados a objetos que manejen la creación, estructura y comportamiento de estas entidades sin acoplar la lógica de negocio.



## 1. Factory Method (Patrón Creacional)

### Concepto
El patrón Factory Method define una interfaz para crear un objeto, pero deja que las subclases decidan qué clase instanciar. Promueve el bajo acoplamiento al extraer la lógica de instanciación del código cliente.

### Aplicación en Sotang
**El problema:** Cuando el usuario envía un `POST /api/v1/accounts/` desde React, el payload JSON difiere si es una cuenta de banco regular, una tarjeta (requiere fechas de corte) o una cuenta cripto (requiere símbolo de moneda).
**La solución:** Un `AccountFactory` que evalúa el atributo `tipo` del payload y delega la creación en la base de datos a un `AccountCreator` específico. Esto asegura que el controlador (router) de FastAPI se mantenga limpio e ignorante de las tablas relacionales subyacentes.

### Ejemplo de Código (Python)

```python
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session

# --- 1. Interfaz del Creador ---
class AccountCreator(ABC):
    @abstractmethod
    def create_account(self, db_session: Session, account_data: dict, user_id: str):
        """Crea la cuenta y sus dependencias en la base de datos"""
        pass

# --- 2. Creadores Concretos ---
class BankAccountCreator(AccountCreator):
    def create_account(self, db_session: Session, account_data: dict, user_id: str):
        # Lógica simple: Insert en tabla 'cuentas'
        db_account = Cuenta(
            usuario_id=user_id, 
            tipo="banco", 
            saldo_actual=account_data.get('saldo', 0)
        )
        db_session.add(db_account)
        return db_account

class CryptoAccountCreator(AccountCreator):
    def create_account(self, db_session: Session, account_data: dict, user_id: str):
        # Lógica compleja: Insert en 'cuentas' y en 'cripto_config'
        db_account = Cuenta(usuario_id=user_id, tipo="cripto")
        db_session.add(db_account)
        db_session.flush() # Vacía a BD para obtener el UUID generado
        
        db_crypto = CriptoConfig(
            cuenta_id=db_account.id, 
            simbolo=account_data['simbolo'], 
            cantidad=account_data['cantidad']
        )
        db_session.add(db_crypto)
        return db_account

# --- 3. La Fábrica ---
class AccountFactory:
    @staticmethod
    def get_creator(account_type: str) -> AccountCreator:
        creators = {
            "banco": BankAccountCreator(),
            "cripto": CryptoAccountCreator(),
            # "tarjeta": CreditCardAccountCreator(),
            # "ahorro_virtual": VirtualSavingsCreator()
        }
        creator = creators.get(account_type)
        if not creator:
            raise ValueError(f"Tipo de cuenta no soportado: {account_type}")
        return creator

# --- Uso en el endpoint de FastAPI ---
# @router.post("/")
# def create_new_account(payload: AccountCreateSchema, db: Session = Depends(get_db)):
#     creator = AccountFactory.get_creator(payload.tipo)
#     account = creator.create_account(db, payload.model_dump(), current_user.id)
#     db.commit()
#     return account
```



## 2. Strategy (Patrón de Comportamiento)

### Concepto
Permite definir una familia de algoritmos, encapsular cada uno como un objeto y hacerlos intercambiables. Permite que el algoritmo varíe independientemente de los clientes que lo usan.

### Aplicación en Sotang
**El problema:** El Dashboard de Sotang requiere calcular el "Patrimonio Neto" (Net Worth). Sumar el saldo de una cuenta bancaria es directo. Sin embargo, el saldo de una tarjeta de crédito representa una deuda (valor negativo en el patrimonio), y el saldo de una cuenta cripto requiere multiplicar la cantidad de tokens por su precio actual en USD almacenado en `cripto_config`.
**La solución:** Definir una familia de estrategias `BalanceCalculationStrategy` para estandarizar cómo cada tipo de cuenta reporta su valor financiero real.

### Ejemplo de Código (Python)

```python
from abc import ABC, abstractmethod

# --- 1. Interfaz de Estrategia ---
class BalanceCalculationStrategy(ABC):
    @abstractmethod
    def calculate_balance_in_usd(self, account_model) -> float:
        """Calcula el balance real estandarizado a USD"""
        pass

# --- 2. Estrategias Concretas ---
class StandardBalanceStrategy(BalanceCalculationStrategy):
    def calculate_balance_in_usd(self, account_model) -> float:
        # Dinero líquido a favor (Cuentas corrientes, ahorros)
        return float(account_model.saldo_actual) 

class CreditCardBalanceStrategy(BalanceCalculationStrategy):
    def calculate_balance_in_usd(self, account_model) -> float:
        # La deuda resta al patrimonio
        return float(-account_model.saldo_actual) 

class CryptoBalanceStrategy(BalanceCalculationStrategy):
    def calculate_balance_in_usd(self, account_model) -> float:
        # El saldo líquido no está en la tabla cuenta, sino calculado
        # usando la relación (relationship) de SQLAlchemy con cripto_config
        cantidad = account_model.cripto_config.cantidad
        precio = account_model.cripto_config.precio_actual_usd
        return float(cantidad * precio)

# --- 3. Contexto ---
class AccountBalanceContext:
    def __init__(self, strategy: BalanceCalculationStrategy):
        self._strategy = strategy

    def get_usd_balance(self, account_model) -> float:
        return self._strategy.calculate_balance_in_usd(account_model)

# --- Uso ---
# def calculate_net_worth(accounts: list):
#     total = 0
#     for acc in accounts:
#         if acc.tipo == 'banco':
#             ctx = AccountBalanceContext(StandardBalanceStrategy())
#         elif acc.tipo == 'tarjeta':
#             ctx = AccountBalanceContext(CreditCardBalanceStrategy())
#         elif acc.tipo == 'cripto':
#             ctx = AccountBalanceContext(CryptoBalanceStrategy())
#         
#         total += ctx.get_usd_balance(acc)
#     return total
```



## 3. Facade (Patrón Estructural)

### Concepto
Proporciona una interfaz unificada (y simplificada) a un conjunto de interfaces en un subsistema. Facade define una interfaz de nivel más alto que hace que el subsistema sea más fácil de usar.

### Aplicación en Sotang
**El problema:** Cuando la SPA en React navega a `/accounts`, la UI necesita un objeto JSON jerárquico complejo que incluya: cuentas líquidas, tarjetas agrupadas por su `cupo_grupo_id`, y el portafolio cripto con sus símbolos. Si el controlador de FastAPI ejecuta las 4 o 5 consultas SQL por separado y luego mezcla los diccionarios, el controlador viola el principio de responsabilidad única.
**La solución:** Un `AccountDashboardFacade` que actúe como un "frente" único. Oculta la complejidad de interactuar con múltiples repositorios de SQLAlchemy y entrega un Data Transfer Object (DTO) limpio.

### Ejemplo de Código (Python)

```python
# Supongamos que existen estos repositorios (DAOs)
class AccountRepository: pass
class CardRepository: pass
class CryptoRepository: pass

class AccountDashboardFacade:
    """
    Fachada que simplifica la obtención del resumen financiero completo.
    Oculta la interacción con múltiples repositorios y tablas.
    """
    def __init__(self, db_session):
        self.account_repo = AccountRepository(db_session)
        self.card_repo = CardRepository(db_session)
        self.crypto_repo = CryptoRepository(db_session)

    def get_full_account_summary(self, user_id: str) -> dict:
        # 1. Obtener cuentas líquidas
        liquid_accounts = self.account_repo.get_liquid_accounts(user_id)
        
        # 2. Obtener tarjetas y agruparlas por su cupo compartido
        cards_with_groups = self.card_repo.get_cards_with_groups(user_id)
        grouped_cards = self._format_card_groups(cards_with_groups)
        
        # 3. Obtener portafolio cripto
        crypto_assets = self.crypto_repo.get_crypto_portfolio(user_id)
        
        # 4. Retornar una estructura unificada y lista para el Frontend
        return {
            "liquidez": {
                "total": sum(a.saldo_actual for a in liquid_accounts),
                "items": liquid_accounts
            },
            "tarjetas": grouped_cards,
            "cripto": crypto_assets
        }

    def _format_card_groups(self, raw_data):
        # Lógica interna de mapeo (oculta al controlador)
        pass

# --- Uso en FastAPI router ---
# @router.get("/summary")
# def get_account_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
#     facade = AccountDashboardFacade(db)
#     return facade.get_full_account_summary(user.id)
```



## 4. Adapter (Patrón Estructural)

### Concepto
Convierte la interfaz de una clase en otra interfaz que los clientes esperan. Permite que clases con interfaces incompatibles trabajen juntas.

### Aplicación en Sotang
**El problema:** El módulo de criptomonedas necesita actualizar sus precios en USD periódicamente mediante Celery (`workers/crypto_prices.py`). Sotang planea usar la API de CoinGecko. Sin embargo, si CoinGecko cambia su modelo de precios, Sotang podría necesitar migrar a Binance API. Acoplar la lógica del worker a los endpoints JSON específicos de CoinGecko hace el código frágil.
**La solución:** Definir una interfaz base `CryptoPriceProvider` que Sotang entienda, e implementar un `CoinGeckoAdapter` que encapsule la lógica HTTP y las llaves JSON específicas de esa API externa.

### Ejemplo de Código (Python)

```python
from abc import ABC, abstractmethod
import httpx # Librería HTTP

# --- 1. Interfaz Objetivo (Lo que Sotang necesita) ---
class CryptoPriceProvider(ABC):
    @abstractmethod
    def get_price_in_usd(self, symbol: str) -> float:
        """Retorna el precio actual en USD para un símbolo dado (ej: 'btc')"""
        pass

# --- 2. Adaptador (El traductor para la API externa) ---
class CoinGeckoAdapter(CryptoPriceProvider):
    def __init__(self):
        self.base_url = "https://api.coingecko.com/v3"
        self.client = httpx.Client()
        
    def get_price_in_usd(self, symbol: str) -> float:
        try:
            # Petición específica a la interfaz de CoinGecko
            url = f"{self.base_url}/simple/price?ids={symbol.lower()}&vs_currencies=usd"
            response = self.client.get(url)
            response.raise_for_status()
            data = response.json()
            
            # CoinGecko devuelve: {"bitcoin": {"usd": 65000.5}}
            # El adaptador extrae el float limpio para Sotang
            return float(data.get(symbol.lower(), {}).get('usd', 0.0))
        except Exception as e:
            # Manejo de errores encapsulado
            print(f"Error adaptando respuesta de CoinGecko: {e}")
            return 0.0

# --- Uso en Celery Worker ---
# def update_crypto_prices_task():
#     # Si mañana cambiamos a Binance, solo reemplazamos el adaptador:
#     # provider = BinanceAdapter()
#     provider = CoinGeckoAdapter() 
#     
#     cryptos_to_update = db.query(CriptoConfig).all()
#     for crypto in cryptos_to_update:
#         new_price = provider.get_price_in_usd(crypto.simbolo)
#         crypto.precio_actual_usd = new_price
#     db.commit()
```



## 5. Observer (Patrón de Comportamiento)

### Concepto
Define una dependencia de uno a muchos entre objetos para que, cuando uno de los objetos cambie de estado, todos sus dependientes sean notificados y actualizados automáticamente.

### Aplicación en Sotang
**El problema:** Cuando se registra una nueva transacción (módulo `transactions`), el saldo de la cuenta asociada debe actualizarse (módulo `accounts`), y si la cuenta está atada a una meta de ahorro, el progreso de la meta debe recalcularse (módulo `goals`). Si el servicio de transacciones importa y llama a los servicios de cuentas y metas directamente, se genera un alto acoplamiento inter-módulo.
**La solución:** Implementar un Event Bus (o usar el sistema de Signals de SQLAlchemy/FastAPI). El módulo de transacciones simplemente "emite" el evento `TransactionCreated`. Los módulos de cuentas y metas actúan como observadores y reaccionan de manera independiente.

### Ejemplo de Código (Python)

```python
# --- 1. El Gestor de Eventos (Event Bus / Subject) ---
class EventManager:
    def __init__(self):
        # Diccionario que mapea nombres de eventos a listas de funciones/clases observadoras
        self._listeners = {}

    def subscribe(self, event_type: str, listener):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(listener)

    def notify(self, event_type: str, data):
        for listener in self._listeners.get(event_type, []):
            listener.update(data)

# Instancia global (singleton de facto)
event_manager = EventManager()

# --- 2. Los Observadores ---
class AccountBalanceUpdater:
    """Observador del módulo de cuentas"""
    def update(self, transaction_data: dict):
        # Lógica real: db.query(Cuenta)... suma o resta monto
        cuenta_id = transaction_data['cuenta_id']
        monto = transaction_data['monto']
        print(f"[Accounts Module] Actualizando saldo de cuenta {cuenta_id} con delta {monto}")

class GoalProgressUpdater:
    """Observador del módulo de metas de ahorro"""
    def update(self, transaction_data: dict):
        cuenta_id = transaction_data['cuenta_id']
        print(f"[Goals Module] Verificando si la cuenta {cuenta_id} pertenece a una meta para sumar aporte.")

# --- 3. Suscripción y Emisión ---

# En el archivo de inicialización de FastAPI (main.py):
event_manager.subscribe("TRANSACTION_CREATED", AccountBalanceUpdater())
event_manager.subscribe("TRANSACTION_CREATED", GoalProgressUpdater())

# En el módulo transactions/service.py:
def create_transaction(db_session, txn_data: dict):
    # 1. Insertar la transacción en la tabla 'transacciones'
    # db_session.add(Transaccion(**txn_data))
    # db_session.commit()
    
    # 2. Notificar a los observadores (Desacoplado)
    event_manager.notify("TRANSACTION_CREATED", txn_data)
    
    return True
    
```
