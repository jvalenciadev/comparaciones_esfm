"use client";

import React, { useMemo } from "react";
import { FilaComparativa, FilaResumen } from "../../types";

interface Props {
  tabla: FilaComparativa[];
  resumen: FilaResumen[];
}

export const EstadisticasTab: React.FC<Props> = ({ tabla, resumen }) => {
  // Consolidado por Departamento
  const deptoStats = useMemo(() => {
    const map = new Map<string, { total2023: number; totalPub: number; instituciones: number }>();

    for (const r of resumen) {
      const d = r.departamento || "SIN DEPTO";
      const item = map.get(d);
      if (!item) {
        map.set(d, { total2023: r.items2023, totalPub: r.itemsOficial, instituciones: 1 });
      } else {
        item.total2023 += r.items2023;
        item.totalPub += r.itemsOficial;
        item.instituciones += 1;
      }
    }

    return Array.from(map.entries())
      .map(([departamento, stats]) => ({
        departamento,
        ...stats,
        diferencia: stats.totalPub - stats.total2023,
      }))
      .sort((a, b) => b.totalPub - a.totalPub);
  }, [resumen]);

  const maxVal = Math.max(...deptoStats.map((d) => Math.max(d.total2023, d.totalPub)), 1);

  // Docente vs Administrativo
  const catStats = useMemo(() => {
    let doc2023 = 0, docPub = 0, adm2023 = 0, admPub = 0;
    for (const r of tabla) {
      if (r.categoria === "DOCENTE") {
        doc2023 += r.items_gestion_2023 ?? 0;
        docPub += r.items_oficial_publicado ?? 0;
      } else {
        adm2023 += r.items_gestion_2023 ?? 0;
        admPub += r.items_oficial_publicado ?? 0;
      }
    }
    return { doc2023, docPub, adm2023, admPub };
  }, [tabla]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
          📈 Tablero Estadístico Nacional
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          Distribución de plazas por Departamento y desagregación por categoría ocupacional.
        </p>
      </div>

      {/* Gráfico de Barras por Departamento */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
          Plazas Convocadas por Departamento (Gestión 2023 vs Oficial Publicado)
        </h4>

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", fontSize: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", background: "#f59e0b", borderRadius: "2px" }} />
            <span style={{ color: "var(--text-muted)" }}>Gestión 2023</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "2px" }} />
            <span style={{ color: "var(--text-muted)" }}>Oficial Publicado</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {deptoStats.map((d, idx) => {
            const pct23 = Math.round((d.total2023 / maxVal) * 100);
            const pctPub = Math.round((d.totalPub / maxVal) * 100);

            return (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ fontWeight: 600, color: "#ffffff" }}>
                    {d.departamento} <span style={{ color: "#64748b", fontSize: "0.75rem" }}>({d.instituciones} ESFM/UA)</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", color: "#cbd5e1" }}>
                    2023: <strong>{d.total2023}</strong> | Oficial: <strong style={{ color: "#60a5fa" }}>{d.totalPub}</strong> ({d.diferencia >= 0 ? `+${d.diferencia}` : d.diferencia})
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ height: "8px", background: "#1f2937", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct23}%`, background: "#f59e0b", height: "100%", borderRadius: "4px" }} />
                  </div>
                  <div style={{ height: "8px", background: "#1f2937", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pctPub}%`, background: "#3b82f6", height: "100%", borderRadius: "4px" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tarjetas comparativas Docentes vs Administrativos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#60a5fa", marginBottom: "8px" }}>
            🎓 Plazas Docentes (Catedráticos)
          </h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Gestión 2023:</span>
            <span style={{ fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>{catStats.doc2023.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Oficial Publicado:</span>
            <span style={{ fontWeight: 700, color: "#60a5fa", fontFamily: "var(--font-mono, monospace)" }}>{catStats.docPub.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Variación Neta:</span>
            <span style={{ fontWeight: 700, color: catStats.docPub >= catStats.doc2023 ? "var(--accent-emerald)" : "var(--accent-amber)", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.docPub - catStats.doc2023 >= 0 ? `+${catStats.docPub - catStats.doc2023}` : catStats.docPub - catStats.doc2023}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>
            💼 Plazas Administrativas / Directivas
          </h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Gestión 2023:</span>
            <span style={{ fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>{catStats.adm2023.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Oficial Publicado:</span>
            <span style={{ fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono, monospace)" }}>{catStats.admPub.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ color: "var(--text-muted)" }}>Variación Neta:</span>
            <span style={{ fontWeight: 700, color: catStats.admPub >= catStats.adm2023 ? "var(--accent-emerald)" : "var(--accent-amber)", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.admPub - catStats.adm2023 >= 0 ? `+${catStats.admPub - catStats.adm2023}` : catStats.admPub - catStats.adm2023}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
