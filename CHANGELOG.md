# Changelog - AnotaLink

Todas las notas notables y cambios de este proyecto están documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.2.2] - 2026-11-06

### Mejorado
- **Rediseño completo de la ventana de guardado (Web Share Target)**:
  - **Corrección total de contraste y legibilidad en subcategorías**: Se solucionó el problema de fuentes poco visibles por colores de fondo. Las subcategorías ahora se presentan en tarjetas individuales de máximo contraste (`text-gray-900` en tema claro y `text-white` en tema oscuro) sobre fondos nítidos y bien delimitados.
  - **Estructura jerárquica limpia y elegante**: Cada grupo de categoría principal cuenta con una cabecera clara, botón directo *"Elegir esta"* para archivar en la carpeta raíz y chevron animado para desplegar sus subcategorías.
  - **Selector táctil de subcategorías mejorado**: Cada subcategoría cuenta con su propio icono de color, texto en negrita y radio/check circular claro. Al seleccionarse, se resalta en azul sólido (`bg-blue-600 text-white`) con checkmark blanco de confirmación.
  - **Banner de destino destacado**: Tarjeta superior con borde azul reforzado que muestra en todo momento la ruta completa seleccionada (`Padre › Subcategoría`) y confirmación `✓ Listo`.
  - **Buscador de carpetas ágil con resultados de alto contraste**: Filtrado en tiempo real que lista las rutas coincidentes con tipografía brillante y selección instantánea al tocar.
  - **Diseño general prolijo y refinado**: Header minimalista, tarjeta de URL y título estilizada con favicon y botón *"Probar enlace"*, panel colapsable para notas y botón de guardado destacado.

---

## [1.2.1] - 2026-10-31

### Mejorado
- **Rediseño completo, ágil y visualmente agradable de la pantalla de compartir**:
  - **Selector de categorías cómodo y fluido**: Reemplazada la cuadrícula rígida de botones por una lista jerárquica limpia con iconos, colores y chevrons suaves para desplegar y seleccionar subcategorías con un solo toque.
  - **Buscador instantáneo de categorías**: Barra de búsqueda integrada para filtrar al instante cualquier categoría o subcategoría por nombre (ej. "viajes", "estudio") con selección directa en 1 clic.
  - **Banner de categoría seleccionada**: Indicador visual destacado en tiempo real con el camino completo `Padre › Subcategoría` y confirmación de selección.
  - **Creación ágil de categorías y subcategorías**: Botón accesible `+ Nueva categoría` arriba del buscador y botón directo `+ Añadir subcategoría` dentro de cada carpeta principal.
  - **Diseño más ligero y compacto**: Disposición compacta del título y enlace con previsualización de favicon, botón para probar URL y panel colapsable para notas y etiquetas para no sobrecargar la vista.

---

## [1.2.0] - 2026-10-29

### Añadido
- **Pantalla exclusiva e intuitiva para enlaces compartidos (Web Share Target)**:
  - Al compartir cualquier enlace desde otra app móvil o navegador (Chrome, YouTube, Instagram, etc.), AnotaLink ahora abre inmediatamente una pantalla dedicada y enfocada en guardar el enlace, evitando confusiones con la ventana principal.
  - **Tarjeta visual del enlace**: Muestra el favicon del sitio web, nombre del dominio, enlace editable y botón directo para probar el enlace en una nueva pestaña.
  - **Selector táctil de categorías**: Cuadrícula visual de categorías con sus iconos y colores representativos, soporte desplegable para subcategorías directas, opción "Sin categoría" y acceso rápido para crear una nueva categoría sobre la marcha.
  - **Opciones adicionales**: Soporte para notas/recordatorios, etiquetas (#tags) y marcado como Favorito ⭐.
  - **Pantalla de confirmación y feedback**: Check animado con confirmación de guardado exitoso, indicando la categoría destino y botones de acceso directo para navegar a la categoría o volver al inicio.
  - **Persistencia de sesión**: Si el usuario no ha iniciado sesión al momento de compartir, el enlace se resguarda temporalmente y se muestra un banner en el login para abrir la pantalla de guardado inmediatamente al ingresar.

---

## [1.1.0] - 2026-10-12

### Añadido
- **Módulo de Reportes y Exportación**:
  - Exportación de listados de enlaces organizados por categorías y subcategorías a formato Excel/CSV.
  - Generación de reportes PDF de alta calidad con encabezados decorativos, desglose por categoría y firma institucional CAELUM.
  - Soporte para compartir el reporte PDF directamente mediante `navigator.share`.

### Corregido
- Menú contextual de opciones rápidas (3 puntos) en tarjetas de enlaces para renombrar, mover de categoría, editar y eliminar.
- Barra de búsqueda fija y visible en la parte superior para filtrado instantáneo en tiempo real.
- Distribución compacta del cajón rápido para agregar enlaces en la pantalla principal.

---

## [1.0.0] - 2026-09-12

### Añadido
- Lanzamiento inicial de AnotaLink como Progressive Web App (PWA).
- Sincronización en la nube mediante Firebase Authentication y Cloud Firestore.
- Organización jerárquica de enlaces mediante categorías y subcategorías personalizables con paleta de colores e iconos.
- Soporte para tema claro y tema oscuro con guardado de preferencias.
- Integración de Web Share Target API en `manifest.json`.
