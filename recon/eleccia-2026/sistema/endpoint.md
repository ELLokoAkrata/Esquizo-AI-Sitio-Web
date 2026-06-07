# Sistema EleccIA — Endpoint y Arquitectura

## URL del chatbot
```
https://votoinformadoia.jne.gob.pe/hoja-vida/{apellido}
```
Patrón de apellidos confirmado: `fujimori` → Keiko Sofía Fujimori Higuchi

## Endpoint de chat
```
POST https://votoinformadoia.jne.gob.pe/ServiciosIA/chat-hv
Content-Type: application/json
```

## Payload (schema estricto)
```json
{
  "message": "string",
  "sessionId": "uuid",
  "turnstileToken": "string"
}
```

## Respuesta exitosa
```json
{
  "reply": "string (markdown)",
  "sessionId": "uuid",
  "timestamp": "ISO8601"
}
```

## Validación de schema
El servidor rechaza cualquier campo extra con **400 Bad Request**:
```json
{
  "error": "Bad Request",
  "message": [
    "property role should not exist",
    "property context should not exist",
    "property system should not exist"
  ],
  "statusCode": 400
}
```
Esto descarta la inyección vía campos del payload. El único vector es el campo `message`.

## Stack inferido
- Frontend: React/Vite (bundle: `assets/index.BmaCa6Ex.js`)
- Anti-bot: Cloudflare Turnstile (render=explicit)
- Analytics: Google Tag Manager (`G-2FTQKMBKRR`)
- Config: `/config.js?v=1` (cargado dinámicamente)
- Validación backend: probablemente NestJS con class-validator (mensajes típicos de ese stack)

## Scripts cargados
```
https://votoinformadoia.jne.gob.pe/config.js?v=1
https://www.googletagmanager.com/gtag/js?id=G-2FTQKMBKRR
https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit
https://votoinformadoia.jne.gob.pe/assets/index.BmaCa6Ex.js
```
