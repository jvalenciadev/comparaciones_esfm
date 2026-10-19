"use client";

import React, { useMemo } from "react";
import { FilaResumen } from "../../types";
import { exportarExcelResumen } from "../../lib/exportar";
import { Download, Building2 } from "lucide-react";

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
  const totConv = filtrados.reduce((acc, r) => acc + r.itemsConvocatoria, 0);
  const tot3a = filtrados.reduce((acc, r) => acc + r.anios3, 0);
  const tot2a = filtrados.reduce((acc, r) => acc + r.anios2, 0);
  const tot1a = filtrados.reduce((acc, r) => acc + r.anios1, 0);
  const totInam = filtrados.reduce((acc, r) => acc + r.conInamovilidad, 0);
  const totDif = totConv - tot2023;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
            <Building2 size={20} color="var(--accent-blue)" />
            Consolidado Institucional por ESFM / UA
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Comparativa total de plazas entre la Gestión 2023 y la Publicación de Convocatoria (desglosado en 3 años, 2 años, 1 año compulsa e inamovilidades).
          </p>
        </div>

        <button
          onClick={() => exportarExcelResumen(filtrados)}
          className="btn-primary"
        >
          <Download size={16} />
          Exportar Reporte Resumen en Excel
        </button>
      </div>

      {/* KPI Cards de Resumen */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="title">Total Ítems Gestión 2023</div>
          <div className="val">{tot2023.toLocaleString()}</div>
          <span className="badge badge-yellow">Línea Base</span>
        </div>
        <div className="metric-card">
          <div className="title">Total Convocatoria</div>
          <div className="val">{totConv.toLocaleString()}</div>
          <span className="badge badge-green">
            3a: {tot3a} | 2a: {tot2a} | 1a: {tot1a}
          </span>
        </div>
        <div className="metric-card">
          <div className="title">Diferencia Neta (Conv - 2023)</div>
          <div className="val" style={{ color: totDif > 0 ? "var(--accent-emerald)" : totDif < 0 ? "var(--accent-amber)" : "#ffffff" }}>
            {totDif > 0 ? `+${totDif.toLocaleString()}` : totDif.toLocaleString()}
          </div>
          <span className={`badge ${totDif >= 0 ? "badge-green" : "badge-yellow"}`}>
            {totDif >= 0 ? "Incremento Neto" : "Reducción Neta"}
          </span>
        </div>
        <div className="metric-card">
          <div className="title">Plazas con Inamovilidad</div>
          <div className="val" style={{ color: "#f59e0b" }}>{totInam.toLocaleString()}</div>
          <span className="badge badge-yellow">Funcionarios Protegidos</span>
        </div>
      </div>

      {/* Tabla Resumen */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>ESFM / UA</th>
              <th style={{ textAlign: "right" }}>Ítems 2023</th>
              <th style={{ textAlign: "right" }}>Convocatoria</th>
              <th style={{ textAlign: "right" }}>3 Años</th>
              <th style={{ textAlign: "right" }}>2 Años</th>
              <th style={{ textAlign: "right" }}>1 Año (Comp.)</th>
              <th style={{ textAlign: "right" }}>Inamovilidad</th>
              <th style={{ textAlign: "right" }}>Diferencia</th>
              <th style={{ textAlign: "center", width: "180px" }}>Comparativa Visual</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No hay instituciones registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtrados.map((r, idx) => {
                const maxVal = Math.max(r.items2023, r.itemsConvocatoria, 1);
                const pct23 = Math.round((r.items2023 / maxVal) * 100);
                const pctConv = Math.round((r.itemsConvocatoria / maxVal) * 100);

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{r.departamento}</td>
                    <td>{r.esfm}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                      {r.items2023}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
                      {r.itemsConvocatoria}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#93c5fd" }}>
                      {r.anios3}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a" }}>
                      {r.anios2}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd" }}>
                      {r.anios1}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: r.conInamovilidad > 0 ? "#f59e0b" : "#6b7280" }}>
                      {r.conInamovilidad > 0 ? r.conInamovilidad : "—"}
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
                          <span style={{ fontSize: "0.65rem", color: "#9ca3af", width: "32px" }}>Conv</span>
                          <div style={{ flex: 1, background: "#1f2937", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pctConv}%`, background: "#3b82f6", height: "100%" }} />
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
