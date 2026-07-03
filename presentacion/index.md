---
title: Presentación — Sotang Finance
---

<PresHero
  badge="Presentación del Proyecto · 2026"
  title="Sotang Finance"
  subtitle="Sistema de gestión de finanzas personales 100% local — privacidad total, costo cero de hosting, sobre una Raspberry Pi 5"
/>

<StatGrid :stats="[
  { value: 50, label: 'Requerimientos Funcionales' },
  { value: 26, label: 'Requerimientos No Funcionales' },
  { value: 28, label: 'Tablas PostgreSQL' },
  { value: 12, label: 'Módulos de Negocio' },
  { value: 8, label: 'Patrones GoF' },
  { value: 5, label: 'Patrones Arquitectónicos' },
  { value: 0, prefix: '$', label: 'Costo mensual de hosting' },
]"/>

## Agenda

<Reveal>

| # | Acto | Qué veremos |
|---|------|-------------|
| 1 | [El Problema](./problema) | Por qué ninguna app del mercado sirve para el contexto ecuatoriano |
| 2 | [Requerimientos](./requerimientos) | 50 RF + 26 RNF explorables por módulo |
| 3 | [Casos de Uso](./casos-de-uso) | Actores y flujos paso a paso |
| 4 | [Arquitectura](./arquitectura) | Diagrama interactivo por capas + C4 |
| 5 | [Seguridad](./seguridad) | 6 capas de defensa en profundidad |
| 6 | [Patrones de Diseño](./patrones) | 5 arquitectónicos + 8 GoF con tarjetas interactivas |
| 7 | [Métricas de Calidad](./metricas) | CK Suite + McCabe con gráficos animados |
| 8 | [Riesgos y Análisis Formal](./riesgos) | Matriz interactiva R = P×I + ATAM |
| 9 | [Mejoras del Diseño](./mejoras) | 5 técnicas con antes/después medible |
| 10 | [Roadmap y Conclusiones](./conclusiones) | Fases del proyecto y cierre |

</Reveal>

<Reveal :delay="150">

::: tip El elevator pitch
**Sotang** registra cada gasto con desglose de IVA ecuatoriano (15%), maneja el cupo compartido de tarjetas Diners/Titanium, proyecta metas de ahorro y consolida patrimonio — todo desde una app móvil y un bot de Telegram, con los datos viviendo **únicamente** en hardware propio.
:::

</Reveal>
