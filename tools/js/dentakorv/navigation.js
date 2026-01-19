// DENTAKORV - Navigation and UI Toggles

// Setup custom toggle for select fields with custom option
export function setupCustomToggle(selectId, customId) {
    const select = document.getElementById(selectId);
    const custom = document.getElementById(customId);
    if (select && custom) {
        select.addEventListener('change', () => {
            custom.style.display = select.value === 'custom' ? 'block' : 'none';
        });
    }
}

// Setup toggle button with show/hide functionality
export function setupToggle(btnId, optionsId, defaultOn = false, onClass = 'on') {
    const btn = document.getElementById(btnId);
    const options = document.getElementById(optionsId);
    if (!btn || !options) return () => false;

    let enabled = defaultOn;

    if (defaultOn) {
        btn.textContent = 'ON';
        btn.className = 'toggle-btn ' + onClass;
        options.style.display = 'block';
    }

    btn.addEventListener('click', () => {
        enabled = !enabled;
        btn.textContent = enabled ? 'ON' : 'OFF';
        btn.className = 'toggle-btn ' + (enabled ? onClass : 'off');
        options.style.display = enabled ? 'block' : 'none';
    });

    return () => enabled;
}

export function initNavigation() {
    // Main navigation tabs
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Setup custom field toggles for generator
    setupCustomToggle('apertura', 'apertura-custom');
    setupCustomToggle('tipo-entidad', 'tipo-entidad-custom');
    setupCustomToggle('personaje', 'personaje-custom');
    setupCustomToggle('accion', 'accion-custom');
    setupCustomToggle('vestimenta', 'vestimenta-custom');
    setupCustomToggle('escenario', 'escenario-custom');
    setupCustomToggle('iluminacion', 'iluminacion-custom');

    // Setup toggle buttons for generator
    setupToggle('toggle-viscerales', 'viscerales-options', true, 'on');
    setupToggle('toggle-vestimenta', 'vestimenta-options', false, 'on-amber');
    setupToggle('toggle-objetos', 'objetos-options', false, 'on-amber');
    setupToggle('toggle-iluminacion', 'iluminacion-options', false, 'on-green');
    setupToggle('toggle-contraste', 'contraste-desc', false, 'on-blue');
    setupToggle('toggle-texturas', 'texturas-options', false, 'on-amber');
    setupToggle('toggle-paleta', 'paleta-options', false, 'on-pink');
    setupToggle('toggle-render', 'render-options', false, 'on-cyan');
    setupToggle('toggle-ritual', 'ritual-options', false, 'on');
    setupToggle('toggle-constraints', 'constraints-options', false, 'on-blue');

    // Aspect Ratio special toggle
    const toggleRatio = document.getElementById('toggle-ratio');
    const ratioOptions = document.getElementById('ratio-options');
    const ratioBtns = document.querySelectorAll('.ratio-btn[data-ratio]');
    let selectedRatio = '';

    if (toggleRatio && ratioOptions) {
        let ratioEnabled = false;

        toggleRatio.addEventListener('click', () => {
            ratioEnabled = !ratioEnabled;
            toggleRatio.textContent = ratioEnabled ? 'ON' : 'OFF';
            toggleRatio.className = 'toggle-btn ' + (ratioEnabled ? 'on' : 'off');
            ratioOptions.style.display = ratioEnabled ? 'block' : 'none';
            if (!ratioEnabled) {
                selectedRatio = '';
                ratioBtns.forEach(b => b.classList.remove('active'));
            }
        });

        ratioBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                ratioBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedRatio = btn.dataset.ratio;
            });
        });

        // Expose getter
        window.getSelectedRatio = () => ({ enabled: ratioEnabled, ratio: selectedRatio });
    }

    // Constraints multi-select
    const constraintBtns = document.querySelectorAll('#constraints-options .multi-btn');
    constraintBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // Graffiti uppercase
    const graffitiInput = document.getElementById('graffiti');
    if (graffitiInput) {
        graffitiInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}
