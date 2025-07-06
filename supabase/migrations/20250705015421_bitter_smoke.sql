/*
# Complete Daycare Management Database Schema

This migration creates the complete database schema for the daycare management system.

## New Tables

1. **users** (extends Supabase auth)
   - `id` (uuid, matches auth.users.id)
   - `nombres` (text)
   - `apellidos` (text)
   - `rol` (enum: admin, profesor, portero)
   - `tipo_documento` (text)
   - `numero_documento` (text, unique)
   - `telefono` (text)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **aulas**
   - `id` (uuid, primary key)
   - `nombre_aula` (text)
   - `nivel_educativo` (text)
   - `numero_aula` (text)
   - `capacidad` (integer)
   - `profesor_asignado_id` (uuid, references users)
   - `created_at` (timestamp)

3. **ninos**
   - `id` (uuid, primary key)
   - `nombres` (text)
   - `apellidos` (text)
   - `tipo_documento` (text)
   - `numero_documento` (text, unique)
   - `aula_id` (uuid, references aulas)
   - `activo` (boolean, default true)
   - `created_at` (timestamp)

4. **acudientes**
   - `id` (uuid, primary key)
   - `nombres` (text)
   - `apellidos` (text)
   - `tipo_documento` (text)
   - `numero_documento` (text, unique)
   - `telefono1` (text)
   - `telefono2` (text)
   - `email` (text)
   - `direccion` (text)
   - `created_at` (timestamp)

5. **nino_acudiente**
   - `id` (uuid, primary key)
   - `nino_id` (uuid, references ninos)
   - `acudiente_id` (uuid, references acudientes)
   - `created_at` (timestamp)

6. **registros_asistencia**
   - `id` (uuid, primary key)
   - `fecha` (date)
   - `hora` (time)
   - `tipo` (enum: entrada, salida)
   - `nino_id` (uuid, references ninos)
   - `acudiente_id` (uuid, references acudientes)
   - `usuario_registra_id` (uuid, references users)
   - `anotacion` (text)
   - `created_at` (timestamp)

## Security
- Enable RLS on all tables
- Add policies for role-based access control
- Secure policies for each user type
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'profesor', 'portero');
CREATE TYPE attendance_type AS ENUM ('entrada', 'salida');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  rol user_role NOT NULL DEFAULT 'profesor',
  tipo_documento text NOT NULL,
  numero_documento text UNIQUE NOT NULL,
  telefono text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create aulas table
CREATE TABLE IF NOT EXISTS aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_aula text NOT NULL,
  nivel_educativo text NOT NULL,
  numero_aula text NOT NULL,
  capacidad integer NOT NULL DEFAULT 0,
  profesor_asignado_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create ninos table
CREATE TABLE IF NOT EXISTS ninos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL,
  numero_documento text UNIQUE NOT NULL,
  aula_id uuid REFERENCES aulas(id),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create acudientes table
CREATE TABLE IF NOT EXISTS acudientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL,
  numero_documento text UNIQUE NOT NULL,
  telefono1 text,
  telefono2 text,
  email text,
  direccion text,
  created_at timestamptz DEFAULT now()
);

-- Create nino_acudiente relationship table
CREATE TABLE IF NOT EXISTS nino_acudiente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nino_id uuid REFERENCES ninos(id) ON DELETE CASCADE,
  acudiente_id uuid REFERENCES acudientes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(nino_id, acudiente_id)
);

-- Create registros_asistencia table
CREATE TABLE IF NOT EXISTS registros_asistencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  hora time NOT NULL DEFAULT CURRENT_TIME,
  tipo attendance_type NOT NULL,
  nino_id uuid REFERENCES ninos(id),
  acudiente_id uuid REFERENCES acudientes(id),
  usuario_registra_id uuid REFERENCES users(id),
  anotacion text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ninos ENABLE ROW LEVEL SECURITY;
ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nino_acudiente ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_asistencia ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Create policies for aulas table
CREATE POLICY "Authenticated users can read aulas"
  ON aulas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage aulas"
  ON aulas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Create policies for ninos table
CREATE POLICY "Authenticated users can read ninos"
  ON ninos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage ninos"
  ON ninos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Create policies for acudientes table
CREATE POLICY "Authenticated users can read acudientes"
  ON acudientes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage acudientes"
  ON acudientes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Create policies for nino_acudiente table
CREATE POLICY "Authenticated users can read nino_acudiente"
  ON nino_acudiente
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage nino_acudiente"
  ON nino_acudiente
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Create policies for registros_asistencia table
CREATE POLICY "Authenticated users can read attendance"
  ON registros_asistencia
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create attendance"
  ON registros_asistencia
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_registra_id);

CREATE POLICY "Admins can manage attendance"
  ON registros_asistencia
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);
CREATE INDEX IF NOT EXISTS idx_users_documento ON users(numero_documento);
CREATE INDEX IF NOT EXISTS idx_ninos_aula ON ninos(aula_id);
CREATE INDEX IF NOT EXISTS idx_ninos_activo ON ninos(activo);
CREATE INDEX IF NOT EXISTS idx_acudientes_documento ON acudientes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_nino_acudiente_nino ON nino_acudiente(nino_id);
CREATE INDEX IF NOT EXISTS idx_nino_acudiente_acudiente ON nino_acudiente(acudiente_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_asistencia(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_nino ON registros_asistencia(nino_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();