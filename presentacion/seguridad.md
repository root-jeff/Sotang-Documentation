---
title: 5. Seguridad
---

<PresHero
  badge="Acto 5"
  title="Seguridad"
  subtitle="Defensa en profundidad: 6 capas que un atacante debe atravesar para llegar a los datos"
/>

## Las 6 capas de defensa

Haz clic en cada capa para ver cómo protege el sistema:

<SecurityLayers />

## Decisiones de seguridad destacadas

<Reveal>

### Tokens de vida corta + revocación instantánea

| Token | TTL | Almacenamiento | Revocación |
|-------|-----|----------------|------------|
| Access token | 15 min | Memoria / SecureStore | Expira solo |
| Refresh token | 7 días | SecureStore (mobile) / Cookie HttpOnly (web) | `DEL` en Redis — inmediata |

Si un dispositivo se compromete, la ventana de exposición del access token es de máximo 15 minutos, y el refresh token se revoca al instante desde cualquier sesión.

</Reveal>

<Reveal>

### 404, no 403

Cuando un usuario intenta acceder a un recurso ajeno, el sistema responde **404 Not Found** en lugar de 403 Forbidden. Un 403 confirmaría que el recurso *existe* — información útil para un atacante. El 404 no revela nada.

</Reveal>

<Reveal>

### "Invalid credentials"— siempre

El login responde exactamente lo mismo si el email no existe o si la contraseña es incorrecta. Esto impide la **enumeración de usuarios**. Además: máximo 5 intentos fallidos por 15 minutos (contador en Redis) y el hash bcrypt jamás aparece en ninguna respuesta.

</Reveal>

<Reveal>

### La privacidad como arquitectura, no como promesa

Los servicios externos reciben solo el mínimo indispensable:

| Servicio | Qué recibe | Qué NO recibe |
|----------|-----------|----------------|
| CoinGecko | IDs de criptomonedas | Cantidades ni saldos |
| Resend | El email a enviar | Historial financiero |
| Firebase | Token FCM + payload de la push | Datos de cuentas |
| Google Drive | Backup **cifrado**| Datos legibles |
| Cloudflare | Tráfico ya cifrado con TLS | Contenido descifrable |

</Reveal>

---

<div style="display:flex; justify-content:space-between">
  <a href="./arquitectura">← Arquitectura</a>
  <a href="./patrones">Siguiente: Patrones de Diseño →</a>
</div>
