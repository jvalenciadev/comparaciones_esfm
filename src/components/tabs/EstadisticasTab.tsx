"use client";

import React, { useMemo } from "react";
import { FilaComparativa, FilaResumen, FilaControlTope } from "../../types";
import { exportarExcelEstadisticasDepto } from "../../lib/exportar";
import {
  BarChart3,
  GraduationCap,
  Briefcase,
  Layers,
  Download,
  Building2,
  Wrench,
} from "lucide-react";

interface Props {
  tabla: FilaComparativa[];
  resumen: FilaResumen[];
  controlTopes?: FilaControlTope[];
  categoriaPersonal?: "DOCENTES" | "ADMINISTRATIVOS" | "SERVICIO" | "TODOS";
}

export const EstadisticasTab: React.FC<Props> = ({
  tabla,
  resumen,
  controlTopes = [],
  categoriaPersonal = "TODOS",
}) => {
  // Consolidado Tripartito por Departamento (SEP vs 2023 vs Convocatoria)
  const deptoStats = useMemo(() => {
    const map = new Map<
      string,
      {
        totalSep: number;
        total2023: number;
        totalConv: number;
        instituciones: Set<string>;
      }
    >();

    const getOrCreate = (dep: string) => {
      const d = dep.trim().toUpperCase() || "SIN DEPTO";
      let item = map.get(d);
      if (!item) {
        item = { totalSep: 0, total2023: 0, totalConv: 0, instituciones: new Set<string>() };
        map.set(d, item);
      }
      return item;
    };

    // 1. Datos de Planilla SEP (controlTopes)
    for (const ct of controlTopes) {
      const item = getOrCreate(ct.departamento);
      item.totalSep += ct.topeSEP;
      if (ct.esfm) item.instituciones.add(ct.esfm);
    }

    // 2. Datos de Gestión 2023 y Convocatoria (resumen)
    for (const r of resumen) {
      const item = getOrCreate(r.departamento);
      item.total2023 += r.items2023;
      item.totalConv += r.itemsConvocatoria;
      if (r.esfm) item.instituciones.add(r.esfm);
    }

    return Array.from(map.entries())
      .map(([departamento, stats]) => ({
        departamento,
        instituciones: stats.instituciones.size,
        totalSep: stats.totalSep,
        total2023: stats.total2023,
        totalConv: stats.totalConv,
        difVsSep: stats.totalConv - stats.totalSep,
        difVs2023: stats.totalConv - stats.total2023,
      }))
      .sort((a, b) => b.totalConv - a.totalConv);
  }, [controlTopes, resumen]);

  const maxVal = Math.max(
    ...deptoStats.map((d) => Math.max(d.totalSep, d.total2023, d.totalConv)),
    1
  );

  // Totales Nacionales
  const totalNacSep = useMemo(() => deptoStats.reduce((acc, d) => acc + d.totalSep, 0), [deptoStats]);
  const totalNac2023 = useMemo(() => deptoStats.reduce((acc, d) => acc + d.total2023, 0), [deptoStats]);
  const totalNacConv = useMemo(() => deptoStats.reduce((acc, d) => acc + d.totalConv, 0), [deptoStats]);
  const totalDifSep = totalNacConv - totalNacSep;
  const totalDif2023 = totalNacConv - totalNac2023;

  // Desglose Ocupacional (Docente, Administrativo, Servicio)
  const catStats = useMemo(() => {
    let docSep = 0, doc2023 = 0, docConv = 0;
    let admSep = 0, adm2023 = 0, admConv = 0;
    let srvSep = 0, srv2023 = 0, srvConv = 0;

    for (const r of tabla) {
      const cUpper = (r.cargo_display || r.cargo_key || "").toUpperCase();
      const esServicio = cUpper.includes("CHOFER") || cUpper.includes("PORTERO");

      if (r.categoria === "DOCENTE") {
        docSep += r.cant_sep ?? 0;
        doc2023 += r.items_gestion_2023 ?? 0;
        docConv += r.items_convocatoria ?? 0;
      } else if (esServicio) {
        srvSep += r.cant_sep ?? 0;
        srv2023 += r.items_gestion_2023 ?? 0;
        srvConv += r.items_convocatoria ?? 0;
      } else {
        admSep += r.cant_sep ?? 0;
        adm2023 += r.items_gestion_2023 ?? 0;
        admConv += r.items_convocatoria ?? 0;
      }
    }

    return {
      doc: { sep: docSep, g23: doc2023, conv: docConv },
      adm: { sep: admSep, g23: adm2023, conv: admConv },
      srv: { sep: srvSep, g23: srv2023, conv: srvConv },
    };
  }, [tabla]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Encabezado y Acción de Exportar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart3 size={22} color="var(--accent-blue)" />
            Tablero Estadístico Nacional Comparativo
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Comparación integral tripartita: <strong>Planilla SEP (Tope Presupuestario)</strong> vs <strong>Gestión 2023 (Línea Base)</strong> vs <strong>Convocatoria Oficial</strong>.
          </p>
        </div>

        <button
          onClick={() => exportarExcelEstadisticasDepto(deptoStats)}
          className="btn-primary"
        >
          <Download size={16} />
          Exportar Estadísticas Departamentales
        </button>
      </div>

      {/* KPI Cards: Totales Nacionales Tripartitos */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="title">Planilla SEP (Tope Asignado)</div>
          <div className="val" style={{ color: "#a5b4fc" }}>{totalNacSep.toLocaleString()}</div>
          <span className="badge badge-blue">Techo Presupuestario</span>
        </div>

        <div className="metric-card">
          <div className="title">Gestión 2023 (Línea Base)</div>
          <div className="val" style={{ color: "#fde68a" }}>{totalNac2023.toLocaleString()}</div>
          <span className="badge badge-yellow">Histórico 2023</span>
        </div>

        <div className="metric-card">
          <div className="title">Convocatoria Oficial Publicada</div>
          <div className="val" style={{ color: "#93c5fd" }}>{totalNacConv.toLocaleString()}</div>
          <span className="badge badge-green">Plazas Activas</span>
        </div>

        <div className="metric-card">
          <div className="title">Balance vs Planilla SEP</div>
          <div className="val" style={{ color: totalDifSep > 0 ? "var(--accent-rose)" : totalDifSep < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
            {totalDifSep > 0 ? `+${totalDifSep.toLocaleString()}` : totalDifSep.toLocaleString()}
          </div>
          <span className={`badge ${totalDifSep > 0 ? "badge-red" : totalDifSep < 0 ? "badge-yellow" : "badge-green"}`}>
            {totalDifSep > 0 ? "Sobregiro Nacional" : totalDifSep < 0 ? "Plazas Disponibles" : "Cuadre Exacto"}
          </span>
        </div>

        <div className="metric-card">
          <div className="title">Variación Neta vs 2023</div>
          <div className="val" style={{ color: totalDif2023 >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
            {totalDif2023 >= 0 ? `+${totalDif2023.toLocaleString()}` : totalDif2023.toLocaleString()}
          </div>
          <span className={`badge ${totalDif2023 >= 0 ? "badge-green" : "badge-yellow"}`}>
            {totalDif2023 >= 0 ? "Crecimiento de Plazas" : "Reducción de Plazas"}
          </span>
        </div>
      </div>

      {/* Gráfico de Barras Tripartito por Departamento */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={18} color="var(--accent-blue)" />
              Plazas por Departamento (Planilla SEP vs Gestión 2023 vs Convocatoria Oficial)
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0 0" }}>
              Visualización comparativa simultánea de los 3 instrumentos en cada departamento.
            </p>
          </div>

          {/* Leyenda de 3 Colores */}
          <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", background: "rgba(17, 24, 39, 0.6)", padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", background: "#818cf8", borderRadius: "3px" }} />
              <span style={{ color: "#c7d2fe", fontWeight: 600 }}>Planilla SEP</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", background: "#f59e0b", borderRadius: "3px" }} />
              <span style={{ color: "#fde68a", fontWeight: 600 }}>Gestión 2023</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
              <span style={{ color: "#93c5fd", fontWeight: 600 }}>Convocatoria Oficial</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {deptoStats.map((d, idx) => {
            const pctSep = Math.round((d.totalSep / maxVal) * 100);
            const pct23 = Math.round((d.total2023 / maxVal) * 100);
            const pctConv = Math.round((d.totalConv / maxVal) * 100);

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  background: "rgba(15, 23, 42, 0.35)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={15} color="#94a3b8" />
                    {d.departamento}{" "}
                    <span style={{ color: "#64748b", fontSize: "0.76rem", fontWeight: 500 }}>
                      ({d.instituciones} ESFM/UA)
                    </span>
                  </span>

                  {/* Resumen numérico en la fila */}
                  <div style={{ display: "flex", gap: "14px", fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem" }}>
                    <span>
                      SEP: <strong style={{ color: "#a5b4fc" }}>{d.totalSep}</strong>
                    </span>
                    <span>
                      '23: <strong style={{ color: "#fde68a" }}>{d.total2023}</strong>
                    </span>
                    <span>
                      Conv: <strong style={{ color: "#93c5fd" }}>{d.totalConv}</strong>
                    </span>
                    <span style={{ color: d.difVsSep > 0 ? "var(--accent-rose)" : d.difVsSep < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
                      vs SEP: <strong>{d.difVsSep > 0 ? `+${d.difVsSep}` : d.difVsSep}</strong>
                    </span>
                    <span style={{ color: d.difVs2023 >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                      vs '23: <strong>{d.difVs2023 >= 0 ? `+${d.difVs2023}` : d.difVs2023}</strong>
                    </span>
                  </div>
                </div>

                {/* 3 Barras horizontales por departamento */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "2px" }}>
                  {/* Barra Planilla SEP */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "#a5b4fc", width: "42px", fontFamily: "var(--font-mono, monospace)" }}>SEP</span>
                    <div style={{ flex: 1, height: "7px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pctSep}%`,
                          background: "#818cf8",
                          height: "100%",
                          borderRadius: "3px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Barra Gestión 2023 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "#fde68a", width: "42px", fontFamily: "var(--font-mono, monospace)" }}>'2023</span>
                    <div style={{ flex: 1, height: "7px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct23}%`,
                          background: "#f59e0b",
                          height: "100%",
                          borderRadius: "3px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Barra Convocatoria Oficial */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "#93c5fd", width: "42px", fontFamily: "var(--font-mono, monospace)" }}>Conv</span>
                    <div style={{ flex: 1, height: "7px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pctConv}%`,
                          background: "#3b82f6",
                          height: "100%",
                          borderRadius: "3px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla Departamental Consolidada */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={18} color="var(--accent-blue)" />
          Consolidado Departamental Tripartito (Cifras Oficiales)
        </h4>

        <div className="table-container" style={{ maxHeight: "400px", overflow: "auto" }}>
          <table className="custom-table" style={{ fontSize: "0.82rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Departamento</th>
                <th style={{ textAlign: "center" }}>Sedes (ESFM/UA)</th>
                <th style={{ textAlign: "right", color: "#c7d2fe" }}>Planilla SEP (Tope)</th>
                <th style={{ textAlign: "right", color: "#fde68a" }}>Gestión 2023</th>
                <th style={{ textAlign: "right", color: "#93c5fd" }}>Convocatoria</th>
                <th style={{ textAlign: "right" }}>Dif. vs SEP</th>
                <th style={{ textAlign: "right" }}>Dif. vs 2023</th>
                <th style={{ textAlign: "center", width: "140px" }}>Comparativa Visual</th>
              </tr>
            </thead>
            <tbody>
              {deptoStats.map((d, idx) => {
                const maxD = Math.max(d.totalSep, d.total2023, d.totalConv, 1);
                const pSep = Math.round((d.totalSep / maxD) * 100);
                const p23 = Math.round((d.total2023 / maxD) * 100);
                const pConv = Math.round((d.totalConv / maxD) * 100);

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{d.departamento}</td>
                    <td style={{ textAlign: "center", color: "#94a3b8" }}>{d.instituciones}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#a5b4fc", fontWeight: 600 }}>
                      {d.totalSep.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a" }}>
                      {d.total2023.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#93c5fd" }}>
                      {d.totalConv.toLocaleString()}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 700,
                        color: d.difVsSep > 0 ? "var(--accent-rose)" : d.difVsSep < 0 ? "var(--accent-amber)" : "var(--accent-emerald)",
                      }}
                    >
                      {d.difVsSep > 0 ? `+${d.difVsSep}` : d.difVsSep}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 700,
                        color: d.difVs2023 >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)",
                      }}
                    >
                      {d.difVs2023 >= 0 ? `+${d.difVs2023}` : d.difVs2023}
                    </td>
                    <td style={{ textAlign: "center", padding: "6px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.65em", color: "#a5b4fc", width: "24px", textAlign: "left" }}>SEP</span>
                          <div style={{ flex: 1, background: "#1e293b", height: "4px", borderRadius: "2px" }}>
                            <div style={{ width: `${pSep}%`, background: "#818cf8", height: "100%", borderRadius: "2px" }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.65em", color: "#fde68a", width: "24px", textAlign: "left" }}>'23</span>
                          <div style={{ flex: 1, background: "#1e293b", height: "4px", borderRadius: "2px" }}>
                            <div style={{ width: `${p23}%`, background: "#f59e0b", height: "100%", borderRadius: "2px" }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.65em", color: "#93c5fd", width: "24px", textAlign: "left" }}>Conv</span>
                          <div style={{ flex: 1, background: "#1e293b", height: "4px", borderRadius: "2px" }}>
                            <div style={{ width: `${pConv}%`, background: "#3b82f6", height: "100%", borderRadius: "2px" }} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, background: "rgba(31, 41, 55, 0.8)", borderTop: "2px solid var(--border-subtle)" }}>
                <td>TOTAL NACIONAL</td>
                <td style={{ textAlign: "center" }}>
                  {deptoStats.reduce((acc, d) => acc + d.instituciones, 0)}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#a5b4fc" }}>
                  {totalNacSep.toLocaleString()}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a" }}>
                  {totalNac2023.toLocaleString()}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#93c5fd" }}>
                  {totalNacConv.toLocaleString()}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: totalDifSep > 0 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
                  {totalDifSep > 0 ? `+${totalDifSep}` : totalDifSep}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: totalDif2023 >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                  {totalDif2023 >= 0 ? `+${totalDif2023}` : totalDif2023}
                </td>
                <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  Consolidado
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tarjetas Comparativas por Categoría Ocupacional (Docentes, Administrativos, Servicio) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Docentes */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#93c5fd", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <GraduationCap size={18} />
            Plazas Docentes (Catedráticos)
          </h4>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Planilla SEP (Tope):</span>
            <span style={{ fontWeight: 700, color: "#a5b4fc", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.doc.sep.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "7px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Gestión 2023:</span>
            <span style={{ fontWeight: 700, color: "#fde68a", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.doc.g23.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "7px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Convocatoria Oficial:</span>
            <span style={{ fontWeight: 700, color: "#93c5fd", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.doc.conv.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Balance vs SEP:</span>
            <span
              style={{
                fontWeight: 700,
                color: catStats.doc.conv - catStats.doc.sep > 0 ? "var(--accent-rose)" : "var(--accent-emerald)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {catStats.doc.conv - catStats.doc.sep > 0
                ? `+${catStats.doc.conv - catStats.doc.sep} (Sobregiro)`
                : `${catStats.doc.conv - catStats.doc.sep} (Dentro de Tope)`}
            </span>
          </div>
        </div>

        {/* Administrativos */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f59e0b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Briefcase size={18} />
            Plazas Administrativas / Directivas
          </h4>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Planilla SEP (Tope):</span>
            <span style={{ fontWeight: 700, color: "#a5b4fc", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.adm.sep.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "7px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Gestión 2023:</span>
            <span style={{ fontWeight: 700, color: "#fde68a", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.adm.g23.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "7px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Convocatoria Oficial:</span>
            <span style={{ fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.adm.conv.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Balance vs SEP:</span>
            <span
              style={{
                fontWeight: 700,
                color: catStats.adm.conv - catStats.adm.sep > 0 ? "var(--accent-rose)" : "var(--accent-emerald)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {catStats.adm.conv - catStats.adm.sep > 0
                ? `+${catStats.adm.conv - catStats.adm.sep} (Sobregiro)`
                : `${catStats.adm.conv - catStats.adm.sep} (Dentro de Tope)`}
            </span>
          </div>
        </div>

        {/* Personal de Servicio */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#34d399", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Wrench size={18} />
            Personal de Servicio (Chofer / Portero)
          </h4>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Planilla SEP (Tope):</span>
            <span style={{ fontWeight: 700, color: "#a5b4fc", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.srv.sep.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "7px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Gestión 2023:</span>
            <span style={{ fontWeight: 700, color: "#fde68a", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.srv.g23.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "7px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "7px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Convocatoria Oficial:</span>
            <span style={{ fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono, monospace)" }}>
              {catStats.srv.conv.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Balance vs SEP:</span>
            <span
              style={{
                fontWeight: 700,
                color: catStats.srv.conv - catStats.srv.sep > 0 ? "var(--accent-rose)" : "var(--accent-emerald)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {catStats.srv.conv - catStats.srv.sep > 0
                ? `+${catStats.srv.conv - catStats.srv.sep} (Sobregiro)`
                : `${catStats.srv.conv - catStats.srv.sep} (Dentro de Tope)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

