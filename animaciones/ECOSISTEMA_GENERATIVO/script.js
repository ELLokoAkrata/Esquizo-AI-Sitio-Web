const startButton = document.getElementById('startButton');
const pauseContainer = document.getElementById('pauseContainer');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const visualizer = document.getElementById('visualizer');
const visCtx = visualizer.getContext('2d');
const timeDisplay = document.getElementById('timeDisplay');
const phaseDisplay = document.getElementById('phaseDisplay');
const restartButton = document.getElementById('restartButton');
const resetButton = document.getElementById('resetButton');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
visualizer.width = 300;
visualizer.height = 100;

let mainNodes = {};
let particles = [];
let matrixDrops = [];
let isPaused = false;
let startTime = 0;
let elapsedTime = 0;
let phase = "intro"; // intro, build, peak, glitch, vortex, matrix

// Configuración de Game of Life
const GOL_COLS = 80;
const GOL_ROWS = Math.floor(GOL_COLS * (canvas.height / canvas.width));
const TILE_WIDTH = canvas.width / GOL_COLS;
const TILE_HEIGHT = canvas.height / GOL_ROWS;
let golGrid = [], golNextGrid = [];

// Inicialización de Game of Life
function initGOL() {
    for (let i = 0; i < GOL_COLS; i++) {
        golGrid[i] = [];
        golNextGrid[i] = [];
        for (let j = 0; j < GOL_ROWS; j++) {
            golGrid[i][j] = Math.random() > 0.8 ? 1 : 0;
        }
    }
}

function seedGOL() {
    for(let k=0; k < 200; k++) {
        const i = Math.floor(Math.random() * GOL_COLS);
        const j = Math.floor(Math.random() * GOL_ROWS);
        golGrid[i][j] = 1;
    }
}

function updateGOL() {
    for (let i = 0; i < GOL_COLS; i++) {
        for (let j = 0; j < GOL_ROWS; j++) {
            const neighbors = countNeighbors(i, j);
            const state = golGrid[i][j];
            if (state === 0 && neighbors === 3) golNextGrid[i][j] = 1;
            else if (state === 1 && (neighbors < 2 || neighbors > 3)) golNextGrid[i][j] = 0;
            else golNextGrid[i][j] = state;
        }
    }
    golGrid = golNextGrid.map(arr => arr.slice());
}

function countNeighbors(x, y) {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            const col = (x + i + GOL_COLS) % GOL_COLS;
            const row = (y + j + GOL_ROWS) % GOL_ROWS;
            sum += golGrid[col][row];
        }
    }
    return sum - golGrid[x][y];
}

// Creación de partículas psicodélicas
function createParticle(amp, x, y, hue) {
    const angle = Math.random() * 3 * Math.PI;
    particles.push({
        x: x || canvas.width / 2, 
        y: y || canvas.height / 2,
        angle: angle, 
        radius: 0, 
        life: 77 + amp * 99,
        speed: 3 + Math.random() * 6, 
        rotation: (Math.random() - 0.5) * 0.1,
        hue: hue || Math.random() * 360,
        size: 2 + Math.random() * 6,
        type: "normal"
    });
}

// Crear gotas para el efecto Matrix
function initMatrixEffect() {
    matrixDrops = [];
    const cols = Math.floor(canvas.width / 20);
    
    for (let i = 0; i < cols; i++) {
        matrixDrops.push({
            x: i * 20,
            y: Math.random() * -canvas.height,
            speed: 2 + Math.random() * 5,
            length: 5 + Math.floor(Math.random() * 15),
            chars: generateRandomChars(10 + Math.floor(Math.random() * 20)),
            charIndex: 0
        });
    }
}

function generateRandomChars(length) {
    let chars = '';
    const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < length; i++) {
        chars += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return chars;
}

// Inicio de la experiencia principal
function startMainExperience() {
    initGOL();
    initMatrixEffect();
    
    // Configuración de nodos de audio
    mainNodes.distortion = new Tone.Distortion(0.4).toDestination();
    mainNodes.filter = new Tone.Filter(800, "lowpass").connect(mainNodes.distortion);
    mainNodes.reverb = new Tone.Reverb(1.5).connect(mainNodes.filter);
    mainNodes.phaser = new Tone.Phaser({
        frequency: 0.5,
        octaves: 3,
        baseFrequency: 500
    }).connect(mainNodes.reverb);
    
    // Sintetizadores
    mainNodes.kick = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 8,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0.01 }
    }).connect(mainNodes.phaser);
    
    mainNodes.fmSynth = new Tone.FMSynth({
        harmonicity: 2.5,
        modulationIndex: 8,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }
    }).connect(mainNodes.phaser);
    
    mainNodes.bass = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { Q: 4, type: "lowpass" },
        envelope: { attack: 0.1, decay: 0.8, sustain: 0.4, release: 1.5 },
        filterEnvelope: { attack: 0.1, decay: 0.4, sustain: 0.5, release: 1.5, baseFrequency: 200, octaves: 3 }
    }).connect(mainNodes.phaser);
    
    mainNodes.impact = new Tone.NoiseSynth({ 
        noise: { type: 'brown' }, 
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.5 }
    }).connect(mainNodes.phaser);
    
    // Analizadores
    mainNodes.kickAnalyser = new Tone.Analyser('waveform', 256);
    mainNodes.kick.connect(mainNodes.kickAnalyser);
    
    mainNodes.arpAnalyser = new Tone.Analyser('waveform', 256);
    mainNodes.fmSynth.connect(mainNodes.arpAnalyser);
    
    // Patrones musicales
    mainNodes.kickLoop = new Tone.Loop(time => { 
        mainNodes.kick.triggerAttackRelease('C1', '8n', time); 
    }, '4n').start(0);
    
    mainNodes.pattern = new Tone.Pattern((time, note) => { 
        mainNodes.fmSynth.triggerAttackRelease(note, '16n', time); 
    }, ['C4', 'E4', 'G4', 'B4', 'D5'], 'up').start(0);
    
    mainNodes.bassPattern = new Tone.Pattern((time, note) => { 
        mainNodes.bass.triggerAttackRelease(note, '2n', time); 
    }, ['C2', 'G2', 'D2', 'A2'], 'random').start(0);
    
    mainNodes.impactSeq = new Tone.Sequence((time) => { 
        mainNodes.impact.triggerAttack(time); 
        seedGOL();
    }, [null, null, null, null, 1], '1m').start(0);
    
    mainNodes.golLoop = new Tone.Loop(updateGOL, '8n').start(0);
    
    // Secuencia de evolución
    Tone.Transport.scheduleRepeat(time => {
        elapsedTime = Tone.Transport.seconds;
        updatePhase();
    }, 1);
    
    // Iniciar transporte
    Tone.Transport.bpm.value = 110;
    Tone.Transport.start();
    startTime = Date.now();
    
    // Mostrar elementos de UI
    visualizer.style.display = 'block';
    timeDisplay.style.display = 'block';
    phaseDisplay.style.display = 'block';
}

// Actualizar la fase según el tiempo transcurrido
function updatePhase() {
    if (elapsedTime < 15) {
        phase = "intro";
        phaseDisplay.textContent = "Fase: Introducción";
        phaseDisplay.style.color = "#0f0";
    } else if (elapsedTime < 45) {
        phase = "build";
        phaseDisplay.textContent = "Fase: Construcción";
        phaseDisplay.style.color = "#ff0";
        // Aumentar progresivamente la intensidad
        const progress = (elapsedTime - 15) / 30;
        Tone.Transport.bpm.rampTo(110 + progress * 40, 0.1);
        mainNodes.distortion.distortion = 0.4 + progress * 0.4;
        mainNodes.filter.frequency.value = 800 + progress * 2000;
    } else if (elapsedTime < 75) {
        phase = "peak";
        phaseDisplay.textContent = "Fase: Pico Techno";
        phaseDisplay.style.color = "#f80";
        // Máxima intensidad
        Tone.Transport.bpm.value = 150;
        mainNodes.distortion.distortion = 0.8;
        mainNodes.filter.frequency.value = 2800;
    } else if (elapsedTime < 105) {
        phase = "vortex";
        phaseDisplay.textContent = "Fase: Vórtice Cósmico";
        phaseDisplay.style.color = "#f0f";
        // Transición a vórtice
        Tone.Transport.bpm.rampTo(100, 5);
        mainNodes.distortion.distortion = 0.6;
        mainNodes.filter.frequency.rampTo(1200, 5);
        mainNodes.phaser.frequency.rampTo(2, 5);
    } else if (elapsedTime < 135) {
        phase = "matrix";
        phaseDisplay.textContent = "Fase: Lluvia Digital";
        phaseDisplay.style.color = "#0ff";
        // Transición a matrix
        Tone.Transport.bpm.rampTo(80, 5);
        mainNodes.distortion.distortion = 0.4;
        mainNodes.filter.frequency.rampTo(3000, 5);
        mainNodes.phaser.frequency.rampTo(5, 5);
    } else {
        phase = "glitch";
        phaseDisplay.textContent = "Fase: Glitch Final";
        phaseDisplay.style.color = "#f00";
        // Transición a glitch
        Tone.Transport.bpm.rampTo(60, 5);
        mainNodes.distortion.distortion = 0.95;
        mainNodes.filter.frequency.rampTo(500, 5);
        mainNodes.phaser.frequency.rampTo(10, 5);
    }
}

// Iniciar experiencia
startButton.addEventListener('click', async () => {
    await Tone.start();
    startButton.parentElement.style.display = 'none';
    startMainExperience();
    animate();
});

// Manejar botones de pausa
restartButton.addEventListener('click', () => {
    if (isPaused) {
        togglePause();
    }
});

resetButton.addEventListener('click', () => {
    location.reload();
});

// Alternar pausa con la tecla 'F'
window.addEventListener('keydown', e => { 
    if (e.key.toLowerCase() === 'f') {
        togglePause();
    }
    
    // Teclas para efectos especiales
    if (e.key === '1' && !isPaused) {
        // Efecto de distorsión máxima
        mainNodes.distortion.distortion = 1.0;
        setTimeout(() => {
            if (!isPaused) mainNodes.distortion.distortion = phase === "glitch" ? 0.95 : 0.4;
        }, 500);
    }
    
    if (e.key === '2' && !isPaused) {
        // Explosión de partículas
        for(let i = 0; i < 100; i++) {
            createParticle(1.0, 
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 360);
        }
    }
});

// Alternar estado de pausa
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        Tone.Transport.pause();
        pauseContainer.style.display = 'flex';
        document.body.classList.add('glitch');
    } else {
        Tone.Transport.start();
        pauseContainer.style.display = 'none';
        document.body.classList.remove('glitch');
    }
}

// Animación principal
function animate() {
    if (isPaused) {
        requestAnimationFrame(animate);
        return;
    }
    
    requestAnimationFrame(animate);
    
    // Actualizar tiempo
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Fondo con desenfoque de movimiento
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Obtener datos de audio
    const kickWave = mainNodes.kickAnalyser.getValue();
    const arpWave = mainNodes.arpAnalyser.getValue();
    
    // Calcular amplitud promedio
    const kickAmp = kickWave.reduce((a, b) => a + Math.abs(b), 0) / 256;
    const arpAmp = arpWave.reduce((a, b) => a + Math.abs(b), 0) / 256;
    
    // Generar partículas con base en la amplitud
    if (kickAmp > 0.2 && phase !== "matrix") {
        const count = phase === "peak" ? 10 : (phase === "vortex" ? 15 : 5);
        for(let i = 0; i < count; i++) {
            createParticle(kickAmp, 
                canvas.width * 0.25 + Math.random() * canvas.width * 0.5, 
                canvas.height * 0.25 + Math.random() * canvas.height * 0.5,
                120 + Math.random() * 120);
        }
    }
    
    // Dibujar Game of Life (excepto en fase matrix)
    if (phase !== "matrix") {
        for (let i = 0; i < GOL_COLS; i++) {
            for (let j = 0; j < GOL_ROWS; j++) {
                if (golGrid[i][j] === 1) {
                    const hue = (i * 360 / GOL_COLS + elapsedTime * 10) % 360;
                    ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.7 + arpAmp * 0.3})`;
                    ctx.fillRect(i * TILE_WIDTH, j * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
                }
            }
        }
    }
    
    // ===== EFECTOS ESPECIALES POR FASE =====
    
    // Fase Vortex: Efecto de remolino
    if (phase === "vortex") {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(elapsedTime * 0.5);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    
    // Dibujar partículas psicodélicas
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Comportamiento especial en fase vortex
        if (phase === "vortex") {
            p.angle += 0.05;
            p.radius += p.speed * 0.7;
            p.speed += 0.01;
        } 
        // Comportamiento normal en otras fases
        else {
            p.radius += p.speed;
            p.angle += p.rotation + Math.sin(elapsedTime) * 0.05;
        }
        
        p.life -= 1;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            const x = p.x + Math.cos(p.angle) * p.radius;
            const y = p.y + Math.sin(p.angle) * p.radius;
            
            ctx.beginPath();
            ctx.arc(x, y, p.size * (p.life / 100), 0, Math.PI * 2);
            
            // Efectos de color especiales por fase
            if (phase === "glitch") {
                ctx.fillStyle = `hsla(${(p.hue + elapsedTime * 20) % 360}, 100%, 70%, ${p.life / 150})`;
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsl(${(p.hue + 180) % 360}, 100%, 50%)`;
            } else if (phase === "vortex") {
                ctx.fillStyle = `hsla(${(p.hue + elapsedTime * 10) % 360}, 100%, 70%, ${p.life / 200})`;
                ctx.shadowBlur = 20;
                ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
            } else {
                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life / 150})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
            }
            
            ctx.fill();
            
            // Crear partículas secundarias en el pico
            if (phase === "peak" && p.life % 10 === 0 && Math.random() > 0.7) {
                createParticle(0.5, x, y, (p.hue + 90) % 360);
            }
        }
    }
    
    // Restaurar transformaciones de canvas
    if (phase === "vortex") {
        ctx.restore();
    }
    
    // Restablecer efectos de sombra
    ctx.shadowBlur = 0;
    
    // Fase Matrix: Efecto de lluvia digital
    if (phase === "matrix") {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '20px monospace';
        
        for (let i = matrixDrops.length - 1; i >= 0; i--) {
            const drop = matrixDrops[i];
            
            // Avanzar la gota
            drop.y += drop.speed;
            
            // Si la gota sale de la pantalla, reiniciarla
            if (drop.y > canvas.height + drop.length * 20) {
                drop.y = Math.random() * -canvas.height;
                drop.speed = 2 + Math.random() * 5;
                drop.chars = generateRandomChars(10 + Math.floor(Math.random() * 20));
            }
            
            // Dibujar caracteres con efecto de desvanecimiento
            for (let j = 0; j < drop.length; j++) {
                const charY = drop.y - j * 20;
                if (charY > 0 && charY < canvas.height) {
                    const alpha = j === 0 ? 1 : 1 - (j / drop.length);
                    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                    ctx.fillText(drop.chars.charAt((drop.charIndex + j) % drop.chars.length), drop.x, charY);
                }
            }
            
            // Avanzar índice de caracteres
            if (elapsedTime % 0.1 < 0.05) {
                drop.charIndex = (drop.charIndex + 1) % drop.chars.length;
            }
        }
    }
    
    // Visualizador de audio
    visCtx.clearRect(0, 0, visualizer.width, visualizer.height);
    
    // Dibujar forma de onda
    visCtx.strokeStyle = '#0f0';
    visCtx.lineWidth = 2;
    visCtx.beginPath();
    visCtx.moveTo(0, visualizer.height / 2);
    
    const waveData = mainNodes.arpAnalyser.getValue();
    for (let i = 0; i < waveData.length; i++) {
        const x = (i / waveData.length) * visualizer.width;
        const y = (0.5 - waveData[i] * 0.5) * visualizer.height;
        visCtx.lineTo(x, y);
    }
    visCtx.stroke();
    
    // Dibujar barras de frecuencia (simplificado)
    visCtx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    const barWidth = visualizer.width / 32;
    for (let i = 0; i < 32; i++) {
        const amplitude = Math.abs(waveData[i * 8]) || 0;
        const barHeight = amplitude * visualizer.height * 0.8;
        visCtx.fillRect(
            i * barWidth, 
            visualizer.height - barHeight, 
            barWidth - 2, 
            barHeight
        );
    }
}

// Manejar redimensionamiento
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initMatrixEffect();
});