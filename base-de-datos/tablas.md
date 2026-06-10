# Base de Datos — Tablas por Módulo



## Core — usuarios

### `usuarios`
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| `id` | UUID | gen_random_uuid() | PK |
| `email` | VARCHAR(255) | — | UNIQUE |
| `password_hash` | VARCHAR(255) | — | bcrypt |
| `timezone` | VARCHAR(50) | `America/Guayaquil` | |
| `moneda` | VARCHAR(3) | `USD` | |
| `modo_ui` | VARCHAR(10) | `system` | CHECK IN (light, dark, system) |
| `telegram_chat_id` | VARCHAR(50) | NULL | |
| `activo` | BOOLEAN | TRUE | Soft delete |
| `email_verificado` | BOOLEAN | FALSE | |

### `user_settings` (1:1 con usuarios)
| Columna | Default |
|---------|---------|
| `iva_porcentaje` | 15.00 |
| `alerta_presupuesto_pct` | 80 |
| `dias_notif_recurrente` | 1 |
| `dias_notif_corte` | 1 |
| `auto_registrar_recurrentes` | TRUE |
| `crypto_update_interval_min` | 30 |
| `dia_inicio_semana` | 1 (Lunes) |

### `notification_preferences`
Un registro por evento por usuario. Columnas: `evento` (enum) · `canal_email` · `canal_telegram` · `canal_push`

**Enum `notif_evento`:** `recurrente_dia_antes` · `corte_tarjeta_dia_antes` · `meta_completada` · `meta_progreso` · `presupuesto_alerta` · `presupuesto_excedido` · `deuda_vencida` · `cuenta_cobrar_recordatorio`



## Cuentas

### `cuentas`
| Columna | Notas |
|---------|-------|
| `tipo` | banco · efectivo · tarjeta_credito · cripto · ahorro_virtual · inversion |
| `saldo_inicial` | Saldo al crear la cuenta |
| `saldo_actual` | Actualizado en cada transacción |
| `incluir_en_total` | Si se suma a liquidez del dashboard |

### `tarjetas_config` (extiende cuentas tipo tarjeta_credito)

| Columna | Notas |
|---------|-------|
| `cupo_total` | Límite total de la tarjeta |
| `cupo_grupo_id` | FK al grupo de cupos compartidos |
| `fecha_corte` | Día del mes en que corta |
| `fecha_pago` | Día máximo de pago |
| `tasa_interes_anual` | Tasa de interés de la tarjeta |
| `banco` | Nombre de la entidad |
| `ultimos_4` | Últimos 4 dígitos para identificarla |

### `cupos_grupos`
`nombre` · `cupo_total` · cálculo del disponible: suma de saldos de todas las tarjetas del grupo

### `cripto_config` (extiende cuentas tipo cripto)

| Columna | Notas |
|---------|-------|
| `simbolo` | Ticker (BTC, ETH, etc) |
| `cantidad` | Monto de tokens |
| `precio_compra_promedio` | Costo promedio de adquisición |
| `precio_actual_usd` | Precio de mercado actual |
| `precio_desactualizado` | TRUE si el worker falló |
| `ultima_actualizacion` | Timestamp de última consulta a API |

### `ahorro_virtual_config` (extiende cuentas tipo ahorro_virtual)
`cuenta_padre_id` → FK a la cuenta bancaria real donde está el dinero



## Transacciones

### `transacciones`
| Columna | Notas |
|---------|-------|
| `tipo` | ingreso · gasto · transferencia |
| `monto_sin_iva` | Calculado si `incluye_iva=true` |
| `iva_monto` | `monto − monto_sin_iva` |
| `canal` | web · mobile · telegram · email |
| `recurrente_id` | FK si fue generada por una recurrente |
| `estado` | completada · pendiente · en_proceso · anulada |

### `transacciones_recurrentes`

| Columna | Notas |
|---------|-------|
| `frecuencia` | diaria, semanal, quincenal, mensual, anual |
| `dia_del_mes` | Día específico de ejecución |
| `dia_de_semana` | Para casos semanales (ej: 1=Lunes) |
| `proxima_ejecucion` | Calculada por Celery Beat |
| `ultima_ejecucion` | Fecha del último trigger exitoso |
| `activa` | TRUE/FALSE |

### `categorias`
`es_sistema` → TRUE para las categorías predeterminadas (no borrables) · `parent_id` → autorreferencial (subcategorías)

### `etiquetas` + `transacciones_etiquetas` (tabla pivote)
Tags libres por transacción. M:N entre transacciones y etiquetas.



## Presupuestos y Metas

### `presupuestos`
`periodo` (mensual · semanal · anual · personalizado) · `alerta_porcentaje` (default 80) · `activo`

### `metas_ahorro`
`tipo` (cuenta_virtual · cuenta_especifica · libre) · `monto_actual` (actualizado en cada aporte) · `completada` · `fecha_completada`



## Patrimonio

### `activos`
`metodo_valoracion` (automatico · manual) · `tasa_depreciacion_anual` · `ultima_valoracion`

### `pasivos`
`monto_original` · `saldo_pendiente` · `cuota_mensual` · `fecha_fin`

### `equifax_reportes`
`raw_json` (JSONB — JSON completo para reprocesar) · `historico_score` (JSONB — últimos 3 períodos) · `archivo_path` (ruta del JSON original guardado)

### `cripto_precios_historico`
Registro por cada actualización de precio para graficar evolución. Crecerá con el tiempo.



## Cobros y Deudas

### `cuentas_por_cobrar`
`estado` (pendiente · parcial · cobrado · incobrable) · `ultimo_recordatorio` (para evitar spam)

### `cuentas_por_cobrar_abonos`
Historial de pagos parciales de cada deuda.

### `deudas_informales` + `deudas_informales_abonos`
Espejo de cuentas_por_cobrar pero desde la perspectiva de "yo debo".



## Sistema

### `adjuntos`

| Columna | Notas |
|---------|-------|
| `nombre_original` | Nombre del archivo subido por el usuario |
| `nombre_storage` | UUID renombrado para evitar colisiones |
| `ruta` | Relativa al filesystem local |
| `tipo_mime` | image/png, application/pdf, etc. |
| `tamano_bytes` | Peso del archivo para control de cuotas |

### `notificaciones_log`

| Columna | Notas |
|---------|-------|
| `evento` | Tipo de evento disparado |
| `canal` | email, telegram, push |
| `estado` | enviado, fallido |
| `metadata` | JSONB con payload detallado del evento |

### `backup_log`
`tipo` (db · data_report · adjuntos) · `estado` (ok · error) · `gdrive_file_id` · `tamano_bytes` · `error_mensaje`
