import initialMap from './initial-map.json'
import { markdownToMap } from '../lib/markdown'
import type { KnowledgeMap } from '../types'

export const demoMaps: KnowledgeMap[] = [
  initialMap as KnowledgeMap,
  markdownToMap(`# React & TypeScript
Interfaces fiables, construidas con componentes y tipos.
## Componentes
Un componente describe una parte de la interfaz como función de sus props y estado.
### Props tipadas
Usa tipos explícitos para contratos públicos. Una unión discriminada evita combinaciones imposibles.
### Composición
Combina componentes pequeños. children permite separar estructura y contenido.
## Estado & efectos
Mantén el estado cerca de sus consumidores y deriva los valores que puedas calcular.
### useState
Las actualizaciones que dependen del estado previo deben usar una función: setCount(count => count + 1).
### useEffect
Sincroniza con sistemas externos. Limpia temporizadores y suscripciones para evitar recursos duplicados.
`, 'react.md', 'react-typescript'),
  markdownToMap(`# HTTP & APIs
Contratos predecibles para sistemas conectados.
## Solicitudes
Una solicitud contiene método, destino, cabeceras y un cuerpo opcional.
### Métodos
GET recupera; POST procesa; PUT reemplaza. Diseña semántica y reintentos de forma explícita.
### Seguridad
Usa HTTPS y valida autenticación y autorización en el servidor. CORS no sustituye controles de acceso.
## Respuestas
Los códigos de estado comunican el resultado a los clientes.
### Errores
Define una estructura de error estable. No expongas secretos ni detalles internos.
### Caché
Cache-Control define políticas de caché. ETag permite validar si una representación cambió.
`, 'http.md', 'http-apis'),
]
