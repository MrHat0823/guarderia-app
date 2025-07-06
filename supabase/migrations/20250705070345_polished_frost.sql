/*
  # Agregar campos de contacto a configuración de guardería

  1. Cambios en la tabla
    - Agregar campo `telefono_guarderia` (text, opcional)
    - Agregar campo `direccion_guarderia` (text, opcional)

  2. Seguridad
    - Mantener las políticas RLS existentes
    - Solo administradores pueden modificar estos campos

  3. Notas
    - Los campos son opcionales para mantener compatibilidad
    - Se pueden agregar valores por defecto más adelante
*/

-- Agregar campos de contacto a la tabla de configuración
ALTER TABLE configuracion_guarderia 
ADD COLUMN IF NOT EXISTS telefono_guarderia text,
ADD COLUMN IF NOT EXISTS direccion_guarderia text;

-- Crear índice para búsquedas por teléfono si es necesario
CREATE INDEX IF NOT EXISTS idx_configuracion_telefono 
ON configuracion_guarderia(telefono_guarderia) 
WHERE telefono_guarderia IS NOT NULL;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN configuracion_guarderia.telefono_guarderia IS 'Teléfono principal de contacto de la guardería';
COMMENT ON COLUMN configuracion_guarderia.direccion_guarderia IS 'Dirección física donde se encuentra ubicada la guardería';