---
title: 2. Requerimientos
---

<PresHero
  badge="Acto 2"
  title="Requerimientos"
  subtitle="50 requerimientos funcionales en 10 módulos + 26 no funcionales en 5 dimensiones"
/>

## Explorador de Requerimientos Funcionales

Filtra por módulo o busca por texto — estos son los requerimientos representativos de cada módulo:

<ReqExplorer :requirements="[
  { id: 'RF-01', module: 'Autenticación', text: 'Registro e inicio de sesión con email y contraseña (bcrypt, mínimo 8 caracteres)', priority: 'Alta' },
  { id: 'RF-03', module: 'Autenticación', text: 'Access token JWT de 15 min + refresh token de 7 días revocable', priority: 'Alta' },
  { id: 'RF-05', module: 'Cuentas', text: 'Gestionar 6 tipos de cuenta: bancaria, tarjeta, ahorro, efectivo, cripto, inversión', priority: 'Alta' },
  { id: 'RF-08', module: 'Transacciones', text: 'Registrar ingresos, gastos y transferencias con actualización atómica de saldos (ACID)', priority: 'Alta' },
  { id: 'RF-09', module: 'Transacciones', text: 'IVA 15% en dos modos: incluido (desglose: neto = monto/1.15) y adicional con casilla Aplica IVA (total = base × 1.15, compras digitales)', priority: 'Alta' },
  { id: 'RF-12', module: 'Transacciones', text: 'Transacciones recurrentes con ciclo de vida de 5 estados (patrón State)', priority: 'Media' },
  { id: 'RF-17', module: 'Cuentas', text: 'Cupo compartido entre tarjetas Diners y Titanium ($900 consolidado)', priority: 'Alta' },
  { id: 'RF-20', module: 'Categorías', text: 'Jerarquía de 2 niveles: 9 categorías de gasto y 3 de ingreso del sistema + personalizadas', priority: 'Media' },
  { id: 'RF-24', module: 'Presupuestos', text: 'Presupuestos por categoría y periodo (mensual/semanal/anual) con alertas al 80% y 100%', priority: 'Alta' },
  { id: 'RF-28', module: 'Metas', text: '3 tipos de meta de ahorro con cálculo de aporte mensual necesario y fecha estimada', priority: 'Media' },
  { id: 'RF-31', module: 'Metas', text: 'Notificaciones de hito al alcanzar 25%, 50%, 75% y 100% de la meta', priority: 'Baja' },
  { id: 'RF-33', module: 'Patrimonio', text: 'Registro de 7 tipos de activo con depreciación vehicular automática anual', priority: 'Media' },
  { id: 'RF-36', module: 'Patrimonio', text: 'Tabla de amortización de pasivos con cuota francesa', priority: 'Media' },
  { id: 'RF-38', module: 'Patrimonio', text: 'Carga de reportes Equifax con deduplicación por transaction_id', priority: 'Baja' },
  { id: 'RF-40', module: 'Cobros/Deudas', text: 'Cuentas por cobrar con 4 estados y recordatorios con guard de 24h entre envíos', priority: 'Media' },
  { id: 'RF-43', module: 'Dashboard', text: '9 widgets con cache Redis TTL 5 min: liquidez, balance, tarjetas, metas, presupuestos...', priority: 'Alta' },
  { id: 'RF-46', module: 'Notificaciones', text: '17 tipos de evento × 3 canales: email (Resend), push (FCM) y Telegram (gramMY)', priority: 'Alta' },
  { id: 'RF-48', module: 'Notificaciones', text: 'Bot de Telegram con 8 comandos conversacionales para registro rápido', priority: 'Media' },
  { id: 'RF-49', module: 'Reportes', text: '6 tipos de reporte PDF/Excel generados de forma asíncrona (jobId + polling)', priority: 'Media' },
  { id: 'RF-50', module: 'Reportes', text: 'Precios de criptomonedas actualizados cada 30 min desde CoinGecko', priority: 'Baja' },
]"/>

## Requerimientos No Funcionales — las 5 dimensiones

<Reveal>

| Dimensión | Requerimiento estrella | Meta medible |
|-----------|------------------------|--------------|
| **Costo**| RNF-01: Operación sin costo de hosting | $0/mes — Raspberry Pi propia |
| **Rendimiento**| RNF-05: Respuesta de la API | < 200 ms en lecturas comunes |
| **Seguridad**| RNF-10: Defensa en profundidad | 6 capas (red → TLS → JWT → authz → validación → ACID) |
| **Privacidad**| RNF-15: Datos fuera de nubes de terceros | 100% de datos financieros en hardware local |
| **Mantenibilidad**| RNF-21: Extensión sin modificación | Nuevo tipo de cuenta = 1 clase nueva, 0 cambios |

</Reveal>

<Reveal>

::: info Cómo se validan
Cada RNF tiene una **métrica de medición** asociada: los tiempos de respuesta salen de los logs del hook `onSend` de Fastify, la disponibilidad se monitorea con UptimeRobot (meta > 99%), y la mantenibilidad se demuestra con las métricas CK del Acto 7.
:::

</Reveal>

---

<div style="display:flex; justify-content:space-between">
  <a href="./problema">← El Problema</a>
  <a href="./casos-de-uso">Siguiente: Casos de Uso →</a>
</div>
