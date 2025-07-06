/*
  # Insertar datos de ejemplo

  1. Datos iniciales
    - Aulas de ejemplo con diferentes niveles educativos
    - Niños de ejemplo distribuidos en las aulas
    - Acudientes de ejemplo
    - Relaciones niño-acudiente
    - Algunos registros de asistencia de ejemplo

  2. Notas importantes
    - Los datos son solo para demostración
    - Las contraseñas de usuarios deben cambiarse en producción
    - Los documentos son ficticios
*/

-- Insertar aulas de ejemplo
INSERT INTO aulas (nombre_aula, nivel_educativo, numero_aula, capacidad) VALUES
  ('Aula Girasoles', 'Maternal', '101', 15),
  ('Aula Mariposas', 'Prejardín', '102', 20),
  ('Aula Arcoíris', 'Jardín', '103', 25),
  ('Aula Estrellas', 'Transición', '104', 25),
  ('Aula Patitos', 'Maternal', '105', 15),
  ('Aula Conejitos', 'Prejardín', '106', 20)
ON CONFLICT DO NOTHING;

-- Insertar acudientes de ejemplo
INSERT INTO acudientes (nombres, apellidos, tipo_documento, numero_documento, telefono1, email, direccion) VALUES
  ('María Elena', 'García López', 'CC', '12345678', '3001234567', 'maria.garcia@email.com', 'Calle 123 #45-67'),
  ('Carlos Andrés', 'Rodríguez Silva', 'CC', '23456789', '3012345678', 'carlos.rodriguez@email.com', 'Carrera 89 #12-34'),
  ('Ana Sofía', 'Martínez Pérez', 'CC', '34567890', '3023456789', 'ana.martinez@email.com', 'Avenida 56 #78-90'),
  ('Luis Fernando', 'González Ruiz', 'CC', '45678901', '3034567890', 'luis.gonzalez@email.com', 'Calle 78 #90-12'),
  ('Patricia', 'Hernández Castro', 'CC', '56789012', '3045678901', 'patricia.hernandez@email.com', 'Carrera 34 #56-78'),
  ('Roberto', 'Jiménez Morales', 'CC', '67890123', '3056789012', 'roberto.jimenez@email.com', 'Calle 90 #12-34'),
  ('Carmen Rosa', 'López Vargas', 'CC', '78901234', '3067890123', 'carmen.lopez@email.com', 'Avenida 12 #34-56'),
  ('Diego Alejandro', 'Ramírez Torres', 'CC', '89012345', '3078901234', 'diego.ramirez@email.com', 'Carrera 56 #78-90')
ON CONFLICT DO NOTHING;

-- Insertar niños de ejemplo
INSERT INTO ninos (nombres, apellidos, tipo_documento, numero_documento, aula_id, activo) VALUES
  ('Sofía', 'García Rodríguez', 'TI', '1001234567', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Girasoles' LIMIT 1), true),
  ('Mateo', 'Martínez González', 'TI', '1002345678', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Mariposas' LIMIT 1), true),
  ('Isabella', 'Hernández López', 'TI', '1003456789', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Arcoíris' LIMIT 1), true),
  ('Santiago', 'Jiménez Ramírez', 'TI', '1004567890', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Estrellas' LIMIT 1), true),
  ('Valentina', 'López Torres', 'TI', '1005678901', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Patitos' LIMIT 1), true),
  ('Sebastián', 'Rodríguez Vargas', 'TI', '1006789012', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Conejitos' LIMIT 1), true),
  ('Camila', 'González Castro', 'TI', '1007890123', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Girasoles' LIMIT 1), true),
  ('Nicolás', 'Pérez Morales', 'TI', '1008901234', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Mariposas' LIMIT 1), true),
  ('Lucía', 'Silva Ruiz', 'TI', '1009012345', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Arcoíris' LIMIT 1), true),
  ('Emiliano', 'Castro López', 'TI', '1010123456', (SELECT id FROM aulas WHERE nombre_aula = 'Aula Estrellas' LIMIT 1), true)
ON CONFLICT DO NOTHING;

-- Insertar relaciones niño-acudiente
INSERT INTO nino_acudiente (nino_id, acudiente_id) VALUES
  -- Sofía García con María Elena García
  ((SELECT id FROM ninos WHERE numero_documento = '1001234567'), (SELECT id FROM acudientes WHERE numero_documento = '12345678')),
  -- Mateo Martínez con Ana Sofía Martínez
  ((SELECT id FROM ninos WHERE numero_documento = '1002345678'), (SELECT id FROM acudientes WHERE numero_documento = '34567890')),
  -- Isabella Hernández con Patricia Hernández
  ((SELECT id FROM ninos WHERE numero_documento = '1003456789'), (SELECT id FROM acudientes WHERE numero_documento = '56789012')),
  -- Santiago Jiménez con Roberto Jiménez
  ((SELECT id FROM ninos WHERE numero_documento = '1004567890'), (SELECT id FROM acudientes WHERE numero_documento = '67890123')),
  -- Valentina López con Carmen Rosa López
  ((SELECT id FROM ninos WHERE numero_documento = '1005678901'), (SELECT id FROM acudientes WHERE numero_documento = '78901234')),
  -- Sebastián Rodríguez con Carlos Andrés Rodríguez
  ((SELECT id FROM ninos WHERE numero_documento = '1006789012'), (SELECT id FROM acudientes WHERE numero_documento = '23456789')),
  -- Camila González con Luis Fernando González
  ((SELECT id FROM ninos WHERE numero_documento = '1007890123'), (SELECT id FROM acudientes WHERE numero_documento = '45678901')),
  -- Nicolás Pérez con Ana Sofía Martínez (segundo hijo)
  ((SELECT id FROM ninos WHERE numero_documento = '1008901234'), (SELECT id FROM acudientes WHERE numero_documento = '34567890')),
  -- Lucía Silva con Diego Alejandro Ramírez
  ((SELECT id FROM ninos WHERE numero_documento = '1009012345'), (SELECT id FROM acudientes WHERE numero_documento = '89012345')),
  -- Emiliano Castro con Patricia Hernández (segundo hijo)
  ((SELECT id FROM ninos WHERE numero_documento = '1010123456'), (SELECT id FROM acudientes WHERE numero_documento = '56789012'))
ON CONFLICT DO NOTHING;