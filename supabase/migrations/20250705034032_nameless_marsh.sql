/*
  # Crear datos de prueba para el sistema

  1. Nuevos registros
    - 20 niños con Registro Civil (RC)
    - 12 acudientes con Cédula de Ciudadanía (CC)
    - 4 aulas con diferentes niveles educativos
    - 2 profesores adicionales
    - 1 portero adicional

  2. Relaciones
    - 3 acudientes específicos tendrán 2 niños cada uno (6 niños en total)
    - Los otros 14 niños quedarán sin acudiente asignado por ahora
    - Asignar niños a las aulas creadas

  3. Seguridad
    - Mantener RLS habilitado
    - Usar datos realistas pero ficticios
*/

-- Crear 2 profesores adicionales
INSERT INTO users (
  nombres,
  apellidos,
  rol,
  tipo_documento,
  numero_documento,
  password,
  telefono
) VALUES 
(
  'María Elena',
  'González Pérez',
  'profesor',
  'CC',
  '23456789',
  '234567',
  '3012345678'
),
(
  'Carlos Alberto',
  'Rodríguez Martín',
  'profesor',
  'CC',
  '34567890',
  '345678',
  '3023456789'
);

-- Crear 1 portero adicional
INSERT INTO users (
  nombres,
  apellidos,
  rol,
  tipo_documento,
  numero_documento,
  password,
  telefono
) VALUES 
(
  'José Luis',
  'Morales Castro',
  'portero',
  'CC',
  '45678901',
  '456789',
  '3034567890'
);

-- Crear 4 aulas
INSERT INTO aulas (
  nombre_aula,
  nivel_educativo,
  numero_aula,
  capacidad,
  profesor_asignado_id
) VALUES 
(
  'Aula Girasoles',
  'Maternal',
  '101',
  15,
  (SELECT id FROM users WHERE nombres = 'María Elena' AND apellidos = 'González Pérez' LIMIT 1)
),
(
  'Aula Mariposas',
  'Prejardín',
  '102',
  18,
  (SELECT id FROM users WHERE nombres = 'Carlos Alberto' AND apellidos = 'Rodríguez Martín' LIMIT 1)
),
(
  'Aula Estrellitas',
  'Jardín',
  '201',
  20,
  NULL
),
(
  'Aula Arcoíris',
  'Transición',
  '202',
  22,
  NULL
);

-- Crear 12 acudientes con cédula de ciudadanía
INSERT INTO acudientes (
  nombres,
  apellidos,
  tipo_documento,
  numero_documento,
  telefono1,
  telefono2,
  email,
  direccion
) VALUES 
(
  'Ana María',
  'López Hernández',
  'CC',
  '52123456',
  '3101234567',
  '6012345678',
  'ana.lopez@email.com',
  'Calle 123 #45-67, Bogotá'
),
(
  'Luis Fernando',
  'García Ruiz',
  'CC',
  '80234567',
  '3112345678',
  NULL,
  'luis.garcia@email.com',
  'Carrera 89 #12-34, Medellín'
),
(
  'Carmen Elena',
  'Martínez Silva',
  'CC',
  '41345678',
  '3123456789',
  '6023456789',
  'carmen.martinez@email.com',
  'Avenida 56 #78-90, Cali'
),
(
  'Roberto Carlos',
  'Sánchez Torres',
  'CC',
  '79456789',
  '3134567890',
  NULL,
  'roberto.sanchez@email.com',
  'Diagonal 34 #56-78, Barranquilla'
),
(
  'Patricia Isabel',
  'Ramírez Gómez',
  'CC',
  '52567890',
  '3145678901',
  '6034567890',
  'patricia.ramirez@email.com',
  'Transversal 12 #34-56, Bucaramanga'
),
(
  'Miguel Ángel',
  'Fernández Castro',
  'CC',
  '80678901',
  '3156789012',
  NULL,
  'miguel.fernandez@email.com',
  'Calle 67 #89-01, Pereira'
),
(
  'Gloria Esperanza',
  'Vargas Moreno',
  'CC',
  '41789012',
  '3167890123',
  '6045678901',
  'gloria.vargas@email.com',
  'Carrera 23 #45-67, Manizales'
),
(
  'Andrés Felipe',
  'Jiménez Rojas',
  'CC',
  '79890123',
  '3178901234',
  NULL,
  'andres.jimenez@email.com',
  'Avenida 78 #90-12, Ibagué'
),
(
  'Claudia Marcela',
  'Herrera Díaz',
  'CC',
  '52901234',
  '3189012345',
  '6056789012',
  'claudia.herrera@email.com',
  'Diagonal 90 #12-34, Neiva'
),
(
  'Fernando José',
  'Mendoza Vega',
  'CC',
  '80012345',
  '3190123456',
  NULL,
  'fernando.mendoza@email.com',
  'Transversal 56 #78-90, Pasto'
),
(
  'Liliana Andrea',
  'Cruz Paredes',
  'CC',
  '41123456',
  '3201234567',
  '6067890123',
  'liliana.cruz@email.com',
  'Calle 34 #56-78, Popayán'
),
(
  'Javier Eduardo',
  'Restrepo Aguilar',
  'CC',
  '79234567',
  '3212345678',
  NULL,
  'javier.restrepo@email.com',
  'Carrera 12 #34-56, Villavicencio'
);

-- Crear 20 niños con registro civil
INSERT INTO ninos (
  nombres,
  apellidos,
  tipo_documento,
  numero_documento,
  aula_id,
  activo
) VALUES 
-- Niños para Maternal (Aula Girasoles)
(
  'Sofía Valentina',
  'López García',
  'RC',
  '1001234567',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Girasoles' LIMIT 1),
  true
),
(
  'Santiago Alejandro',
  'Martínez Ruiz',
  'RC',
  '1001234568',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Girasoles' LIMIT 1),
  true
),
(
  'Isabella María',
  'Sánchez López',
  'RC',
  '1001234569',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Girasoles' LIMIT 1),
  true
),
(
  'Mateo Sebastián',
  'García Hernández',
  'RC',
  '1001234570',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Girasoles' LIMIT 1),
  true
),
(
  'Emma Lucía',
  'Ramírez Silva',
  'RC',
  '1001234571',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Girasoles' LIMIT 1),
  true
),
-- Niños para Prejardín (Aula Mariposas)
(
  'Nicolás David',
  'Fernández Torres',
  'RC',
  '1001234572',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Mariposas' LIMIT 1),
  true
),
(
  'Valeria Antonia',
  'Vargas Gómez',
  'RC',
  '1001234573',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Mariposas' LIMIT 1),
  true
),
(
  'Diego Andrés',
  'Jiménez Castro',
  'RC',
  '1001234574',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Mariposas' LIMIT 1),
  true
),
(
  'Camila Andrea',
  'Herrera Moreno',
  'RC',
  '1001234575',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Mariposas' LIMIT 1),
  true
),
(
  'Samuel Esteban',
  'Mendoza Rojas',
  'RC',
  '1001234576',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Mariposas' LIMIT 1),
  true
),
-- Niños para Jardín (Aula Estrellitas)
(
  'Mariana Sofía',
  'Cruz Díaz',
  'RC',
  '1001234577',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Estrellitas' LIMIT 1),
  true
),
(
  'Alejandro José',
  'Restrepo Vega',
  'RC',
  '1001234578',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Estrellitas' LIMIT 1),
  true
),
(
  'Gabriela Victoria',
  'Aguilar Paredes',
  'RC',
  '1001234579',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Estrellitas' LIMIT 1),
  true
),
(
  'Daniel Felipe',
  'Morales Jiménez',
  'RC',
  '1001234580',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Estrellitas' LIMIT 1),
  true
),
(
  'Antonella Grace',
  'Salazar Herrera',
  'RC',
  '1001234581',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Estrellitas' LIMIT 1),
  true
),
-- Niños para Transición (Aula Arcoíris)
(
  'Emiliano Tomás',
  'Castillo Mendoza',
  'RC',
  '1001234582',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Arcoíris' LIMIT 1),
  true
),
(
  'Luciana Esperanza',
  'Guerrero Cruz',
  'RC',
  '1001234583',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Arcoíris' LIMIT 1),
  true
),
(
  'Maximiliano Ángel',
  'Ortega Restrepo',
  'RC',
  '1001234584',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Arcoíris' LIMIT 1),
  true
),
(
  'Renata Alejandra',
  'Peña Aguilar',
  'RC',
  '1001234585',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Arcoíris' LIMIT 1),
  true
),
(
  'Benjamín Isaac',
  'Rojas Morales',
  'RC',
  '1001234586',
  (SELECT id FROM aulas WHERE nombre_aula = 'Aula Arcoíris' LIMIT 1),
  true
);

-- Crear relaciones niño-acudiente: 3 acudientes con 2 niños cada uno
-- Acudiente 1: Ana María López Hernández - 2 niños
INSERT INTO nino_acudiente (nino_id, acudiente_id) VALUES 
(
  (SELECT id FROM ninos WHERE nombres = 'Sofía Valentina' AND apellidos = 'López García' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Ana María' AND apellidos = 'López Hernández' LIMIT 1)
),
(
  (SELECT id FROM ninos WHERE nombres = 'Santiago Alejandro' AND apellidos = 'Martínez Ruiz' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Ana María' AND apellidos = 'López Hernández' LIMIT 1)
);

-- Acudiente 2: Luis Fernando García Ruiz - 2 niños
INSERT INTO nino_acudiente (nino_id, acudiente_id) VALUES 
(
  (SELECT id FROM ninos WHERE nombres = 'Isabella María' AND apellidos = 'Sánchez López' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Luis Fernando' AND apellidos = 'García Ruiz' LIMIT 1)
),
(
  (SELECT id FROM ninos WHERE nombres = 'Mateo Sebastián' AND apellidos = 'García Hernández' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Luis Fernando' AND apellidos = 'García Ruiz' LIMIT 1)
);

-- Acudiente 3: Carmen Elena Martínez Silva - 2 niños
INSERT INTO nino_acudiente (nino_id, acudiente_id) VALUES 
(
  (SELECT id FROM ninos WHERE nombres = 'Emma Lucía' AND apellidos = 'Ramírez Silva' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Carmen Elena' AND apellidos = 'Martínez Silva' LIMIT 1)
),
(
  (SELECT id FROM ninos WHERE nombres = 'Nicolás David' AND apellidos = 'Fernández Torres' LIMIT 1),
  (SELECT id FROM acudientes WHERE nombres = 'Carmen Elena' AND apellidos = 'Martínez Silva' LIMIT 1)
);