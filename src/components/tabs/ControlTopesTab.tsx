"use client";

import React, { useState, useMemo } from "react";
import { FilaControlTope } from "../../types";
import { exportarExcelTopes } from "../../lib/exportar";
import { Download, AlertOctagon } from "lucide-react";

interface Props {
  controlTopes: FilaControlTope[];
  filtroDepto: string;
  filtroEsfm: string;
}

export const ControlTopesTab: React.FC<Props> = ({
  controlTopes,
  filtroDepto,
  filtroEsfm,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");

  const filtrados = useMemo(() => {
    return controlTopes.filter((r) => {
      if (filtroDepto && r.departamento !== filtroDepto) return false;
      if (filtroEsfm && r.esfm !== filtroEsfm) return false;
      if (filtroEstado === "EXCEDE" && r.diferencia <= 0) return false;
      if (filtroEstado === "FALTA" && r.diferencia >= 0) return false;
      if (filtroEstado === "CUADRE" && r.diferencia !== 0) return false;
      return true;
    });
  }, [controlTopes, filtroDepto, filtroEsfm, filtroEstado]);

  const totTope = filtrados.reduce((acc, r) => acc + r.topeSEP, 0);
  const totConv = filtrados.reduce((acc, r) => acc + r.convocadosTotal, 0);
  const tot3a = filtrados.reduce((acc, r) => acc + r.anios3, 0);
  const tot2a = filtrados.reduce((acc, r) => acc + r.anios2, 0);
  const tot1a = filtrados.reduce((acc, r) => acc + r.anios1, 0);
  const totInam = filtrados.reduce((acc, r) => acc + r.inamovilidadDocente, 0);
  const totDif = totConv - totTope;
  const exceden = filtrados.filter((r) => r.diferencia > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
          🎯 Verificación de Tope de Docentes Requeridos (Planilla SEP vs Convocatoria Oficial)
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          La Planilla SEP (PLA0926_DGFM estado=1) establece el tope presupuestario asignado. Este módulo compara con la Convocatoria Oficial y permite incluir o excluir años (3a, 2a, 1a) e inamovilidades.
        </p>
      </div>

      {/* KPI Topes */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="title">Tope Docentes (Planilla SEP)</div>
          <div className="val">{totTope.toLocaleString()}</div>
          <span className="badge badge-blue">Techo Presupuestario</span>
        </div>
        <div className="metric-card">
          <div className="title">Docentes Convocados (Total)</div>
          <div className="val">{totConv.toLocaleString()}</div>
          <span className="badge badge-green">
            3a: {tot3a} | 2a: {tot2a} | 1a: {tot1a}
          </span>
        </div>
        <div className="metric-card">
          <div className="title">Diferencia Neta</div>
          <div className="val" style={{ color: totDif > 0 ? "var(--accent-rose)" : totDif < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
            {totDif > 0 ? `+${totDif.toLocaleString()}` : totDif.toLocaleString()}
          </div>
          <span className={`badge ${totDif > 0 ? "badge-red" : totDif < 0 ? "badge-yellow" : "badge-green"}`}>
            {totDif > 0 ? "Sobregiro" : totDif < 0 ? "Plazas Disponibles" : "Cuadre Exacto"}
          </span>
        </div>
        <div className="metric-card">
          <div className="title">Docentes con Inamovilidad</div>
          <div className="val" style={{ color: "#f59e0b" }}>{totInam}</div>
          <span className="badge badge-yellow">Observación Funcionaria</span>
        </div>
      </div>

      {/* Banner de Alerta si hay instituciones excediendo el tope */}
      {exceden.length > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "var(--radius-md)",
          padding: "16px 20px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
        }}>
          <AlertOctagon size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h4 style={{ color: "#fca5a5", fontSize: "0.95rem", fontWeight: 700 }}>
              ALERTA PRESUPUESTARIA: Se detectaron {exceden.length} ESFM/UA convocando MÁS docentes de los permitidos por su tope en Planilla SEP.
            </h4>
            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {exceden.map((e, idx) => (
                <span key={idx} className="badge badge-red">
                  {e.esfm} (+{e.diferencia})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros de Estado Presupuestario y Descarga */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setFiltroEstado("TODOS")}
            className={`btn-secondary ${filtroEstado === "TODOS" ? "active" : ""}`}
            style={filtroEstado === "TODOS" ? { borderColor: "var(--accent-blue)", background: "rgba(59, 130, 246, 0.2)" } : {}}
          >
            Todos ({controlTopes.length})
          </button>
          <button
            onClick={() => setFiltroEstado("EXCEDE")}
            className="btn-secondary"
            style={filtroEstado === "EXCEDE" ? { borderColor: "var(--accent-rose)", background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" } : {}}
          >
            🔴 Excede Tope ({controlTopes.filter((r) => r.diferencia > 0).length})
          </button>
          <button
            onClick={() => setFiltroEstado("FALTA")}
            className="btn-secondary"
            style={filtroEstado === "FALTA" ? { borderColor: "var(--accent-amber)", background: "rgba(245, 158, 11, 0.2)", color: "#fde68a" } : {}}
          >
            🟡 Faltan por Convocar ({controlTopes.filter((r) => r.diferencia < 0).length})
          </button>
          <button
            onClick={() => setFiltroEstado("CUADRE")}
            className="btn-secondary"
            style={filtroEstado === "CUADRE" ? { borderColor: "var(--accent-emerald)", background: "rgba(16, 185, 129, 0.2)", color: "#a7f3d0" } : {}}
          >
            🟢 Cuadre Exacto ({controlTopes.filter((r) => r.diferencia === 0).length})
          </button>
        </div>

        <button
          onClick={() => exportarExcelTopes(filtrados)}
          className="btn-primary"
        >
          <Download size={16} />
          Descargar Reporte en Excel
        </button>
      </div>

      {/* Tabla de Control de Topes */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>ESFM / UA</th>
              <th style={{ textAlign: "right" }}>Tope SEP</th>
              <th style={{ textAlign: "right" }}>Convocatoria</th>
              <th style={{ textAlign: "right" }}>3 Años</th>
              <th style={{ textAlign: "right" }}>2 Años</th>
              <th style={{ textAlign: "right" }}>1 Año (Comp.)</th>
              <th style={{ textAlign: "right" }}>Inamovilidad</th>
              <th style={{ textAlign: "right" }}>Diferencia</th>
              <th style={{ textAlign: "center" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No se encontraron registros con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtrados.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{row.departamento}</td>
                  <td>{row.esfm}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>{row.topeSEP}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>{row.convocadosTotal}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#93c5fd" }}>{row.anios3}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a" }}>{row.anios2}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd" }}>{row.anios1}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: row.inamovilidadDocente > 0 ? "#f59e0b" : "#6b7280" }}>
                    {row.inamovilidadDocente > 0 ? row.inamovilidadDocente : "—"}
                  </td>
                  <td style={{
                    textAlign: "right",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 700,
                    color: row.diferencia > 0 ? "var(--accent-rose)" : row.diferencia < 0 ? "var(--accent-amber)" : "var(--accent-emerald)",
                  }}>
                    {row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={
                      row.estado.includes("EXCEDE")
                        ? "badge-red"
                        : row.estado.includes("FALTAN")
                        ? "badge-yellow"
                        : "badge-green"
                    }>
                      {row.estado}
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
