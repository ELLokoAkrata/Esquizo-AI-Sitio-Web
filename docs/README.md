# ESQUIZOAI AUDIO MANUAL — DOCS

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `esquizoai-audio-manual.html` | Fuente del manual (editar aquí) |
| `generate-pdf.js` | Script Puppeteer → PDF |
| `ESQUIZOAI_AUDIO_MANUAL.pdf` | PDF generado (no editar) |

---

## Ejecutar (regenerar PDF)

```bash
cd docs
node generate-pdf.js
```

Primera vez (instalar dependencia):
```bash
cd docs
npm install
node generate-pdf.js
```

---

## Modificar el manual

Editar `esquizoai-audio-manual.html` directamente.

- **Contenido:** HTML estándar, secciones con `<section id="...">`
- **Colores:** Variables CSS en `:root` al inicio del `<style>`
- **Page breaks:** `class="page-break"` entre secciones para saltos en el PDF
- **Tablas:** `<table class="param-table">` para tablas de parámetros

Después de editar, regenerar:
```bash
node generate-pdf.js
```

---

## Opciones del script (`generate-pdf.js`)

```js
await page.pdf({
  format: 'A4',          // Cambiar a 'Letter' si se prefiere
  printBackground: true, // false = sin fondos negros (más económico imprimir)
  margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
});
```

Para PDF sin fondo negro (impresión en papel):
- Abrir `esquizoai-audio-manual.html`
- El media query `@media print` ya aplica fondo blanco / texto negro automáticamente
- O cambiar `printBackground: false` en el script
