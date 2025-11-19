# 🎨 Generar Iconos PWA - Guía Rápida

Ya tienes tu icono `icono-app.png` guardado en `/public/`. ✅

Ahora elige una opción para crear las 4 versiones necesarias:

---

## 🚀 OPCIÓN 1: Script Automático (Python) ⭐ MÁS RÁPIDO

Si tienes Python instalado:

### **Paso 1: Instalar Pillow (una sola vez)**
```bash
pip install Pillow
```

### **Paso 2: Ejecutar script**
```bash
python generar_iconos.py
```

✅ **Listo!** Se crearán automáticamente las 4 versiones.

---

## 🌐 OPCIÓN 2: Herramienta Online

### **Para icon-192.png y icon-512.png:**

1. Ve a: https://www.simpleimageresizer.com/
2. Sube `public/icono-app.png`
3. Redimensiona a **192x192** → Download como `icon-192.png`
4. Redimensiona a **512x512** → Download como `icon-512.png`
5. Guarda ambos en `/public/`

### **Para icon-maskable (con padding):**

1. Ve a: https://maskable.app/
2. Sube `icon-512.png`
3. Ajusta el slider hasta ver padding seguro (zona verde)
4. Export → Download como `icon-maskable-512.png`
5. Repite con `icon-192.png` → `icon-maskable-192.png`

---

## 💻 OPCIÓN 3: Manualmente (Windows/Mac)

### **Windows (Paint):**
```
1. Abre icono-app.png con Paint
2. Inicio → Cambiar tamaño → Píxeles → 192 x 192
3. Guardar como icon-192.png
4. Repetir con 512 x 512 → icon-512.png
```

### **Mac (Preview):**
```
1. Abre icono-app.png con Preview
2. Tools → Adjust Size
3. Width: 192, Height: 192
4. Export como icon-192.png
5. Repetir con 512 x 512 → icon-512.png
```

---

## ✅ RESULTADO FINAL

Deberías tener estos archivos en `/public/`:

```
public/
├── icono-app.png            ← Tu icono original
├── icon-192.png             ← Versión 192x192
├── icon-512.png             ← Versión 512x512
├── icon-maskable-192.png    ← 192x192 con padding
└── icon-maskable-512.png    ← 512x512 con padding
```

---

## 🧪 PROBAR

Después de crear los iconos:

```bash
npm run dev
```

1. Abre el navegador en `http://localhost:5173`
2. Presiona **F12** (DevTools)
3. Ve a **Application** → **Manifest**
4. Deberías ver tus 4 iconos cargados ✅

---

## ⚠️ ESTADO ACTUAL

Por ahora, el `manifest.json` apunta temporalmente a `icono-app.png` para todos los tamaños.

**La PWA funciona, pero:**
- ✅ El icono se ve
- ⚠️ Puede verse estirado en algunos dispositivos
- ⚠️ No hay versión optimizada para Android (maskable)

**Cuando crees las 4 versiones:**
1. Actualiza el `manifest.json` para que apunte a los iconos correctos
2. Todo se verá perfecto en todos los dispositivos

---

## 🔄 Actualizar manifest.json (después de crear iconos)

Cambia en `/public/manifest.json`:

```json
"icons": [
  {
    "src": "/icon-192.png",           ← Cambiar aquí
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-512.png",           ← Cambiar aquí
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-maskable-192.png",  ← Cambiar aquí
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "maskable"
  },
  {
    "src": "/icon-maskable-512.png",  ← Cambiar aquí
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
]
```

---

## 💡 Tips

- **Maskable:** El padding evita que el logo se corte en Android
- **PNG con transparencia:** Mejor que JPG
- **Tamaño original:** Usa al menos 512x512 para mejor calidad

---

¿Dudas? Ejecuta `python generar_iconos.py` y listo! 🚀








