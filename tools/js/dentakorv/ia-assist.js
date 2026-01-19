// DENTAKORV - IA Assist (Groq API Integration)

const API_URL = '/api/groq';

let currentImageBase64 = null;

// Compress image if exceeds limit
async function compressImage(file, maxSizeKB = 1800) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Si es muy grande, reducir dimensiones primero
                const maxDim = 2048;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Intentar diferentes calidades hasta que quepa
                let quality = 0.9;
                let result = canvas.toDataURL('image/jpeg', quality);

                while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(result);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function handleImageFile(file, elements) {
    const { iaDropzoneText, iaPreview, iaAnalyzeBtn } = elements;

    iaDropzoneText.textContent = 'Procesando imagen...';

    let imageData;

    // Si excede 1.5MB, comprimir
    if (file.size > 1.5 * 1024 * 1024) {
        iaDropzoneText.textContent = 'Comprimiendo imagen...';
        imageData = await compressImage(file);
    } else {
        // Leer directamente
        imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    currentImageBase64 = imageData;
    iaPreview.src = currentImageBase64;
    iaPreview.style.display = 'block';
    iaDropzoneText.style.display = 'none';
    iaAnalyzeBtn.disabled = false;
}

// Fetch response from API (sin streaming)
async function fetchFromAPI(mode, prompt, imageBase64 = null, elements) {
    const { iaOutput, iaCopyBtn, iaModelText, iaModelVision, iaTemperature } = elements;

    iaOutput.textContent = 'Generando...';
    iaCopyBtn.style.display = 'none';

    // Obtener configuracion
    const selectedModel = mode === 'analyze' ? iaModelVision.value : iaModelText.value;
    const temperature = parseFloat(iaTemperature.value);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode,
                prompt,
                imageBase64,
                selectedModel,
                temperature
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Error en la API');
        }

        // Mostrar contenido completo
        iaOutput.textContent = data.content || '';

        // Show copy button when done
        if (iaOutput.textContent.trim()) {
            iaCopyBtn.style.display = 'inline-block';
        }

    } catch (error) {
        iaOutput.textContent = `ERROR: ${error.message}\n\nAsegurate de que la API esta configurada correctamente en Vercel.`;
    }
}

export function initIAAssist() {
    const iaPromptInput = document.getElementById('ia-prompt-input');
    const iaGenerateBtn = document.getElementById('ia-generate-btn');
    const iaGenerateText = document.getElementById('ia-generate-text');
    const iaGenerateLoading = document.getElementById('ia-generate-loading');
    const iaAnalyzeBtn = document.getElementById('ia-analyze-btn');
    const iaAnalyzeText = document.getElementById('ia-analyze-text');
    const iaAnalyzeLoading = document.getElementById('ia-analyze-loading');
    const iaOutput = document.getElementById('ia-output');
    const iaCopyBtn = document.getElementById('ia-copy-btn');
    const iaDropzone = document.getElementById('ia-dropzone');
    const iaDropzoneText = document.getElementById('ia-dropzone-text');
    const iaPreview = document.getElementById('ia-preview');
    const iaFileInput = document.getElementById('ia-file-input');
    const iaModelText = document.getElementById('ia-model-text');
    const iaModelVision = document.getElementById('ia-model-vision');
    const iaTemperature = document.getElementById('ia-temperature');
    const iaTempValue = document.getElementById('ia-temp-value');

    if (!iaGenerateBtn || !iaOutput) return;

    const elements = {
        iaOutput,
        iaCopyBtn,
        iaModelText,
        iaModelVision,
        iaTemperature,
        iaDropzoneText,
        iaPreview,
        iaAnalyzeBtn
    };

    // Actualizar display de temperatura
    if (iaTemperature && iaTempValue) {
        iaTemperature.addEventListener('input', () => {
            iaTempValue.textContent = iaTemperature.value;
        });
    }

    // Dropzone functionality
    if (iaDropzone && iaFileInput) {
        iaDropzone.addEventListener('click', () => iaFileInput.click());

        iaDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            iaDropzone.style.borderColor = '#06b6d4';
            iaDropzone.style.background = 'rgba(6, 182, 212, 0.1)';
        });

        iaDropzone.addEventListener('dragleave', () => {
            iaDropzone.style.borderColor = 'rgba(6, 182, 212, 0.5)';
            iaDropzone.style.background = 'rgba(6, 182, 212, 0.05)';
        });

        iaDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            iaDropzone.style.borderColor = 'rgba(6, 182, 212, 0.5)';
            iaDropzone.style.background = 'rgba(6, 182, 212, 0.05)';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImageFile(file, elements);
            }
        });

        iaFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImageFile(file, elements);
        });
    }

    // Generate prompt button
    iaGenerateBtn.addEventListener('click', async () => {
        const prompt = iaPromptInput?.value.trim();
        if (!prompt) {
            alert('Escribe una descripcion de lo que quieres ver.');
            return;
        }

        if (iaGenerateText) iaGenerateText.style.display = 'none';
        if (iaGenerateLoading) iaGenerateLoading.style.display = 'inline';
        iaGenerateBtn.disabled = true;

        await fetchFromAPI('generate', prompt, null, elements);

        if (iaGenerateText) iaGenerateText.style.display = 'inline';
        if (iaGenerateLoading) iaGenerateLoading.style.display = 'none';
        iaGenerateBtn.disabled = false;
    });

    // Analyze image button
    if (iaAnalyzeBtn) {
        iaAnalyzeBtn.addEventListener('click', async () => {
            if (!currentImageBase64) {
                alert('Primero sube una imagen.');
                return;
            }

            if (iaAnalyzeText) iaAnalyzeText.style.display = 'none';
            if (iaAnalyzeLoading) iaAnalyzeLoading.style.display = 'inline';
            iaAnalyzeBtn.disabled = true;

            await fetchFromAPI('analyze', 'Analiza esta imagen y genera un prompt de animacion DENTAKORV.', currentImageBase64, elements);

            if (iaAnalyzeText) iaAnalyzeText.style.display = 'inline';
            if (iaAnalyzeLoading) iaAnalyzeLoading.style.display = 'none';
            iaAnalyzeBtn.disabled = false;
        });
    }

    // Copy button
    if (iaCopyBtn) {
        iaCopyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(iaOutput.textContent);
                iaCopyBtn.className = 'copy-btn copied';
                iaCopyBtn.textContent = 'COPIADO!';
                setTimeout(() => {
                    iaCopyBtn.className = 'copy-btn default';
                    iaCopyBtn.textContent = 'COPIAR';
                }, 2000);
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        });
    }
}
