"use client";

import React, { useMemo, useState } from "react";
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
  CheckCircle2,
  Eye,
  EyeOff,
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
  // Toggles de visualizacion por fuente
  const [mostrarSEP, setMostrarSEP] = useState(true);
  const [mostrar2023, setMostrar2023] = useState(false); // Desactivado por defecto para evitar ruido
  const [mostrarConv, setMostrarConv] = useState(true);

  // Consolidado por Departamento (SEP vs 2023 vs Convocatoria)
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

    // 2. Datos de Gestion 2023 y Convocatoria (resumen)
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
    ...deptoStats.map((d) =>
      Math.max(
        mostrarSEP ? d.totalSep : 0,
        mostrar2023 ? d.total2023 : 0,
        mostrarConv ? d.totalConv : 0
      )
    ),
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── ENCABEZADO ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <BarChart3 size={22} color="var(--accent-blue)" />
            Tablero Estadístico Nacional
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginTop: "5px" }}>
            Consolidado comparativo departamental. Puedes activar u ocultar fuentes según tu necesidad de análisis.
          </p>
        </div>

        <button onClick={() => exportarExcelEstadisticasDepto(deptoStats)} className="btn-primary">
          <Download size={16} />
          Exportar Excel
        </button>
      </div>

      {/* ── BARRA DE CONTROL DE FUENTES (FILTROS) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          background: "rgba(17, 24, 39, 0.75)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "12px 18px",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600, marginRight: "4px" }}>
          Fuentes visibles:
        </span>

        {/* Toggle SEP */}
        <button
          onClick={() => setMostrarSEP(!mostrarSEP)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            transition: "all 0.15s ease",
            background: mostrarSEP ? "rgba(129, 140, 248, 0.2)" : "rgba(31, 41, 55, 0.5)",
            borderColor: mostrarSEP ? "#818cf8" : "#374151",
            color: mostrarSEP ? "#c7d2fe" : "#64748b",
          }}
          title={mostrarSEP ? "Clic para ocultar Planilla SEP" : "Clic para mostrar Planilla SEP"}
        >
          {mostrarSEP ? <Eye size={14} color="#818cf8" /> : <EyeOff size={14} color="#64748b" />}
          Planilla SEP (Tope)
        </button>

        {/* Toggle Convocatoria Oficial */}
        <button
          onClick={() => setMostrarConv(!mostrarConv)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            transition: "all 0.15s ease",
            background: mostrarConv ? "rgba(59, 130, 246, 0.2)" : "rgba(31, 41, 55, 0.5)",
            borderColor: mostrarConv ? "#3b82f6" : "#374151",
            color: mostrarConv ? "#93c5fd" : "#64748b",
          }}
          title={mostrarConv ? "Clic para ocultar Convocatoria" : "Clic para mostrar Convocatoria"}
        >
          {mostrarConv ? <Eye size={14} color="#3b82f6" /> : <EyeOff size={14} color="#64748b" />}
          Convocatoria Oficial
        </button>

        {/* Toggle Gestión 2023 */}
        <button
          onClick={() => setMostrar2023(!mostrar2023)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            transition: "all 0.15s ease",
            background: mostrar2023 ? "rgba(245, 158, 11, 0.2)" : "rgba(31, 41, 55, 0.5)",
            borderColor: mostrar2023 ? "#f59e0b" : "#374151",
            color: mostrar2023 ? "#fde68a" : "#64748b",
          }}
          title={mostrar2023 ? "Clic para ocultar Gestión 2023" : "Clic para mostrar Gestión 2023"}
        >
          {mostrar2023 ? <Eye size={14} color="#f59e0b" /> : <EyeOff size={14} color="#64748b" />}
          Gestión 2023 (Referencial)
        </button>

        <span style={{ marginLeft: "auto", fontSize: "0.76rem", color: "#64748b" }}>
          {[mostrarSEP, mostrarConv, mostrar2023].filter(Boolean).length} / 3 fuentes activas
        </span>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="metrics-grid">
        {mostrarSEP && (
          <div className="metric-card">
            <div className="title">Planilla SEP (Tope)</div>
            <div className="val" style={{ color: "#a5b4fc" }}>{totalNacSep.toLocaleString()}</div>
            <span className="badge badge-blue">Techo Presupuestario</span>
          </div>
        )}

        {mostrarConv && (
          <div className="metric-card">
            <div className="title">Convocatoria Oficial</div>
            <div className="val" style={{ color: "#93c5fd" }}>{totalNacConv.toLocaleString()}</div>
            <span className="badge badge-green">Plazas Publicadas</span>
          </div>
        )}

        {mostrar2023 && (
          <div className="metric-card">
            <div className="title">Gestión 2023</div>
            <div className="val" style={{ color: "#fde68a" }}>{totalNac2023.toLocaleString()}</div>
            <span className="badge badge-yellow">Línea Base Histórica</span>
          </div>
        )}

        {mostrarConv && mostrarSEP && (
          <div className="metric-card">
            <div className="title">Balance Conv. vs SEP</div>
            <div className="val" style={{ color: totalDifSep > 0 ? "var(--accent-rose)" : totalDifSep < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
              {totalDifSep > 0 ? `+${totalDifSep.toLocaleString()}` : totalDifSep.toLocaleString()}
            </div>
            <span className={`badge ${totalDifSep > 0 ? "badge-red" : totalDifSep < 0 ? "badge-yellow" : "badge-green"}`}>
              {totalDifSep > 0 ? "Sobregiro" : totalDifSep < 0 ? "Capacidad Disponible" : "Cuadre Exacto"}
            </span>
          </div>
        )}

        {mostrarConv && mostrar2023 && (
          <div className="metric-card">
            <div className="title">Variación Conv. vs 2023</div>
            <div className="val" style={{ color: totalDif2023 >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
              {totalDif2023 >= 0 ? `+${totalDif2023.toLocaleString()}` : totalDif2023.toLocaleString()}
            </div>
            <span className={`badge ${totalDif2023 >= 0 ? "badge-green" : "badge-yellow"}`}>
              {totalDif2023 >= 0 ? "Crecimiento" : "Reducción de Plazas"}
            </span>
          </div>
        )}
      </div>

      {/* ── GRÁFICO COMPARATIVO POR DEPARTAMENTO ── */}
      <div className="glass-panel" style={{ padding: "22px 24px" }}>
        <div style={{ marginBottom: "18px" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={17} color="var(--accent-blue)" />
            Distribución por Departamento
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.79rem", margin: 0 }}>
            Visualización comparativa de plazas por departamento según las fuentes activadas.
          </p>
        </div>

        {!mostrarSEP && !mostrar2023 && !mostrarConv && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Activa al menos una fuente en los botones superiores para visualizar los datos.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {deptoStats.map((d, idx) => {
            const pctSep = Math.round((d.totalSep / maxVal) * 100);
            const pct23 = Math.round((d.total2023 / maxVal) * 100);
            const pctConv = Math.round((d.totalConv / maxVal) * 100);

            return (
              <div
                key={idx}
                style={{
                  background: "rgba(15, 23, 42, 0.4)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: "12px 16px",
                }}
              >
                {/* Cabecera del departamento */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={14} color="#64748b" />
                    {d.departamento}
                    <span style={{ fontWeight: 400, color: "#64748b", fontSize: "0.74rem" }}>({d.instituciones} sedes)</span>
                  </span>

                  <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", fontFamily: "var(--font-mono, monospace)" }}>
                    {mostrarSEP && (
                      <span style={{ color: "#a5b4fc" }}>
                        SEP: <strong>{d.totalSep.toLocaleString()}</strong>
                      </span>
                    )}
                    {mostrarConv && (
                      <span style={{ color: "#93c5fd" }}>
                        Conv: <strong>{d.totalConv.toLocaleString()}</strong>
                      </span>
                    )}
                    {mostrar2023 && (
                      <span style={{ color: "#fde68a" }}>
                        2023: <strong>{d.total2023.toLocaleString()}</strong>
                      </span>
                    )}
                    {mostrarConv && mostrarSEP && (
                      <span style={{ color: d.difVsSep > 0 ? "var(--accent-rose)" : d.difVsSep < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
                        {d.difVsSep > 0 ? `+${d.difVsSep}` : d.difVsSep} vs SEP
                      </span>
                    )}
                  </div>
                </div>

                {/* Barras Horizontales */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {mostrarSEP && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#a5b4fc", width: "38px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>SEP</span>
                      <div style={{ flex: 1, height: "8px", background: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pctSep}%`, background: "linear-gradient(90deg, #6366f1, #818cf8)", height: "100%", borderRadius: "4px", transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", width: "38px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>{d.totalSep}</span>
                    </div>
                  )}

                  {mostrarConv && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#93c5fd", width: "38px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>Conv</span>
                      <div style={{ flex: 1, height: "8px", background: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pctConv}%`, background: "linear-gradient(90deg, #2563eb, #3b82f6)", height: "100%", borderRadius: "4px", transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", width: "38px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>{d.totalConv}</span>
                    </div>
                  )}

                  {mostrar2023 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#fde68a", width: "38px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>2023</span>
                      <div style={{ flex: 1, height: "8px", background: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct23}%`, background: "linear-gradient(90deg, #d97706, #f59e0b)", height: "100%", borderRadius: "4px", transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", width: "38px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>{d.total2023}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TABLA DEPARTAMENTAL CONSOLIDADA ── */}
      <div className="glass-panel" style={{ padding: "20px 24px" }}>
        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={17} color="var(--accent-blue)" />
          Resumen Departamental — Cifras Oficiales
        </h4>

        <div className="table-container" style={{ maxHeight: "420px", overflow: "auto" }}>
          <table className="custom-table" style={{ fontSize: "0.82rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Departamento</th>
                <th style={{ textAlign: "center" }}>Sedes</th>
                {mostrarSEP && <th style={{ textAlign: "right", color: "#c7d2fe" }}>Planilla SEP</th>}
                {mostrarConv && <th style={{ textAlign: "right", color: "#93c5fd" }}>Convocatoria</th>}
                {mostrar2023 && <th style={{ textAlign: "right", color: "#fde68a" }}>Gestión 2023</th>}
                {mostrarConv && mostrarSEP && <th style={{ textAlign: "right" }}>Dif. vs SEP</th>}
                {mostrarConv && mostrar2023 && <th style={{ textAlign: "right" }}>Dif. vs 2023</th>}
                <th style={{ textAlign: "center", width: "130px" }}>Visual</th>
              </tr>
            </thead>
            <tbody>
              {deptoStats.map((d, idx) => {
                const maxD = Math.max(
                  mostrarSEP ? d.totalSep : 0,
                  mostrarConv ? d.totalConv : 0,
                  mostrar2023 ? d.total2023 : 0,
                  1
                );
                const pSep = Math.round((d.totalSep / maxD) * 100);
                const pConv = Math.round((d.totalConv / maxD) * 100);
                const p23 = Math.round((d.total2023 / maxD) * 100);

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{d.departamento}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{d.instituciones}</td>
                    {mostrarSEP && (
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#a5b4fc", fontWeight: 600 }}>
                        {d.totalSep.toLocaleString()}
                      </td>
                    )}
                    {mostrarConv && (
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#93c5fd" }}>
                        {d.totalConv.toLocaleString()}
                      </td>
                    )}
                    {mostrar2023 && (
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a" }}>
                        {d.total2023.toLocaleString()}
                      </td>
                    )}
                    {mostrarConv && mostrarSEP && (
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: d.difVsSep > 0 ? "var(--accent-rose)" : d.difVsSep < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
                        {d.difVsSep > 0 ? `+${d.difVsSep}` : d.difVsSep}
                      </td>
                    )}
                    {mostrarConv && mostrar2023 && (
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: d.difVs2023 >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                        {d.difVs2023 >= 0 ? `+${d.difVs2023}` : d.difVs2023}
                      </td>
                    )}
                    <td style={{ padding: "6px 8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {mostrarSEP && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "0.6em", color: "#818cf8", width: "22px", textAlign: "right" }}>SEP</span>
                            <div style={{ flex: 1, background: "#1e293b", height: "4px", borderRadius: "2px" }}>
                              <div style={{ width: `${pSep}%`, background: "#818cf8", height: "100%", borderRadius: "2px" }} />
                            </div>
                          </div>
                        )}
                        {mostrarConv && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "0.6em", color: "#93c5fd", width: "22px", textAlign: "right" }}>Cv</span>
                            <div style={{ flex: 1, background: "#1e293b", height: "4px", borderRadius: "2px" }}>
                              <div style={{ width: `${pConv}%`, background: "#3b82f6", height: "100%", borderRadius: "2px" }} />
                            </div>
                          </div>
                        )}
                        {mostrar2023 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "0.6em", color: "#fde68a", width: "22px", textAlign: "right" }}>'23</span>
                            <div style={{ flex: 1, background: "#1e293b", height: "4px", borderRadius: "2px" }}>
                              <div style={{ width: `${p23}%`, background: "#f59e0b", height: "100%", borderRadius: "2px" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, background: "rgba(31, 41, 55, 0.9)", borderTop: "2px solid var(--border-subtle)" }}>
                <td>TOTAL NACIONAL</td>
                <td style={{ textAlign: "center" }}>{deptoStats.reduce((acc, d) => acc + d.instituciones, 0)}</td>
                {mostrarSEP && <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#a5b4fc" }}>{totalNacSep.toLocaleString()}</td>}
                {mostrarConv && <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#93c5fd" }}>{totalNacConv.toLocaleString()}</td>}
                {mostrar2023 && <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a" }}>{totalNac2023.toLocaleString()}</td>}
                {mostrarConv && mostrarSEP && (
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: totalDifSep > 0 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
                    {totalDifSep > 0 ? `+${totalDifSep}` : totalDifSep}
                  </td>
                )}
                {mostrarConv && mostrar2023 && (
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: totalDif2023 >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                    {totalDif2023 >= 0 ? `+${totalDif2023}` : totalDif2023}
                  </td>
                )}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── TARJETAS DESGLOSE OCUPACIONAL ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        {(["doc", "adm", "srv"] as const).map((key) => {
          const meta = {
            doc: { label: "Docentes (Catedráticos)", icon: <GraduationCap size={17} />, color: "#93c5fd" },
            adm: { label: "Administrativos / Directivos", icon: <Briefcase size={17} />, color: "#f59e0b" },
            srv: { label: "Servicio (Chofer / Portero)", icon: <Wrench size={17} />, color: "#34d399" },
          }[key];
          const vals = catStats[key];

          return (
            <div key={key} className="glass-panel" style={{ padding: "18px 20px" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: meta.color, marginBottom: "12px", display: "flex", alignItems: "center", gap: "7px" }}>
                {meta.icon}
                {meta.label}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.83rem" }}>
                {mostrarSEP && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Planilla SEP:</span>
                    <span style={{ fontWeight: 700, color: "#a5b4fc", fontFamily: "var(--font-mono, monospace)" }}>{vals.sep.toLocaleString()}</span>
                  </div>
                )}
                {mostrarConv && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: mostrar2023 ? "1px solid var(--border-subtle)" : "none", paddingBottom: "5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Convocatoria:</span>
                    <span style={{ fontWeight: 700, color: meta.color, fontFamily: "var(--font-mono, monospace)" }}>{vals.conv.toLocaleString()}</span>
                  </div>
                )}
                {mostrar2023 && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Gestión 2023:</span>
                    <span style={{ fontWeight: 700, color: "#fde68a", fontFamily: "var(--font-mono, monospace)" }}>{vals.g23.toLocaleString()}</span>
                  </div>
                )}
                {mostrarConv && mostrarSEP && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Balance vs SEP:</span>
                    <span style={{
                      fontWeight: 700,
                      fontFamily: "var(--font-mono, monospace)",
                      color: vals.conv - vals.sep > 0 ? "var(--accent-rose)" : "var(--accent-emerald)",
                    }}>
                      {vals.conv - vals.sep > 0 ? `+${vals.conv - vals.sep}` : vals.conv - vals.sep}
                      <span style={{ fontSize: "0.75em", fontWeight: 500, marginLeft: "4px" }}>
                        {vals.conv - vals.sep > 0 ? "(Sobregiro)" : "(Dentro de Tope)"}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
