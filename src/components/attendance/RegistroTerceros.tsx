import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import {
  Baby,
  Search,
  CheckCircle,
  XCircle,
  UploadCloud,
} from "lucide-react";


interface Nino {
  id: string;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  guarderia_id: string;
  aula_id: string | null;
  aula_nombre?: string | null;
}

interface Acudiente {
  id: string;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  parentesco: string;
}

export default function RegistroTerceros() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [nino, setNino] = useState<Nino | null>(null);
  const [acudientes, setAcudientes] = useState<Acudiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [registroHoy, setRegistroHoy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [tercero, setTercero] = useState({
    nombres: "",
    apellidos: "",
    tipo_documento: "CC",
    numero_documento: "",
    telefono: "",
    email: "",
    direccion: "",
    parentesco: "",
    foto_frente: "",
    foto_reverso: "",
  });

  const fechaLocal = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (search.trim().length < 2 || !user?.guarderia_id) {
        setNinos([]);
        return;
      }
      setLoading(true);

      const { data, error } = await supabase
        .from("ninos")
        .select("id, nombres, apellidos, numero_documento, guarderia_id, aula_id")
        .eq("guarderia_id", user.guarderia_id)
        .or(
          `nombres.ilike.%${search}%,apellidos.ilike.%${search}%,numero_documento.ilike.%${search}%`
        )
        .limit(10);

      if (error) {
        toast.error("Error buscando niños");
      } else {
        setNinos(data || []);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, user?.guarderia_id]);

  const seleccionarNino = async (n: Nino) => {
    setSearch(`${n.nombres} ${n.apellidos}`);
    setNinos([]);
    setLoading(true);

    const { data, error } = await supabase
      .from("ninos")
      .select(`
        id, nombres, apellidos, numero_documento, guarderia_id, aula_id,
        aulas ( nombre_aula ),
        nino_acudiente (
          parentesco,
          acudientes ( id, nombres, apellidos, numero_documento )
        )
      `)
      .eq("id", n.id)
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error("Error cargando datos del niño");
      return;
    }

    setNino({
      id: data.id,
      nombres: data.nombres,
      apellidos: data.apellidos,
      numero_documento: data.numero_documento,
      aula_id: data.aula_id,
      aula_nombre: data.aulas?.nombre_aula || "",
      guarderia_id: data.guarderia_id,
    });

    setAcudientes(
      (data.nino_acudiente || []).map((rel: any) => ({
        id: rel.acudientes.id,
        nombres: rel.acudientes.nombres,
        apellidos: rel.acudientes.apellidos,
        numero_documento: rel.acudientes.numero_documento,
        parentesco: rel.parentesco,
      }))
    );

    const { data: registro } = await supabase
      .from("registros_asistencia")
      .select("tipo")
      .eq("nino_id", n.id)
      .eq("fecha", fechaLocal)
      .order("created_at", { ascending: false })
      .limit(1);

    setRegistroHoy(registro?.length ? registro[0].tipo : null);
  };

  const uploadImage = async (file: File, path: "frenteId" | "reversoId") => {
    const fileName = `${uuidv4()}-${file.name}`;
    const { error } = await supabase.storage
      .from("idsterceros")
      .upload(`${path}/${fileName}`, file);

    if (error) {
      toast.error("Error subiendo la imagen");
      return "";
    }
    toast.success("Imagen subida correctamente");
    return supabase.storage
      .from("idsterceros")
      .getPublicUrl(`${path}/${fileName}`).data.publicUrl;
  };

  const registrarAsistencia = async (tipo: "entrada" | "salida") => {
    if (!user) return toast.error("Debe iniciar sesión");
    if (!nino) return toast.error("Seleccione un niño primero");
    if (!nino.aula_id) return toast.error("El niño no tiene aula asignada");
    if (!tercero.nombres || !tercero.apellidos || !tercero.numero_documento)
      return toast.error("Complete los datos obligatorios del tercero");

    setSaving(true);

    const { data: terceroData, error: terceroError } = await supabase
      .from("terceros")
      .insert([{
        nombres: tercero.nombres,
        apellidos: tercero.apellidos,
        tipo_documento: tercero.tipo_documento,
        numero_documento: tercero.numero_documento,
        telefono: tercero.telefono || null,
        email: tercero.email || null,
        direccion: tercero.direccion || null,
        parentesco: tercero.parentesco || null,
        foto_id_frente: tercero.foto_frente,
        foto_id_reverso: tercero.foto_reverso,
        guarderia_id: user.guarderia_id,
        aula_id: nino.aula_id,
      }])
      .select()
      .single();

    if (terceroError) {
      toast.error(`Error registrando tercero`);
      setSaving(false);
      return;
    }

    const { error: asistenciaError } = await supabase
      .from("registros_asistencia")
      .insert([{
        tipo,
        nino_id: nino.id,
        tercero_id: terceroData.id,
        usuario_registra_id: user.id,
        fecha: fechaLocal,
        guarderia_id: user.guarderia_id,
        aula_id: nino.aula_id,
      }]);

    setSaving(false);

    if (asistenciaError) {
      toast.error("Error registrando asistencia");
      return;
    }

    toast.success(`✅ Registro de ${tipo.toUpperCase()} exitoso`);

    setTercero({
      nombres: "",
      apellidos: "",
      tipo_documento: "CC",
      numero_documento: "",
      telefono: "",
      email: "",
      direccion: "",
      parentesco: "",
      foto_frente: "",
      foto_reverso: "",
    });
    setRegistroHoy(tipo);
  };

  return  (
  <div className="min-h-screen bg-gradient-to-br from-mint-50 via-sky-50 to-blue-50 p-6">
    <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Baby className="w-6 h-6 text-mint-600" />
        Registro de Terceros
      </h2>

      {/* Buscar niño */}
      <div className="relative mb-6">
        <div className="flex items-center bg-gray-50 border rounded-lg px-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar niño por nombre o documento"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent w-full p-2 focus:outline-none"
          />
        </div>
        {loading && <p className="text-sm text-gray-500 mt-1">Buscando...</p>}
        {search.trim() && ninos.length > 0 && (
          <ul className="absolute w-full bg-white border rounded-lg shadow-md mt-1 max-h-48 overflow-auto z-10">
            {ninos.map((n) => (
              <li
                key={n.id}
                onClick={() => seleccionarNino(n)}
                className="px-3 py-2 hover:bg-mint-50 cursor-pointer"
              >
                {n.nombres} {n.apellidos} - {n.numero_documento}
              </li>
            ))}
          </ul>
        )}
      </div>

      {nino && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 mb-6">
          <h3 className="font-bold text-lg text-gray-800">
            {nino.nombres} {nino.apellidos}
          </h3>
          <p className="text-gray-700">Documento: {nino.numero_documento}</p>
          {nino.aula_nombre && <p>Aula: {nino.aula_nombre}</p>}
          <p className="mt-2 font-semibold text-gray-800">Acudientes:</p>
          <ul className="list-disc list-inside text-gray-700">
            {acudientes.map((a) => (
              <li key={a.id}>
                {a.nombres} {a.apellidos} ({a.parentesco})
              </li>
            ))}
          </ul>
        </div>
      )}

      {nino && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-800">Datos del Tercero</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(
              [
                ["Nombres", "nombres"],
                ["Apellidos", "apellidos"],
                ["Número Documento", "numero_documento"],
                ["Teléfono", "telefono"],
                ["Email", "email"],
                ["Dirección", "direccion"],
                ["Parentesco", "parentesco"],
              ] as [string, keyof typeof tercero][]
            ).map(([placeholder, key]) => {
              // Ajustamos el tipo de input según el campo
              let extraProps: any = {};
              if (key === "telefono") {
                extraProps = {
                  type: "tel",
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                };
              }
              if (key === "email") {
                extraProps = { type: "email" };
              }
              return (
                <input
                  key={key}
                  placeholder={placeholder}
                  className="border rounded-lg p-2 focus:ring-2 focus:ring-mint-300"
                  value={tercero[key]}
                  onChange={(e) =>
                    setTercero({ ...tercero, [key]: e.target.value })
                  }
                  {...extraProps}
                />
              );
            })}

            <select
              className="border rounded-lg p-2 focus:ring-2 focus:ring-mint-300"
              value={tercero.tipo_documento}
              onChange={(e) =>
                setTercero({ ...tercero, tipo_documento: e.target.value })
              }
            >
              <option value="CC">CC</option>
              <option value="TI">TI</option>
              <option value="CE">CE</option>
            </select>
          </div>

          {/* Subida imágenes */}
          <p className="mt-4 text-gray-700 font-medium">
            Foto del documento de identidad por ambos lados
          </p>
          <div className="mt-2 flex gap-3">
            <label className="cursor-pointer flex items-center gap-2 bg-mint-50 border border-mint-200 rounded-lg px-3 py-2 hover:bg-mint-100 transition">
              <UploadCloud className="w-5 h-5 text-mint-600" />
              Frente
              <input
                type="file"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadImage(e.target.files[0], "frenteId");
                    setTercero({ ...tercero, foto_frente: url });
                  }
                }}
              />
            </label>
            <label className="cursor-pointer flex items-center gap-2 bg-mint-50 border border-mint-200 rounded-lg px-3 py-2 hover:bg-mint-100 transition">
              <UploadCloud className="w-5 h-5 text-mint-600" />
              Reverso
              <input
                type="file"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadImage(e.target.files[0], "reversoId");
                    setTercero({ ...tercero, foto_reverso: url });
                  }
                }}
              />
            </label>
          </div>

          {/* Botones */}
          <div className="mt-4 flex gap-3">
            {!registroHoy && (
              <button
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-green-500 hover:bg-green-600 transition ${
                  saving ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={() => registrarAsistencia("entrada")}
              >
                <CheckCircle className="w-5 h-5" />
                Registrar ENTRADA
              </button>
            )}
            {registroHoy === "entrada" && (
              <button
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition ${
                  saving ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={() => registrarAsistencia("salida")}
              >
                <XCircle className="w-5 h-5" />
                Registrar SALIDA
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}