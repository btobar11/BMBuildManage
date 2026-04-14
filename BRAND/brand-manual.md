# BMBuildManage - Manual de Marca

## 1. Identidad de Marca

### 1.1 Nombre Comercial
- **Razón Social**: BMBuildManage
- **Nombre Display**: BMBuildManage
- **Nombre Corto**: BM (wordmark)
- **所属行业**: SaaS B2B - Gestión de Construcción

### 1.2 Tagline
> "Construcción inteligente, ejecutada con precisión."

### 1.3 Valores de Marca
- **Solidez**: Bases tecnológicas sólidas y confiabilidad inquebrantable
- **Estructura**: Organización y metodología en cada proceso
- **Tecnología**: Innovación constantlye para resolver desafíos constructivos
- **Eficiencia**: Maximizar resultados optimizando recursos

---

## 2. Logo System

### 2.1 Isotipo (Icono)

#### Descripción
Cubo isométrico estilo "wireframe" transparente con líneas monolineares que integra las letras "B" y "M" en sus caras laterales visibles.

#### Especificaciones Técnicas
- **Proporción**: 1:1 (cuadrado)
- **Grosor de línea**: 3px en SVG base de 100x100
- **Espacio de seguridad**: Mínimo 10 unidades (10% del área)
- **Estilo**: Monolinear,stroke-linecap round, stroke-linejoin round

#### Código Base SVG
```
 Archivo: BRAND/isotype-bm-build.svg
 ViewBox: 0 0 100 100
 Grosor stroke: 3px
 Color stroke: #10B981
```

### 2.2 Logotipo - Three Versions

#### A) Horizontal (Primary)
- **Uso principal**: Dashboard, headers web, documentos oficiales
- **Dimensiones推荐**: 280x80px (relación 3.5:1)
- **Disposición**: Isotipo 60x60px + texto
- **Jerarquía**: "BM" en Bold 700, "BUILD MANAGE" en Regular 400

```
 Archivo: BRAND/logo-horizontal-bm-buildmanage.svg
 ViewBox: 0 0 280 80
```

#### B) Vertical/Stacked
- **Uso principal**: Tarjetas de presentación, perfiles sociales, App icons
- **Dimensiones推荐**: 120x140px
- **Disposición**: Isotipo centrado arriba, texto centrado abajo
- **Jerarquía**: "BM" en Bold 700, "BUILD MANAGE" en Regular 400

```
 Archivo: BRAND/logo-vertical-stacked-bm-buildmanage.svg
 ViewBox: 0 0 120 140
```

#### C) Short Wordmark
- **Uso principal**: Favicon, botones compactos,签署
- **Dimensiones推荐**: 80x40px
- **Contenido**: Solo "BM" en Extra Bold 800

```
 Archivo: BRAND/wordmark-bm.svg
 ViewBox: 0 0 80 40
```

### 2.3 Espacio de Seguridad

#### Definición
El área de separación mínima entre el logo y otros elementos. Basada en la proporción "x" = altura de la letra "B" en el isotipo.

```
+---x---+
|       |
|  LOGO |
|       |
+---x---+
     ↑
 清理 Espacio
```

#### Valores Mínimos
| Contexto | Espacio (x) |
|----------|-------------|
| Digital | 8px |
| Impreso | 10mm |
| Senaletica Grande | 20mm |
| Merchandising | 15mm |

### 2.4 UsosIncorrectos Prohibidos

#### NEVER DO:
- ❌ Cambiar colores del logo
- ❌ Rotar o distorsionar el isotipo
- ❌ Agregar sombras o efectos
- ❌ Usar gradientes
- ❌ Alterar tipografía
- ❌ Recortar o modificar proporción
- ❌ Usar fondo que reduzca contraste
- ❌ Agregar bordess or contornos
- ❌ Descomponer элементы

---

## 3. Color System

### 3.1 Paleta Principal

#### Emerald Green (Verde Esmeralda)
```
 HEX: #10B981
 RGB: 16, 185, 129
 CMYK: C:100 M:0 Y:60 K:0
 HSL: 160°, 84%, 39%
 PMS: 7472 C
 Uso: Marca principal, CTAs, acentos, iconos activos
```

#### Navy Black (Negro/Azul Oscuro)
```
 HEX: #0F172A
 RGB: 15, 23, 42
 CMYK: C:90 M:77 Y:40 K:83
 HSL: 222°, 47%, 11%
 Uso: Texto principal, fondos oscuros, headers
```

#### Slate Gray (Gris Oscuro)
```
 HEX: #334155
 RGB: 51, 65, 85
 CMYK: C:53 M:40 Y:26 K:27
 HSL: 215°, 25%, 27%
 Uso: Texto secundario, bordes, divisores
```

### 3.2 Paleta Extendida

#### Light Mode Backgrounds
```
 Blanco:   #FFFFFF
 Gris Claro: #F8FAFC
 Gris Neutral: #E2E8F0
```

#### Estados y Feedback
```
 Success:  #10B981 (Emerald)
 Warning:  #F59E0B (Amber)
 Error:    #EF4444 (Red)
 Info:     #3B82F6 (Blue)
```

#### Light Mode (Fondo claro)
- Texto principal: #0F172A
- Texto secundario: #475569
- Texto terciario: #64748B
- Fondos: #FFFFFF / #F8FAFC
- Bordes: #E2E8F0

#### Dark Mode (Fondo oscuro)
- Texto principal: #F8FAFC
- Texto sekundario: #94A3B8
- Texto terciario: #64748B
- Fondos: #0F172A / #1E293B
- Bordes: #334155

### 3.3 ratios de Contraste

#### Accesibilidad WCAG 2.1
```
 AA (mínimo): 4.5:1 para texto normal, 3:1 para texto grande
 AAA (preferido): 7:1 para texto normal, 4.5:1 para texto grande
```

#### Combinaciones Recomendadas
| Fondo | Texto | Ratio | WCAG |
|-------|-------|-------|-----|
| #FFFFFF | #0F172A | 15.3:1 | AAA ✓ |
| #FFFFFF | #334155 | 7.5:1 | AAA ✓ |
| #10B981 | #FFFFFF | 4.6:1 | AA ✓ |
| #0F172A | #10B981 | 4.6:1 | AA ✓ |
| #F8FAFC | #64748B | 4.5:1 | AA ✓ |

---

## 4. Tipografía

### 4.1 Familia Principal

#### Inter (Google Fonts)
- **Pesos disponibles**: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 800 (Extra-Bold)
- **Origen**: Designed by Rasmus Andersson
- **Licencia**: OFL (Open Font License)
- **URL**: https://fonts.google.com/specimen/Inter

#### Usos
| Peso | Uso | Tamaño |
|------|-----|--------|
| 800 | Wordmark, logos | 24-32px |
| 700 | Headers H1, titles principales | 24-28px |
| 600 | Headers H2, subtitulos | 18-20px |
| 500 | Navigation, botones | 14-16px |
| 400 | Cuerpo de texto, labels | 14-16px |

### 4.2 Familia Secundaria

#### Roboto Mono (Google Fonts)
- **Uso**: Datos numéricos, tablas, códigos, fechas
- **Pesos**: 400, 500, 700
- **URL**: https://fonts.google.com/specimen/Roboto+Mono

### 4.3 Especificaciones de Jerarquía

```
 H1 - Page Title: Inter 700, 28px, line-height 1.2
 H2 - Section Title: Inter 600, 22px, line-height 1.3
 H3 - Card Title: Inter 600, 18px, line-height 1.4
 H4 - Subsection: Inter 500, 16px, line-height 1.4
 Body - Paragraph: Inter 400, 14px, line-height 1.6
 Caption: Inter 400, 12px, line-height 1.5
 Label: Inter 500, 12px, line-height 1.4, letter-spacing 0.5px
```

### 4.4 Loading de Fuentes

#### CSS Import
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap');
```

#### Configuración Tailwind (tailwind.config.js)
```javascript
theme: {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Roboto Mono', 'monospace'],
  },
}
```

---

## 5. Imagenética

### 5.1 Estilo Fotográfico

#### Principios
- **Luz**: Natural, ligeramente contrastada
- **Ángulo**: Perspectiva técnica (isométrica o 45°)
- **Color**: Palette de verdes como accent, Neutros dominantes
- **Ambient**: Construcción moderna, urbana, industrial limpia

### 5.2 Ilustraciones

#### Estilo
- **Líneas**: Monolineares, grosor constante (2-3px)
- **Formas**: Geométricas, isométricas
- **Color**: Emerald #10B981 como stroke principal
- **Relleno**: Transparente o sólidos suaves

### 5.3 Iconografía

#### Especificaciones
- **Grid**: 24x24px (iconos), 20x20px (acciones)
- **Stroke**: 2px, rounded caps y joins
- **Estados**: default (#334155), hover (#10B981), disabled (#CBD5E1)

---

## 6. Web Assets

### 6.1 Favicon

#### Tamaños Requeridos
| Tamaño | Formato | Archivo |
|--------|---------|---------|
| 16x16 | .ico, .png | favicon-16.ico |
| 32x32 | .ico, .png | favicon-32.ico |
| 180x180 | .png (Apple) | apple-touch-icon.png |
| 192x192 | .png (Android) | android-chrome-192.png |
| 512x512 | .png (Android) | android-chrome-512.png |

#### Generador Online Recomendado
- https://favicon.io
- https://realfavicongenerator.com

### 6.2 Meta Tags para Social Media

```html
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="BMBuildManage - SaaS de Gestión de Construcción">
<meta property="og:description" content="Software de gestión de proyectos de construcción">
<meta property="og:image" content="https://bmbuildmanage.com/og-image.png">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BMBuildManage">
<meta name="twitter:description" content="SaaS de gestión de construcción">
```

### 6.3 Light Mode vs Dark Mode

#### CSS Custom Properties
```css
:root {
  --bm-emerald: #10B981;
  --bm-dark: #0F172A;
  --bm-text: #0F172A;
  --bm-text-secondary: #475569;
  --bm-background: #FFFFFF;
  --bm-surface: #F8FAFC;
  --bm-border: #E2E8F0;
}

[data-theme="dark"] {
  --bm-emerald: #10B981; /* Mantener verde en dark mode */
  --bm-text: #F8FAFC;
  --bm-text-secondary: #94A3B8;
  --bm-background: #0F172A;
  --bm-surface: #1E293B;
  --bm-border: #334155;
}
```

---

## 7. Aplicaciones

### 7.1 Digital

| Aplicación | Logo | Color |
|-----------|------|-------|
| Header Web | Horizontal | Dark en fondo claro |
| Sidebar | Vertical + Wordmark | Emerald en fondo oscuro |
| App Icon | Vertical | Emerald en fondo blanco/oscuro |
| Login Screen | Horizontal | Emerald en centro |
| Email Signature | Wordmark | Dark |
| Social Profile | Wordmark | Según plataforma |

### 7.2 Impreso

| Aplicación | Logo | Especificación |
|-----------|------|--------------|
| Tarjetas | Vertical | 30x20mm, full color |
| Letterhead | Horizontal | 50mm ancho |
| Folder Proyecto | Vertical | 70mm ancho |
| Proposal Cover | Horizontal | 60mm ancho, esquina |
| Factura | Wordmark | Header, 25mm |

### 7.3 Uniformes Y Señaletica

#### Uniformes (Serigrafía)
- **Técnica**: Screen printing, 1 color
- **Colores**: Emerald (#10B981) sobre tela oscura, o Navy (#0F172A) sobre tela clara
- **Posición**: Pechera izquierda (camisas), Espalda central (chaquetones)
- **Tamaño**: 8-10cm de ancho

#### Señaletica de Proyecto
- **Material**: Vinilo calendrado o sustrato rígido
- **Colores**: Full color o 2 colores (Emerald + Blanco)
- **Fondo**: Evitar fondos complejos
- **Adhesivo**: according a superficie

### 7.4 Merchandising

| Producto | Técnica | Tamaño Logo |
|----------|---------|--------------|
| Camisetas | Serigrafía 1-2 colores | 10-12cm |
| Gorras | Bordado | 5-6cm |
| Bolígrafos | Tampografía | 2-3cm |
| блокноты | Grabado láser | 4-5cm |
| Utiles | Serigraphia | Proporcional |

---

## 8. gobernanza

### 8.1 Proceso de Aprobación

#### Flujo de Trabajo
```
1. Solicitud → Brief con contexto y uso
2. Diseño → Propuestas alternativas
3. Revisión → Por equipo de marca
4. Validación → check de consistencia
5. Entrega → Archivos finales + guidelines
```

#### Roles
- **Owner**: Marketing/Brand Team
- **Aprobador**: Directorio o CMO
- **Consultor**: Designer Lead

### 8.2 Herramientas de assets

#### Repositorio Central
- **Ubicación**: BRAND/ folder en repo principal
- **Estructura**:
```
BRAND/
├── assets/
│   ├── icons/
│   ├── logos/
│   └── social/
├── source/
│   ├── illustrator/
│   └── figma/
├── output/
│   ├── print/
│   └── web/
└── guidelines/
```

### 8.3 Monitoreo

- **Revisión trimestral**: De consistencia de marca
- **Audit anual**: De uso en todos los puntos de contacto
- **Feedback**: Recopilar de equipos internos

---

## 9. Licencia y Derechos

### 9.1 Propiedad Intelectual
- **Marca Registrada**: BMBuildManage® 
- **Año de registro**: [Año actual]
- **Clases**: 9 (Software), 42 (SaaS Services)

### 9.2 Uso Interno
- El uso de la marca por empleados está permitido para actividades profesionales
- Uso comercial requiere aprobación

### 9.3 Uso Externo
- Partners y clientes: Solo con license agreement
- Prohibido uso no autorizado

---

## 10. Changelog

### Versión 1.0 (2026-04)
- ✅ Primera versión del manual de marca
- ✅ Definición de sistema de logo (3 versiones)
- ✅ Paleta de colores establecida
- ✅ Tipografía Inter seleccionada
- ✅ Especificaciones de web assets

---

## Contacto

**Brand Manager**: [Nombre del equipo]
**Email**: brand@bmbuildmanage.com
**Slack**: #brand-team

---

*Documento actualizado: Abril 2026*