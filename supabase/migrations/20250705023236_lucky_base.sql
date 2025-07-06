/*
  # Actualizar tabla de usuarios para funcionar sin Auth

  1. Cambios
    - Remover la referencia a auth.users
    - Hacer que id sea un UUID generado automáticamente
    - Agregar usuarios de ejemplo para pruebas

  2. Seguridad
    - Mantener RLS habilitado
    - Simplificar políticas para funcionar sin autenticación
*/

-- Primero, eliminar las políticas existentes que dependen de auth.uid()
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Eliminar el trigger y función de auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Eliminar la restricción de foreign key a auth.users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Cambiar la columna id para que sea un UUID generado automáticamente
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Crear nuevas políticas más simples
CREATE POLICY "Anyone can read users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete users"
  ON users
  FOR DELETE
  USING (true);

-- Insertar usuarios de ejemplo para pruebas
INSERT INTO users (nombres, apellidos, rol, tipo_documento, numero_documento, telefono) VALUES
  ('Admin', 'Sistema', 'admin', 'CC', '12345678', '3001234567'),
  ('María Elena', 'García López', 'profesor', 'CC', '23456789', '3012345678'),
  ('Carlos Andrés', 'Portero', 'portero', 'CC', '34567890', '3023456789'),
  ('Ana Sofía', 'Martínez Pérez', 'profesor', 'CC', '45678901', '3034567890'),
  ('Luis Fernando', 'González Ruiz', 'admin', 'CC', '56789012', '3045678901')
ON CONFLICT (numero_documento) DO NOTHING;