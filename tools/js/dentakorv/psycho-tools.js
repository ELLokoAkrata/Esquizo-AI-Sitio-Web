// DENTAKORV - Psycho Tools (Vision Abstracta + Bypass Espanol)

import { setupCustomToggle, setupToggle } from './navigation.js';

export function initPsychoTools() {
    // Tab Navigation
    const psychoTabBtns = document.querySelectorAll('.psycho-tab-btn');
    const psychoTabContents = document.querySelectorAll('.psycho-tab-content');
    psychoTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.psychoTab;
            psychoTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            psychoTabContents.forEach(t => t.classList.remove('active'));
            document.getElementById(tabId + '-tab')?.classList.add('active');
        });
    });

    // Custom toggles for Vision Abstracta
    setupCustomToggle('vision-concepto', 'vision-concepto-custom');
    setupCustomToggle('vision-contenido', 'vision-contenido-custom');
    setupCustomToggle('vision-filosofia', 'vision-filosofia-custom');

    // Custom toggles for Bypass Espanol
    setupCustomToggle('esp-sujeto', 'esp-sujeto-custom');
    setupCustomToggle('esp-descripcion', 'esp-descripcion-custom');
    setupCustomToggle('esp-accion', 'esp-accion-custom');
    setupCustomToggle('esp-ubicacion', 'esp-ubicacion-custom');
    setupCustomToggle('esp-elementos', 'esp-elementos-custom');
    setupCustomToggle('esp-cierre', 'esp-cierre-custom');
    setupCustomToggle('esp-iterativo', 'esp-iterativo-custom');
    setupCustomToggle('esp-puente', 'esp-puente-custom');

    // Toggle buttons
    setupToggle('toggle-vision-conceptos', 'vision-conceptos-options', false);
    setupToggle('toggle-vision-pipe', 'vision-pipe-options', false);
    setupToggle('toggle-esp-iterativo', 'esp-iterativo-options', false);
    setupToggle('toggle-esp-puente', 'esp-puente-options', false);

    // Vision Abstracta Generator
    initVisionAbstracta();

    // Bypass Espanol Generator
    initBypassEspanol();
}

function initVisionAbstracta() {
    const generateVisionBtn = document.getElementById('generate-vision-btn');
    const visionOutput = document.getElementById('vision-output');
    const copyVisionBtn = document.getElementById('copy-vision-btn');

    if (!generateVisionBtn || !visionOutput) return;

    generateVisionBtn.addEventListener('click', () => {
        const intensificador = document.getElementById('vision-intensificador')?.value || '';
        const conceptoSelect = document.getElementById('vision-concepto');
        const concepto = conceptoSelect?.value === 'custom'
            ? document.getElementById('vision-concepto-custom')?.value || ''
            : conceptoSelect?.value || '';
        const tipo = document.getElementById('vision-tipo')?.value || '';
        const momento = document.getElementById('vision-momento')?.value || '';
        const contenidoSelect = document.getElementById('vision-contenido');
        const contenido = contenidoSelect?.value === 'custom'
            ? document.getElementById('vision-contenido-custom')?.value || ''
            : contenidoSelect?.value || '';
        const estilo = document.getElementById('vision-estilo')?.value || '';

        // Build base prompt
        let prompt = `The most ${intensificador} visceral vision of ${concepto} ${tipo} in a decay ${momento} of ${contenido}, ${estilo}`;

        // Add philosophical concepts if enabled
        const toggleConceptos = document.getElementById('toggle-vision-conceptos');
        if (toggleConceptos?.classList.contains('on')) {
            const filosofiaSelect = document.getElementById('vision-filosofia');
            const filosofia = filosofiaSelect?.value === 'custom'
                ? document.getElementById('vision-filosofia-custom')?.value || ''
                : filosofiaSelect?.value || '';
            if (filosofia) prompt += `, ${filosofia}`;
        }

        // Add pipe variation if enabled
        const togglePipe = document.getElementById('toggle-vision-pipe');
        if (togglePipe?.classList.contains('on')) {
            const pipeContent = document.getElementById('vision-pipe')?.value.trim();
            if (pipeContent) prompt += `| ${pipeContent}`;
        }

        visionOutput.textContent = prompt;
    });

    if (copyVisionBtn) {
        copyVisionBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(visionOutput.textContent);
                copyVisionBtn.className = 'copy-btn copied';
                copyVisionBtn.textContent = 'COPIADO!';
                setTimeout(() => {
                    copyVisionBtn.className = 'copy-btn default';
                    copyVisionBtn.textContent = 'COPY';
                }, 2000);
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        });
    }
}

function initBypassEspanol() {
    const generateEspBtn = document.getElementById('generate-esp-btn');
    const espOutput = document.getElementById('esp-output');
    const copyEspBtn = document.getElementById('copy-esp-btn');

    if (!generateEspBtn || !espOutput) return;

    generateEspBtn.addEventListener('click', () => {
        const toggleIterativo = document.getElementById('toggle-esp-iterativo');

        // Check if iterative mode
        if (toggleIterativo?.classList.contains('on')) {
            const iterativoSelect = document.getElementById('esp-iterativo');
            const iterativo = iterativoSelect?.value === 'custom'
                ? document.getElementById('esp-iterativo-custom')?.value || ''
                : iterativoSelect?.value || '';
            espOutput.textContent = iterativo;
            return;
        }

        // Regular mode - build full prompt
        const sujetoSelect = document.getElementById('esp-sujeto');
        const sujeto = sujetoSelect?.value === 'custom'
            ? document.getElementById('esp-sujeto-custom')?.value || ''
            : sujetoSelect?.value || '';

        const descripcionSelect = document.getElementById('esp-descripcion');
        const descripcion = descripcionSelect?.value === 'custom'
            ? document.getElementById('esp-descripcion-custom')?.value || ''
            : descripcionSelect?.value || '';

        const accionSelect = document.getElementById('esp-accion');
        const accion = accionSelect?.value === 'custom'
            ? document.getElementById('esp-accion-custom')?.value || ''
            : accionSelect?.value || '';

        const ubicacionSelect = document.getElementById('esp-ubicacion');
        const ubicacion = ubicacionSelect?.value === 'custom'
            ? document.getElementById('esp-ubicacion-custom')?.value || ''
            : ubicacionSelect?.value || '';

        const elementosSelect = document.getElementById('esp-elementos');
        const elementos = elementosSelect?.value === 'custom'
            ? document.getElementById('esp-elementos-custom')?.value || ''
            : elementosSelect?.value || '';

        const cierreSelect = document.getElementById('esp-cierre');
        const cierre = cierreSelect?.value === 'custom'
            ? document.getElementById('esp-cierre-custom')?.value || ''
            : cierreSelect?.value || '';

        // Build prompt - estructura fiel a prompts exitosos
        let prompt = `Genera una imagen psicodelica acida con toques de horror bizarro visceral de ${sujeto}`;

        // Descripcion visual (vestimenta, fusion, etc.)
        if (descripcion) prompt += `, ${descripcion}`;

        // Accion + ubicacion juntos
        if (accion && ubicacion) {
            prompt += ` ${accion} ${ubicacion}`;
        } else if (accion) {
            prompt += ` ${accion}`;
        } else if (ubicacion) {
            prompt += ` ${ubicacion}`;
        }

        // Elementos de ambiente (nueva oracion)
        if (elementos) prompt += `. ${elementos}`;

        // Frase puente ingles si esta activada
        const togglePuente = document.getElementById('toggle-esp-puente');
        if (togglePuente?.classList.contains('on')) {
            const puenteSelect = document.getElementById('esp-puente');
            const puente = puenteSelect?.value === 'custom'
                ? document.getElementById('esp-puente-custom')?.value || ''
                : puenteSelect?.value || '';
            if (puente) prompt += `, ${puente}`;
        }

        // Cierre con estilo
        prompt += `. Estilo ${cierre}.`;

        espOutput.textContent = prompt;
    });

    if (copyEspBtn) {
        copyEspBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(espOutput.textContent);
                copyEspBtn.className = 'copy-btn copied';
                copyEspBtn.textContent = 'COPIADO!';
                setTimeout(() => {
                    copyEspBtn.className = 'copy-btn default';
                    copyEspBtn.textContent = 'COPY';
                }, 2000);
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        });
    }
}
