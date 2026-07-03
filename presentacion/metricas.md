---
title: 7. Métricas de Calidad
---

<PresHero
  badge="Acto 7"
  title="Métricas de Calidad"
  subtitle="El diseño evaluado con números: CK Metrics Suite (Chidamber & Kemerer) + complejidad de McCabe"
/>

<Reveal>

<StatGrid :stats="[
  { value: 54, label: 'Clases del diseño (NC)' },
  { value: 6, label: 'WMC máximo (umbral: 14)' },
  { value: 5, label: 'CBO máximo (umbral: 7)' },
  { value: 0, label: 'LCOM en clases centrales' },
  { value: 1, label: 'DIT en jerarquías principales' },
  { value: 100, suffix: '%', label: 'Encapsulamiento (IHF)' },
]"/>

</Reveal>

## Complejidad ciclomática V(G) por función crítica

**V(G) = 1 + decisiones lógicas.** Escala: 1–4 bajo riesgo · 5–10 moderado · >10 alto:

<MetricBars
  title="McCabe V(G) — funciones críticas"
  :threshold="10"
  threshold-label="alto riesgo"
  :max="12"
  :bars="[
    { label: 'AccountFactory.create()', value: 7, note: 'switch de 6 tipos — única función moderada, con refactorización planificada (Acto 9)' },
    { label: 'TransactionsService.create()', value: 5, note: 'tipo + IVA + fondos + transfer: complejidad de negocio justificada' },
    { label: 'NotificationWorker.selectProvider()', value: 4 },
    { label: 'RecurringTransaction.execute()', value: 4, note: 'sin el patrón State sería ~10' },
    { label: 'AuthDecorator.handle()', value: 2 },
  ]"
/>

## Acoplamiento (CBO) por clase

<MetricBars
  title="CBO — Coupling Between Objects"
  :threshold="7"
  threshold-label="umbral de alerta"
  :max="9"
  :bars="[
    { label: 'AccountFactory', value: 5, note: 'esperado en un Factory: conoce las clases concretas que crea' },
    { label: 'TransactionsService', value: 4, note: 'gracias al Observer — sin él llamaría a 3 módulos más (CBO ≈ 7)' },
    { label: 'NotificationWorker', value: 3 },
    { label: 'AuthService', value: 3 },
    { label: 'AuthDecorator', value: 2 },
    { label: 'AccountGroup', value: 1 },
  ]"
/>

## Lo que los números demuestran

<Reveal>

| Hallazgo | Evidencia | Por qué importa |
|----------|-----------|-----------------|
| **Sin God Classes**| WMC máximo = 6 (umbral 14) | Ninguna clase concentra demasiada responsabilidad |
| **Cohesión perfecta**| LCOM = 0 en clases centrales | Consecuencia directa de State, Composite y Strategy: un solo atributo de delegación |
| **Composición sobre herencia**| DIT = 1 en todas las jerarquías | Cambios en interfaces no rompen cadenas de herencia |
| **Bajo acoplamiento**| CBO máximo = 5 (umbral 7) | Cada clase puede cambiar sin arrastrar al resto |
| **NOC justificado**| IRecurringState con 5 hijos | No es inflación: son exactamente los 5 estados del dominio |

</Reveal>

<Reveal>

::: warning El único punto amarillo
`AccountFactory.create()` con **V(G) = 7** es la única métrica en zona moderada — y crecerá con cada tipo de cuenta nuevo. La solución está diseñada y medida en el [Acto 9: Mejoras](./mejoras): una tabla de constructores la reduce a **V(G) = 2**.
:::

</Reveal>

---

<div style="display:flex; justify-content:space-between">
  <a href="./patrones">← Patrones</a>
  <a href="./riesgos">Siguiente: Riesgos →</a>
</div>
