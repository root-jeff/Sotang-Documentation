---
title: 8. Riesgos y Análisis Formal
---

<PresHero
  badge="Acto 8"
  title="Riesgos y Análisis Formal"
  subtitle="Matriz de riesgos R = Probabilidad × Impacto + verificación formal con ATAM y Design by Contract"
/>

## Matriz interactiva de riesgos

Los 8 riesgos arquitectónicos identificados, posicionados por probabilidad e impacto. **Ninguno alcanza la zona crítica (R = 9):**

<RiskMatrix />

## Checklist ATAM — 8 atributos de calidad

<Reveal>

| Atributo | Escenario de prueba | Resultado |
|----------|---------------------|:---------:|
| Disponibilidad | ¿Se recupera solo si un pod falla? — K3s reinicia en <30s | Cumple |
| Seguridad | ¿Un usuario ve datos ajenos? — userId verificado, 404 no revelador | Cumple |
| Rendimiento | ¿API < 200ms? — Cache Redis + tareas lentas en BullMQ | Cumple |
| Mantenibilidad | ¿Nuevo tipo de cuenta sin modificar código? — Factory + IAccount | Cumple |
| Testabilidad | ¿Módulos probables sin Fastify ni DB? — services + inyección | Cumple |
| Interoperabilidad | ¿Integrar WhatsApp? — Un WhatsAppAdapter, cero cambios al worker | Cumple |
| Privacidad | ¿Datos fuera de nubes de terceros? — PostgreSQL en la Raspi | Cumple |
| Escalabilidad | ¿Multiusuario sin rediseño? — Diseño intencional monousuario | Parcial |

**7 de 8 atributos cumplidos.** La escalabilidad parcial es una decisión consciente del alcance, no un defecto: K3s ya permite réplicas y el Monolito Modular facilita una extracción futura.

</Reveal>

## Design by Contract — la operación más crítica

<Reveal>

El contrato formal de `POST /api/v1/transactions` (Meyer, 1997):

```
PRECONDICIONES:
  amount ∈ ℝ⁺  ·  type ∈ {expense, income, transfer}
  accountId pertenece al usuario autenticado (garantizado por AuthDecorator)

POSTCONDICIONES:
  INSERT de transacción + UPDATE de saldo en la MISMA transacción ACID
  Jobs encolados en notificationsQueue y budgetQueue
  Cache del dashboard invalidada · HTTP 201

INVARIANTES:
   Si el INSERT falla, el UPDATE se revierte automáticamente
   Un usuario JAMÁS crea transacciones en cuentas ajenas
```

</Reveal>

## Verificación de consistencia

<Reveal>

Tres propiedades verificadas formalmente sobre el modelo de estados y los workers:

| Propiedad | Verificación | Resultado |
|-----------|--------------|:---------:|
| **Sin estados trampa**| Todo estado tiene salida (Executed → Pending o fin) | Verificado |
| **Completitud**| Los 5 estados definen respuesta a los 4 eventos (25 celdas, ninguna ambigua) | Verificado |
| **Sin deadlock**| Dependencias entre workers unidireccionales: RecurringTxn → Notification. Sin ciclos | Verificado |

</Reveal>

<Reveal>

::: info Análisis completo
Los 3 contratos de interfaz, la matriz de transiciones completa y la reflexión crítica sobre robustez están en [Design → Formal Analysis](/entrega2/analisis-formal).
:::

</Reveal>

---

<div style="display:flex; justify-content:space-between">
  <a href="./metricas">← Métricas</a>
  <a href="./mejoras">Siguiente: Mejoras →</a>
</div>
