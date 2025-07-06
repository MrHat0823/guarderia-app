/*
  # Create configuracion_guarderia table

  1. New Tables
    - `configuracion_guarderia`
      - `id` (uuid, primary key)
      - `nombre_guarderia` (text, default 'Guardería Infantil')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `configuracion_guarderia` table
    - Add policy for public read access
    - Add policies for admin-only insert/update
  3. Performance
    - Add index on updated_at column
  4. Automation
    - Create trigger function for automatic updated_at updates
    - Create trigger to call the function
  5. Initial Data
    - Insert default configuration record
*/

-- Create the configuracion_guarderia table
CREATE TABLE IF NOT EXISTS configuracion_guarderia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_guarderia text NOT NULL DEFAULT 'Guardería Infantil',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance on updated_at queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_configuracion_guarderia_updated_at'
  ) THEN
    CREATE INDEX idx_configuracion_guarderia_updated_at 
    ON configuracion_guarderia USING btree (updated_at DESC);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE configuracion_guarderia ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Todos pueden leer configuracion" ON configuracion_guarderia;
  DROP POLICY IF EXISTS "Solo admins pueden insertar configuracion" ON configuracion_guarderia;
  DROP POLICY IF EXISTS "Solo admins pueden actualizar configuracion" ON configuracion_guarderia;
  
  -- Create policies
  CREATE POLICY "Todos pueden leer configuracion"
    ON configuracion_guarderia
    FOR SELECT
    TO public
    USING (true);

  CREATE POLICY "Solo admins pueden insertar configuracion"
    ON configuracion_guarderia
    FOR INSERT
    TO public
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.rol = 'admin'
      )
    );

  CREATE POLICY "Solo admins pueden actualizar configuracion"
    ON configuracion_guarderia
    FOR UPDATE
    TO public
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.rol = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.rol = 'admin'
      )
    );
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_configuracion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DO $$
BEGIN
  -- Drop trigger if it exists
  DROP TRIGGER IF EXISTS update_configuracion_updated_at ON configuracion_guarderia;
  
  -- Create trigger
  CREATE TRIGGER update_configuracion_updated_at
    BEFORE UPDATE ON configuracion_guarderia
    FOR EACH ROW
    EXECUTE FUNCTION update_configuracion_updated_at();
END $$;

-- Insert default configuration record
INSERT INTO configuracion_guarderia (nombre_guarderia)
VALUES ('Guardería Infantil')
ON CONFLICT DO NOTHING;