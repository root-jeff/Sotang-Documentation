# Modelo de Seguridad

<p class="section-intro">Sotang implementa <strong>defensa en profundidad</strong> con 6 capas independientes. Comprometer una capa no compromete las demás. El modelo está diseñado para un servidor personal expuesto a internet vía Cloudflare Tunnels.</p>

## Defensa en profundidad — 6 capas

```mermaid
graph TB
    L1["Capa 1 — Red: Cloudflare Tunnels\nSin puertos expuestos. TLS terminado en Cloudflare.\nCloudflare WAF + DDoS protection de serie."]
    L2["Capa 2 — TLS: Traefik v3\nHTTPS obligatorio internamente. Certificado gestionado por Cloudflare.\nHTTP → HTTPS redirect en IngressRoute."]
    L3["Capa 3 — Autenticación: JWT\naccess_token 15 min (stateless) + refresh_token 30 días\nRefresh tokens hasheados en PostgreSQL (revocables)"]
    L4["Capa 4 — Autorización: Fastify\nTodo recurso verifica userId === resource.userId.\n404 en lugar de 403 — no revela existencia del recurso."]
    L5["Capa 5 — Validación: TypeBox\nSchema validation estricta en cada endpoint.\nTipos, enums y rangos en tiempo de compilación y runtime."]
    L6["Capa 6 — Base de datos: PostgreSQL + Drizzle ORM\nQueries type-safe, sin SQL injection posible.\nAccesible solo desde la red interna K3s."]

    INTERNET["Internet"] --> L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

## Gestión de secretos

**Regla:** ningún secreto va en el repositorio, nunca.

| Secreto | Almacenamiento |
|---------|---------------|
| `DATABASE_URL` | K3s Secret |
| `JWT_SECRET` | K3s Secret — `openssl rand -hex 64` |
| `RESEND_API_KEY` | K3s Secret |
| `TELEGRAM_TOKEN` | K3s Secret |
| `FIREBASE_KEY` | K3s Secret (JSON completo) |
| `GDRIVE_SA_JSON` | K3s Secret (JSON completo) |
| `CLOUDFLARE_TUNNEL_TOKEN` | K3s Secret / systemd env |

```
Desarrollador → kubectl create secret → K3s Secrets
                                              ↓ env vars inyectadas
                                        Pods K3s → process.env
```

`.env` y `.env.*` siempre en `.gitignore`.

## Auth mobile vs web

| Aspecto | Mobile (React Native) | Web SPA (Fase 2) |
|---------|-----------------------|------------------|
| Token storage | `expo-secure-store` (Keychain iOS / Keystore Android) | Cookie HttpOnly + SameSite=Strict |
| Token envío | `Authorization: Bearer` header | Cookie automática |
| CSRF | N/A (no cookies) | SameSite=Strict previene CSRF |
| Refresh | JSON body `{ refreshToken }` | Cookie HttpOnly (invisible a JS) |

## Amenazas y mitigaciones

| Amenaza | Mitigación |
|---------|-----------|
| **XSS** | React Native no tiene DOM · Web: React escapa por default + CSP headers |
| **CSRF** | Mobile: sin cookies · Web: SameSite=Strict + Cookie HttpOnly |
| **SQL Injection** | Drizzle ORM — queries parameterizadas, imposible inyectar |
| **IDOR** | Filtro `userId` en **todos** los queries · 404 en lugar de 403 |
| **Brute force login** | Rate limit: 10 req/min en `POST /auth/login` (Fastify rate limit plugin) |
| **Token theft** | access_token 15 min · refresh revocable en DB · HTTPS obligatorio |
| **User enumeration** | Mismo mensaje para "no existe" y "contraseña incorrecta" |
| **Puertos expuestos** | Cloudflare Tunnels — sin puertos abiertos en el router |
| **Secrets en código** | K3s Secrets + `.gitignore` estricto |
| **Passwords legibles** | bcrypt con salt (cost=12) |
| **DDoS** | Cloudflare WAF + rate limiting de Cloudflare |

## Headers de seguridad (Nginx — Fase 2 web)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## Límites de confianza

```mermaid
graph TB
    subgraph INTERNET["Sin confianza (internet público)"]
        MOB["Mobile App (Jeff)"]
        TG_SRV["Telegram servers (webhook)"]
        ATTACKER["Atacante"]
    end

    subgraph CF["Cloudflare (filtro exterior)"]
        CF_WAF["WAF + DDoS + TLS termination"]
    end

    subgraph CLUSTER["Confianza K3s (red interna)"]
        TRAEFIK_C["Traefik v3"]
        BE_C["Backend Fastify\n(JWT verify en cada request)"]
        BOT_C["Telegram Bot\n(X-Internal-Key)"]
        PG_C["PostgreSQL\n(solo acceso interno)"]
        REDIS_C["Redis\n(solo acceso interno)"]
    end

    MOB -->|"HTTPS"| CF_WAF
    TG_SRV -->|"HTTPS webhook"| CF_WAF
    ATTACKER -->|"bloqueado"| CF_WAF

    CF_WAF -->|"tunnel cifrado"| TRAEFIK_C
    TRAEFIK_C --> BE_C & BOT_C
    BOT_C -->|"X-Internal-Key"| BE_C
    BE_C --> PG_C & REDIS_C
```

## Autenticación de canales

| Canal | Mecanismo |
|-------|-----------|
| Mobile App | `Authorization: Bearer {accessToken}` |
| Telegram Bot → API | `X-Internal-Key: {SECRET}` (solo red interna K3s) |
| Endpoints públicos | Sin auth: `POST /auth/login`, `POST /auth/register`, `GET /health` |
