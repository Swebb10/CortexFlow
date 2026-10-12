# Sistemas distribuidos

Un sistema distribuido coordina componentes que se comunican por una red y pueden fallar de forma independiente.

## Disponibilidad

La capacidad de atender solicitudes incluso cuando una parte del sistema falla.

### Redundancia

Usa réplicas y elimina puntos únicos de fallo. Diseña y prueba el proceso de recuperación.

### Observabilidad

Relaciona logs, métricas y trazas para entender el comportamiento real del sistema.

## Consistencia

Define cuándo y cómo los lectores observan cambios en los datos.

### Consistencia eventual

Si dejan de producirse actualizaciones, las réplicas pueden converger. Comunica al usuario estados pendientes cuando sea necesario.

### Idempotencia

Un reintento debe conservar el efecto esperado de la operación.

```ts
const request = { idempotencyKey: 'order-123' }
```
