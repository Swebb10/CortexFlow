# CortexFlow

Dashboard de aprendizaje local con mapas mentales interactivos, notas Markdown, Active Recall y Pomodoro. React 19, TypeScript estricto, Vite 7, Tailwind CSS 4, Lucide y React Flow 12.

## Ejecutar el proyecto entregado

Requiere Node.js **22.12 o superior** y npm. El proyecto completo se encuentra en `C:/Freelance/CortexFlow` después de la instalación local.

```powershell
Set-Location C:/Freelance/CortexFlow
npm ci
npm run dev
```

Abre la URL que imprime Vite (normalmente `http://127.0.0.1:5173`). El mapa de Arquitectura de Software está disponible desde el primer inicio. `npm ci` usa las versiones reproducibles de `package-lock.json`; puedes omitirlo si ya tienes `node_modules` instalado.

```powershell
npm run test       # Parser, validación de copias y temporizador
npm run typecheck  # TypeScript estricto
npm run build      # Genera dist/ para producción
npm run preview    # Revisa el build de producción
```

## Inicializar desde cero con Vite y Tailwind

Estos comandos son una referencia para una carpeta **vacía**, no se necesitan sobre el proyecto entregado:

```powershell
New-Item -ItemType Directory -Force C:/Freelance | Out-Null
Set-Location C:/Freelance
npm create vite@latest CortexFlow -- --template react-ts
Set-Location CortexFlow
npm install
npm install @xyflow/react lucide-react react-markdown remark-gfm
npm install -D tailwindcss @tailwindcss/vite vitest
```

En Tailwind 4 no se necesita `tailwind.config.js` ni `npx tailwindcss init`. Añade `tailwindcss()` a los plugins de Vite y `@import "tailwindcss";` al CSS global, como en este proyecto. Guías oficiales: [Vite](https://vite.dev/guide/) y [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite).

## Estructura modular

```text
CortexFlow/
├── examples/mi-primera-nota.md
├── public/favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Selector de temas, guía e indicadores
│   │   ├── Sidebar.tsx          # Biblioteca, creación e importación
│   │   ├── MindMapCanvas.tsx    # React Flow, navegación y minimapa
│   │   ├── KnowledgeNode.tsx    # Nodos con estilos y estados propios
│   │   ├── PomodoroTimer.tsx    # Controles de enfoque y descanso
│   │   ├── NodeInspector.tsx    # Markdown y Active Recall
│   │   ├── NodeEditor.tsx       # Crear/editar conceptos y su conexión
│   │   ├── MarkdownContent.tsx  # Renderizado seguro con GFM
│   │   └── Modal.tsx            # Diálogo accesible con foco nativo
│   ├── context/ThemeContext.tsx # Tema global y LocalStorage
│   ├── data/
│   │   ├── initial-map.json     # Mock de 10 nodos: software, cloud y redes
│   │   └── demo-maps.ts         # Módulos de React y HTTP
│   ├── hooks/
│   │   ├── usePomodoro.ts       # Estado y sincronización del reloj
│   │   └── useMapHistory.ts     # Deshacer/rehacer por módulo
│   ├── lib/
│   │   ├── markdown.ts          # Parser y distribución jerárquica
│   │   ├── storage.ts           # Validación y almacenamiento tolerante a fallos
│   │   ├── map-editor.ts        # Creación, edición, conexiones y borrado de ramas
│   │   ├── map-history.ts       # Historial reversible de cambios
│   │   ├── map-editor.test.ts   # Invariantes del editor y del historial
│   │   ├── timer.ts             # Transiciones puras del Pomodoro
│   │   └── core.test.ts         # Pruebas del comportamiento principal
│   ├── styles/index.css        # Cinco temas, layout y estilos del grafo
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.app.json
└── vite.config.ts
```

## Flujo de uso

1. Elige un módulo o crea/importa una nota. El selector admite `.md`, `.markdown`, `.txt` y copias `.json` exportadas desde CortexFlow.
2. Arrastra los nodos y el fondo; usa los controles de zoom o el gesto de pinza. La rueda desplaza el lienzo. Selecciona un nodo para abrir su contenido. `Ctrl + K` / `Cmd + K` lleva a la búsqueda de conceptos.
3. Activa Active Recall. La explicación se retira del DOM mientras está oculta; responde a la pregunta y revela tus notas. Marca el concepto como repasado para actualizar el progreso.
4. Inicia 25 minutos de enfoque; al finalizar se prepara un descanso de 5 minutos **pausado**. Cada fase requiere inicio explícito. Pausar conserva el tiempo y reiniciar restablece la fase actual.
5. Exporta tu módulo para respaldarlo. Incluye posiciones, Markdown y conceptos repasados; una importación JSON crea un módulo independiente.

En pantallas pequeñas, la biblioteca y el inspector se abren con los botones de la barra superior. Escape cierra paneles, búsqueda o diálogos. La vista Esquema ofrece navegación por texto.

## Editar un mapa

- Pulsa **Nuevo concepto**, el botón **Añadir** sobre el nodo seleccionado o **Añadir hijo** en el inspector. Elige el padre, escribe el título y añade una explicación Markdown. Un nuevo concepto se coloca cerca del padre sin mover los nodos existentes.
- Haz **doble clic** en un nodo o pulsa **Editar concepto**. Puedes cambiar título, resumen, explicación, pregunta de Active Recall, concepto padre y color de una rama principal. Editar la raíz también actualiza el nombre del módulo.
- Para cambiar una conexión, selecciona otro padre en el editor o arrastra el punto derecho de un nodo al punto izquierdo del que quieres conectar como hijo. La nueva conexión reemplaza el padre anterior. La raíz se conserva y se rechazan conexiones circulares.
- **Eliminar rama** borra el concepto y todos sus descendientes, después de confirmar en el diálogo. También puedes usar la tecla Delete con un nodo seleccionado. Sus IDs se eliminan del progreso de repaso.
- **Deshacer / Rehacer** revierte hasta 30 cambios por módulo durante la sesión. Atajos: `Ctrl/Cmd + Z`, `Ctrl/Cmd + Shift + Z` y `Ctrl/Cmd + Y`. Dentro de un campo de texto se conserva el historial nativo de escritura. Recargar mantiene el mapa guardado, pero reinicia este historial de cambios.
- Cambiar el título, la explicación o la pregunta de un concepto lo marca de nuevo para repasar. Los demás conceptos conservan su progreso. Todos los cambios del mapa se guardan localmente y se incluyen en la exportación JSON.

## Temas dinámicos

`ThemeContext` actualiza `data-theme` en `<html>` y guarda la elección en `cortexflow:theme`. Un script inicial evita el destello del tema predeterminado. Los componentes usan variables semánticas (`--bg`, `--surface`, `--text`, `--accent`) y los nodos usan tonos de rama (`--violet`, `--blue`, `--mint`, `--amber`). El bloque `@theme inline` los expone también como utilidades Tailwind, por ejemplo `bg-surface`, `text-accent` y `text-muted`.

| Tema | Dirección visual |
| --- | --- |
| Dark (predeterminado) | Grafito, azul y violeta |
| Light | Blanco, texto oscuro y acentos con contraste |
| Cyberpunk | Negro, cian, magenta y verde neón |
| Nordic | Slate, azul frío y menta |
| Sunset | Terracota, ámbar y degradados cálidos |

## Datos, límites y decisiones

- La conversión es **estructural y local**, sin IA ni servicios externos. Reconoce encabezados ATX (`#` a `######`), preserva sus explicaciones y respeta bloques de código. Sin encabezados, crea conceptos a partir de párrafos. Los encabezados Setext no forman nodos, aunque su contenido sí se puede leer como Markdown.
- Los archivos tienen un límite de 1 MB; cada módulo, 100 nodos; la biblioteca, 30 módulos. Los árboles importados se validan contra ciclos, IDs duplicados, referencias inexistentes y posiciones inválidas.
- LocalStorage guarda módulos, posiciones al terminar de arrastrar, progreso, tema, módulo activo y Pomodoro. Si está bloqueado o se llena, se puede seguir trabajando en memoria; el panel muestra el problema de guardado de notas y permite exportar. El almacenamiento pertenece al origen: cambiar de puerto o navegador crea otro espacio.
- El reloj usa `Date.now()` y una fecha de vencimiento, evitando depender del número de ticks. Reconcilia el tiempo después de recargar o volver a una pestaña inactiva. No requiere que la pestaña quede abierta para conservar una fase, pero no emite una alarma mientras está cerrada.
- Markdown se renderiza con `react-markdown` y GFM. HTML incrustado se omite, los enlaces conservan la sanitización de la librería y abren con `noopener noreferrer`. Las imágenes se muestran como texto alternativo para evitar peticiones de red desde notas importadas. No se usa `dangerouslySetInnerHTML`.
- No hay cuentas, sincronización remota, colaboración ni backend. Para compartir un mapa, exporta el JSON. El modelo tipado facilita añadir IndexedDB o una API en `lib/storage.ts` sin acoplar el canvas a la persistencia.
- Tailwind usa el plugin oficial de Vite. React Flow conserva la atribución requerida. Documentación: [React Flow](https://reactflow.dev/learn/customization/custom-nodes), [react-markdown](https://github.com/remarkjs/react-markdown).

## Despliegue

`npm run build` produce una aplicación estática en `dist/`. Sirve esa carpeta con HTTPS. No se necesitan variables de entorno ni secretos. Para desplegar bajo un subdirectorio, configura `base` en `vite.config.ts`.

En Vercel, importa el repositorio de GitHub con preset **Vite**, comando `npm run build` y salida `dist`. Para actualizar un proyecto que ya está conectado a la rama `main`:

```powershell
Set-Location C:/Freelance/CortexFlow
git add .
git commit -m "Add mind map editing"
git push
```

Vercel compilará el nuevo commit. Para ver cambios mientras desarrollas localmente, usa `npm run dev`; `npm run preview` sirve el último build, por lo que requiere compilar de nuevo después de editar el código.
