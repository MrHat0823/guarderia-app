#!/usr/bin/env python3
"""
Script para generar iconos PWA desde icono-app.png

Requiere: pip install Pillow

Uso:
    python generar_iconos.py
"""

from PIL import Image
import os

def generar_iconos():
    # Ruta de entrada
    input_path = 'public/icono-app.png'
    
    if not os.path.exists(input_path):
        print("❌ Error: No se encontró public/icono-app.png")
        print("   Por favor, guarda tu icono con ese nombre en la carpeta public/")
        return
    
    print(f"✅ Encontrado: {input_path}")
    
    # Abrir imagen original
    try:
        img = Image.open(input_path)
        print(f"📐 Tamaño original: {img.size}")
    except Exception as e:
        print(f"❌ Error al abrir la imagen: {e}")
        return
    
    # Convertir a RGBA si no lo es
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Iconos a generar
    iconos = [
        ('public/icon-192.png', 192),
        ('public/icon-512.png', 512),
    ]
    
    # Generar iconos normales
    print("\n🎨 Generando iconos normales...")
    for output_path, size in iconos:
        try:
            img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
            img_resized.save(output_path, 'PNG')
            print(f"  ✅ Creado: {output_path} ({size}x{size})")
        except Exception as e:
            print(f"  ❌ Error al crear {output_path}: {e}")
    
    # Generar iconos maskable (con padding del 20%)
    print("\n🎭 Generando iconos maskable (con padding)...")
    iconos_maskable = [
        ('public/icon-maskable-192.png', 192),
        ('public/icon-maskable-512.png', 512),
    ]
    
    for output_path, size in iconos_maskable:
        try:
            # Calcular tamaño del logo (80% del total)
            logo_size = int(size * 0.8)
            padding = (size - logo_size) // 2
            
            # Crear canvas con fondo transparente o blanco
            canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255))
            
            # Redimensionar logo
            logo = img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            
            # Pegar logo centrado con padding
            canvas.paste(logo, (padding, padding), logo)
            
            # Guardar
            canvas.save(output_path, 'PNG')
            print(f"  ✅ Creado: {output_path} ({size}x{size} con padding)")
        except Exception as e:
            print(f"  ❌ Error al crear {output_path}: {e}")
    
    print("\n🎉 ¡Listo! Iconos generados exitosamente.")
    print("\n📋 Archivos creados:")
    print("   - public/icon-192.png")
    print("   - public/icon-512.png")
    print("   - public/icon-maskable-192.png")
    print("   - public/icon-maskable-512.png")
    print("\n🚀 Ahora ejecuta: npm run dev")

if __name__ == '__main__':
    try:
        generar_iconos()
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelado por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        print("\n💡 Si no tienes Pillow instalado, ejecuta:")
        print("   pip install Pillow")









