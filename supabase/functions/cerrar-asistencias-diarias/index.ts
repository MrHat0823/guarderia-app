import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener fecha actual en zona horaria Colombia
    const now = new Date();
    const colombiaDate = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Bogota" })
    );
    const fechaHoy = colombiaDate.toISOString().split("T")[0];

    console.log(`[${new Date().toISOString()}] Ejecutando cierre automático para fecha: ${fechaHoy}`);

    // 1. Buscar todos los registros de ENTRADA del día que no tienen SALIDA
    const { data: entradasSinSalida, error: queryError } = await supabase
      .from("registros_asistencia")
      .select("nino_id, acudiente_id, tercero_id, guarderia_id, aula_id")
      .eq("fecha", fechaHoy)
      .eq("tipo", "entrada");

    if (queryError) {
      console.error("Error al consultar entradas:", queryError);
      throw queryError;
    }

    if (!entradasSinSalida || entradasSinSalida.length === 0) {
      console.log("No hay registros de entrada para procesar.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No hay registros pendientes",
          procesados: 0,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Verificar cuáles NO tienen salida registrada
    const ninosParaCerrar = [];

    for (const entrada of entradasSinSalida) {
      const { data: salidas, error: salidaError } = await supabase
        .from("registros_asistencia")
        .select("id")
        .eq("fecha", fechaHoy)
        .eq("tipo", "salida")
        .eq("nino_id", entrada.nino_id)
        .maybeSingle();

      if (salidaError) {
        console.error(`Error al verificar salida para niño ${entrada.nino_id}:`, salidaError);
        continue;
      }

      // Si NO tiene salida, agregarlo a la lista
      if (!salidas) {
        ninosParaCerrar.push(entrada);
      }
    }

    console.log(`Niños sin salida detectados: ${ninosParaCerrar.length}`);

    if (ninosParaCerrar.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Todos los niños tienen salida registrada",
          procesados: 0,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Crear usuario sistema para los registros automáticos
    const { data: usuarioSistema } = await supabase
      .from("users")
      .select("id")
      .eq("numero_documento", "SISTEMA_AUTO")
      .maybeSingle();

    let usuarioRegistraId = usuarioSistema?.id;

    // Si no existe, usar el primer admin o coordinador disponible
    if (!usuarioRegistraId) {
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .in("rol", ["admin", "coordinador"])
        .limit(1)
        .maybeSingle();

      usuarioRegistraId = adminUser?.id;
    }

    if (!usuarioRegistraId) {
      throw new Error("No se encontró usuario para registrar las salidas automáticas");
    }

    // 4. Registrar las salidas automáticas
    const salidasAutomaticas = ninosParaCerrar.map((entrada) => ({
      fecha: fechaHoy,
      hora: "18:00:00",
      tipo: "salida",
      nino_id: entrada.nino_id,
      acudiente_id: entrada.acudiente_id || null,
      tercero_id: entrada.tercero_id || null,
      usuario_registra_id: usuarioRegistraId,
      guarderia_id: entrada.guarderia_id,
      aula_id: entrada.aula_id,
      anotacion: "Salida automática registrada por el sistema a las 18:00",
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from("registros_asistencia")
      .insert(salidasAutomaticas)
      .select();

    if (insertError) {
      console.error("Error al insertar salidas automáticas:", insertError);
      throw insertError;
    }

    console.log(`✅ Salidas automáticas registradas: ${insertedData.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Salidas automáticas registradas exitosamente`,
        procesados: insertedData.length,
        fecha: fechaHoy,
        hora: "18:00",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error en función de cierre automático:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error desconocido",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});








