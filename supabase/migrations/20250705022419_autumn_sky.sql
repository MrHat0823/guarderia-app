/*
  # Crear tabla de usuarios del sistema

  1. Nueva tabla
    - `users` - Usuarios del sistema (administradores, profesores, porteros)
      - `id` (uuid, primary key) - Vinculado con auth.users
      - `nombres` (text) - Nombres del usuario
      - `apellidos` (text) - Apellidos del usuario
      - `rol` (enum) - Rol del usuario (admin, profesor, portero)
      - `tipo_documento` (text) - Tipo de documento de identidad
      - `numero_documento` (text, unique) - Número de documento
      - `telefono` (text, optional) - Número de teléfono
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `users`
    - Políticas para que los usuarios puedan leer su propia información
    - Solo administradores pueden crear/editar usuarios
*/

-- Crear enum para roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'profesor', 'portero');

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  rol user_role NOT NULL DEFAULT 'profesor',
  tipo_documento text NOT NULL DEFAULT 'CC',
  numero_documento text UNIQUE NOT NULL,
  telefono text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan leer su propia información
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para que los administradores puedan ver todos los usuarios
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que los administradores puedan insertar usuarios
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que los administradores puedan actualizar usuarios
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que los administradores puedan eliminar usuarios
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, nombres, apellidos, rol, tipo_documento, numero_documento)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nombres', 'Usuario'),
    COALESCE(new.raw_user_meta_data->>'apellidos', 'Nuevo'),
    COALESCE((new.raw_user_meta_data->>'rol')::user_role, 'profesor'),
    COALESCE(new.raw_user_meta_data->>'tipo_documento', 'CC'),
    COALESCE(new.raw_user_meta_data->>'numero_documento', new.id::text)
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();