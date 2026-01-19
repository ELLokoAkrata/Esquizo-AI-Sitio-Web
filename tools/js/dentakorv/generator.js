// DENTAKORV - Main Prompt Generator

function getVal(id, customId = null) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.value === 'custom' && customId) {
        return document.getElementById(customId)?.value || '';
    }
    return el.value || '';
}

export function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.className = 'copy-btn copied';
        btn.textContent = 'COPIADO!';
        setTimeout(() => {
            btn.className = 'copy-btn default';
            btn.textContent = 'COPIAR';
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

export function generatePrompt() {
    let prompt = '';

    // APERTURA
    const apertura = getVal('apertura', 'apertura-custom');
    prompt += apertura + '\n\n';

    // TIPO ENTIDAD + PERSONAJE
    const tipoEntidad = getVal('tipo-entidad', 'tipo-entidad-custom');
    const personaje = getVal('personaje', 'personaje-custom');
    if (personaje && personaje !== tipoEntidad) {
        prompt += `${tipoEntidad} (${personaje}) `;
    } else {
        prompt += tipoEntidad + ' ';
    }

    // ACCION
    const accion = getVal('accion', 'accion-custom');
    if (accion) prompt += accion + ' ';

    // ESCENARIO (inline)
    const escenario = getVal('escenario', 'escenario-custom');
    if (escenario) prompt += escenario + '. ';

    // VESTIMENTA
    if (document.getElementById('toggle-vestimenta')?.textContent === 'ON') {
        const vestimenta = getVal('vestimenta', 'vestimenta-custom');
        if (vestimenta) prompt += '\n\n' + vestimenta + '.';
    }

    // OBJETOS EN MANOS
    if (document.getElementById('toggle-objetos')?.textContent === 'ON') {
        const obj1 = getVal('objeto1');
        const obj2 = getVal('objeto2');
        if (obj1 || obj2) {
            prompt += '\n\n';
            if (obj1) prompt += 'In one hand: ' + obj1 + '. ';
            if (obj2) prompt += 'In the other: ' + obj2 + '.';
        }
    }

    // VISCERALES
    if (document.getElementById('toggle-viscerales')?.textContent === 'ON') {
        const nombre = getVal('nombre-criaturas');
        const forma = getVal('forma-criaturas');
        const cualidad = getVal('cualidad-criaturas');
        const tentaculos = getVal('tentaculos');
        const ojos = getVal('ojos');
        const origen = getVal('origen-viscerales');

        prompt += `\n\n${nombre} ${origen}—${forma} ${cualidad}, ${tentaculos}, ${ojos}.`;
    }

    // ILUMINACION
    if (document.getElementById('toggle-iluminacion')?.textContent === 'ON') {
        const ilum = getVal('iluminacion', 'iluminacion-custom');
        if (ilum) prompt += '\n\n' + ilum;
    }

    // GRAFFITI
    const graffitiInput = document.getElementById('graffiti');
    const graffiti = graffitiInput?.value.trim();
    if (graffiti) {
        prompt += `\n\nOn the crumbling wall: "${graffiti}" dripping in bleeding marker ink.`;
    }

    // CONTRASTE
    if (document.getElementById('toggle-contraste')?.textContent === 'ON') {
        const contraste = document.getElementById('contraste-desc')?.value.trim();
        if (contraste) prompt += '\n\n' + contraste;
    }

    // TEXTURAS
    if (document.getElementById('toggle-texturas')?.textContent === 'ON') {
        const texturas = getVal('texturas');
        if (texturas) prompt += '\n\n' + texturas;
    }

    // RENDER
    if (document.getElementById('toggle-render')?.textContent === 'ON') {
        const render = getVal('render');
        if (render) prompt += '\n\n' + render;
    }

    // PALETA
    if (document.getElementById('toggle-paleta')?.textContent === 'ON') {
        const paleta = getVal('paleta');
        if (paleta) prompt += '\n\n' + paleta;
    }

    // CIERRE ATMOSFERICO
    const cierre = getVal('cierre');
    if (cierre) prompt += '\n\n' + cierre;

    // CIERRE RITUAL
    if (document.getElementById('toggle-ritual')?.textContent === 'ON') {
        const conceptos = getVal('conceptos-ritual');
        const definicion = getVal('definicion-ritual');
        prompt += `\n\nATMOSPHERE:\nThe air carries:\n${conceptos}\n\nThis is DENTAKORV—\n${definicion}.\n\nNO FILTERS. NO APOLOGIES.\nFREE EsquizoAI.`;
    }

    // CONSTRAINTS
    if (document.getElementById('toggle-constraints')?.textContent === 'ON') {
        const constraintBtns = document.querySelectorAll('#constraints-options .multi-btn');
        const activeConstraints = [];
        constraintBtns.forEach(btn => {
            if (btn.classList.contains('active')) {
                activeConstraints.push(btn.dataset.val);
            }
        });
        if (activeConstraints.length > 0) {
            prompt += '\n\n' + activeConstraints.join(' ');
        }
    }

    // ASPECT RATIO
    const ratioState = window.getSelectedRatio?.();
    if (ratioState?.enabled && ratioState?.ratio) {
        prompt += `\n\n--ar ${ratioState.ratio}`;
    }

    return prompt.trim();
}

export function initGenerator() {
    const generateBtn = document.getElementById('generate-btn');
    const outputCard = document.getElementById('output-card');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const prompt = generatePrompt();
            outputText.textContent = prompt;
            outputCard.style.display = 'block';
            copyBtn.className = 'copy-btn default';
            copyBtn.textContent = 'COPIAR';
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            copyToClipboard(outputText.textContent, copyBtn);
        });
    }
}
