/*
  # Agregar datos de ejemplo de asistencia

  1. Datos de ejemplo
    - Registros de asistencia para la fecha actual
    - Incluye entradas y salidas de varios niños
    - Datos realistas para demostrar el funcionamiento del sistema

  2. Registros incluidos
    - 3 entradas de niños diferentes
    - 1 salida para mostrar el flujo completo
    - Diferentes horarios y acudientes
*/

-- Insertar registros de asistencia para hoy
INSERT INTO registros_asistencia (
  fecha,
  hora,
  tipo,
  nino_id,
  acudiente_id,
  usuario_registra_id,
  anotacion
) VALUES
-- Entrada de Lucía Silva Ruiz a las 8:00 AM
(
  CURRENT_DATE,
  '08:00:00',
  'entrada',
  (SELECT id FROM ninos WHERE nombres = 'Lucía' AND apellidos = 'Silva Ruiz' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'María' AND apellidos = 'Ruiz López' LIMIT 1),
  (SELECT id FROM users WHERE rol = 'portero' LIMIT 1),
  'Llegada puntual, muy contenta'
),
-- Entrada de Carlos Mendoza García a las 8:15 AM
(
  CURRENT_DATE,
  '08:15:00',
  'entrada',
  (SELECT id FROM ninos WHERE nombres = 'Carlos' AND apellidos = 'Mendoza García' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Ana' AND apellidos = 'García Torres' LIMIT 1),
  (SELECT id FROM users WHERE rol = 'portero' LIMIT 1),
  'Traía su lonchera favorita'
),
-- Entrada de Sofía Ramírez Díaz a las 8:30 AM
(
  CURRENT_DATE,
  '08:30:00',
  'entrada',
  (SELECT id FROM ninos WHERE nombres = 'Sofía' AND apellidos = 'Ramírez Díaz' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Luis' AND apellidos = 'Ramírez Silva' LIMIT 1),
  (SELECT id FROM users WHERE rol = 'profesor' LIMIT 1),
  'Llegó con su papá, muy animada'
),
-- Salida de Carlos Mendoza García a las 12:00 PM (almuerzo temprano)
(
  CURRENT_DATE,
  '12:00:00',
  'salida',
  (SELECT id FROM ninos WHERE nombres = 'Carlos' AND apellidos = 'Mendoza García' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Ana' AND apellidos = 'García Torres' LIMIT 1),
  (SELECT id FROM users WHERE rol = 'profesor' LIMIT 1),
  'Cita médica programada'
);