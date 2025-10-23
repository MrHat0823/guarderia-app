# 🎨 Generar Iconos PWA desde icono-app.png

Ya tienes `icono-app.png` guardado. Ahora necesitas crear 4 versiones:

---

## ⚡ OPCIÓN RÁPIDA: Herramienta Online

### **Paso 1: Ir a Simple Image Resizer**
https://www.simpleimageresizer.com/

### **Paso 2: Subir tu imagen**
- Click en "Upload Image"
- Selecciona `public/icono-app.png`

### **Paso 3: Crear versiones**

#### **Versión 1: icon-192.png**
1. Width: `192`
2. Height: `192`
3. Click "Resize"
4. Download y guarda como `icon-192.png` en `/public/`

#### **Versión 2: icon-512.png**
1. Width: `512`
2. Height: `512`
3. Click "Resize"
4. Download y guarda como `icon-512.png` en `/public/`

#### **Versión 3 y 4: Maskable (con padding)**
1. Ve a https://maskable.app/
2. Sube `icon-512.png`
3. Ajusta el slider hasta que veas padding seguro
4. Export → Download PNG
5. Guarda como `icon-maskable-512.png`
6. Repite con 192x192 → `icon-maskable-192.png`

---

## 💻 OPCIÓN 2: Desde tu computadora

### **Windows (Paint):**
1. Abre `icono-app.png` con Paint
2. Redimensionar → 192 x 192 píxeles → Guardar como `icon-192.png`
3. Repetir con 512 x 512 → `icon-512.png`

### **Mac (Preview):**
1. Abre `icono-app.png` con Preview
2. Tools → Adjust Size → 192 x 192 → Export `icon-192.png`
3. Repetir con 512 x 512 → `icon-512.png`

### **Photoshop/GIMP:**
1. Image → Image Size → 192x192 → Export `icon-192.png`
2. Repetir con 512x512 → `icon-512.png`

---

## ✅ RESULTADO FINAL:

Deberías tener en `/public/`:

```
public/
├── icono-app.png (original)
├── icon-192.png (192x192)
├── icon-512.png (512x512)
├── icon-maskable-192.png (192x192 con padding)
└── icon-maskable-512.png (512x512 con padding)
```

---

## 🧪 VERIFICAR:

Después de crear los iconos:

```bash
npm run dev
```

1. Abre DevTools (F12)
2. Application → Manifest
3. Verifica que se vean los iconos
4. Lighthouse → PWA Audit

---

## ⚠️ TEMPORAL: Si no tienes tiempo ahora

Por ahora el manifest apunta a `icono-app.png` temporalmente.
La PWA funcionará, pero el icono puede verse estirado.

Cuando tengas las 4 versiones, el sistema las usará automáticamente.

