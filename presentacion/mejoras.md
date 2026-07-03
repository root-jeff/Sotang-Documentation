---
title: 9. Mejoras del Diseño
---

<PresHero
  badge="Acto 9"
  title="Mejoras del Diseño"
  subtitle="5 técnicas motivadas directamente por las métricas — cada una con impacto medible antes/después"
/>

## Técnica 1 — Tabla de constructores en el Factory

El hallazgo amarillo del Acto 7 tiene solución diseñada: reemplazar el `switch` de 6 ramas por un mapa declarativo `Record<AccountType, Constructor>`.

<BeforeAfter
  title="Refactorización de AccountFactory.create()"
  metric="Complejidad ciclomática V(G) de McCabe"
  :before="7"
  :after="2"
  improvement="−71%"
  before-desc="switch/case de 6 ramas — modificar el factory por cada tipo nuevo"
  after-desc="mapa declarativo — extender sin modificar (OCP)"
/>

## Técnica 2 — Capa de adapters explícita

<BeforeAfter
  title="Desacoplar NotificationWorker de los SDKs"
  metric="CBO — Coupling Between Objects"
  :before="4"
  :after="1"
  improvement="−75%"
  before-desc="SDKs de Resend, Firebase y Telegram llamados directamente — imposible testear sin enviar emails reales"
  after-desc="solo conoce INotificationProvider — mocks triviales, proveedores intercambiables"
/>

## Técnica 5 — SRP en workers

<BeforeAfter
  title="Descomponer RecurringTxnWorker.process()"
  metric="V(G) del método process()"
  :before="6"
  :after="2"
  improvement="−67%"
  before-desc="un método hace todo: leer DB + decidir + ejecutar"
  after-desc="fetchRecurring() · isDue() · executeTransaction() — cada uno testeable en aislamiento"
/>

## Las 5 técnicas y los atributos que mejoran

<Reveal>

| Técnica | Mantenibilidad | Extensibilidad | Testabilidad | Acoplamiento ↓ | Cohesión ↑ |
|---------|:---:|:---:|:---:|:---:|:---:|
| 1. Tabla de constructores | Sí | Sí | Sí | — | — |
| 2. Capa de adapters | Sí | Sí | Sí | Sí | — |
| 3. OCP en reportes (IReportGenerator + registro) | Sí | Sí | — | Sí | — |
| 4. Inyección de dependencias por constructor | — | — | Sí | Sí | — |
| 5. SRP en workers | Sí | — | Sí | — | Sí |

</Reveal>

<Reveal>

::: tip La lección de diseño
Ninguna de estas técnicas nació de una lista genérica de "buenas prácticas": **cada una responde a un número concreto** de las métricas del Acto 7 o a un riesgo del Acto 8. Así se cierra el ciclo: medir → detectar → mejorar → volver a medir.
:::

</Reveal>

---

<div style="display:flex; justify-content:space-between">
  <a href="./riesgos">← Riesgos</a>
  <a href="./conclusiones">Siguiente: Conclusiones →</a>
</div>
