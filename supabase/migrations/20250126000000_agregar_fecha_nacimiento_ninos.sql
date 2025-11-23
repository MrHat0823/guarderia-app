-- Agregar columna fecha_nacimiento a la tabla ninos
ALTER TABLE public.ninos
ADD COLUMN fecha_nacimiento DATE;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.ninos.fecha_nacimiento IS 'Fecha de nacimiento del niño';
