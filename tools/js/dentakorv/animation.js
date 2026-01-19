// DENTAKORV - Animation Tab

let elementCount = 1;

const verbOptionsHTML = `
    <option value="">-- Verbo --</option>
    <optgroup label="ORGANICO">
        <option value="twitches">twitches</option>
        <option value="pulses">pulses</option>
        <option value="breathes">breathes</option>
        <option value="writhes">writhes</option>
        <option value="oozes">oozes</option>
        <option value="drips">drips</option>
        <option value="blinks">blinks</option>
        <option value="crawls">crawls</option>
        <option value="squirms">squirms</option>
    </optgroup>
    <optgroup label="MECANICO">
        <option value="rattles">rattles</option>
        <option value="creaks">creaks</option>
        <option value="swings">swings</option>
        <option value="spins">spins</option>
        <option value="clicks">clicks</option>
        <option value="buzzes">buzzes</option>
        <option value="sputters">sputters</option>
        <option value="grinds">grinds</option>
    </optgroup>
    <optgroup label="ATMOSFERICO">
        <option value="flickers">flickers</option>
        <option value="drifts">drifts</option>
        <option value="swirls">swirls</option>
        <option value="settles">settles</option>
        <option value="fades">fades</option>
        <option value="glows">glows</option>
        <option value="rises">rises</option>
        <option value="sways">sways</option>
    </optgroup>
`;

function createElementRow(element = '', verb = '') {
    const row = document.createElement('div');
    row.className = 'anim-element-row';
    row.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Elemento';
    input.style.flex = '1';
    input.className = 'anim-element-input';
    input.value = element;

    const select = document.createElement('select');
    select.style.flex = '1';
    select.className = 'anim-verb-select';
    select.innerHTML = verbOptionsHTML;
    if (verb) select.value = verb;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '✕';
    deleteBtn.style.cssText = 'padding: 0.4rem 0.6rem; background: #dc2626; border: none; border-radius: 0.3rem; color: white; cursor: pointer;';
    deleteBtn.addEventListener('click', () => {
        row.remove();
        elementCount--;
    });

    row.appendChild(input);
    row.appendChild(select);
    row.appendChild(deleteBtn);

    return row;
}

export function loadAnimExample(type) {
    const animElementsContainer = document.getElementById('anim-elements-container');
    const audioElementBtns = document.querySelectorAll('#anim-audio-elements .multi-btn');

    if (!animElementsContainer) return;

    // Clear existing elements
    animElementsContainer.innerHTML = '';
    elementCount = 0;

    // Clear audio selections
    audioElementBtns.forEach(btn => btn.classList.remove('active'));

    const examples = {
        'santa': {
            camera: 'Static camera.',
            elements: [
                ['Santa smokes, green smoke', 'rises'],
                ['Hand', 'twitches'],
                ['Eyeballs', ''],
                ['Tentacles', ''],
                ['Brain', 'pulses']
            ],
            lighting: 'Candles flicker.',
            audioGenre: 'Raw crust punk',
            audioElements: ['blast beats', 'guttural screams', 'distorted bass', 'static hum']
        },
        'lab': {
            camera: 'Static camera.',
            elements: [
                ['Scientist corpse slumps in chair', ''],
                ['Monitor static', 'flickers'],
                ['Liquid in tubes', ''],
                ['Cables', ''],
                ['Overhead light', 'swings']
            ],
            lighting: '',
            audioGenre: 'Industrial machinery',
            audioElements: ['hydraulic hiss', 'dripping liquid', 'distant alarm']
        },
        'possessed': {
            camera: 'Static camera.',
            elements: [
                ['Figure in bed', 'breathes'],
                ['Shadows', 'crawls'],
                ['Curtains', 'sways'],
                ['Crucifix on wall tilts slowly', ''],
                ['Candle flame stretches unnaturally', '']
            ],
            lighting: '',
            audioGenre: 'Dark ambient drone',
            audioElements: ['wood creaking', 'subsonic hum', 'reversed whispers']
        }
    };

    const ex = examples[type];
    if (!ex) return;

    // Set camera
    const cameraSelect = document.getElementById('anim-camera');
    if (cameraSelect) cameraSelect.value = ex.camera;

    // Set elements
    ex.elements.forEach(([element, verb]) => {
        const row = createElementRow(element, verb);
        animElementsContainer.appendChild(row);
        elementCount++;
    });

    // Set lighting
    const lightingSelect = document.getElementById('anim-lighting');
    if (lightingSelect) lightingSelect.value = ex.lighting;

    // Set audio genre
    const audioGenreSelect = document.getElementById('anim-audio-genre');
    if (audioGenreSelect) audioGenreSelect.value = ex.audioGenre;

    // Set audio elements
    audioElementBtns.forEach(btn => {
        if (ex.audioElements.includes(btn.dataset.val)) {
            btn.classList.add('active');
        }
    });
}

export function initAnimation() {
    const addElementBtn = document.getElementById('add-element-btn');
    const animElementsContainer = document.getElementById('anim-elements-container');
    const generateAnimBtn = document.getElementById('generate-anim-btn');
    const outputAnimCard = document.getElementById('output-anim-card');
    const outputAnimText = document.getElementById('output-anim-text');
    const copyAnimBtn = document.getElementById('copy-anim-btn');
    const audioElementBtns = document.querySelectorAll('#anim-audio-elements .multi-btn');

    // Add Element Button
    if (addElementBtn && animElementsContainer) {
        addElementBtn.addEventListener('click', () => {
            if (elementCount >= 8) {
                alert('Maximo 8 elementos. Recuerda: 4-6 es optimo.');
                return;
            }
            const row = createElementRow();
            animElementsContainer.appendChild(row);
            elementCount++;
        });
    }

    // Audio Elements Multi-Select
    audioElementBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // Generate Animation Prompt
    if (generateAnimBtn) {
        generateAnimBtn.addEventListener('click', () => {
            let prompt = '';

            // CAMERA
            const camera = document.getElementById('anim-camera')?.value || '';
            prompt += camera + ' ';

            // ELEMENTS
            const elementRows = document.querySelectorAll('.anim-element-row');
            const elements = [];
            elementRows.forEach(row => {
                const elementInput = row.querySelector('.anim-element-input')?.value.trim();
                const verbSelect = row.querySelector('.anim-verb-select')?.value;
                if (elementInput && verbSelect) {
                    elements.push(`${elementInput} ${verbSelect}`);
                } else if (elementInput) {
                    elements.push(elementInput);
                }
            });
            if (elements.length > 0) {
                prompt += elements.join('. ') + '. ';
            }

            // LIGHTING
            const lighting = document.getElementById('anim-lighting')?.value;
            if (lighting) {
                prompt += lighting + ' ';
            }

            // AUDIO
            const audioGenre = document.getElementById('anim-audio-genre')?.value;
            const selectedAudioElements = [];
            audioElementBtns.forEach(btn => {
                if (btn.classList.contains('active')) {
                    selectedAudioElements.push(btn.dataset.val);
                }
            });
            const customAudio = document.getElementById('anim-audio-custom')?.value.trim();

            if (audioGenre || selectedAudioElements.length > 0 || customAudio) {
                prompt += '\n\nAUDIO: ';
                const audioComponents = [];
                if (audioGenre) audioComponents.push(audioGenre);
                if (selectedAudioElements.length > 0) audioComponents.push(...selectedAudioElements);
                if (customAudio) {
                    const customElements = customAudio.split(',').map(s => s.trim()).filter(s => s);
                    audioComponents.push(...customElements);
                }
                prompt += audioComponents.join(', ') + '.';
            }

            if (outputAnimText) outputAnimText.textContent = prompt.trim();
            if (outputAnimCard) outputAnimCard.style.display = 'block';
            if (copyAnimBtn) {
                copyAnimBtn.className = 'copy-btn default';
                copyAnimBtn.textContent = 'COPIAR';
            }
        });
    }

    // Copy Animation Prompt
    if (copyAnimBtn) {
        copyAnimBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(outputAnimText.textContent);
                copyAnimBtn.className = 'copy-btn copied';
                copyAnimBtn.textContent = 'COPIADO!';
                setTimeout(() => {
                    copyAnimBtn.className = 'copy-btn default';
                    copyAnimBtn.textContent = 'COPIAR';
                }, 2000);
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        });
    }

    // Expose loadAnimExample globally for onclick handlers
    window.loadAnimExample = loadAnimExample;
}
