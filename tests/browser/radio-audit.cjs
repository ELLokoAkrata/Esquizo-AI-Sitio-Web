const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer');

const ROOT = __dirname;
const SCREENSHOTS = path.join(ROOT, 'screenshots');
const REPORTS = path.join(ROOT, 'reports');
const args = new Set(process.argv.slice(2));
const headed = args.has('--headed');
const quick = args.has('--quick');
const urlArg = process.argv.slice(2).find((arg) => arg.startsWith('--url='));
const targetUrl = urlArg ? urlArg.slice('--url='.length) : 'http://127.0.0.1:8099/iptv/';

const report = {
  targetUrl,
  startedAt: new Date().toISOString(),
  mode: headed ? 'headed' : 'headless',
  automaticVortex: quick ? 'skipped' : 'enabled',
  checks: [],
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  observations: {}
};

let browser;

function check(name, pass, details = '') {
  const item = { name, pass: Boolean(pass), details };
  report.checks.push(item);
  const glyph = item.pass ? '✓' : '✗';
  console.log(`${glyph} ${name}${details ? ` — ${details}` : ''}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function attachDiagnostics(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      report.consoleErrors.push({ page: label, text: message.text() });
    }
  });
  page.on('pageerror', (error) => {
    report.pageErrors.push({ page: label, text: error.message });
  });
  page.on('requestfailed', (request) => {
    const requestUrl = request.url();
    if (requestUrl.startsWith(new URL(targetUrl).origin)) {
      report.failedRequests.push({
        page: label,
        url: requestUrl,
        reason: request.failure()?.errorText || 'unknown'
      });
    }
  });
}

async function inspectDesktop(page) {
  await page.setViewport({ width: 860, height: 640, deviceScaleFactor: 1 });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.channel').length > 0,
    { timeout: 10000 }
  );
  await sleep(1200);

  const initial = await page.evaluate(() => {
    const canvas = document.querySelector('#visual');
    const rect = document.querySelector('.radio').getBoundingClientRect();
    return {
      title: document.title,
      channels: document.querySelectorAll('.channel').length,
      presets: document.querySelectorAll('[data-preset]').length,
      effects: document.querySelectorAll('[data-fx]').length,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      radioWidth: Math.round(rect.width),
      viewportWidth: window.innerWidth
    };
  });
  report.observations.desktop = initial;

  check('FREE_RADIO carga en escritorio', initial.title.includes('FREE_RADIO'), initial.title);
  check('Catálogo de frecuencias disponible', initial.channels >= 12, `${initial.channels} canales`);
  check('Cuatro presets disponibles', initial.presets === 4, `${initial.presets} presets`);
  check('Cuatro capas visuales disponibles', initial.effects === 4, `${initial.effects} capas`);
  check('Canvas conserva resolución interna', initial.canvasWidth === 960 && initial.canvasHeight === 540, `${initial.canvasWidth}×${initial.canvasHeight}`);
  check('Sin overflow horizontal en escritorio', initial.overflow <= 1, `${initial.overflow}px`);
  check('Aplicación cabe en el viewport', initial.radioWidth <= initial.viewportWidth + 1, `${initial.radioWidth}/${initial.viewportWidth}px`);

  const frameCount = await page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const started = performance.now();
    const count = (now) => {
      frames += 1;
      if (now - started >= 1200) resolve(frames);
      else requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  }));
  report.observations.desktop.framesIn1200ms = frameCount;
  check('Motor generativo continúa animando', frameCount >= 20, `${frameCount} frames/1.2s`);

  await page.click('.channel');
  await sleep(650);
  const tuned = await page.$eval('#stageName', (element) => element.textContent.trim());
  check('Una frecuencia puede sintonizarse', tuned && tuned !== 'SEÑALCORRUPTA', tuned.replace(/\s+/g, ' '));

  await page.click('[data-preset="datamosh"]');
  const activePreset = await page.$eval('.preset.active', (element) => element.dataset.preset);
  check('Cambio de preset responde', activePreset === 'datamosh', activePreset);

  await page.click('[data-fx="slices"]');
  const slicesDisabled = await page.$eval('[data-fx="slices"]', (element) => !element.classList.contains('on'));
  check('Capas visuales pueden alternarse', slicesDisabled, 'SLICE desactivado');

  await page.keyboard.press('v');
  await page.waitForSelector('#vortexState.open', { timeout: 3000 });
  const manualVortex = await page.$eval('#vortexState', (element) => element.textContent);
  check('Atajo V genera un vórtice manual', manualVortex.includes('MANUAL'), manualVortex);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'free-radio-vortex-desktop.png') });

  await page.click('#chaosBtn');
  const chaosStatus = await page.$eval('#statusline', (element) => element.textContent);
  check('Modo CAOS responde', chaosStatus.includes('6.5'), chaosStatus);

  await page.click('#resetBtn');
  const resetState = await page.evaluate(() => ({
    preset: document.querySelector('.preset.active')?.dataset.preset,
    intensity: document.querySelector('#intensity').value,
    layersOn: document.querySelectorAll('[data-fx].on').length,
    vortex: document.querySelector('#vortexState').textContent
  }));
  check('RESET restaura el estado visual', resetState.preset === 'spectral' && resetState.intensity === '58' && resetState.layersOn === 4, JSON.stringify(resetState));

  if (!quick) {
    await page.waitForSelector('#vortexState.open', { timeout: 40000 });
    const automaticVortex = await page.$eval('#vortexState', (element) => element.textContent);
    report.observations.automaticVortex = automaticVortex;
    check('El flujo genera un vórtice automático', !automaticVortex.includes('MANUAL'), automaticVortex);
    await page.screenshot({ path: path.join(SCREENSHOTS, 'free-radio-vortex-automatic.png') });
  }

  await page.screenshot({ path: path.join(SCREENSHOTS, 'free-radio-desktop.png') });
}

async function inspectMobile(page) {
  await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 1 });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.channel').length > 0,
    { timeout: 10000 }
  );
  await sleep(900);

  const mobile = await page.evaluate(() => {
    const radio = document.querySelector('.radio').getBoundingClientRect();
    const stage = document.querySelector('#stage').getBoundingClientRect();
    const channels = getComputedStyle(document.querySelector('#channels'));
    const controls = document.querySelector('.deck').getBoundingClientRect();
    return {
      overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      radioWidth: Math.round(radio.width),
      stageHeight: Math.round(stage.height),
      controlsHeight: Math.round(controls.height),
      channelLayout: channels.display,
      viewportWidth: window.innerWidth
    };
  });
  report.observations.mobile = mobile;

  check('Sin overflow horizontal en móvil', mobile.overflow <= 1, `${mobile.overflow}px`);
  check('Aplicación cabe en móvil', mobile.radioWidth <= mobile.viewportWidth + 1, `${mobile.radioWidth}/${mobile.viewportWidth}px`);
  check('Escena generativa visible en móvil', mobile.stageHeight >= 180, `${mobile.stageHeight}px`);
  check('Controles visibles en móvil', mobile.controlsHeight > 0, `${mobile.controlsHeight}px`);
  check('Frecuencias usan rail móvil', mobile.channelLayout === 'flex', mobile.channelLayout);

  await page.keyboard.press('v');
  await page.waitForSelector('#vortexState.open', { timeout: 3000 });
  await page.screenshot({ path: path.join(SCREENSHOTS, 'free-radio-vortex-mobile.png') });
}

async function main() {
  await fs.mkdir(SCREENSHOTS, { recursive: true });
  await fs.mkdir(REPORTS, { recursive: true });

  browser = await puppeteer.launch({
    headless: !headed,
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  const desktop = await browser.newPage();
  attachDiagnostics(desktop, 'desktop');
  await inspectDesktop(desktop);

  const mobile = await browser.newPage();
  attachDiagnostics(mobile, 'mobile');
  await inspectMobile(mobile);

  check('Sin excepciones JavaScript', report.pageErrors.length === 0, `${report.pageErrors.length} excepciones`);
  check('Sin fallos de recursos locales', report.failedRequests.length === 0, `${report.failedRequests.length} fallos`);
}

main()
  .catch((error) => {
    report.fatalError = error.stack || error.message;
    console.error(`✗ Auditoría interrumpida — ${error.message}`);
  })
  .finally(async () => {
    report.finishedAt = new Date().toISOString();
    report.passed = !report.fatalError && report.checks.every((item) => item.pass);
    await fs.mkdir(REPORTS, { recursive: true });
    await fs.writeFile(
      path.join(REPORTS, 'free-radio-audit.json'),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    if (browser) await browser.close();
    console.log(report.passed ? '\nFREE_RADIO // AUDITORÍA OK' : '\nFREE_RADIO // AUDITORÍA FALLIDA');
    process.exitCode = report.passed ? 0 : 1;
  });
