"use client";

import React, { useState, useMemo } from "react";
import { FilaResumen } from "../../types";
import { exportarExcelResumen } from "../../lib/exportar";
import {
  Download,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Props {
  resumen: FilaResumen[];
  filtroDepto: string;
  filtroEsfm: string;
}

type SortField =
  | "departamento"
  | "esfm"
  | "items2023"
  | "itemsConvocatoria"
  | "anios3"
  | "anios2"
  | "anios1"
  | "conInamovilidad"
  | "diferencia";

type Density = "compact" | "normal" | "large";

export const ResumenEsfmTab: React.FC<Props> = ({
  resumen,
  filtroDepto,
  filtroEsfm,
}) => {
  const [sortField, setSortField] = useState<SortField>("departamento");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [densidad, setDensidad] = useState<Density>("normal");
  const [filtroTexto, setFiltroTexto] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      const esNumerico = !["departamento", "esfm"].includes(field);
      setSortOrder(esNumerico ? "desc" : "asc");
    }
  };

  const filtrados = useMemo(() => {
    const list = resumen.filter((r) => {
      if (filtroDepto && r.departamento !== filtroDepto) return false;
      if (filtroEsfm && r.esfm !== filtroEsfm) return false;
      if (filtroTexto) {
        const t = filtroTexto.toLowerCase();
        const mDep = r.departamento.toLowerCase().includes(t);
        const mEsfm = r.esfm.toLowerCase().includes(t);
        if (!mDep && !mEsfm) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === "string" && typeof vb === "string") {
        const c = va.localeCompare(vb);
        return sortOrder === "asc" ? c : -c;
      }
      const numA = (va as number) || 0;
      const numB = (vb as number) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    return list;
  }, [resumen, filtroDepto, filtroEsfm, filtroTexto, sortField, sortOrder]);

  const tot2023 = filtrados.reduce((acc, r) => acc + r.items2023, 0);
  const totConv = filtrados.reduce((acc, r) => acc + r.itemsConvocatoria, 0);
  const tot3a = filtrados.reduce((acc, r) => acc + r.anios3, 0);
  const tot2a = filtrados.reduce((acc, r) => acc + r.anios2, 0);
  const tot1a = filtrados.reduce((acc, r) => acc + r.anios1, 0);
  const totInam = filtrados.reduce((acc, r) => acc + r.conInamovilidad, 0);
  const totDif = totConv - tot2023;

  // Variables de densidad / tamaño
  const configDensidad = {
    compact: {
      fontSize: "0.78rem",
      cellPadding: "6px 10px",
      barHeight: "5px",
      barWidth: "140px",
    },
    normal: {
      fontSize: "0.87rem",
      cellPadding: "10px 14px",
      barHeight: "7px",
      barWidth: "180px",
    },
    large: {
      fontSize: "1.02rem",
      cellPadding: "15px 18px",
      barHeight: "10px",
      barWidth: "220px",
    },
  }[densidad];

  const renderHeader = (
    label: string,
    field: SortField,
    align: "left" | "right" | "center" = "left",
    width?: string
  ) => {
    const isActivo = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          textAlign: align,
          cursor: "pointer",
          userSelect: "none",
          padding: configDensidad.cellPadding,
          width,
          color: isActivo ? "#60a5fa" : undefined,
          background: isActivo ? "rgba(59, 130, 246, 0.08)" : undefined,
        }}
        title={`Clic para ordenar por ${label} (${isActivo && sortOrder === "asc" ? "Descendente" : "Ascendente"})`}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            justifyContent:
              align === "right"
                ? "flex-end"
                : align === "center"
                  ? "center"
                  : "flex-start",
            width: "100%",
          }}
        >
          <span>{label}</span>
          {isActivo ? (
            sortOrder === "asc" ? (
              <ArrowUp size={13} color="#60a5fa" />
            ) : (
              <ArrowDown size={13} color="#60a5fa" />
            )
          ) : (
            <ArrowUpDown size={12} color="#64748b" style={{ opacity: 0.5 }} />
          )}
        </div>
      </th>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Encabezado */}
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

      {/* Contenedor Expandible: Pantalla Completa Panorámica o Flujo Normal */}
      <div
        style={
          isFullscreen
            ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              background: "#080d1a",
              padding: "20px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxSizing: "border-box",
              overflow: "hidden",
            }
            : {
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }
        }
      >
        {/* Cabecera especial visible únicamente en modo Pantalla Completa */}
        {isFullscreen && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "10px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: 0,
                }}
              >
                <Building2 size={22} color="var(--accent-blue)" />
                Consolidado Institucional por ESFM / UA — Pantalla Completa
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  margin: "4px 0 0 0",
                }}
              >
                Visualización panorámica total ({filtrados.length} registros). Presione la tecla <kbd style={{ background: "#1f2937", padding: "2px 6px", borderRadius: "4px", border: "1px solid #374151" }}>ESC</kbd> o el botón para salir.
              </p>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="btn-primary"
              style={{
                background: "#ef4444",
                borderColor: "#dc2626",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.84rem",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                cursor: "pointer",
              }}
              title="Salir de Pantalla Completa (ESC)"
            >
              <Minimize2 size={16} />
              Reducir / Salir (ESC)
            </button>
          </div>
        )}

        {/* Barra de Controles: Buscador Rápido y Selector de Tamaño de Tabla */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            background: "rgba(17, 24, 39, 0.6)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
          }}
        >
          {/* Buscador Rápido dentro de la tabla */}
          <div style={{ position: "relative", minWidth: "240px", flex: "1", maxWidth: "380px" }}>
            <Search size={15} color="#9ca3af" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Filtrar ESFM o Departamento..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "32px", fontSize: "0.82rem", width: "100%", padding: "7px 10px 7px 32px" }}
            />
          </div>

          {/* Controles de Tamaño / Densidad y Zoom */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>
              Tamaño de Tabla:
            </span>
            <div style={{ display: "flex", background: "rgba(31, 41, 55, 0.7)", borderRadius: "var(--radius-sm)", padding: "2px", border: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => setDensidad("compact")}
                style={{
                  background: densidad === "compact" ? "var(--accent-blue)" : "transparent",
                  color: densidad === "compact" ? "#ffffff" : "#9ca3af",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title="Vista Compacta: más filas en pantalla"
              >
                Compacta
              </button>
              <button
                onClick={() => setDensidad("normal")}
                style={{
                  background: densidad === "normal" ? "var(--accent-blue)" : "transparent",
                  color: densidad === "normal" ? "#ffffff" : "#9ca3af",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title="Vista Normal"
              >
                Normal
              </button>
              <button
                onClick={() => setDensidad("large")}
                style={{
                  background: densidad === "large" ? "var(--accent-blue)" : "transparent",
                  color: densidad === "large" ? "#ffffff" : "#9ca3af",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title="Vista Amplia / Grande: texto y barras agrandadas para lectura cómoda"
              >
                Grande
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn-secondary"
              style={{
                padding: "6px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.76rem",
                fontWeight: 600,
                ...(isFullscreen
                  ? { background: "rgba(239, 68, 68, 0.2)", borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }
                  : { background: "rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.4)", color: "#93c5fd" }),
              }}
              title={isFullscreen ? "Restaurar tamaño normal" : "Modo expandido panorámico"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? "Reducir" : "Expandir Pantalla"}
            </button>
          </div>
        </div>

        {/* Tabla Resumen Interactiva con Ordenamiento y Densidad */}
        <div
          className="table-container"
          style={{
            fontSize: configDensidad.fontSize,
            transition: "font-size 0.2s ease",
            ...(isFullscreen
              ? {
                flex: 1,
                height: "100%",
                maxHeight: "calc(100vh - 145px)",
                overflow: "auto",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                borderRadius: "var(--radius-md)",
                background: "#0c1322",
              }
              : {}),
          }}
        >
          <table className="custom-table" style={{ fontSize: "inherit" }}>
            <thead>
              <tr>
                {renderHeader("Departamento", "departamento", "left")}
                {renderHeader("ESFM / UA", "esfm", "left")}
                {renderHeader("Ítems 2023", "items2023", "right")}
                {renderHeader("Convocatoria", "itemsConvocatoria", "right")}
                {renderHeader("3 Años", "anios3", "right")}
                {renderHeader("2 Años", "anios2", "right")}
                {renderHeader("1 Año (Comp.)", "anios1", "right")}
                {renderHeader("Inamovilidad", "conInamovilidad", "right")}
                {renderHeader("Diferencia", "diferencia", "right")}
                <th style={{ textAlign: "center", width: configDensidad.barWidth, padding: configDensidad.cellPadding }}>
                  Comparativa Visual
                </th>
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
                      <td style={{ fontWeight: 600, padding: configDensidad.cellPadding }}>{r.departamento}</td>
                      <td style={{ padding: configDensidad.cellPadding }}>{r.esfm}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", padding: configDensidad.cellPadding }}>
                        {r.items2023}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, padding: configDensidad.cellPadding }}>
                        {r.itemsConvocatoria}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#93c5fd", padding: configDensidad.cellPadding }}>
                        {r.anios3}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a", padding: configDensidad.cellPadding }}>
                        {r.anios2}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd", padding: configDensidad.cellPadding }}>
                        {r.anios1}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: r.conInamovilidad > 0 ? "#f59e0b" : "#6b7280", padding: configDensidad.cellPadding }}>
                        {r.conInamovilidad > 0 ? r.conInamovilidad : "—"}
                      </td>
                      <td style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 700,
                        padding: configDensidad.cellPadding,
                        color: r.diferencia > 0 ? "var(--accent-emerald)" : r.diferencia < 0 ? "var(--accent-amber)" : "var(--text-muted)",
                      }}>
                        {r.diferencia > 0 ? `+${r.diferencia}` : r.diferencia}
                      </td>
                      <td style={{ textAlign: "center", padding: configDensidad.cellPadding }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.68em", color: "#9ca3af", width: "32px", textAlign: "left" }}>'23</span>
                            <div style={{ flex: 1, background: "#1f2937", height: configDensidad.barHeight, borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${pct23}%`, background: "#f59e0b", height: "100%", borderRadius: "3px" }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.68em", color: "#9ca3af", width: "32px", textAlign: "left" }}>Conv</span>
                            <div style={{ flex: 1, background: "#1f2937", height: configDensidad.barHeight, borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${pctConv}%`, background: "#3b82f6", height: "100%", borderRadius: "3px" }} />
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
    </div>
  );
};
