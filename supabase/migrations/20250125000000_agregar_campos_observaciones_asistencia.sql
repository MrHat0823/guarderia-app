-- Migración: Agregar campos de observaciones a registros_asistencia
-- Campos para registro de entrada: fiebre, mordidas, aruñado, golpes, otro, otro_texto
-- Campos para registro de salida: fiebre_salida, mordidas_salida, aruñado_salida, golpes_salida

ALTER TABLE public.registros_asistencia
ADD COLUMN IF NOT EXISTS fiebre boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mordidas boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS aruñado boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS golpes boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS otro boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS otro_texto text,
ADD COLUMN IF NOT EXISTS fiebre_salida boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mordidas_salida boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS aruñado_salida boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS golpes_salida boolean NOT NULL DEFAULT false;

-- Comentarios para documentación
COMMENT ON COLUMN public.registros_asistencia.fiebre IS 'Indica si el niño presenta fiebre al momento de la entrada';
COMMENT ON COLUMN public.registros_asistencia.mordidas IS 'Indica si el niño presenta mordidas al momento de la entrada';
COMMENT ON COLUMN public.registros_asistencia.aruñado IS 'Indica si el niño presenta arañazos al momento de la entrada';
COMMENT ON COLUMN public.registros_asistencia.golpes IS 'Indica si el niño presenta golpes al momento de la entrada';
COMMENT ON COLUMN public.registros_asistencia.otro IS 'Indica si hay otra observación al momento de la entrada';
COMMENT ON COLUMN public.registros_asistencia.otro_texto IS 'Texto descriptivo de la observación "otro" en la entrada';
COMMENT ON COLUMN public.registros_asistencia.fiebre_salida IS 'Indica si el niño presenta fiebre al momento de la salida';
COMMENT ON COLUMN public.registros_asistencia.mordidas_salida IS 'Indica si el niño presenta mordidas al momento de la salida';
COMMENT ON COLUMN public.registros_asistencia.aruñado_salida IS 'Indica si el niño presenta arañazos al momento de la salida';
COMMENT ON COLUMN public.registros_asistencia.golpes_salida IS 'Indica si el niño presenta golpes al momento de la salida';

