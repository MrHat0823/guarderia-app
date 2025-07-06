/*
  # Agregar registros de asistencia de ejemplo para hoy

  1. Datos de ejemplo
    - Registros de entrada y salida para demostrar el funcionamiento
    - Usa los primeros niños, acudientes y usuarios disponibles en la base de datos
    - Registros para la fecha actual con diferentes horarios

  2. Funcionalidad
    - 3 entradas de diferentes niños
    - 1 salida para mostrar el flujo completo
    - Anotaciones de ejemplo para mostrar el campo opcional
*/

-- Insertar registros de asistencia para hoy usando los primeros registros disponibles
DO $$
DECLARE
    primer_nino_id uuid;
    segundo_nino_id uuid;
    tercer_nino_id uuid;
    primer_acudiente_id uuid;
    segundo_acudiente_id uuid;
    tercer_acudiente_id uuid;
    primer_usuario_id uuid;
    segundo_usuario_id uuid;
BEGIN
    -- Obtener los primeros 3 niños activos
    SELECT id INTO primer_nino_id FROM ninos WHERE activo = true ORDER BY created_at LIMIT 1;
    SELECT id INTO segundo_nino_id FROM ninos WHERE activo = true AND id != primer_nino_id ORDER BY created_at LIMIT 1;
    SELECT id INTO tercer_nino_id FROM ninos WHERE activo = true AND id NOT IN (primer_nino_id, segundo_nino_id) ORDER BY created_at LIMIT 1;
    
    -- Obtener los primeros 3 acudientes
    SELECT id INTO primer_acudiente_id FROM acudientes ORDER BY created_at LIMIT 1;
    SELECT id INTO segundo_acudiente_id FROM acudientes WHERE id != primer_acudiente_id ORDER BY created_at LIMIT 1;
    SELECT id INTO tercer_acudiente_id FROM acudientes WHERE id NOT IN (primer_acudiente_id, segundo_acudiente_id) ORDER BY created_at LIMIT 1;
    
    -- Obtener usuarios para registrar
    SELECT id INTO primer_usuario_id FROM users WHERE rol IN ('portero', 'admin') ORDER BY created_at LIMIT 1;
    SELECT id INTO segundo_usuario_id FROM users WHERE rol IN ('profesor', 'admin') AND id != primer_usuario_id ORDER BY created_at LIMIT 1;
    
    -- Si no hay segundo usuario, usar el primero
    IF segundo_usuario_id IS NULL THEN
        segundo_usuario_id := primer_usuario_id;
    END IF;
    
    -- Solo insertar si tenemos los datos necesarios
    IF primer_nino_id IS NOT NULL AND primer_acudiente_id IS NOT NULL AND primer_usuario_id IS NOT NULL THEN
        
        -- Entrada 1: 8:00 AM
        INSERT INTO registros_asistencia (
            fecha,
            hora,
            tipo,
            nino_id,
            acudiente_id,
            usuario_registra_id,
            anotacion
        ) VALUES (
            CURRENT_DATE,
            '08:00:00',
            'entrada',
            primer_nino_id,
            primer_acudiente_id,
            primer_usuario_id,
            'Llegada puntual, muy contento'
        );
        
        -- Entrada 2: 8:15 AM (si hay segundo niño)
        IF segundo_nino_id IS NOT NULL AND segundo_acudiente_id IS NOT NULL THEN
            INSERT INTO registros_asistencia (
                fecha,
                hora,
                tipo,
                nino_id,
                acudiente_id,
                usuario_registra_id,
                anotacion
            ) VALUES (
                CURRENT_DATE,
                '08:15:00',
                'entrada',
                segundo_nino_id,
                segundo_acudiente_id,
                primer_usuario_id,
                'Traía su lonchera favorita'
            );
            
            -- Salida del segundo niño: 12:00 PM
            INSERT INTO registros_asistencia (
                fecha,
                hora,
                tipo,
                nino_id,
                acudiente_id,
                usuario_registra_id,
                anotacion
            ) VALUES (
                CURRENT_DATE,
                '12:00:00',
                'salida',
                segundo_nino_id,
                segundo_acudiente_id,
                segundo_usuario_id,
                'Cita médica programada'
            );
        END IF;
        
        -- Entrada 3: 8:30 AM (si hay tercer niño)
        IF tercer_nino_id IS NOT NULL AND tercer_acudiente_id IS NOT NULL THEN
            INSERT INTO registros_asistencia (
                fecha,
                hora,
                tipo,
                nino_id,
                acudiente_id,
                usuario_registra_id,
                anotacion
            ) VALUES (
                CURRENT_DATE,
                '08:30:00',
                'entrada',
                tercer_nino_id,
                tercer_acudiente_id,
                segundo_usuario_id,
                'Llegó muy animado para jugar'
            );
        END IF;
        
    END IF;
END $$;