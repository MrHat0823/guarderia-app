-- =====================================================
-- FUNCIÓN AUTOMÁTICA: Cerrar Asistencias a las 6 PM
-- =====================================================
-- Se ejecuta de lunes a sábado a las 18:00
-- Registra salidas automáticas para niños sin salida

-- 1. Habilitar extensión pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Crear función para cerrar asistencias automáticamente
CREATE OR REPLACE FUNCTION cerrar_asistencias_automaticas()
RETURNS TABLE(
  ninos_procesados INTEGER,
  fecha_proceso DATE,
  hora_proceso TIME
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fecha_hoy DATE := CURRENT_DATE;
  entrada_record RECORD;
  usuario_sistema_id UUID;
  contador INTEGER := 0;
BEGIN
  -- Obtener primer usuario admin o coordinador disponible
  SELECT id INTO usuario_sistema_id 
  FROM users 
  WHERE rol IN ('admin', 'coordinador')
  LIMIT 1;

  -- Si no hay usuario, abortar
  IF usuario_sistema_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró usuario para registrar salidas automáticas';
  END IF;

  -- Buscar entradas sin salida del día
  FOR entrada_record IN
    SELECT DISTINCT ON (e.nino_id)
      e.nino_id, 
      e.acudiente_id, 
      e.tercero_id, 
      e.guarderia_id, 
      e.aula_id
    FROM registros_asistencia e
    WHERE e.fecha = fecha_hoy
      AND e.tipo = 'entrada'
      AND NOT EXISTS (
        SELECT 1 
        FROM registros_asistencia s
        WHERE s.fecha = fecha_hoy 
          AND s.tipo = 'salida'
          AND s.nino_id = e.nino_id
      )
  LOOP
    -- Insertar salida automática
    INSERT INTO registros_asistencia (
      fecha, 
      hora, 
      tipo, 
      nino_id, 
      acudiente_id, 
      tercero_id, 
      usuario_registra_id, 
      guarderia_id, 
      aula_id, 
      anotacion,
      created_at
    ) VALUES (
      fecha_hoy,
      '18:00:00'::TIME,
      'salida',
      entrada_record.nino_id,
      entrada_record.acudiente_id,
      entrada_record.tercero_id,
      usuario_sistema_id,
      entrada_record.guarderia_id,
      entrada_record.aula_id,
      'Salida automática registrada por el sistema a las 18:00',
      NOW()
    );
    
    contador := contador + 1;
  END LOOP;

  -- Retornar resultado
  RETURN QUERY SELECT contador, fecha_hoy, '18:00:00'::TIME;
END;
$$;

-- 3. Comentario descriptivo
COMMENT ON FUNCTION cerrar_asistencias_automaticas() IS 
'Función automática que registra salidas a las 18:00 para niños sin salida registrada. 
Se ejecuta de lunes a sábado mediante pg_cron.';

-- 4. Programar ejecución con pg_cron
-- Lunes a sábado a las 18:00 (hora del servidor)
SELECT cron.schedule(
  'cerrar-asistencias-diarias',        -- nombre del job
  '0 18 * * 1-6',                      -- cron: 6 PM, lun-sáb
  $$SELECT cerrar_asistencias_automaticas();$$
);

-- 5. Verificar que el job se creó correctamente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cerrar-asistencias-diarias') THEN
    RAISE NOTICE '✅ Job programado correctamente: cerrar-asistencias-diarias';
    RAISE NOTICE 'Horario: Lunes a Sábado a las 18:00';
  ELSE
    RAISE WARNING '⚠️ El job no se pudo crear. Verifica permisos de pg_cron.';
  END IF;
END $$;

-- =====================================================
-- CONSULTAS ÚTILES PARA ADMINISTRACIÓN
-- =====================================================

-- Ver todos los jobs programados:
-- SELECT * FROM cron.job;

-- Ver historial de ejecuciones:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Desactivar el job (si es necesario):
-- SELECT cron.unschedule('cerrar-asistencias-diarias');

-- Reactivar el job:
-- SELECT cron.schedule('cerrar-asistencias-diarias', '0 18 * * 1-6', $$SELECT cerrar_asistencias_automaticas();$$);

-- Ejecutar manualmente (para pruebas):
-- SELECT * FROM cerrar_asistencias_automaticas();









