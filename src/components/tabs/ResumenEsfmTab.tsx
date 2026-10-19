"use client";

import React, { useMemo } from "react";
import { FilaResumen } from "../../types";

interface Props {
  resumen: FilaResumen[];
  filtroDepto: string;
  filtroEsfm: string;
}

export const ResumenEsfmTab: React.FC<Props> = ({
  resumen,
  filtroDepto,
  filtroEsfm,
}) => {
  const filtrados = useMemo(() => {
    return resumen.filter((r) => {
      if (filtroDepto && r.departamento !== filtroDepto) return false;
      if (filtroEsfm && r.esfm !== filtroEsfm) return false;
      return true;
    });
  }, [resumen, filtroDepto, filtroEsfm]);

  const tot2023 = filtrados.reduce((acc, r) => acc + r.items2023, 0);
  const totPub = filtrados.reduce((acc, r) => acc + r.itemsOficial, 0);
  const totDif = totPub - tot2023;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
          🏛️ Consolidado Cuantitativo por Institución
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          Comparativa total de plazas entre la Gestión 2023 y la Convocatoria Oficial Publicada.
        </p>
      </div>

      {/* KPI Cards de Resumen */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="title">Total Ítems Gestión 2023</div>
          <div className="val">{tot2023.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="title">Total Ítems Oficial Publicado</div>
          <div className="val">{totPub.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="title">Diferencia Neta</div>
          <div className="val" style={{ color: totDif > 0 ? "var(--accent-emerald)" : totDif < 0 ? "var(--accent-amber)" : "#ffffff" }}>
            {totDif > 0 ? `+${totDif.toLocaleString()}` : totDif.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabla Resumen */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>ESFM / UA</th>
              <th style={{ textAlign: "right" }}>Total Ítems 2023</th>
              <th style={{ textAlign: "right" }}>Total Ítems Oficial</th>
              <th style={{ textAlign: "right" }}>Diferencia (Pub - 2023)</th>
              <th style={{ textAlign: "center", width: "220px" }}>Comparativa Visual</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No hay instituciones registradas.
                </td>
              </tr>
            ) : (
              filtrados.map((r, idx) => {
                const maxVal = Math.max(r.items2023, r.itemsOficial, 1);
                const pct23 = Math.round((r.items2023 / maxVal) * 100);
                const pctPub = Math.round((r.itemsOficial / maxVal) * 100);

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{r.departamento}</td>
                    <td>{r.esfm}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                      {r.items2023}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
                      {r.itemsOficial}
                    </td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 700,
                      color: r.diferencia > 0 ? "var(--accent-emerald)" : r.diferencia < 0 ? "var(--accent-amber)" : "var(--text-muted)",
                    }}>
                      {r.diferencia > 0 ? `+${r.diferencia}` : r.diferencia}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "0.65rem", color: "#9ca3af", width: "32px" }}>'23</span>
                          <div style={{ flex: 1, background: "#1f2937", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pct23}%`, background: "#f59e0b", height: "100%" }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "0.65rem", color: "#9ca3af", width: "32px" }}>Pub</span>
                          <div style={{ flex: 1, background: "#1f2937", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pctPub}%`, background: "#3b82f6", height: "100%" }} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
