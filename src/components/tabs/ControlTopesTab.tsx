"use client";

import React, { useState, useMemo } from "react";
import { FilaControlTope } from "../../types";
import { exportarExcelTopes } from "../../lib/exportar";
import {
  Download,
  AlertOctagon,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Props {
  controlTopes: FilaControlTope[];
  filtroDepto: string;
  filtroEsfm: string;
  categoriaPersonal?: "DOCENTES" | "ADMINISTRATIVOS" | "SERVICIO" | "TODOS";
}

type SortField =
  | "departamento"
  | "esfm"
  | "topeSEP"
  | "convocadosTotal"
  | "anios3"
  | "anios2"
  | "anios1"
  | "inamovilidadDocente"
  | "diferencia"
  | "estado";

type Density = "compact" | "normal" | "large";

export const ControlTopesTab: React.FC<Props> = ({
  controlTopes,
  filtroDepto,
  filtroEsfm,
  categoriaPersonal = "DOCENTES",
}) => {
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
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

  const labelCat =
    categoriaPersonal === "ADMINISTRATIVOS"
      ? "Administrativos"
      : categoriaPersonal === "SERVICIO"
        ? "Servicio (Chofer / Portero)"
        : categoriaPersonal === "TODOS"
          ? "Personal (General)"
          : "Docentes";

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      const esNumerico = !["departamento", "esfm", "estado"].includes(field);
      setSortOrder(esNumerico ? "desc" : "asc");
    }
  };

  const filtrados = useMemo(() => {
    const list = controlTopes.filter((r) => {
      if (filtroDepto && r.departamento !== filtroDepto) return false;
      if (filtroEsfm && r.esfm !== filtroEsfm) return false;
      if (filtroEstado === "EXCEDE" && r.diferencia <= 0) return false;
      if (filtroEstado === "FALTA" && r.diferencia >= 0) return false;
      if (filtroEstado === "CUADRE" && r.diferencia !== 0) return false;
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
  }, [controlTopes, filtroDepto, filtroEsfm, filtroEstado, filtroTexto, sortField, sortOrder]);

  const totTope = filtrados.reduce((acc, r) => acc + r.topeSEP, 0);
  const totConv = filtrados.reduce((acc, r) => acc + r.convocadosTotal, 0);
  const tot3a = filtrados.reduce((acc, r) => acc + r.anios3, 0);
  const tot2a = filtrados.reduce((acc, r) => acc + r.anios2, 0);
  const tot1a = filtrados.reduce((acc, r) => acc + r.anios1, 0);
  const totInam = filtrados.reduce((acc, r) => acc + r.inamovilidadDocente, 0);
  const totDif = totConv - totTope;
  const exceden = filtrados.filter((r) => r.diferencia > 0);

  // Variables de densidad / tamaño
  const configDensidad = {
    compact: {
      fontSize: "0.78rem",
      cellPadding: "6px 10px",
    },
    normal: {
      fontSize: "0.87rem",
      cellPadding: "10px 14px",
    },
    large: {
      fontSize: "1.02rem",
      cellPadding: "15px 18px",
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
          <Target size={20} color="var(--accent-blue)" />
          Control de Topes de {labelCat} (Planilla SEP vs Convocatoria Oficial)
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          La Planilla SEP (PLA0926_DGFM estado=1) establece el tope presupuestario asignado. Este módulo compara con la Convocatoria Oficial según la categoría seleccionada ({labelCat.toLowerCase()}) y permite ajustar años (3a, 2a, 1a) e inamovilidades.
        </p>
      </div>

      {/* KPI Topes */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="title">Tope {labelCat} (Planilla SEP)</div>
          <div className="val">{totTope.toLocaleString()}</div>
          <span className="badge badge-blue">Techo Presupuestario</span>
        </div>
        <div className="metric-card">
          <div className="title">{labelCat} Convocados (Total)</div>
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
          <div className="title">{labelCat} con Inamovilidad</div>
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
              ALERTA PRESUPUESTARIA: Se detectaron {exceden.length} ESFM/UA convocando MÁS plazas de las permitidas por su tope en Planilla SEP.
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
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(filtroEstado === "TODOS" ? { borderColor: "var(--accent-blue)", background: "rgba(59, 130, 246, 0.2)" } : {})
            }}
          >
            <Layers size={14} />
            Todos ({controlTopes.length})
          </button>
          <button
            onClick={() => setFiltroEstado("EXCEDE")}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(filtroEstado === "EXCEDE" ? { borderColor: "var(--accent-rose)", background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" } : {})
            }}
          >
            <AlertTriangle size={14} color="#ef4444" />
            Excede Tope ({controlTopes.filter((r) => r.diferencia > 0).length})
          </button>
          <button
            onClick={() => setFiltroEstado("FALTA")}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(filtroEstado === "FALTA" ? { borderColor: "var(--accent-amber)", background: "rgba(245, 158, 11, 0.2)", color: "#fde68a" } : {})
            }}
          >
            <Clock size={14} color="#f59e0b" />
            Faltan por Convocar ({controlTopes.filter((r) => r.diferencia < 0).length})
          </button>
          <button
            onClick={() => setFiltroEstado("CUADRE")}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(filtroEstado === "CUADRE" ? { borderColor: "var(--accent-emerald)", background: "rgba(16, 185, 129, 0.2)", color: "#a7f3d0" } : {})
            }}
          >
            <CheckCircle2 size={14} color="#10b981" />
            Cuadre Exacto ({controlTopes.filter((r) => r.diferencia === 0).length})
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
                <Target size={22} color="var(--accent-blue)" />
                Control de Topes de {labelCat} — Pantalla Completa
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
                title="Vista Amplia / Grande: texto agrandado para lectura cómoda"
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

        {/* Tabla de Control de Topes */}
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
                {renderHeader("Tope SEP", "topeSEP", "right")}
                {renderHeader("Convocatoria", "convocadosTotal", "right")}
                {renderHeader("3 Años", "anios3", "right")}
                {renderHeader("2 Años", "anios2", "right")}
                {renderHeader("1 Año (Comp.)", "anios1", "right")}
                {renderHeader("Inamovilidad", "inamovilidadDocente", "right")}
                {renderHeader("Diferencia", "diferencia", "right")}
                {renderHeader("Estado", "estado", "center")}
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
                    <td style={{ fontWeight: 600, padding: configDensidad.cellPadding }}>{row.departamento}</td>
                    <td style={{ padding: configDensidad.cellPadding }}>{row.esfm}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", padding: configDensidad.cellPadding }}>{row.topeSEP}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, padding: configDensidad.cellPadding }}>{row.convocadosTotal}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#93c5fd", padding: configDensidad.cellPadding }}>{row.anios3}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#fde68a", padding: configDensidad.cellPadding }}>{row.anios2}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd", padding: configDensidad.cellPadding }}>{row.anios1}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: row.inamovilidadDocente > 0 ? "#f59e0b" : "#6b7280", padding: configDensidad.cellPadding }}>
                      {row.inamovilidadDocente > 0 ? row.inamovilidadDocente : "—"}
                    </td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 700,
                      padding: configDensidad.cellPadding,
                      color: row.diferencia > 0 ? "var(--accent-rose)" : row.diferencia < 0 ? "var(--accent-amber)" : "var(--accent-emerald)",
                    }}>
                      {row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia}
                    </td>
                    <td style={{ textAlign: "center", padding: configDensidad.cellPadding }}>
                      {row.estado.includes("EXCEDE") ? (
                        <span className="badge-red" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 8px" }}>
                          <AlertTriangle size={12} />
                          Excede ({row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia})
                        </span>
                      ) : row.estado.includes("FALTAN") ? (
                        <span className="badge-yellow" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 8px" }}>
                          <Clock size={12} />
                          Faltan ({row.diferencia})
                        </span>
                      ) : (
                        <span className="badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 8px" }}>
                          <CheckCircle2 size={12} />
                          Cuadre Exacto
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
