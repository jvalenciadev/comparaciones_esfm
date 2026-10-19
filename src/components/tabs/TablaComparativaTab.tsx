"use client";

import React, { useState, useMemo } from "react";
import { FilaComparativa, FilaResumen } from "../../types";
import { exportarExcelComparativo } from "../../lib/exportar";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  tabla: FilaComparativa[];
  resumen: FilaResumen[];
  filtroDepto: string;
  filtroEsfm: string;
  filtroCat: string;
  soloDiscrepancias: boolean;
}

export const TablaComparativaTab: React.FC<Props> = ({
  tabla,
  resumen,
  filtroDepto,
  filtroEsfm,
  filtroCat,
  soloDiscrepancias,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const filtrados = useMemo(() => {
    return tabla.filter((r) => {
      if (filtroDepto && r.departamento !== filtroDepto) return false;
      if (filtroEsfm && r.esfm_display !== filtroEsfm) return false;
      if (filtroCat && r.categoria !== filtroCat) return false;
      if (soloDiscrepancias && r.diagnostico === "Ratificado en convocatoria") return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesCargo = r.descripcion_cargo.toLowerCase().includes(term);
        const matchesOficial = r.cargo_oficial_homologado.toLowerCase().includes(term);
        const matchesEsfm = r.esfm_display.toLowerCase().includes(term);
        const matchesDiag = r.diagnostico.toLowerCase().includes(term);
        if (!matchesCargo && !matchesOficial && !matchesEsfm && !matchesDiag) {
          return false;
        }
      }

      return true;
    });
  }, [tabla, filtroDepto, filtroEsfm, filtroCat, soloDiscrepancias, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, currentPage, pageSize]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Barra superior de herramientas y estadísticas */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
            {filtrados.length.toLocaleString()}
          </span>{" "}
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            registros centralizados · {new Set(filtrados.map((r) => r.esfm_key)).size} ESFM/UA
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} color="#9ca3af" style={{ position: "absolute", left: "10px", top: "11px" }} />
            <input
              type="text"
              placeholder="Buscar cargo, especialidad o ESFM..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input"
              style={{ paddingLeft: "32px", width: "100%" }}
            />
          </div>

          <button
            onClick={() => exportarExcelComparativo(filtrados, resumen)}
            className="btn-primary"
          >
            <Download size={16} />
            Exportar Excel Consolidado
          </button>
        </div>
      </div>

      {/* Tabla con scroll y encabezado fijo */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>ESFM / UA</th>
              <th>Categoría</th>
              <th>Cargo / Especialidad</th>
              <th>Cargo Oficial Sugerido</th>
              <th style={{ textAlign: "right" }}>Ítems 2023</th>
              <th style={{ textAlign: "right" }}>Ítems Oficial</th>
              <th style={{ textAlign: "center" }}>SEP</th>
              <th style={{ textAlign: "center" }}>SIFMWEB</th>
              <th>Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No se encontraron registros con los criterios aplicados.
                </td>
              </tr>
            ) : (
              currentRecords.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{r.departamento}</td>
                  <td>{r.esfm_display}</td>
                  <td>
                    <span className={`badge ${r.categoria === "DOCENTE" ? "badge-blue" : "badge-yellow"}`}>
                      {r.categoria}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.descripcion_cargo}</td>
                  <td style={{ color: "#93c5fd", fontStyle: "italic" }}>
                    {r.cargo_oficial_homologado}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                    {r.items_gestion_2023 ?? "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
                    {r.items_oficial_publicado ?? "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {r.en_planilla_sep ?? "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {r.en_sifmweb ?? "—"}
                  </td>
                  <td>
                    <span className={
                      r.diagnostico.includes("sin personal") || r.diagnostico.includes("sin plaza")
                        ? "badge-red"
                        : r.diagnostico.includes("Nuevo") || r.diagnostico.includes("no figura")
                        ? "badge-yellow"
                        : "badge-green"
                    }>
                      {r.diagnostico}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación reactiva */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Página {currentPage} de {totalPages} (Mostrando {currentRecords.length} de {filtrados.length} filas)
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="form-select"
              style={{ padding: "4px 8px" }}
            >
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
              <option value={200}>200 por página</option>
            </select>

            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn-secondary"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
