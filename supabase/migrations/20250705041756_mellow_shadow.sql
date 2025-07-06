/*
  # Limpiar base de datos e implementar sistema de parentesco

  1. Limpieza de datos
    - Eliminar todos los registros excepto el usuario administrador
    - Mantener la estructura de las tablas intacta
    
  2. Sistema de parentesco
    - Crear enum tipo_parentesco si no existe
    - Agregar columna parentesco a nino_acudiente
    - Crear índices para optimización
    
  3. Datos de prueba básicos
    - Mantener solo el usuario administrador
    - Preparar estructura para nuevos datos
*/

-- 1. LIMPIEZA DE DATOS (respetando foreign keys)
-- Eliminar registros de asistencia primero
DELETE FROM registros_asistencia;

-- Eliminar relaciones niño-acudiente
DELETE FROM nino_acudiente;

-- Eliminar niños
DELETE FROM ninos;

-- Eliminar acudientes
DELETE FROM acudientes;

-- Eliminar aulas (esto también limpiará las referencias de profesor_asignado_id)
DELETE FROM aulas;

-- Eliminar usuarios excepto el administrador
DELETE FROM users WHERE numero_documento != '12345678';

-- Verificar que el administrador existe, si no, crearlo
INSERT INTO users (
  nombres,
  apellidos,
  rol,
  tipo_documento,
  numero_documento,
  password,
  telefono
) VALUES (
  'Administrador',
  'Sistema',
  'admin',
  'CC',
  '12345678',
  '123456',
  '3001234567'
) ON CONFLICT (numero_documento) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  rol = EXCLUDED.rol,
  password = EXCLUDED.password,
  telefono = EXCLUDED.telefono;

-- 2. IMPLEMENTAR SISTEMA DE PARENTESCO

-- Crear tipo enum para parentesco si no existe
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
    RAISE NOTICE 'Tipo enum tipo_parentesco creado';
  ELSE
    RAISE NOTICE 'Tipo enum tipo_parentesco ya existe';
  END IF;
END $$;

-- Agregar columna parentesco a nino_acudiente si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'nino_acudiente' AND column_name = 'parentesco'
  ) THEN
    ALTER TABLE nino_acudiente 
    ADD COLUMN parentesco tipo_parentesco DEFAULT 'Madre';
    RAISE NOTICE 'Columna parentesco agregada a nino_acudiente';
  ELSE
    RAISE NOTICE 'Columna parentesco ya existe en nino_acudiente';
  END IF;
END $$;

-- Crear índice para parentesco si no existe
CREATE INDEX IF NOT EXISTS idx_nino_acudiente_parentesco 
ON nino_acudiente(parentesco);

-- 3. VERIFICACIÓN Y REPORTE
DO $$
DECLARE
    admin_count INTEGER;
    total_users INTEGER;
    total_ninos INTEGER;
    total_acudientes INTEGER;
    total_aulas INTEGER;
    total_registros INTEGER;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO admin_count FROM users WHERE rol = 'admin';
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_ninos FROM ninos;
    SELECT COUNT(*) INTO total_acudientes FROM acudientes;
    SELECT COUNT(*) INTO total_aulas FROM aulas;
    SELECT COUNT(*) INTO total_registros FROM registros_asistencia;
    
    -- Reportar estado
    RAISE NOTICE '=== REPORTE DE LIMPIEZA ===';
    RAISE NOTICE 'Usuarios administradores: %', admin_count;
    RAISE NOTICE 'Total usuarios: %', total_users;
    RAISE NOTICE 'Total niños: %', total_ninos;
    RAISE NOTICE 'Total acudientes: %', total_acudientes;
    RAISE NOTICE 'Total aulas: %', total_aulas;
    RAISE NOTICE 'Total registros de asistencia: %', total_registros;
    RAISE NOTICE '=== FIN REPORTE ===';
    
    -- Verificar que solo queda el administrador
    IF admin_count = 1 AND total_users = 1 THEN
        RAISE NOTICE 'ÉXITO: Base de datos limpiada correctamente. Solo queda el usuario administrador.';
    ELSE
        RAISE WARNING 'ADVERTENCIA: Estado inesperado después de la limpieza.';
    END IF;
END $$;