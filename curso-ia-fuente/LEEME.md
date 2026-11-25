# Curso «Aprende IA en sesiones de 20 minutos» — código fuente

Se publica en **https://mbainative.com/curso-ia** (panel de alumnos: `/curso-ia/admin.html`).

## Cambiar algo

1. Edita lo que toque:
   - `data.py`: textos de las 20 fichas (idea, pasos, «Para asentar»).
   - `extras.py`: preguntas de comprobación, ejemplos, repasos y alternativas.
   - `app.js` (lógica) y `app.template.html` (diseño) del curso; `admin.template.html` (panel de alumnos); `privacidad.html`.
2. Desde la raíz del repositorio: `python curso-ia-fuente/build.py` → regenera `app/public/curso-ia/`.
3. `git add -A && git commit -m "…" && git push origin master`. Hostinger publica solo.

## Firebase (plan gratuito Spark, sin forma de pago)

- Proyecto `curso-ia-20min-mbai`: acceso con Google y enlace por email (5 envíos al día), Firestore en Europa (`eur3`).
- Reglas: `firestore.rules`. Si cambian, pégalas en Firebase › Firestore › Reglas y publica.
- Administradores: `lbt00001@gmail.com` y, si se crea, el documento `config/admins` con un campo `emails` (lista).

## Cómo mide el tiempo

Por reloj: guarda la hora de la última anotación y suma la diferencia, esté la pestaña visible o no. Si el alumno vuelve tras más de 30 minutos fuera, pregunta cuántos minutos contar (máximo 3 horas). En Chrome y Edge de escritorio hay reloj flotante (Document Picture-in-Picture).
