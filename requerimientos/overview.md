# Requerimientos — Visión General

Sotang gestiona finanzas personales para un usuario en Ecuador (USD, IVA 15%). Datos 100% en servidor propio.



## Pantallas principales

| # | Pantalla | Descripción |
|---|----------|-------------|
| 1 | **Dashboard** | Vista rápida: liquidez, metas, alertas del día |
| 2 | **Transacciones** | Registro diario, calendario, resúmenes mensuales |
| 3 | **Finanzas** | Gráficos de análisis, ingresos vs gastos |
| 4 | **Cuentas** | Bancos, tarjetas, fondos, efectivo, ahorros, cripto |
| 5 | **Patrimonio** | Activos, pasivos, net worth, score Equifax |
| 6 | **Presupuestos** | Por categoría con alertas al 80% |
| 7 | **Metas** | Metas de ahorro con progreso visual |
| 8 | **Cuentas x Cobrar / Deudas** | Préstamos a terceros y deudas informales |
| 9 | **Configuración** | Parámetros globales, categorías, integraciones |



## Principios de diseño

- **Simple primero** — entrada de datos rápida, especialmente en móvil/Telegram
- **Todo parametrizable** — IVA, categorías, cupos compartidos, recurrencias
- **Multicanal** — web, móvil (fase 2), Telegram Bot
- **Notificaciones inteligentes** — alertas antes de eventos clave, no spam
- **Privacidad local** — datos en Raspberry Pi 5 + Tailscale, sin SaaS externos



## Contexto Ecuador

| Parámetro | Valor |
|-----------|-------|
| Moneda | USD |
| IVA | 15% (parametrizable) |
| Bancos | No exponen APIs públicas — sin integración automática |
| Score crediticio | Equifax Ecuador (carga manual de JSON) |
| Tarjetas | Diners + Titanium con cupo compartido de $900 |



## Módulos de requerimientos

-  — usuarios, JWT, roles, notif. config
-  — tipos, IVA, recurrentes, vistas, canales
-  — tipos, cupos compartidos, cripto, ahorros virtuales
-  — categorías, presupuestos, alertas
-  — metas, aportes, proyecciones
-  — net worth, depreciación, Equifax
-  — cuentas por cobrar, deudas informales
-  — widgets, finanzas, configuración global
-  — email/push/telegram, bot, CoinGecko, reportes
-  — adjuntos, pg_dump, data report, Google Drive
