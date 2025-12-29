# Configuración de Make.com para Publicación Automática

## Archivo JSON Generado

El sistema genera automáticamente `social-content.json` en:
```
https://mbainative.com/data/social-content.json
```

### Estructura del JSON:
```json
{
  "generatedAt": "2025-12-29T17:30:00Z",
  "scheduleSlot": "evening",
  "post": {
    "type": "doctrine",
    "title": "📜 Doctrina #1: El talento artificial se compra",
    "content": "Texto corto para Twitter (max 280 chars)",
    "contentLong": "Texto largo para Facebook/LinkedIn",
    "hashtags": ["IA", "InteligenciaArtificial", "MBAINative"],
    "url": "https://mbainative.com/...",
    "imageUrl": "URL de imagen si hay"
  }
}
```

## Configuración en Make.com

### 1. Crear Escenario
1. Ve a Make.com → Create new scenario

### 2. Añadir Trigger: Schedule
- **Module**: Schedule
- **Interval**: Every day at 06:05, 12:05, 18:05 (5 min después de que GitHub genere)

### 3. Añadir HTTP Request
- **Module**: HTTP > Make a request
- **URL**: `https://mbainative.com/data/social-content.json`
- **Method**: GET

### 4. Añadir Módulos de Redes Sociales

#### Twitter/X
- **Module**: Twitter > Create a Tweet
- **Text**: `{{3.post.content}} {{join(3.post.hashtags, " #")}}`

#### Facebook
- **Module**: Facebook Pages > Create a Post
- **Message**: `{{3.post.contentLong}}\n\n{{join(3.post.hashtags, " #")}}`
- **Link**: `{{3.post.url}}`

#### LinkedIn
- **Module**: LinkedIn > Create a Share
- **Text**: `{{3.post.contentLong}}`

#### Instagram
- **Module**: Instagram Business > Create Photo Post
- **Image URL**: `{{3.post.imageUrl}}` (o imagen por defecto)
- **Caption**: `{{3.post.contentLong}}\n\n{{join(3.post.hashtags, " #")}}`

### 5. Activar el Escenario
- Guardar y activar

## Horarios
| Madrid | UTC | Slot |
|--------|-----|------|
| 06:00 | 05:00 | morning |
| 12:00 | 11:00 | noon |
| 18:00 | 17:00 | evening |

## Operaciones Mensuales
- 3 publicaciones/día × 30 días = 90 operaciones
- × 4 redes = 360 operaciones
- Con margen para errores: ~400-500 operaciones/mes
- Gratis en Make.com (límite 1000/mes)
