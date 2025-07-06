/*
  # Limpiar base de datos y crear usuario administrador

  1. Limpieza completa
    - Eliminar todos los registros de asistencia
    - Eliminar todas las relaciones niño-acudiente
    - Eliminar todos los niños
    - Eliminar todos los acudientes
    - Eliminar todas las aulas
    - Eliminar todos los usuarios

  2. Crear usuario administrador
    - Usuario admin con credenciales conocidas para pruebas
    - Documento: 12345678
    - Contraseña: 123456
*/

-- Eliminar todos los datos en orden correcto (respetando foreign keys)

-- 1. Eliminar registros de asistencia (depende de ninos, acudientes, users)
DELETE FROM registros_asistencia;

-- 2. Eliminar relaciones niño-acudiente (depende de ninos y acudientes)
DELETE FROM nino_acudiente;

-- 3. Eliminar niños (depende de aulas)
DELETE FROM ninos;

-- 4. Eliminar acudientes (independiente)
DELETE FROM acudientes;

-- 5. Eliminar aulas (depende de users para profesor_asignado_id)
DELETE FROM aulas;

-- 6. Eliminar usuarios (independiente)
DELETE FROM users;

-- Crear usuario administrador para pruebas
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
);