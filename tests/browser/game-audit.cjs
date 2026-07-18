const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const BASE = process.argv.find(a => a.startsWith('--url='))?.slice(6) || 'http://127.0.0.1:8099';
const shots = path.join(__dirname, 'screenshots');
const reports = path.join(__dirname, 'reports');
fs.mkdirSync(shots, {recursive:true});
fs.mkdirSync(reports, {recursive:true});

function listen(page, bucket, label){
  page.on('pageerror', e => bucket.push(`${label}: ${e.message}`));
  page.on('console', m => {
    if(m.type() === 'error' && !m.text().includes('favicon.ico')) bucket.push(`${label}: ${m.text()}`);
  });
}

async function metrics(page){
  return page.evaluate(() => {
    const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};
    return {
      viewport:{w:innerWidth,h:innerHeight},
      body:{scrollW:document.body.scrollWidth,scrollH:document.body.scrollHeight},
      console:rect(document.querySelector('.console')),
      screen:rect(document.querySelector('.screen-area')),
      controls:[...document.querySelectorAll('[data-input],.sys-btn')].map(el=>({id:el.id||el.dataset.input,...rect(el)})),
      games:[...document.querySelectorAll('.game-tab')].map(el=>el.textContent.trim())
    };
  });
}

async function pongMetrics(page){
  return page.evaluate(() => {
    const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};
    return {
      viewport:{w:innerWidth,h:innerHeight},
      body:{scrollW:document.body.scrollWidth,scrollH:document.body.scrollHeight},
      shell:rect(document.querySelector('.arcade')),
      canvas:rect(document.querySelector('#arena')),
      moveControls:[...document.querySelectorAll('.move-btn')].map(el=>({id:el.id,...rect(el)})),
      core:window.EsquizoArcade&&window.EsquizoArcade.version
    };
  });
}

async function minesMetrics(page){
  return page.evaluate(() => {
    const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};
    return {
      viewport:{w:innerWidth,h:innerHeight},body:{scrollW:document.body.scrollWidth,scrollH:document.body.scrollHeight},
      shell:rect(document.querySelector('.mines-app')),board:rect(document.querySelector('#board')),
      cells:document.querySelectorAll('.cell').length,
      controls:[...document.querySelectorAll('.diff-btn,.sys-btn,.face-btn')].map(el=>({id:el.id||el.dataset.level,...rect(el)})),
      core:window.EsquizoArcade&&window.EsquizoArcade.version
    };
  });
}

let browser;
(async()=>{
  browser = await puppeteer.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  try{
  const errors=[];
  const report={generatedAt:new Date().toISOString(),base:BASE};

  const desktop=await browser.newPage();
  await desktop.setViewport({width:1366,height:768});
  listen(desktop,errors,'desktop');
  await desktop.goto(`${BASE}/games/brick-game.html`,{waitUntil:'networkidle0'});
  report.desktop=await metrics(desktop);
  assert.deepEqual(report.desktop.games,['TETRIS','SNAKE','BREAKOUT','RACING']);
  assert.ok(report.desktop.screen.w>=175,`pantalla desktop demasiado angosta: ${report.desktop.screen.w}`);
  assert.ok(report.desktop.controls.every(c=>c.w>=44&&c.h>=44),'hay controles desktop menores de 44px');
  const x0=await desktop.evaluate(()=>eval('tX'));
  await desktop.keyboard.press('ArrowLeft');
  const x1=await desktop.evaluate(()=>eval('tX'));
  assert.equal(x1,x0-1,'el teclado no mueve Tetris');
  report.tetrisAirLock=await desktop.evaluate(()=>eval(`tReset();for(let i=0;i<20;i++)tMove(i%2?1:-1);tLoop(0);({gameOver,tY,tLockMoves})`));
  assert.equal(report.tetrisAirLock.gameOver,false,'Tetris bloqueó o terminó con movimientos en el aire');
  await desktop.click('[data-game="1"]');
  assert.equal(await desktop.$eval('#gameLabel',e=>e.textContent),'SNAKE');
  await desktop.keyboard.press('p');
  assert.equal(await desktop.$eval('#infoState',e=>e.textContent),'PAUSA');
  await desktop.keyboard.press('p');
  assert.equal(await desktop.$eval('#infoState',e=>e.textContent),'JUGANDO');
  await desktop.screenshot({path:path.join(shots,'brick-game-desktop.png'),fullPage:true});

  const mobile=await browser.newPage();
  await mobile.setViewport({width:390,height:780,isMobile:true,hasTouch:true});
  listen(mobile,errors,'mobile');
  await mobile.goto(`${BASE}/games/brick-game.html`,{waitUntil:'networkidle0'});
  report.mobile=await metrics(mobile);
  assert.equal(report.mobile.body.scrollW,390,'overflow horizontal móvil');
  assert.ok(report.mobile.screen.w>=135,'pantalla móvil demasiado angosta');
  assert.ok(report.mobile.controls.every(c=>c.w>=44&&c.h>=44),'hay controles touch menores de 44px');
  const left=await mobile.$eval('[data-input="left"]',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  const mx0=await mobile.evaluate(()=>eval('tX'));
  await mobile.touchscreen.tap(left.x,left.y);
  await new Promise(r=>setTimeout(r,80));
  const mx1=await mobile.evaluate(()=>eval('tX'));
  assert.equal(mx1,mx0-1,'el control táctil izquierdo no responde');
  await mobile.evaluate(()=>eval('gameOver=true;updateHUD()'));
  const action=await mobile.$eval('[data-input="action"]',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  await mobile.touchscreen.tap(action.x,action.y);
  assert.equal(await mobile.evaluate(()=>eval('gameOver')),false,'A no reinicia después de GAME OVER');
  await mobile.screenshot({path:path.join(shots,'brick-game-mobile.png'),fullPage:true});

  const landscape=await browser.newPage();
  await landscape.setViewport({width:844,height:390,isMobile:true,hasTouch:true});
  listen(landscape,errors,'landscape');
  await landscape.goto(`${BASE}/games/brick-game.html`,{waitUntil:'networkidle0'});
  report.landscape=await metrics(landscape);
  assert.equal(report.landscape.body.scrollW,844,'overflow horizontal en paisaje');
  assert.ok(report.landscape.controls.every(c=>c.w>=44&&c.h>=44),'hay controles touch menores de 44px en paisaje');
  await landscape.screenshot({path:path.join(shots,'brick-game-landscape.png'),fullPage:true});

  const pong=await browser.newPage();
  await pong.setViewport({width:1366,height:768});
  listen(pong,errors,'pong-desktop');
  await pong.goto(`${BASE}/games/pong-mutante.html`,{waitUntil:'networkidle0'});
  report.pong=await pongMetrics(pong);
  assert.equal(report.pong.core,'1.1.0','PONG no cargó el núcleo arcade compartido');
  assert.equal(report.pong.body.scrollW,1366,'overflow horizontal en PONG desktop');
  assert.ok(report.pong.moveControls.every(c=>c.w>=44&&c.h>=44),'hay controles PONG menores de 44px');
  assert.equal(await pong.evaluate(()=>eval('phase')),'title');
  await pong.keyboard.press('Space');
  assert.equal(await pong.evaluate(()=>eval('phase')),'play','espacio no inicia PONG');
  const py0=await pong.evaluate(()=>eval('human.y'));
  await pong.keyboard.down('ArrowUp');await new Promise(r=>setTimeout(r,180));await pong.keyboard.up('ArrowUp');
  const py1=await pong.evaluate(()=>eval('human.y'));
  assert.ok(py1<py0,'el teclado no mueve la paleta de PONG');
  report.pong.paddleHit=await pong.evaluate(()=>eval(`human.y=200;ball.x=human.x+human.w+ball.r+2;ball.y=human.y+human.h/2;ball.vx=-400;ball.vy=0;phase='play';rally=0;update(.01);({rally,vx:ball.vx})`));
  assert.equal(report.pong.paddleHit.rally,1,'PONG no registra el rebote de la paleta');
  assert.ok(report.pong.paddleHit.vx>0,'la pelota no rebota hacia el daemon');
  report.pong.mutation=await pong.evaluate(()=>eval(`rally=4;triggerMutation();mutation.name`));
  assert.notEqual(report.pong.mutation,'SEÑAL ESTABLE','la mutación de PONG no se activa');
  report.pong.matchEnd=await pong.evaluate(()=>eval(`humanScore=6;daemonScore=0;phase='play';ball.x=W+40;ball.vx=100;update(.016);({humanScore,phase})`));
  assert.deepEqual(report.pong.matchEnd,{humanScore:7,phase:'gameover'},'PONG no cierra la partida al llegar a 7');
  await pong.click('[data-difficulty="colapso"]');
  assert.equal(await pong.evaluate(()=>eval('difficulty')),'colapso','no cambia la dificultad de PONG');
  await pong.screenshot({path:path.join(shots,'pong-mutante-desktop.png'),fullPage:true});

  const pongMobile=await browser.newPage();
  await pongMobile.setViewport({width:390,height:780,isMobile:true,hasTouch:true});
  listen(pongMobile,errors,'pong-mobile');
  await pongMobile.goto(`${BASE}/games/pong-mutante.html`,{waitUntil:'networkidle0'});
  report.pongMobile=await pongMetrics(pongMobile);
  assert.equal(report.pongMobile.body.scrollW,390,'overflow horizontal en PONG móvil');
  assert.ok(report.pongMobile.moveControls.every(c=>c.w>=44&&c.h>=44),'hay controles touch PONG menores de 44px');
  const pongAction=await pongMobile.$eval('#btnAction',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  await pongMobile.touchscreen.tap(pongAction.x,pongAction.y);
  assert.equal(await pongMobile.evaluate(()=>eval('phase')),'play','A no inicia PONG en touch');
  const pongUp=await pongMobile.$eval('#btnUp',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  const mpy0=await pongMobile.evaluate(()=>eval('human.y'));
  await pongMobile.touchscreen.touchStart(pongUp.x,pongUp.y);await new Promise(r=>setTimeout(r,180));await pongMobile.touchscreen.touchEnd();
  const mpy1=await pongMobile.evaluate(()=>eval('human.y'));
  assert.ok(mpy1<mpy0,'el control touch no mueve la paleta de PONG');
  await pongMobile.screenshot({path:path.join(shots,'pong-mutante-mobile.png'),fullPage:true});

  const mines=await browser.newPage();
  await mines.setViewport({width:1366,height:768});
  listen(mines,errors,'minas-desktop');
  await mines.goto(`${BASE}/games/minas-666.html`,{waitUntil:'networkidle0'});
  report.mines=await minesMetrics(mines);
  assert.equal(report.mines.core,'1.1.0','MINAS no cargó el núcleo arcade compartido');
  assert.equal(report.mines.cells,144,'RITUAL no creó un tablero 12×12');
  assert.ok(report.mines.controls.every(c=>c.w>=44&&c.h>=44),'hay controles MINAS menores de 44px');
  await mines.click('.cell:nth-child(1)');
  report.mines.firstMove=await mines.evaluate(()=>eval(`({phase,safe:board[0].revealed&&!board[0].mine,safeZone:[0,...neighbors(0)].every(i=>!board[i].mine)})`));
  assert.deepEqual(report.mines.firstMove,{phase:'playing',safe:true,safeZone:true},'la primera jugada de MINAS no es segura');
  const flagIndex=await mines.evaluate(()=>eval(`board.findIndex((cell,index)=>index>0&&!cell.revealed&&!cell.mine)`));
  await mines.click(`.cell:nth-child(${flagIndex+1})`,{button:'right'});
  assert.equal(await mines.evaluate(i=>eval(`board[${i}].flagged`),flagIndex),true,'clic derecho no coloca bandera');
  await mines.evaluate(()=>eval('activeIndex=0;renderBoard()'));
  await mines.keyboard.press('ArrowRight');
  assert.equal(await mines.evaluate(()=>eval('activeIndex')),1,'el teclado no mueve el foco de MINAS');
  report.mines.loss=await mines.evaluate(()=>eval(`const mineIndex=board.findIndex(cell=>cell.mine);handleReveal(mineIndex);({phase,exploded:board[mineIndex].exploded})`));
  assert.deepEqual(report.mines.loss,{phase:'lost',exploded:true},'MINAS no termina al revelar una mina');
  report.mines.win=await mines.evaluate(()=>eval(`newGame('ritual');handleReveal(0);board.forEach(cell=>{if(!cell.mine&&!cell.revealed){cell.revealed=true;revealed++}});checkWin();({phase,flags})`));
  assert.deepEqual(report.mines.win,{phase:'won',flags:22},'MINAS no detecta la victoria');
  await mines.evaluate(()=>eval(`newGame('ritual');handleReveal(0)`));
  await mines.screenshot({path:path.join(shots,'minas-666-desktop.png'),fullPage:true});

  const minesMobile=await browser.newPage();
  await minesMobile.setViewport({width:390,height:780,isMobile:true,hasTouch:true});
  listen(minesMobile,errors,'minas-mobile');
  await minesMobile.goto(`${BASE}/games/minas-666.html`,{waitUntil:'networkidle0'});
  report.minesMobile=await minesMetrics(minesMobile);
  assert.equal(report.minesMobile.body.scrollW,390,'overflow horizontal en MINAS móvil');
  assert.ok(report.minesMobile.board.right<=390,'el tablero MINAS sale del viewport móvil');
  const firstMineCell=await minesMobile.$eval('.cell:nth-child(1)',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  await minesMobile.touchscreen.touchStart(firstMineCell.x,firstMineCell.y);await new Promise(r=>setTimeout(r,500));await minesMobile.touchscreen.touchEnd();
  assert.equal(await minesMobile.evaluate(()=>eval('board[0].flagged')),true,'pulsación larga no coloca bandera en MINAS');
  const secondMineCell=await minesMobile.$eval('.cell:nth-child(2)',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  await minesMobile.touchscreen.tap(secondMineCell.x,secondMineCell.y);
  assert.equal(await minesMobile.evaluate(()=>eval('phase')),'playing','tap no inicia MINAS en móvil');
  await minesMobile.screenshot({path:path.join(shots,'minas-666-mobile.png'),fullPage:true});

  const os=await browser.newPage();
  await os.setViewport({width:1366,height:768});
  listen(os,errors,'os');
  await os.goto(`${BASE}/index.html`,{waitUntil:'domcontentloaded'});
  const boot=await os.$('#boot');if(boot)await boot.click();
  await os.evaluate(()=>{localStorage.removeItem('esquizoDesktopState');openBrickGame()});
  await os.waitForSelector('iframe[src="games/brick-game.html"]');
  await new Promise(r=>setTimeout(r,350));
  report.os=await os.evaluate(()=>{
    const win=document.querySelector('.win[data-app-file="games/brick-game.html"]');
    const frame=win.querySelector('iframe'),wr=win.getBoundingClientRect(),cr=frame.contentDocument.querySelector('.console').getBoundingClientRect();
    return {window:{w:wr.width,h:wr.height},active:document.activeElement===frame,innerX:frame.contentWindow.eval('tX'),inner:{viewportH:frame.contentWindow.innerHeight,scrollH:frame.contentDocument.body.scrollHeight,consoleBottom:cr.bottom}};
  });
  assert.equal(Math.round(report.os.window.w),600,'ancho de ventana BRICK incorrecto');
  assert.equal(report.os.active,true,'el iframe del juego no recibió foco automático');
  assert.ok(report.os.inner.consoleBottom<=report.os.inner.viewportH+1,'los controles quedan fuera del iframe del OS');
  assert.ok(report.os.inner.scrollH<=report.os.inner.viewportH+1,'BRICK requiere scroll vertical dentro del OS');
  await os.keyboard.press('ArrowLeft');
  const focusedX=await os.evaluate(()=>document.querySelector('iframe[src="games/brick-game.html"]').contentWindow.eval('tX'));
  assert.equal(focusedX,report.os.innerX-1,'el teclado no responde al abrir el juego desde el OS');
  await os.evaluate(()=>{WM.close('app_games_brick_game_html');openFolder('JUEGOS')});
  await os.waitForSelector('.win[data-id="fold_JUEGOS"] .fitem');
  await os.click('.win[data-id="fold_JUEGOS"] .fitem',{clickCount:2,delay:60});
  await os.waitForSelector('iframe[src="games/brick-game.html"]');
  await new Promise(r=>setTimeout(r,250));
  report.os.folderWindowW=await os.evaluate(()=>document.querySelector('.win[data-app-file="games/brick-game.html"]').getBoundingClientRect().width);
  assert.equal(Math.round(report.os.folderWindowW),600,'la carpeta JUEGOS ignoró las dimensiones de FS');
  await os.screenshot({path:path.join(shots,'brick-game-os.png'),fullPage:true});
  await os.evaluate(()=>{WM.close('app_games_brick_game_html');WM.close('fold_JUEGOS');openPongMutante()});
  await os.waitForSelector('iframe[src="games/pong-mutante.html"]');
  await new Promise(r=>setTimeout(r,300));
  report.pongOS=await os.evaluate(()=>{
    const win=document.querySelector('.win[data-app-file="games/pong-mutante.html"]'),frame=win.querySelector('iframe'),wr=win.getBoundingClientRect(),shell=frame.contentDocument.querySelector('.arcade').getBoundingClientRect();
    return {window:{w:wr.width,h:wr.height},active:document.activeElement===frame,phase:frame.contentWindow.eval('phase'),inner:{viewportH:frame.contentWindow.innerHeight,scrollH:frame.contentDocument.body.scrollHeight,shellBottom:shell.bottom}};
  });
  assert.equal(Math.round(report.pongOS.window.w),820,'ancho de ventana PONG incorrecto');
  assert.equal(report.pongOS.active,true,'el iframe de PONG no recibió foco automático');
  assert.ok(report.pongOS.inner.scrollH<=report.pongOS.inner.viewportH+1,'PONG requiere scroll vertical dentro del OS');
  await os.keyboard.press('Space');
  assert.equal(await os.evaluate(()=>document.querySelector('iframe[src="games/pong-mutante.html"]').contentWindow.eval('phase')),'play','el teclado no inicia PONG desde el OS');
  await os.screenshot({path:path.join(shots,'pong-mutante-os.png'),fullPage:true});
  await os.evaluate(()=>{WM.close('app_games_pong_mutante_html');openMinas666()});
  await os.waitForSelector('iframe[src="games/minas-666.html"]');
  await new Promise(r=>setTimeout(r,300));
  report.minesOS=await os.evaluate(()=>{
    const win=document.querySelector('.win[data-app-file="games/minas-666.html"]'),frame=win.querySelector('iframe'),wr=win.getBoundingClientRect(),shell=frame.contentDocument.querySelector('.mines-app').getBoundingClientRect();
    return {window:{w:wr.width,h:wr.height},active:document.activeElement===frame,phase:frame.contentWindow.eval('phase'),items:FS.JUEGOS.items.length,inner:{viewportH:frame.contentWindow.innerHeight,scrollH:frame.contentDocument.body.scrollHeight,shellBottom:shell.bottom}};
  });
  assert.equal(Math.round(report.minesOS.window.w),760,'ancho de ventana MINAS incorrecto');
  assert.equal(report.minesOS.active,true,'el iframe de MINAS no recibió foco automático');
  assert.equal(report.minesOS.items,3,'la carpeta JUEGOS no contiene las tres máquinas');
  assert.ok(report.minesOS.inner.scrollH<=report.minesOS.inner.viewportH+1,'MINAS requiere scroll vertical dentro del OS');
  await os.keyboard.press('Space');
  assert.equal(await os.evaluate(()=>document.querySelector('iframe[src="games/minas-666.html"]').contentWindow.eval('phase')),'playing','el teclado no inicia MINAS desde el OS');
  await os.screenshot({path:path.join(shots,'minas-666-os.png'),fullPage:true});

  assert.deepEqual(errors,[],`errores de navegador:\n${errors.join('\n')}`);
  fs.writeFileSync(path.join(reports,'game-audit.json'),JSON.stringify({...report,errors},null,2));
  console.log('GAME AUDIT OK');
  console.log(JSON.stringify({brick:{desktop:report.desktop.screen,mobile:report.mobile.screen,landscape:report.landscape.screen,os:report.os},pong:{desktop:report.pong.canvas,mobile:report.pongMobile.canvas,os:report.pongOS},minas:{desktop:report.mines.board,mobile:report.minesMobile.board,os:report.minesOS}},null,2));
  }finally{
    if(browser) await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
