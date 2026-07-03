---
title: 1. El Problema
---

<PresHero
  badge="Acto 1"
  title="El Problema"
  subtitle="Gestionar las finanzas personales exige datos completos, siempre disponibles y que trabajen solos — ninguna herramienta actual cumple las tres cosas"
/>

## La necesidad: nadie sabe realmente a dónde va su dinero

<Reveal>

La gestión de finanzas personales falla casi siempre por la misma razón: **la fricción de registrar**. Anotar cada gasto en una hoja de cálculo exige disciplina diaria; al tercer día de olvidos, el registro pierde sentido y se abandona. Sin registro no hay datos; sin datos no hay respuestas a las preguntas que importan:

- ¿Cuánto gasto realmente al mes, descontando impuestos?
- ¿Cuánto cupo me queda **entre todas** mis tarjetas?
- ¿Cuánto me deben — y desde cuándo?
- ¿Cuál es mi patrimonio neto hoy: activos menos deudas?

</Reveal>

## Siete problemas que ninguna herramienta resuelve junta

<Reveal>

### 1. La vida financiera está fragmentada

El dinero real no vive en un solo lugar: cuentas bancarias, dos tarjetas de crédito, efectivo, una billetera cripto, un vehículo que se deprecia, un préstamo que se amortiza, y la plata que le prestaste a un amigo. Las apps del mercado modelan **una fracción** de eso — casi ninguna consolida el patrimonio neto completo: activos con depreciación, pasivos con tabla de amortización, cuentas por cobrar y score crediticio en una sola vista.

</Reveal>

<Reveal>

### 2. Las apps locales encarcelan los datos en un dispositivo

Es cierto: muchas apps (Money Manager, Bluecoin, Wallet) guardan los datos localmente, sin nube. Pero eso crea el problema inverso: **los datos quedan presos del teléfono**. Si el dispositivo se pierde, se daña o se cambia, el historial financiero desaparece o depende de backups manuales que nadie hace. Y solo se puede consultar y registrar *desde ese teléfono*.

El mercado ofrece un dilema falso: **o privacidad (app local, datos presos) o disponibilidad (nube, datos entregados a terceros)**. Sotang rompe el dilema con una tercera vía: un servidor propio — los datos disponibles desde cualquier canal, sin salir de tu hardware.

</Reveal>

<Reveal>

### 3. Sin un servidor, nada trabaja por ti

Una app local es pasiva: si el teléfono está apagado, **nada ocurre**. No se ejecuta la transacción recurrente del arriendo, no llega la alerta de presupuesto, no se actualiza el precio del portafolio cripto, no se hace el backup. La automatización real — recurrentes que se ejecutan solas, alertas proactivas al 80% del presupuesto, precios actualizados cada 30 minutos, backup nocturno — exige un proceso corriendo 24/7. Eso es un servidor, no una app.

</Reveal>

<Reveal>

### 4. El registro sigue siendo lento

Abrir la app, esperar que cargue, tocar "+", llenar cuatro campos, guardar. La fricción mata el hábito. Sotang reduce el registro a un mensaje de Telegram — `/gasto 25.50 comida` — cinco segundos, desde cualquier dispositivo con el chat abierto, incluso desde el computador del trabajo.

</Reveal>

<Reveal>

### 5. No entienden el IVA ecuatoriano — que golpea en dos direcciones

El IVA del 15% aparece de dos formas distintas, y las apps no modelan ninguna:

- **Incluido en el precio**: la factura del restaurante ya trae el impuesto adentro — hay que *desglosarlo* para conocer el consumo real.
- **Sumado encima del precio**: en compras digitales internacionales (Steam, Amazon, suscripciones), el precio mostrado es la base y el emisor de la tarjeta cobra el IVA *adicional*. Un juego de $59 termina siendo un cargo de $67.85 — si registras $59, subestimas tu gasto y tu cupo disponible es mentira.

Compruébalo en ambos modos:

<IvaCalc />

</Reveal>

<Reveal>

### 6. No modelan la realidad financiera local

Dos ejemplos concretos que el modelo de datos de las apps comerciales no puede expresar:

- **El cupo compartido**: Diners Club y Titanium comparten un cupo único de $900 — un gasto en una reduce el disponible de la otra. Las apps las tratan como cuentas aisladas.
- **Las deudas informales**: prestar dinero a familiares y amigos es práctica común; ninguna app las gestiona con estados (pendiente, parcial, cobrado, incobrable) ni recordatorios de cobro.

</Reveal>

<Reveal>

### 7. Son cajas cerradas: sin API, no hay futuro

Ninguna app comercial expone una API sobre tus propios datos. No puedes conectar un bot, un script, un dashboard alterno — ni una IA. Sotang nace como **plataforma**: la API REST es el centro y cada canal (móvil, bot, web) es un cliente más. Eso habilita la visión a futuro: un servidor **MCP** para que una IA local converse con tus finanzas sin que un solo dato salga de tu red.

</Reveal>

## El cuadrante que nadie ocupa

<Reveal>

| Capacidad | Hoja de cálculo | App en la nube | App local | Sotang |
|-----------|:---:|:---:|:---:|:---:|
| Privacidad total | Parcial | No | Sí | Sí |
| Disponible desde varios canales | No | Sí | No | Sí |
| Automatización 24/7 (recurrentes, alertas, backups) | No | Sí | No | Sí |
| Registro en segundos (bot conversacional) | No | No | No | Sí |
| IVA 15% + cupo compartido + deudas informales | Manual | No | No | Sí |
| Patrimonio completo (depreciación, amortización, cobros) | Manual | Parcial | Parcial | Sí |
| API propia / extensible (IA local vía MCP) | No | No | No | Sí |
| Costo mensual | $0 | Suscripción | $0 o ads | $0 |

La columna de Sotang no existe en el mercado porque exige combinar tres cosas que ningún producto comercial tiene incentivo para juntar: **servidor propio del usuario, contexto financiero local y arquitectura abierta**.

</Reveal>

<Reveal>

## Objetivo general

> Diseñar y construir un sistema de información financiero personal, **seguro, extensible y de costo operativo cero**, que consolide toda la vida financiera del usuario, elimine la fricción del registro, automatice las tareas periódicas desde un servidor propio y rompa el dilema privacidad-disponibilidad operando íntegramente sobre infraestructura propia.

</Reveal>

---

<div style="display:flex; justify-content:space-between">
  <a href="./">← Portada</a>
  <a href="./requerimientos">Siguiente: Requerimientos →</a>
</div>
