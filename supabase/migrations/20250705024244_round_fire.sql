/*
  # Agregar campo de contraseña a usuarios

  1. Cambios en la tabla users
    - Agregar campo `password` de 6 dígitos
    - Actualizar usuarios existentes con contraseñas por defecto

  2. Seguridad
    - Las contraseñas se almacenan como texto plano para simplicidad
    - En producción se debería usar hash
*/

-- Agregar campo de contraseña a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password text NOT NULL DEFAULT '123456';

-- Actualizar usuarios existentes con contraseñas específicas
UPDATE users SET password = '123456' WHERE numero_documento = '12345678'; -- Admin
UPDATE users SET password = '234567' WHERE numero_documento = '23456789'; -- Profesor
UPDATE users SET password = '345678' WHERE numero_documento = '34567890'; -- Portero
UPDATE users SET password = '456789' WHERE numero_documento = '45678901'; -- Profesor
UPDATE users SET password = '567890' WHERE numero_documento = '56789012'; -- Admin

-- Agregar constraint para que la contraseña tenga exactamente 6 dígitos
ALTER TABLE users ADD CONSTRAINT password_length_check 
  CHECK (length(password) = 6 AND password ~ '^[0-9]+$');