import os
from datetime import datetime
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

# Crear el cliente con la API key desde variable de entorno
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY")
)

# Prompt de generación de imagen
contents = (
    'Una biblioteca infinita y caótica, con libros que se transforman en seres vivos y se devoran entre sí. Las estanterías se retuercen como serpientes, y en el centro, una figura humana es asaltada por un enjambre de ideas luminosas y agresivas. Estilo de arte digital, oscuro, surrealista, con la paleta de colores de una contusión.'
)

# Generar la imagen con la configuración adecuada
response = client.models.generate_content(
    model="gemini-2.0-flash-preview-image-generation",
    contents=contents,
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE']
    )
)

# Procesar la respuesta
if response.candidates:
    for part in response.candidates[0].content.parts:
        if part.text is not None:
            print(part.text)
        elif part.inline_data is not None:
            # Convertir los datos de la imagen (bytes) a una imagen y guardar
            image = Image.open(BytesIO(part.inline_data.data))
            # Generar un nombre de archivo único con fecha y hora
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"realidad-fractal_{timestamp}.png"
            # Directorio de destino
            output_dir = os.path.dirname(os.path.abspath(__file__))
            filepath = os.path.join(output_dir, filename)
            image.save(filepath)
            image.show()
            print(f"[OK] Imagen guardada como '{filename}'")
else:
    print("Error: No se generaron candidatos en la respuesta")
    print("Respuesta completa:", response)