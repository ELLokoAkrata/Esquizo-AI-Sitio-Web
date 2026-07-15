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
      stationScenes: new Set([...document.querySelectorAll('.channel')].map((channel) => channel.dataset.scene)).size,
      phraseBanks: [...document.querySelectorAll('.channel')].filter((channel) => Number(channel.dataset.phraseBank) >= 4).length,
      analysisMode: document.querySelector('#analysisBadge').textContent,
      fallbackEnergy: Number(document.querySelector('#valEnergy').textContent),
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
  check('Cada frecuencia declara una escena propia', initial.stationScenes === initial.channels, `${initial.stationScenes} escenas únicas`);
  check('Cada frecuencia declara frases propias', initial.phraseBanks === initial.channels, `${initial.phraseBanks}/${initial.channels} bancos`);
  check('Fallback generativo sigue activo sin telemetría', initial.analysisMode === 'PULSO GENERATIVO' && initial.fallbackEnergy > 0, `${initial.analysisMode} / Σ ${initial.fallbackEnergy}`);
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

  await page.evaluate(() => {
    window.__freeRadioTuningEvents = [];
    window.addEventListener('free-radio:tuning', (event) => window.__freeRadioTuningEvents.push(event.detail));
  });
  await page.click('.channel');
  await sleep(650);
  const firstStation = await page.evaluate(() => ({
    tuned: document.querySelector('#stageName').textContent.trim(),
    scene: document.querySelector('#stage').dataset.stationScene,
    palette: getComputedStyle(document.querySelector('#stage')).getPropertyValue('--station-a').trim(),
    tuningBurst: Number(document.querySelector('#stage').dataset.tuningBurst || 0)
  }));
  const tuned = firstStation.tuned;
  check('Una frecuencia puede sintonizarse', tuned && tuned !== 'SEÑALCORRUPTA', tuned.replace(/\s+/g, ' '));

  await page.click('.channel:nth-of-type(3)');
  await page.waitForFunction(() => document.querySelector('#stage').dataset.transmissionSource === 'station', { timeout: 3000 });
  await page.waitForFunction(() => document.querySelector('#txText').textContent.length >= 6, { timeout: 3000 });
  const secondStation = await page.evaluate(async () => {
    const activeId = document.querySelector('.channel.active').dataset.id;
    const channelList = await fetch('channels.json', { cache: 'no-store' }).then((response) => response.json());
    const activeChannel = channelList.find((channel) => channel.id === activeId);
    return {
      id: activeId,
      scene: document.querySelector('#stage').dataset.stationScene,
      palette: getComputedStyle(document.querySelector('#stage')).getPropertyValue('--station-a').trim(),
      tuningBurst: Number(document.querySelector('#stage').dataset.tuningBurst || 0),
      tuningEvents: window.__freeRadioTuningEvents,
      transmission: document.querySelector('#txText').textContent,
      phrases: activeChannel.visual.phrases
    };
  });
  check('Cambiar de estación dispara sonido de sintonización', secondStation.tuningBurst === firstStation.tuningBurst + 1 && secondStation.tuningEvents.length === 2, `${secondStation.tuningEvents.length} ráfagas Web Audio`);
  check('Cambiar de estación transmuta la escena', secondStation.scene !== firstStation.scene && secondStation.palette !== firstStation.palette, `${firstStation.scene} → ${secondStation.scene}`);
  check('La transmisión usa frases de la estación activa', secondStation.phrases.some((phrase) => phrase.startsWith(secondStation.transmission)), secondStation.transmission);

  await page.click('.channel[data-id="vaporwaves"]');
  await page.waitForFunction(() => document.querySelector('#stage').dataset.vaporLayout === 'CRT_LEFT + SUN_HORIZON + TV_RIGHT', { timeout: 3000 });
  await sleep(900);
  const vaporLayout = await page.evaluate(async () => {
    const stage = document.querySelector('#stage');
    const channelList = await fetch('channels.json', { cache: 'no-store' }).then((response) => response.json());
    const phrases = channelList.find((channel) => channel.id === 'vaporwaves').visual.phrases;
    return {
      anchor: stage.dataset.vaporAnchor,
      layout: stage.dataset.vaporLayout,
      copyMode: stage.dataset.vaporCopy,
      leftCopy: stage.dataset.vaporLeftCopy,
      rightCopy: stage.dataset.vaporRightCopy,
      bottomCopyOpacity: getComputedStyle(document.querySelector('#txText')).opacity,
      phrases
    };
  });
  await page.screenshot({ path: path.join(SCREENSHOTS, 'free-radio-vapor-composition.png') });
  check('Vaporwaves fija el sol en el horizonte', vaporLayout.anchor === '50% 58%', vaporLayout.anchor);
  check('Vaporwaves ordena ordenador, sol y TV', vaporLayout.layout === 'CRT_LEFT + SUN_HORIZON + TV_RIGHT', vaporLayout.layout);
  check('Las frases viven dentro de las pantallas', vaporLayout.copyMode === 'DEVICE_SCREENS' && vaporLayout.bottomCopyOpacity === '0' && vaporLayout.leftCopy && vaporLayout.rightCopy && vaporLayout.phrases.some((phrase) => phrase.startsWith(vaporLayout.leftCopy) || phrase.startsWith(vaporLayout.rightCopy)), `${vaporLayout.leftCopy} // ${vaporLayout.rightCopy}`);

  await page.click('[data-preset="datamosh"]');
  const activePreset = await page.$eval('.preset.active', (element) => element.dataset.preset);
  check('Cambio de preset responde', activePreset === 'datamosh', activePreset);

  await page.click('[data-fx="slices"]');
  const slicesDisabled = await page.$eval('[data-fx="slices"]', (element) => !element.classList.contains('on'));
  check('Capas visuales pueden alternarse', slicesDisabled, 'SLICE desactivado');

  await page.keyboard.press('v');
  await page.waitForSelector('#vortexState.open', { timeout: 3000 });
  const manualVortex = await page.evaluate(() => ({
    state: document.querySelector('#vortexState').textContent,
    anchor: document.querySelector('#stage').dataset.vortexAnchor,
    coordinates: document.querySelector('#stage').dataset.vortexCoordinates
  }));
  check('Atajo V genera un vórtice manual', manualVortex.state.includes('MANUAL'), manualVortex.state);
  check('El vórtice Vaporwaves se centra sobre el sol', manualVortex.anchor === 'SUN_HORIZON' && manualVortex.coordinates === '480,313', `${manualVortex.anchor} @ ${manualVortex.coordinates}`);
  await sleep(1200);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'free-radio-vortex-desktop.png') });

  await page.click('#chaosBtn');
  const chaosState = await page.$eval('#stage', (element) => element.dataset.chaos);
  check('Modo CAOS responde', chaosState === 'active', chaosState || 'inactivo');

  await page.click('#resetBtn');
  const resetState = await page.evaluate(() => ({
    preset: document.querySelector('.preset.active')?.dataset.preset,
    intensity: document.querySelector('#intensity').value,
    layersOn: document.querySelectorAll('[data-fx].on').length,
    vortex: document.querySelector('#vortexState').textContent,
    chaos: document.querySelector('#stage').dataset.chaos || 'inactivo'
  }));
  check('RESET restaura el estado visual', resetState.preset === 'spectral' && resetState.intensity === '58' && resetState.layersOn === 4 && resetState.chaos === 'inactivo', JSON.stringify(resetState));

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

  await page.click('.channel[data-id="vaporwaves"]');
  await page.waitForFunction(() => document.querySelector('#stage').dataset.vaporLayout === 'CRT_LEFT + SUN_HORIZON + TV_RIGHT', { timeout: 3000 });
  const mobileVaporLayout = await page.$eval('#stage', (element) => element.dataset.vaporLayout);
  check('Vaporwaves conserva su composición en móvil', mobileVaporLayout === 'CRT_LEFT + SUN_HORIZON + TV_RIGHT', mobileVaporLayout);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'free-radio-vapor-mobile.png') });

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
