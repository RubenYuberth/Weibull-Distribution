<div align="center">

# Distribución de Weibull — Visualización interactiva

**Herramienta educativa para explorar la distribución de Weibull:
confiabilidad $R(x)$, probabilidad acumulada $F(x)$ y densidad $f(x)$.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![D3](https://img.shields.io/badge/D3.js-3-f9a03c?logo=d3&logoColor=white)
![KaTeX](https://img.shields.io/badge/KaTeX-0.16-000000?logo=katex&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-2-729b1f?logo=vitest&logoColor=white)

</div>

---

## Índice

- [Descripción](#descripción)
- [Conceptos clave](#conceptos-clave)
- [Características](#características)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Guía de parámetros](#guía-de-parámetros)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pruebas](#pruebas)
- [Construcción para producción](#construcción-para-producción)
- [Tecnologías](#tecnologías)

---

## Descripción

Esta aplicación web interactiva está pensada para que **estudiantes universitarios**
se familiaricen con la **distribución de Weibull**, ampliamente usada en
ingeniería de confiabilidad, análisis de fallas, control de calidad y
modelado de tiempos de vida.

Al mover los parámetros $x_0$ (umbral), $\eta$ (escala) y $b$ (forma), se
actualizan en tiempo real las curvas, las fórmulas con los valores
sustituidos y los marcadores de vida útil, permitiendo una exploración
puramente visual y numérica del modelo.

## Conceptos clave

La distribución de Weibull de tres parámetros se define para $x \ge x_0$ como:

$$
R(x) = \exp\!\left(-\left(\frac{x - x_0}{\eta}\right)^{b}\right)
$$

$$
F(x) = 1 - \exp\!\left(-\left(\frac{x - x_0}{\eta}\right)^{b}\right)
$$

$$
f(x) = \frac{b}{\eta}\left(\frac{x - x_0}{\eta}\right)^{b-1}
\exp\!\left(-\left(\frac{x - x_0}{\eta}\right)^{b}\right)
$$

Donde:

| Símbolo | Nombre | Significado |
| --- | --- | --- |
| $x_0$ | Umbral | Tiempo mínimo antes del cual no ocurren fallas ($R = 1$ para $x < x_0$) |
| $\eta$ | Escala (vida característica) | Tiempo en el que $R = e^{-1} \approx 36{,}8\%$ |
| $b$ | Forma (exponente) | Controla la forma de la curva de fallas |

Además, la app muestra tres marcadores de vida útil:

- **Vida característica**: $x_0 + \eta$, donde $R = e^{-1} \approx 0{,}368$
- **Mediana**: $x_0 + \eta\,(\ln 2)^{1/b}$
- **Media**: $x_0 + \eta\,\Gamma\!\left(1 + \tfrac{1}{b}\right)$

## Características

- Gráfica interactiva de $R(x)$, $F(x)$ y $f(x)$, con una o varias curvas a la vez
- Fórmulas renderizadas con **KaTeX** que se actualizan con los valores actuales
- Sliders para $x_0$, $\eta$ y $b$ con respuestas inmediatas y animadas
- Presets predefinidos que ilustran comportamientos clásicos:
  - *Weibull típica* ($b = 1{,}5$)
  - *Exponencial* ($b = 1$): tasa de falla constante
  - *Envejecimiento* ($b = 3$) y *Envejecimiento fuerte* ($b = 5$): desgaste
  - *Con umbral* ($x_0 = 2$)
- Marcadores de vida útil (vida característica, mediana y media)
- Crosshair con tooltip para leer valores puntuales en la gráfica
- Eje $x$ y tope de $y$ que se autoajustan según los parámetros

## Requisitos previos

- [Node.js](https://nodejs.org/) **18** o superior (incluye `npm`)
- Un navegador web moderno (Chrome, Firefox, Edge o Safari)

## Instalación

```bash
# 1. Clona el repositorio
git clone <url-del-repositorio>
cd Weibull

# 2. Instala las dependencias
npm install
```

## Uso

### Modo desarrollo

```bash
npm run dev
```

Vite inicia un servidor local (por defecto en `http://localhost:5173`) con
recarga en caliente: cada cambio en el código se refleja al instante en el
navegador.

### Flujo de trabajo sugerido para estudiantes

1. Abre la app y selecciona el preset **Exponencial** ($b = 1$): la
   confiabilidad decae como una exponencial pura.
2. Aumenta $b$ poco a poco con el slider y observa cómo $R(x)$ pasa de
   cóncava a sigmoidea, y cómo $f(x)$ se vuelve de tipo "campana".
3. Cambia $\eta$: la curva se estira o se comprime sin cambiar de forma.
   Fíjate en el marcador de **vida característica**.
4. Mueve $x_0$ con el preset **Con umbral**: toda la distribución se
   desplaza hacia la derecha y $R(x) = 1$ antes del umbral.
5. Activa simultáneamente $R$, $F$ y $f$ para verificar visualmente que
   $F(x) = 1 - R(x)$.

### Controles de la interfaz

| Control | Efecto |
| --- | --- |
| **Valores predefinidos** | Aplica combinaciones de parámetros con significado físico conocido |
| **Umbral $x_0$** | Desplaza el origen de la distribución ($0$ a $10$) |
| **Escala $\eta$** | Estira o comprime la distribución ($0{,}1$ a $10$) |
| **Exponente $b$** | Cambia la forma de la curva ($1$ a $10$) |
| **Curvas** | Muestra u oculta $R(x)$, $F(x)$ y $f(x)$ (siempre debe quedar al menos una visible) |
| **Marcadores de vida útil** | Activa/desactiva las líneas de vida característica, mediana y media |

## Guía de parámetros

El exponente de forma $b$ define el tipo de comportamiento del sistema:

| Valor de $b$ | Comportamiento de la tasa de falla | Interpretación |
| --- | --- | --- |
| $b < 1$ | Decreciente | Mortalidad infantil (fallas tempranas) |
| $b = 1$ | Constante | Fallas aleatorias (equivalente a la exponencial) |
| $b > 1$ | Creciente | Desgaste / envejecimiento |

> **Nota:** en esta app el slider de $b$ comienza en $1$, pero la función
> `f(x)` implementada soporta cualquier $b > 0$ (ver `src/weibull.ts`).

## Estructura del proyecto

```
Weibull/
├── index.html            # Estructura de la página y controles
├── src/
│   ├── main.ts           # Punto de entrada: conecta estado, gráfica y fórmulas
│   ├── weibull.ts        # Modelo matemático (R, F, f, gamma, métricas)
│   ├── state.ts          # Estado de la app, presets y store con suscriptores
│   ├── controls.ts       # Sliders, presets y checkboxes
│   ├── chart.ts          # Gráfica con D3 (ejes, curvas, marcadores, leyenda)
│   ├── crosshair.ts      # Crosshair y tooltip
│   ├── formula.ts        # Renderizado de fórmulas con KaTeX
│   ├── format.ts         # Formateo numérico
│   ├── theme.ts          # Colores y claves de curvas
│   └── styles.css        # Estilos de la interfaz
├── tests/
│   └── weibull.test.ts   # Pruebas del modelo matemático
├── vite.config.ts        # Configuración de Vite y Vitest
└── tsconfig.json         # Configuración de TypeScript (modo estricto)
```

## Pruebas

Las pruebas verifican las propiedades matemáticas de la distribución
($R(x_0) = 1$, $R(x_0 + \eta) = e^{-1}$, $F = 1 - R$, integral de $f$
igual a $1$, valores de $\Gamma$, mediana, media y moda, etc.):

```bash
# Ejecuta la suite una vez
npm test

# Modo observador (re-ejecuta al guardar cambios)
npm run test:watch
```

## Construcción para producción

```bash
# Compila TypeScript y genera el bundle optimizado en dist/
npm run build

# Previsualiza localmente el contenido de dist/
npm run preview
```

Como `vite.config.ts` define `base: "./"`, el resultado en `dist/` puede
desplegarse en cualquier hosting estático (GitHub Pages, Netlify, etc.) sin
configuración adicional.

## Tecnologías

| Herramienta | Rol |
| --- | --- |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático y seguridad en tiempo de compilación |
| [Vite](https://vitejs.dev/) | Servidor de desarrollo y empaquetado |
| [D3](https://d3js.org/) (módulos) | Escalas, ejes, formas y transiciones de la gráfica |
| [KaTeX](https://katex.org/) | Renderizado de las fórmulas matemáticas |
| [Vitest](https://vitest.dev/) | Pruebas unitarias del modelo de Weibull |
