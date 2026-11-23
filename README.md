# tickets-service

Emite y administra las entradas digitales de EntradasYa. Es propietario de `tickets_db` y de los PDF guardados en `storage/tickets`.

## Emisión

- Cada unidad de una orden genera una entrada, un código aleatorio, un QR y un PDF independientes.
- Los códigos se generan con 256 bits de aleatoriedad criptográfica.
- El QR contiene únicamente el código; no incluye nombres, correos ni otros datos personales.
- `orderId` es único. Repetir exactamente la misma solicitud devuelve las entradas existentes.
- Repetir una orden con cantidad o referencias diferentes devuelve conflicto.
- La base se actualiza en una transacción local y los archivos temporales se limpian cuando la operación falla.

El PDF incluye evento, fecha, lugar, sector, nombre del cliente, identificador, QR y aviso de ingreso único. Los datos se consultan mediante HTTP a `events-service` y `auth-service`; no se accede a sus bases.

## Endpoints

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| `POST` | `/internal/tickets/issue` | Interno | Emitir entradas de una orden pagada |
| `POST` | `/internal/tickets/validate` | Interno | Consultar código para check-in |
| `GET` | `/internal/tickets/orders/:orderId` | Interno | Consultar entradas para notificaciones |
| `GET` | `/internal/tickets/:id/pdf` | Interno | Descargar el PDF para adjuntarlo al correo |
| `GET` | `/tickets` | Cliente | Listar entradas propias |
| `GET` | `/tickets/:id/download` | Cliente propietario | Descargar PDF |
| `GET` | `/health/live` | Público local | Estado del proceso |
| `GET` | `/health/ready` | Público local | Disponibilidad de PostgreSQL |

Los endpoints internos requieren `X-Internal-Api-Key`. Los endpoints de cliente validan el JWT y el propietario antes de devolver datos o archivos.

## Base local

La base ya puede prepararse con:

```bash
pnpm db:tickets:deploy
```

Variables importantes:

```dotenv
DATABASE_URL=postgresql://tickets_user:change-me@localhost:5432/tickets_db?schema=public
TICKETS_STORAGE_PATH=../../storage/tickets
AUTH_SERVICE_URL=http://localhost:3001
EVENTS_SERVICE_URL=http://localhost:3002
```

## Desarrollo

```bash
pnpm --filter tickets-service dev
pnpm --filter tickets-service test
pnpm --filter tickets-service test:e2e
pnpm --filter tickets-service build
```
