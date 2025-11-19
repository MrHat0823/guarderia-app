# 🕐 Tarea Automática: Cierre de Asistencias a las 6 PM

## 📋 Descripción
Sistema automático que detecta niños sin salida registrada y automáticamente registra una salida a las **18:00 (6:00 PM)** de lunes a sábado.

- ✅ Usa el mismo acudiente/tercero de la entrada
- ✅ Hora fija: 18:00
- ✅ Agrega anotación identificable
- ✅ Previene inconsistencias en registros

---

## 🎯 Tienes 2 opciones de implementación:

### **Opción 1: PostgreSQL pg_cron** ⭐ (MÁS FÁCIL)
Ejecuta directamente en Supabase, sin configuración externa.

### **Opción 2: Supabase Edge Functions**
Más flexible, requiere CLI de Supabase.

---

## 🚀 INSTALACIÓN RÁPIDA

### **OPCIÓN 1: PostgreSQL pg_cron** (Recomendado)

#### Paso 1: Ir al SQL Editor de Supabase
1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú izquierdo
3. Click en **New Query**

#### Paso 2: Copiar y ejecutar este SQL

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear función
CREATE OR REPLACE FUNCTION cerrar_asistencias_automaticas()
RETURNS TABLE(ninos_procesados INTEGER, fecha_proceso DATE, hora_proceso TIME) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fecha_hoy DATE := CURRENT_DATE;
  entrada_record RECORD;
  usuario_sistema_id UUID;
  contador INTEGER := 0;
BEGIN
  SELECT id INTO usuario_sistema_id 
  FROM users 
  WHERE rol IN ('admin', 'coordinador')
  LIMIT 1;

  IF usuario_sistema_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario admin/coordinador disponible';
  END IF;

  FOR entrada_record IN
    SELECT DISTINCT ON (e.nino_id)
      e.nino_id, e.acudiente_id, e.tercero_id, 
      e.guarderia_id, e.aula_id
    FROM registros_asistencia e
    WHERE e.fecha = fecha_hoy
      AND e.tipo = 'entrada'
      AND NOT EXISTS (
        SELECT 1 FROM registros_asistencia s
        WHERE s.fecha = fecha_hoy 
          AND s.tipo = 'salida'
          AND s.nino_id = e.nino_id
      )
  LOOP
    INSERT INTO registros_asistencia (
      fecha, hora, tipo, nino_id, acudiente_id, tercero_id,
      usuario_registra_id, guarderia_id, aula_id, anotacion
    ) VALUES (
      fecha_hoy, '18:00:00'::TIME, 'salida',
      entrada_record.nino_id, entrada_record.acudiente_id,
      entrada_record.tercero_id, usuario_sistema_id,
      entrada_record.guarderia_id, entrada_record.aula_id,
      'Salida automática registrada por el sistema a las 18:00'
    );
    contador := contador + 1;
  END LOOP;

  RETURN QUERY SELECT contador, fecha_hoy, '18:00:00'::TIME;
END;
$$;

-- Programar ejecución (Lunes a Sábado 6 PM)
SELECT cron.schedule(
  'cerrar-asistencias-diarias',
  '0 18 * * 1-6',
  $$SELECT cerrar_asistencias_automaticas();$$
);
```

#### Paso 3: Click en **RUN** ▶️

✅ **¡Listo!** Ya está configurado y se ejecutará automáticamente.

---

## 🧪 PROBAR MANUALMENTE

Para probar sin esperar a las 6 PM:

```sql
-- Ejecutar manualmente
SELECT * FROM cerrar_asistencias_automaticas();
```

Resultado esperado:
```
ninos_procesados | fecha_proceso | hora_proceso
-----------------|---------------|-------------
5                | 2025-01-24    | 18:00:00
```

---

## 📊 MONITOREAR

### Ver si el job está activo:
```sql
SELECT * FROM cron.job WHERE jobname = 'cerrar-asistencias-diarias';
```

### Ver historial de ejecuciones:
```sql
SELECT 
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'cerrar-asistencias-diarias'
)
ORDER BY start_time DESC 
LIMIT 10;
```

### Ver registros automáticos creados:
```sql
SELECT 
  fecha,
  hora,
  ninos.nombres,
  ninos.apellidos,
  anotacion
FROM registros_asistencia
JOIN ninos ON ninos.id = registros_asistencia.nino_id
WHERE anotacion LIKE '%automática%'
ORDER BY fecha DESC, hora DESC
LIMIT 20;
```

---

## 🛠️ ADMINISTRACIÓN

### Pausar el job:
```sql
SELECT cron.unschedule('cerrar-asistencias-diarias');
```

### Reactivar el job:
```sql
SELECT cron.schedule(
  'cerrar-asistencias-diarias',
  '0 18 * * 1-6',
  $$SELECT cerrar_asistencias_automaticas();$$
);
```

### Cambiar horario (ejemplo: 5:30 PM):
```sql
-- Primero eliminar el existente
SELECT cron.unschedule('cerrar-asistencias-diarias');

-- Crear con nuevo horario (30 minutos = minuto 30)
SELECT cron.schedule(
  'cerrar-asistencias-diarias',
  '30 17 * * 1-6',  -- 5:30 PM
  $$SELECT cerrar_asistencias_automaticas();$$
);
```

---

## 🕐 FORMATO CRON

```
┌─── minuto (0-59)
│ ┌─── hora (0-23)
│ │ ┌─── día del mes (1-31)
│ │ │ ┌─── mes (1-12)
│ │ │ │ ┌─── día de la semana (0-6) 0=domingo
│ │ │ │ │
0 18 * * 1-6  ← Lunes a Sábado 6 PM
```

**Ejemplos:**
- `0 18 * * 1-5` → Lunes a Viernes 6 PM
- `30 17 * * 1-6` → Lunes a Sábado 5:30 PM
- `0 20 * * *` → Todos los días 8 PM

---

## ❓ TROUBLESHOOTING

### Error: "extension pg_cron does not exist"
**Solución:** Algunos planes de Supabase no incluyen pg_cron. Usa la Opción 2 (Edge Functions).

### Error: "No hay usuario admin/coordinador disponible"
**Solución:** Asegúrate de tener al menos un usuario con rol `admin` o `coordinador` en la tabla `users`.

### El job no se ejecuta
1. Verifica que esté activo:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'cerrar-asistencias-diarias';
   ```
2. Revisa los logs:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```
3. Verifica la zona horaria del servidor:
   ```sql
   SHOW timezone;
   ```

---

## 📌 NOTAS IMPORTANTES

✅ **Ventajas:**
- Totalmente automático, sin intervención manual
- Previene datos inconsistentes
- Mantiene histórico completo
- Identificable por anotación

⚠️ **Consideraciones:**
- Los registros automáticos tienen hora fija `18:00:00`
- Se usa el primer usuario admin/coordinador encontrado
- Solo procesa niños con ENTRADA sin SALIDA del día actual
- No modifica registros existentes

---

## 🎉 ¡LISTO!

La tarea automática ya está configurada. A las 6:00 PM de cada día (lunes a sábado), el sistema cerrará automáticamente las asistencias pendientes.

**Puedes verificarlo mañana a las 6:01 PM revisando:**
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 1;
```









