"use client";

import React, { useState, useMemo } from "react";
import { FilaControlTope } from "../../types";
import { exportarExcelTopes } from "../../lib/exportar";
import { Download, AlertOctagon, CheckCircle2, AlertCircle } from "lucide-react";

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
  const totConv = filtrados.reduce((acc, r) => acc + r.convocadosOficial, 0);
  const totDif = totConv - totTope;
  const exceden = filtrados.filter((r) => r.diferencia > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
          🎯 Verificación de Tope de Docentes Requeridos (Planilla SEP vs Oficial Publicado)
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          La Planilla SEP (PLA0926_DGFM estado=1) establece el tope presupuestario asignado. Este módulo verifica si las plazas docentes convocadas cumplen o exceden dicho límite.
        </p>
      </div>

      {/* KPI Topes */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="title">Tope Docentes (Planilla SEP)</div>
          <div className="val">{totTope.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="title">Docentes Convocados (Oficial)</div>
          <div className="val">{totConv.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="title">Diferencia Neta Nacional</div>
          <div className="val" style={{ color: totDif > 0 ? "var(--accent-rose)" : totDif < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
            {totDif > 0 ? `+${totDif.toLocaleString()}` : totDif.toLocaleString()}
          </div>
        </div>
        <div className="metric-card">
          <div className="title">Alertas de Sobregiro</div>
          <div className="val" style={{ color: exceden.length > 0 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
            {exceden.length} {exceden.length === 1 ? "Institución" : "Instituciones"}
          </div>
          <span className={`badge ${exceden.length > 0 ? "badge-red" : "badge-green"}`}>
            {exceden.length > 0 ? "Exceden Tope" : "Cuadre Normal"}
          </span>
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
            🔴 Excede Tope (Sobregiro)
          </button>
          <button
            onClick={() => setFiltroEstado("FALTA")}
            className="btn-secondary"
            style={filtroEstado === "FALTA" ? { borderColor: "var(--accent-amber)", background: "rgba(245, 158, 11, 0.2)", color: "#fde68a" } : {}}
          >
            🟡 Faltan por Convocar
          </button>
          <button
            onClick={() => setFiltroEstado("CUADRE")}
            className="btn-secondary"
            style={filtroEstado === "CUADRE" ? { borderColor: "var(--accent-emerald)", background: "rgba(16, 185, 129, 0.2)", color: "#a7f3d0" } : {}}
          >
            🟢 Cuadre Exacto
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
              <th style={{ textAlign: "right" }}>Tope Docentes (SEP)</th>
              <th style={{ textAlign: "right" }}>Convocados (Oficial)</th>
              <th style={{ textAlign: "right" }}>Diferencia (Pub - Tope)</th>
              <th style={{ textAlign: "center" }}>Estado de Presupuesto</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No se encontraron registros con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtrados.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{row.departamento}</td>
                  <td>{row.esfm}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>{row.topeSEP}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>{row.convocadosOficial}</td>
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
