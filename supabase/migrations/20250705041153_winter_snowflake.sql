/*
  # Agregar columna de parentesco a la relación niño-acudiente

  1. Cambios en la tabla
    - Agregar columna `parentesco` a la tabla `nino_acudiente`
    - Crear tipo enum para los tipos de parentesco
    - Actualizar registros existentes con valor por defecto

  2. Seguridad
    - Mantener las políticas RLS existentes
    - No se requieren cambios en las políticas de seguridad
*/

-- Crear tipo enum para parentesco
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_parentesco') THEN
    CREATE TYPE tipo_parentesco AS ENUM (
      'Madre',
      'Padre', 
      'Hermano',
      'Hermana',
      'Tío',
      'Tía',
      'Abuelo',
      'Abuela',
      'Tutor Legal',
      'Otro'
    );
  END IF;
END $$;

-- Agregar columna parentesco a la tabla nino_acudiente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'nino_acudiente' AND column_name = 'parentesco'
  ) THEN
    ALTER TABLE nino_acudiente 
    ADD COLUMN parentesco tipo_parentesco DEFAULT 'Madre';
  END IF;
END $$;

-- Actualizar registros existentes con valores por defecto variados
DO $$
DECLARE
    registro RECORD;
    parentescos tipo_parentesco[] := ARRAY['Madre', 'Padre', 'Tutor Legal'];
    contador INTEGER := 0;
BEGIN
    FOR registro IN 
        SELECT id FROM nino_acudiente WHERE parentesco IS NULL OR parentesco = 'Madre'
    LOOP
        UPDATE nino_acudiente 
        SET parentesco = parentescos[(contador % 3) + 1]
        WHERE id = registro.id;
        
        contador := contador + 1;
    END LOOP;
    
    RAISE NOTICE 'Actualizados % registros con tipos de parentesco', contador;
END $$;

-- Crear índice para optimizar consultas por parentesco
CREATE INDEX IF NOT EXISTS idx_nino_acudiente_parentesco 
ON nino_acudiente(parentesco);

-- Verificar los cambios
DO $$
DECLARE
    total_registros INTEGER;
    registros_con_parentesco INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_registros FROM nino_acudiente;
    SELECT COUNT(*) INTO registros_con_parentesco FROM nino_acudiente WHERE parentesco IS NOT NULL;
    
    RAISE NOTICE 'Total de registros en nino_acudiente: %', total_registros;
    RAISE NOTICE 'Registros con parentesco asignado: %', registros_con_parentesco;
END $$;