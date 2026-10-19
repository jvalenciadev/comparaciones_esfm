"use client";

import React, { useState, useMemo } from "react";
import { FilaComparativa } from "../../types";
import { AlertCircle, PlusCircle, MinusCircle, UserX, ShieldAlert } from "lucide-react";

interface Props {
  tabla: FilaComparativa[];
  filtroDepto: string;
  filtroEsfm: string;
}

export const DiscrepanciasTab: React.FC<Props> = ({
  tabla,
  filtroDepto,
  filtroEsfm,
}) => {
  const [selectedTipo, setSelectedTipo] = useState<string>("ALL");

  const discrepancias = useMemo(() => {
    return tabla.filter((r) => {
      if (filtroDepto && r.departamento !== filtroDepto) return false;
      if (filtroEsfm && r.esfm_display !== filtroEsfm) return false;
      return r.diagnostico !== "Ratificado en convocatoria";
    });
  }, [tabla, filtroDepto, filtroEsfm]);

  const sinPersonalSep = discrepancias.filter((r) => r.diagnostico.includes("sin personal asignado en SEP"));
  const nuevosOficial = discrepancias.filter((r) => r.diagnostico.includes("Nuevo ítem incorporado"));
  const noFiguraOficial = discrepancias.filter((r) => r.diagnostico.includes("no figura en Oficial Publicado"));
  const cubiertoSinPlaza = discrepancias.filter((r) => r.diagnostico.includes("Cubierto en SEP sin plaza"));

  const filtrados = useMemo(() => {
    if (selectedTipo === "SIN_SEP") return sinPersonalSep;
    if (selectedTipo === "NUEVO") return nuevosOficial;
    if (selectedTipo === "NO_OFICIAL") return noFiguraOficial;
    if (selectedTipo === "SIN_PLAZA") return cubiertoSinPlaza;
    return discrepancias;
  }, [selectedTipo, discrepancias, sinPersonalSep, nuevosOficial, noFiguraOficial, cubiertoSinPlaza]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
          🔍 Análisis Profundo de Discrepancias y Alertas
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          Plazas con inconsistencias presupuestarias, variaciones históricas o desalineación con la Planilla SEP.
        </p>
      </div>

      {/* Tarjetas de Categoría de Discrepancia */}
      <div className="metrics-grid">
        <div
          onClick={() => setSelectedTipo(selectedTipo === "SIN_SEP" ? "ALL" : "SIN_SEP")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: selectedTipo === "SIN_SEP" ? "var(--accent-rose)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <UserX size={16} color="#ef4444" />
            Sin Personal en SEP
          </div>
          <div className="val" style={{ color: "#ef4444" }}>{sinPersonalSep.length}</div>
          <span className="badge badge-red">Convocado sin SEP</span>
        </div>

        <div
          onClick={() => setSelectedTipo(selectedTipo === "NUEVO" ? "ALL" : "NUEVO")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: selectedTipo === "NUEVO" ? "var(--accent-blue)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <PlusCircle size={16} color="#3b82f6" />
            Nuevos Ítems
          </div>
          <div className="val" style={{ color: "#60a5fa" }}>{nuevosOficial.length}</div>
          <span className="badge badge-blue">Alta en Oficial</span>
        </div>

        <div
          onClick={() => setSelectedTipo(selectedTipo === "NO_OFICIAL" ? "ALL" : "NO_OFICIAL")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: selectedTipo === "NO_OFICIAL" ? "var(--accent-amber)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <MinusCircle size={16} color="#f59e0b" />
            Eliminados de Convocatoria
          </div>
          <div className="val" style={{ color: "#f59e0b" }}>{noFiguraOficial.length}</div>
          <span className="badge badge-yellow">En 2023 pero no en Oficial</span>
        </div>

        <div
          onClick={() => setSelectedTipo(selectedTipo === "SIN_PLAZA" ? "ALL" : "SIN_PLAZA")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: selectedTipo === "SIN_PLAZA" ? "var(--accent-rose)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <ShieldAlert size={16} color="#ec4899" />
            En SEP sin Plaza Oficial
          </div>
          <div className="val" style={{ color: "#f472b6" }}>{cubiertoSinPlaza.length}</div>
          <span className="badge badge-red">Riesgo Institucional</span>
        </div>
      </div>

      {/* Tabla detallada de discrepancias */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>ESFM / UA</th>
              <th>Categoría</th>
              <th>Cargo / Especialidad</th>
              <th>Cargo Oficial Homologado</th>
              <th style={{ textAlign: "right" }}>Ítems 2023</th>
              <th style={{ textAlign: "right" }}>Ítems Oficial</th>
              <th>Tipo de Discrepancia</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No se detectaron discrepancias con los filtros actuales.
                </td>
              </tr>
            ) : (
              filtrados.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{r.departamento}</td>
                  <td>{r.esfm_display}</td>
                  <td>
                    <span className={`badge ${r.categoria === "DOCENTE" ? "badge-blue" : "badge-yellow"}`}>
                      {r.categoria}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.descripcion_cargo}</td>
                  <td style={{ color: "#93c5fd" }}>{r.cargo_oficial_homologado}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                    {r.items_gestion_2023 ?? "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
                    {r.items_oficial_publicado ?? "—"}
                  </td>
                  <td>
                    <span className={
                      r.diagnostico.includes("sin personal") || r.diagnostico.includes("sin plaza")
                        ? "badge-red"
                        : "badge-yellow"
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
    </div>
  );
};
