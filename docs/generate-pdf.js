const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('// ESQUIZOAI :: PDF GENERATOR');
  console.log('// Iniciando Puppeteer...');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'esquizoai-audio-manual.html');
  const pdfPath  = path.resolve(__dirname, 'ESQUIZOAI_AUDIO_MANUAL.pdf');

  console.log('// Cargando: ' + htmlPath);
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

  // Wait for fonts / styles to settle
  await new Promise(r => setTimeout(r, 1000));

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:7px;font-family:monospace;color:#999;width:100%;text-align:right;padding-right:15mm">ESQUIZOAI AUDIO WORKSTATION — MANUAL v1.0</div>',
    footerTemplate: '<div style="font-size:7px;font-family:monospace;color:#999;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });

  await browser.close();
  console.log('// PDF generado: ' + pdfPath);
})();
