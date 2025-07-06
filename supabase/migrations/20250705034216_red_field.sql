/*
  # Verificar zona horaria y crear datos de prueba

  1. Verificación de zona horaria
    - Consultar configuración actual de timezone
    - Mostrar fecha y hora actual del sistema
    - Verificar que esté en zona horaria de Bogotá (America/Bogota)

  2. Crear registros de prueba
    - Insertar algunos registros de asistencia para hoy
    - Usar timestamps actuales para verificar zona horaria
    - Crear registros con diferentes horas del día
*/

-- Verificar la zona horaria actual de la base de datos
DO $$
BEGIN
    RAISE NOTICE 'Zona horaria actual: %', current_setting('timezone');
    RAISE NOTICE 'Fecha y hora actual (con zona): %', now();
    RAISE NOTICE 'Fecha y hora actual (UTC): %', now() AT TIME ZONE 'UTC';
    RAISE NOTICE 'Fecha actual (solo fecha): %', CURRENT_DATE;
    RAISE NOTICE 'Hora actual (solo hora): %', CURRENT_TIME;
END $$;

-- Crear algunos registros de asistencia para hoy con diferentes horas
DO $$
DECLARE
    nino1_id uuid;
    nino2_id uuid;
    nino3_id uuid;
    acudiente1_id uuid;
    acudiente2_id uuid;
    acudiente3_id uuid;
    usuario_portero_id uuid;
    usuario_profesor_id uuid;
BEGIN
    -- Obtener IDs de niños que tienen acudientes asignados
    SELECT n.id INTO nino1_id 
    FROM ninos n 
    INNER JOIN nino_acudiente na ON n.id = na.nino_id 
    WHERE n.activo = true 
    ORDER BY n.created_at 
    LIMIT 1;
    
    SELECT n.id INTO nino2_id 
    FROM ninos n 
    INNER JOIN nino_acudiente na ON n.id = na.nino_id 
    WHERE n.activo = true AND n.id != nino1_id
    ORDER BY n.created_at 
    LIMIT 1;
    
    SELECT n.id INTO nino3_id 
    FROM ninos n 
    INNER JOIN nino_acudiente na ON n.id = na.nino_id 
    WHERE n.activo = true AND n.id NOT IN (nino1_id, nino2_id)
    ORDER BY n.created_at 
    LIMIT 1;
    
    -- Obtener acudientes correspondientes
    SELECT na.acudiente_id INTO acudiente1_id 
    FROM nino_acudiente na 
    WHERE na.nino_id = nino1_id 
    LIMIT 1;
    
    SELECT na.acudiente_id INTO acudiente2_id 
    FROM nino_acudiente na 
    WHERE na.nino_id = nino2_id 
    LIMIT 1;
    
    SELECT na.acudiente_id INTO acudiente3_id 
    FROM nino_acudiente na 
    WHERE na.nino_id = nino3_id 
    LIMIT 1;
    
    -- Obtener usuarios para registrar
    SELECT id INTO usuario_portero_id 
    FROM users 
    WHERE rol IN ('portero', 'admin') 
    ORDER BY created_at 
    LIMIT 1;
    
    SELECT id INTO usuario_profesor_id 
    FROM users 
    WHERE rol IN ('profesor', 'admin') 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Si no hay profesor, usar el portero
    IF usuario_profesor_id IS NULL THEN
        usuario_profesor_id := usuario_portero_id;
    END IF;
    
    -- Limpiar registros existentes de hoy para evitar duplicados
    DELETE FROM registros_asistencia WHERE fecha = CURRENT_DATE;
    
    -- Solo insertar si tenemos todos los datos necesarios
    IF nino1_id IS NOT NULL AND acudiente1_id IS NOT NULL AND usuario_portero_id IS NOT NULL THEN
        
        RAISE NOTICE 'Insertando registros de asistencia para la fecha: %', CURRENT_DATE;
        
        -- Registro 1: Entrada a las 7:30 AM
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
            '07:30:00',
            'entrada',
            nino1_id,
            acudiente1_id,
            usuario_portero_id,
            'Primera entrada del día - muy puntual'
        );
        
        -- Registro 2: Entrada a las 8:00 AM (si hay segundo niño)
        IF nino2_id IS NOT NULL AND acudiente2_id IS NOT NULL THEN
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
                nino2_id,
                acudiente2_id,
                usuario_portero_id,
                'Llegada en horario normal'
            );
        END IF;
        
        -- Registro 3: Entrada a las 8:15 AM (si hay tercer niño)
        IF nino3_id IS NOT NULL AND acudiente3_id IS NOT NULL THEN
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
                nino3_id,
                acudiente3_id,
                usuario_profesor_id,
                'Llegada con lonchera especial'
            );
        END IF;
        
        -- Registro 4: Salida temprana a las 11:30 AM (primer niño)
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
            '11:30:00',
            'salida',
            nino1_id,
            acudiente1_id,
            usuario_profesor_id,
            'Salida temprana por cita médica'
        );
        
        -- Registro 5: Nueva entrada del primer niño a las 2:00 PM
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
            '14:00:00',
            'entrada',
            nino1_id,
            acudiente1_id,
            usuario_portero_id,
            'Regreso después de cita médica'
        );
        
        RAISE NOTICE 'Registros de asistencia creados exitosamente';
        
    ELSE
        RAISE NOTICE 'No se pudieron crear registros - faltan datos: nino1_id=%, acudiente1_id=%, usuario_id=%', 
                     nino1_id, acudiente1_id, usuario_portero_id;
    END IF;
END $$;

-- Verificar los registros creados
DO $$
DECLARE
    registro_count integer;
    fecha_actual date;
BEGIN
    SELECT CURRENT_DATE INTO fecha_actual;
    
    SELECT COUNT(*) INTO registro_count 
    FROM registros_asistencia 
    WHERE fecha = fecha_actual;
    
    RAISE NOTICE 'Total de registros de asistencia para hoy (%): %', fecha_actual, registro_count;
    
    -- Mostrar detalles de los registros
    FOR registro_count IN 
        SELECT 1 FROM registros_asistencia WHERE fecha = fecha_actual LIMIT 1
    LOOP
        RAISE NOTICE 'Registros encontrados para verificación de zona horaria';
        EXIT;
    END LOOP;
END $$;