import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Search, Users, Building, X, Download } from "lucide-react";
import { toast } from "sonner";

export function TercerosList() {
  const [terceros, setTerceros] = useState<any[]>([]);
  const [guarderias, setGuarderias] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuarderia, setSelectedGuarderia] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTercero, setSelectedTercero] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchGuarderias();
  }, []);

  useEffect(() => {
    fetchTerceros();
  }, [searchQuery, selectedGuarderia]);

  const fetchGuarderias = async () => {
    const { data, error } = await supabase.from("guarderias").select("id, nombre");
    if (error) {
      toast.error("No se pudieron cargar las guarderías");
      return;
    }
    setGuarderias(data || []);
  };

  const fetchTerceros = async () => {
    setLoading(true);
    let query = supabase.from("terceros").select(`
      id, nombres, apellidos, tipo_documento, numero_documento,
      telefono, email, direccion, parentesco,
      foto_id_frente, foto_id_reverso,
      guarderias (nombre)
    `);

    if (selectedGuarderia) query = query.eq("guarderia_id", selectedGuarderia);
    if (searchQuery.trim()) query = query.ilike("nombres", `%${searchQuery}%`);

    const { data, error } = await query.order("created_at", { ascending: false });
    setLoading(false);

    if (error) {
      toast.error("No se pudieron cargar los terceros");
      return;
    }
    setTerceros(data || []);
  };

  const handleSelectTercero = (tercero: any) => {
    setSelectedTercero(tercero);
    setModalOpen(true);
  };

  /** ✅ Descarga usando directamente la URL pública */
  const downloadImage = async (url: string, nombre: string) => {
    try {
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Descargando ${nombre}`);
    } catch {
      toast.error("No se pudo descargar la imagen");
    }
  };

  const totalPages = Math.ceil(terceros.length / itemsPerPage);
  const paginatedTerceros = terceros.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
        <Users className="text-blue-600" /> Listado de Terceros
      </h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Search className="w-4 h-4 text-gray-500" /> Buscar por nombres
          </label>
          <input
            type="text"
            placeholder="Escribe un nombre..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Building className="w-4 h-4 text-gray-500" /> Filtrar por guardería
          </label>
          <select
            value={selectedGuarderia}
            onChange={(e) => {
              setSelectedGuarderia(e.target.value);
              setCurrentPage(1);
            }}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Todas</option>
            {guarderias.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de terceros */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500 animate-pulse">Cargando...</p>
        ) : paginatedTerceros.length === 0 ? (
          <p className="text-sm text-gray-500">No hay registros disponibles.</p>
        ) : (
          paginatedTerceros.map((tercero) => (
            <div
              key={tercero.id}
              onClick={() => handleSelectTercero(tercero)}
              className="p-3 border rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer transition"
            >
              <p className="font-medium text-gray-900 text-sm md:text-base">
                {tercero.nombres} {tercero.apellidos}
              </p>
              <p className="text-xs md:text-sm text-gray-600">
                Doc: {tercero.tipo_documento} {tercero.numero_documento}
              </p>
              <p className="text-xs text-gray-500">
                Guardería: {tercero.guarderias?.nombre || "N/A"}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-2 py-1 text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedTercero && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-2">
          <div className="bg-white max-w-2xl w-full rounded-xl p-6 relative overflow-auto max-h-[90vh]">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
            >
              <X />
            </button>
            <h3 className="text-lg md:text-xl font-semibold mb-4">
              Detalles del Tercero
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
              <p><strong>Nombre:</strong> {selectedTercero.nombres} {selectedTercero.apellidos}</p>
              <p><strong>Documento:</strong> {selectedTercero.tipo_documento} {selectedTercero.numero_documento}</p>
              <p><strong>Teléfono:</strong> {selectedTercero.telefono || "N/A"}</p>
              <p><strong>Email:</strong> {selectedTercero.email || "N/A"}</p>
              <p><strong>Dirección:</strong> {selectedTercero.direccion || "N/A"}</p>
              <p><strong>Parentesco:</strong> {selectedTercero.parentesco || "N/A"}</p>
              <p><strong>Guardería:</strong> {selectedTercero.guarderias?.nombre || "N/A"}</p>
            </div>

            <h4 className="text-lg font-semibold mb-2">Fotos del ID</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTercero.foto_id_frente && (
                <div className="flex flex-col items-center">
                  <img
                    src={selectedTercero.foto_id_frente}
                    alt="Frente ID"
                    className="w-full rounded border"
                  />
                  <button
                    onClick={() =>
                      downloadImage(
                        selectedTercero.foto_id_frente,
                        `ID_Frente_${selectedTercero.nombres}.jpg`
                      )
                    }
                    className="mt-2 flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" /> Descargar Frente
                  </button>
                </div>
              )}

              {selectedTercero.foto_id_reverso && (
                <div className="flex flex-col items-center">
                  <img
                    src={selectedTercero.foto_id_reverso}
                    alt="Reverso ID"
                    className="w-full rounded border"
                  />
                  <button
                    onClick={() =>
                      downloadImage(
                        selectedTercero.foto_id_reverso,
                        `ID_Reverso_${selectedTercero.nombres}.jpg`
                      )
                    }
                    className="mt-2 flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" /> Descargar Reverso
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
