/*
  # Actualizar políticas para funcionar sin autenticación

  1. Cambios
    - Simplificar todas las políticas para no depender de auth.uid()
    - Permitir acceso completo temporalmente para desarrollo
    - Mantener la estructura para futuras mejoras de seguridad

  2. Tablas afectadas
    - aulas
    - ninos  
    - acudientes
    - nino_acudiente
    - registros_asistencia
*/

-- Actualizar políticas de aulas
DROP POLICY IF EXISTS "Authenticated users can read aulas" ON aulas;
DROP POLICY IF EXISTS "Admins can insert aulas" ON aulas;
DROP POLICY IF EXISTS "Admins can update aulas" ON aulas;
DROP POLICY IF EXISTS "Admins can delete aulas" ON aulas;

CREATE POLICY "Anyone can read aulas" ON aulas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert aulas" ON aulas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update aulas" ON aulas FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete aulas" ON aulas FOR DELETE USING (true);

-- Actualizar políticas de ninos
DROP POLICY IF EXISTS "Authenticated users can read ninos" ON ninos;
DROP POLICY IF EXISTS "Admins can insert ninos" ON ninos;
DROP POLICY IF EXISTS "Admins can update ninos" ON ninos;
DROP POLICY IF EXISTS "Admins can delete ninos" ON ninos;

CREATE POLICY "Anyone can read ninos" ON ninos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ninos" ON ninos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ninos" ON ninos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ninos" ON ninos FOR DELETE USING (true);

-- Actualizar políticas de acudientes
DROP POLICY IF EXISTS "Authenticated users can read acudientes" ON acudientes;
DROP POLICY IF EXISTS "Admins can insert acudientes" ON acudientes;
DROP POLICY IF EXISTS "Admins can update acudientes" ON acudientes;
DROP POLICY IF EXISTS "Admins can delete acudientes" ON acudientes;

CREATE POLICY "Anyone can read acudientes" ON acudientes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert acudientes" ON acudientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update acudientes" ON acudientes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete acudientes" ON acudientes FOR DELETE USING (true);

-- Actualizar políticas de nino_acudiente
DROP POLICY IF EXISTS "Authenticated users can read nino_acudiente" ON nino_acudiente;
DROP POLICY IF EXISTS "Admins can insert nino_acudiente" ON nino_acudiente;
DROP POLICY IF EXISTS "Admins can update nino_acudiente" ON nino_acudiente;
DROP POLICY IF EXISTS "Admins can delete nino_acudiente" ON nino_acudiente;

CREATE POLICY "Anyone can read nino_acudiente" ON nino_acudiente FOR SELECT USING (true);
CREATE POLICY "Anyone can insert nino_acudiente" ON nino_acudiente FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update nino_acudiente" ON nino_acudiente FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete nino_acudiente" ON nino_acudiente FOR DELETE USING (true);

-- Actualizar políticas de registros_asistencia
DROP POLICY IF EXISTS "Authenticated users can read registros_asistencia" ON registros_asistencia;
DROP POLICY IF EXISTS "Authenticated users can insert registros_asistencia" ON registros_asistencia;
DROP POLICY IF EXISTS "Admins can update registros_asistencia" ON registros_asistencia;
DROP POLICY IF EXISTS "Admins can delete registros_asistencia" ON registros_asistencia;

CREATE POLICY "Anyone can read registros_asistencia" ON registros_asistencia FOR SELECT USING (true);
CREATE POLICY "Anyone can insert registros_asistencia" ON registros_asistencia FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update registros_asistencia" ON registros_asistencia FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete registros_asistencia" ON registros_asistencia FOR DELETE USING (true);