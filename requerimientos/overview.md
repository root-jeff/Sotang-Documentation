# Requerimientos — Visión General

Sotang gestiona finanzas personales para un usuario en Ecuador (USD, IVA 15%). Datos 100% en servidor propio.

## Pantallas principales

| #   | Pantalla                      | Descripción                                         |
| --- | ----------------------------- | --------------------------------------------------- |
| 1   | **Dashboard**                 | Vista rápida: liquidez, metas, alertas del día      |
| 2   | **Transacciones**             | Registro diario, calendario, resúmenes mensuales    |
| 3   | **Finanzas**                  | Gráficos de análisis, ingresos vs gastos            |
| 4   | **Cuentas**                   | Bancos, tarjetas, fondos, efectivo, ahorros, cripto |
| 5   | **Patrimonio**                | Activos, pasivos, net worth, score Equifax          |
| 6   | **Presupuestos**              | Por categoría con alertas al 80%                    |
| 7   | **Metas**                     | Metas de ahorro con progreso visual                 |
| 8   | **Cuentas x Cobrar / Deudas** | Préstamos a terceros y deudas informales            |
| 9   | **Configuración**             | Parámetros globales, categorías, integraciones      |

## Principios de diseño

- **Simple primero** — entrada de datos rápida, especialmente en móvil/Telegram
- **Todo parametrizable** — IVA, categorías, cupos compartidos, recurrencias
- **Multicanal** — web, móvil (fase 2), Telegram Bot
- **Notificaciones inteligentes** — alertas antes de eventos clave, no spam
- **Privacidad local** — datos en Raspberry Pi 5 + Tailscale, sin SaaS externos

## Contexto Ecuador

| Parámetro        | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| Moneda           | USD                                                   |
| IVA              | 15% (parametrizable)                                  |
| Bancos           | No exponen APIs públicas — sin integración automática |
| Score crediticio | Equifax Ecuador (carga manual de JSON)                |
| Tarjetas         | Diners + Titanium con cupo compartido de $900         |

## Módulos de Requerimientos

| Módulo                        | Características Principales                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Autenticación y Seguridad** | Gestión de usuarios, JWT, control de roles, configuración de notificaciones                                       |
| **Transacciones**             | Tipos de movimientos, cálculo de IVA, transacciones recurrentes, vistas filtradas, soporte multicanal             |
| **Cuentas y Tarjetas**        | Tipos de cuentas, cupos compartidos (Diners/Titanium), gestión de criptomonedas, ahorros virtuales                |
| **Categorías y Presupuestos** | Categorías jerárquicas, límites de presupuesto, alertas tempranas                                                 |
| **Metas de Ahorro**           | Definición de metas, aportes trazables, proyecciones de cumplimiento                                              |
| **Patrimonio**                | Cálculo de patrimonio neto (Net Worth), depreciación de activos, registro de score Equifax                        |
| **Cobros y Deudas**           | Gestión de cuentas por cobrar a terceros y deudas informales propias                                              |
| **Dashboard y Reportes**      | Widgets visuales, análisis financiero, configuración global de interfaz                                           |
| **Integraciones Externas**    | Notificaciones por email/push/Telegram, integración con API CoinGecko para criptomonedas, exportación de reportes |
| **Storage y Backup**          | Gestión de adjuntos, tareas programadas (pg_dump), respaldo en Google Drive                                       |
