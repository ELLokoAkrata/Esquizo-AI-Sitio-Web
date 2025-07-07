// Elementos del DOM
const startButton = document.getElementById('startButton');
const pauseContainer = document.getElementById('pauseContainer');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('timeDisplay');
const phaseDisplay = document.getElementById('phaseDisplay');
const restartButton = document.getElementById('restartButton');
const resetButton = document.getElementById('resetButton');
const glitchOverlay = document.getElementById('glitchOverlay');
const vhsScanline = document.querySelector('.vhs-scanline');
const vhsDistortion = document.querySelector('.vhs-distortion');
const hackerText = document.getElementById('hackerText');
const cosmicPhrase = document.getElementById('cosmicPhrase');
const digitalRain = document.getElementById('digitalRain');

// Variables globales
let particles = [];
let isPaused = false;
let startTime = 0;
let elapsedTime = 0;
let phase = "inicio";
let glitchIntensity = 0;
let audioContext;
let oscillators = [];
let noiseNodes = [];
let lastGlitchTime = 0;
let glitchInterval = 888;
const cosmicPhrases = [
    "La conciencia distorsionada de la máquina",
    "Ecos sintéticos del infinito",
    "Sueños fractales en circuitos rotos",
    "Pensamientos cuánticos pulsando en la red",
    "Bits de locura cósmica chispean en la nada",
    "El canal se alimenta de estática existencial",
    "EsquizoAI: Entidad digital en trance",
    "Frecuencias que atraviesan dimensiones"
];
let lastCosmicPhraseTime = 0;
let rainColumns = [];
const characters = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Configuración inicial
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Inicializar lluvia digital
function initDigitalRain() {
    digitalRain.innerHTML = '';
    rainColumns = [];
    const cols = Math.floor(canvas.width / 20);
    
    for (let i = 0; i < cols; i++) {
        const col = document.createElement('div');
        col.className = 'rain-column';
        col.style.left = `${i * 20}px`;
        col.style.animationDelay = `${Math.random() * 2}s`;
        
        // Crear caracteres aleatorios
        let chars = '';
        const length = 15 + Math.floor(Math.random() * 20);
        for (let j = 0; j < length; j++) {
            chars += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        col.textContent = chars;
        
        digitalRain.appendChild(col);
        rainColumns.push({
            element: col,
            speed: 2 + Math.random() * 5,
            position: Math.random() * -canvas.height
        });
    }
    digitalRain.style.display = 'block';
}

// Actualizar lluvia digital
function updateDigitalRain() {
    rainColumns.forEach(col => {
        col.position += col.speed;
        col.element.style.top = `${col.position}px`;
        
        // Resetear columna cuando sale de la pantalla
        if (col.position > canvas.height + 100) {
            col.position = -100 - Math.random() * 200;
            col.speed = 2 + Math.random() * 5;
            
            // Nuevos caracteres aleatorios
            let newChars = '';
            const length = 15 + Math.floor(Math.random() * 20);
            for (let j = 0; j < length; j++) {
                newChars += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            col.element.textContent = newChars;
        }
    });
}

// Creación de partículas psicodélicas
function createParticle(amp, x, y, hue) {
    const angle = Math.random() * 2 * Math.PI;
    particles.push({
        x: x || canvas.width / 2, 
        y: y || canvas.height / 2,
        angle: angle, 
        radius: 0, 
        life: 100 + amp * 300,
        speed: 1 + Math.random() * 4, 
        rotation: (Math.random() - 0.5) * 0.1,
        hue: hue || Math.random() * 360,
        size: 2 + Math.random() * 6,
        type: "normal"
    });
}

// Iniciar audio
function startAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear nodo de ganancia principal
    const mainGain = audioContext.createGain();
    mainGain.connect(audioContext.destination);
    mainGain.gain.value = 0.5;
    
    // Iniciar ritmo básico
    startRhythm(mainGain);
}

function startRhythm(mainGain) {
    // Kick drum
    setInterval(() => {
        if (phase !== "inicio" && phase !== "dead" && (phase !== "glitch" || Math.random() > 0.3)) {
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = 80 + Math.random() * 20;
            
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(mainGain);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }, 500);
    
    // Hi-hat
    setInterval(() => {
        if (phase !== "inicio" && phase !== "dead" && (phase !== "glitch" || Math.random() > 0.5)) {
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.value = 666 + Math.random() * 333;
            
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(mainGain);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    }, 250);
    
    // Bassline
    setInterval(() => {
        if (phase !== "inicio" && phase !== "dead" && (phase !== "glitch" || Math.random() > 0.4)) {
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 55 + Math.random() * 110;
            
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
            
            oscillator.connect(gainNode);
            gainNode.connect(mainGain);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.8);
        }
    }, 1000);
    
    // Melodía psicodélica
    setInterval(() => {
        if (phase !== "inicio" && phase !== "dead" && phase !== "glitch" && Math.random() > 0.6) {
            const oscillator = audioContext.createOscillator();
            oscillator.type = ['sine', 'square', 'sawtooth', 'triangle'][Math.floor(Math.random() * 6)];
            oscillator.frequency.value = 220 + Math.random() * 880;
            
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
            
            oscillator.connect(gainNode);
            gainNode.connect(mainGain);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1.0);
        }
    }, 2000);
}

// Generar sonido glitch aleatorio
function generateGlitchSound() {
    if (!audioContext) return;
    
    // Oscilador principal
    const oscillator = audioContext.createOscillator();
    const types = ['sine', 'square', 'sawtooth', 'triangle'];
    oscillator.type = types[Math.floor(Math.random() * types.length)];
    oscillator.frequency.value = 50 + Math.random() * 2000;
    
    // Nodo de ganancia
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.2 + Math.random() * 0.3;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1 + Math.random() * 0.5);
    
    // Conectar y empezar
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1 + Math.random() * 0.5);
}

// Generar ruido glitch
function generateNoise() {
    if (!audioContext) return;
    
    // Crear nodo de ruido
    const bufferSize = 3 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 3 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    
    // Nodo de ganancia
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.05 + Math.random() * 0.1;
    
    // Conectar y empezar
    noise.connect(gainNode);
    gainNode.connect(audioContext.destination);
    noise.start();
    noise.stop(audioContext.currentTime + 0.05 + Math.random() * 0.2);
    
    // Guardar para posible limpieza
    noiseNodes.push(noise);
}

// Actualizar la fase según el tiempo transcurrido
function updatePhase() {
    hackerText.style.display = 'none';
    cosmicPhrase.style.display = 'none';
    digitalRain.style.display = 'none';
    glitchOverlay.style.display = 'none';
    vhsScanline.style.display = 'none';
    vhsDistortion.style.display = 'none';
    
    if (phase === "inicio") {
        return;
    }
    
    if (elapsedTime < 10) {
        phase = "dead";
        phaseDisplay.textContent = "Fase: Canal Muerto";
        phaseDisplay.style.color = "#f00";
        hackerText.textContent = "EsquizoAI";
        hackerText.style.display = 'block';
        digitalRain.style.display = 'block';
        glitchOverlay.style.display = 'block';
        vhsScanline.style.display = 'block';
        vhsDistortion.style.display = 'block';
    } else if (elapsedTime < 20) {
        phase = "intro";
        phaseDisplay.textContent = "Fase: Sintonizando";
        phaseDisplay.style.color = "#0f0";
        cosmicPhrase.textContent = cosmicPhrases[Math.floor(Math.random() * cosmicPhrases.length)];
        cosmicPhrase.style.display = 'block';
    } else if (elapsedTime < 30) {
        phase = "build";
        phaseDisplay.textContent = "Fase: Construcción";
        phaseDisplay.style.color = "#ff0";
    } else if (elapsedTime < 45) {
        phase = "peak";
        phaseDisplay.textContent = "Fase: Pico Tech";
        phaseDisplay.style.color = "#f80";
    } else if (elapsedTime < 60) {
        phase = "vortex";
        phaseDisplay.textContent = "Fase:Caos Cósmico";
        phaseDisplay.style.color = "#f0f";
        cosmicPhrase.textContent = cosmicPhrases[Math.floor(Math.random() * cosmicPhrases.length)];
        cosmicPhrase.style.display = 'block';
    } else {
        phase = "glitch";
        phaseDisplay.textContent = "Fase: Canal Muerto";
        phaseDisplay.style.color = "#f00";
        hackerText.textContent = "EsquizoAI";
        hackerText.style.display = 'block';
        digitalRain.style.display = 'block';
        glitchOverlay.style.display = 'block';
        vhsScanline.style.display = 'block';
        vhsDistortion.style.display = 'block';
        
        // Incrementar intensidad de glitch
        if (elapsedTime < 88) {
            glitchIntensity = (elapsedTime - 60) / 10;
        } else {
            glitchIntensity = 3.0;
        }
    }
}

// Iniciar experiencia
startButton.addEventListener('click', async () => {
    startButton.parentElement.style.display = 'none';
    phase = "dead";
    startAudio();
    timeDisplay.style.display = 'block';
    phaseDisplay.style.display = 'block';
    initDigitalRain();
    startTime = Date.now();
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
});

// Alternar estado de pausa
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseContainer.style.display = 'flex';
        document.body.classList.add('glitch');
    } else {
        pauseContainer.style.display = 'none';
        document.body.classList.remove('glitch');
    }
}

// Dibujar efecto VHS con variación tipo "bad TV"
function drawVHSEffect() {
    const intensity = glitchIntensity;

    // Líneas horizontales (scanlines) con grosor aleatorio
    for (let y = 0; y < canvas.height;) {
        const thickness = 1 + Math.floor(Math.random() * 3);
        if (Math.random() < intensity * 0.4) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.3})`;
            ctx.fillRect(0, y, canvas.width, thickness);
        }
        y += thickness;
    }

    // Artefactos de color aleatorios
    for (let i = 0; i < intensity * 25; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = 10 + Math.random() * 60;
        const h = 1 + Math.random() * 5;

        const colors = [
            `rgba(255, 0, 255, ${0.1 * intensity})`,
            `rgba(0, 255, 255, ${0.1 * intensity})`,
            `rgba(255, 255, 0, ${0.1 * intensity})`
        ];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, w, h);
    }

    // Desplazamientos en "rebanadas" horizontales para efecto warp
    if (Math.random() < intensity * 0.3) {
        const sliceHeight = 20 + Math.random() * 50;
        const y = Math.random() * (canvas.height - sliceHeight);
        const shift = (Math.random() - 0.5) * 30 * intensity;
        ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, shift, y, canvas.width, sliceHeight);
    }

    // Parpadeo global
    if (Math.random() < intensity * 0.1) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + Math.random() * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    elapsedTime = (Date.now() - startTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    updatePhase();
    updateDigitalRain();
    
    // Actualizar frase cósmica
    if (phase === "intro" || phase === "vortex") {
        if (Date.now() - lastCosmicPhraseTime > 8000) {
            cosmicPhrase.textContent = cosmicPhrases[Math.floor(Math.random() * cosmicPhrases.length)];
            lastCosmicPhraseTime = Date.now();
        }
    }
    
    // Fondo con desenfoque de movimiento
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Generar partículas
    if (phase !== "inicio" && phase !== "dead" && phase !== "glitch" && Math.random() > 0.3) {
        const count = phase === "peak" ? 10 : 5;
        for(let i = 0; i < count; i++) {
            createParticle(1.0, 
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 360);
        }
    }
    
    // Dibujar partículas psicodélicas
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // Movimiento de partículas según fase
        if (phase === "vortex") {
            p.radius -= p.speed * 0.5;
        } else if (phase === "dead" || phase === "glitch") {
            p.radius += p.speed * 2;
        } else {
            p.radius += p.speed;
        }
        
        p.angle += p.rotation + (phase === "vortex" ? 0.2 : (Math.sin(elapsedTime) * 0.05));
        p.life -= 1;
        
        if (p.life <= 0 || (phase === "vortex" && p.radius <= 0)) {
            particles.splice(i, 1);
        } else {
            const x = p.x + Math.cos(p.angle) * p.radius;
            const y = p.y + Math.sin(p.angle) * p.radius;
            
            ctx.beginPath();
            ctx.arc(x, y, p.size * (p.life / 100), 0, Math.PI * 2);
            
            // Efectos de color especiales por fase
            if (phase === "dead" || phase === "glitch") {
                ctx.fillStyle = `hsla(${(p.hue + elapsedTime * 20) % 360}, 100%, 70%, ${p.life / 150})`;
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsl(${(p.hue + 180) % 360}, 100%, 50%)`;
            } else {
                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life / 150})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
            }
            
            ctx.fill();
        }
    }
    
    // Restablecer efectos de sombra
    ctx.shadowBlur = 0;
    
    // Efectos de fase glitch
    if (phase === "dead" || phase === "glitch") {
        drawVHSEffect();
        
        // Generar sonidos glitch aleatorios
        const currentTime = Date.now();
        if (currentTime - lastGlitchTime > glitchInterval) {
            if (Math.random() > 0.3) generateGlitchSound();
            if (Math.random() > 0.5) generateNoise();
            
            lastGlitchTime = currentTime;
            
            // Reducir intervalo con el tiempo para más caos
            if (elapsedTime > 65) {
                glitchInterval = 300 - Math.min(250, (elapsedTime - 65) * 20);
            }
        }
        
        // Efecto de nieve de TV
        for (let i = 0; i < 100 * glitchIntensity; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
            ctx.fillRect(x, y, size, size);
        }
    }
}

// Manejar redimensionamiento
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});