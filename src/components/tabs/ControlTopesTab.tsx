"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FilaControlTope, FilaComparativa } from "../../types";
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
  Eye,
  X,
  Building2,
  Info,
  Filter,
} from "lucide-react";

interface Props {
  controlTopes: FilaControlTope[];
  tabla?: FilaComparativa[];
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
  tabla = [],
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

  // Estado para el modal de detalle de cargos por ESFM (al hacer clic en el ojo)
  const [modalEsfm, setModalEsfm] = useState<FilaControlTope | null>(null);
  const [filtroModalTexto, setFiltroModalTexto] = useState<string>("");
  const [filtroModalEstado, setFiltroModalEstado] = useState<string>("TODOS");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalEsfm) {
          setModalEsfm(null);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    if (isFullscreen || modalEsfm) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, modalEsfm]);

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

  // Cargos pertenecientes a la institución seleccionada para el modal comparativo
  const cargosDeInstitucion = useMemo(() => {
    if (!modalEsfm || !tabla || tabla.length === 0) return [];
    const depTarget = modalEsfm.departamento.toUpperCase().trim();
    const esfmKeyTarget = modalEsfm.esfm_key || "";
    const esfmRawTarget = modalEsfm.esfm.toUpperCase().trim();

    return tabla.filter((t) => {
      if (t.departamento.toUpperCase().trim() !== depTarget) return false;
      if (esfmKeyTarget && t.esfm_key === esfmKeyTarget) return true;
      const tDisplay = t.esfm_display.toUpperCase().trim();
      return tDisplay.includes(esfmRawTarget) || esfmRawTarget.includes(tDisplay);
    });
  }, [tabla, modalEsfm]);

  const cargosFiltradosModal = useMemo(() => {
    return cargosDeInstitucion.filter((c) => {
      if (filtroModalTexto) {
        const txt = filtroModalTexto.toLowerCase().trim();
        const mCargo = (c.cargo_display || c.cargo_key || "").toLowerCase().includes(txt);
        const mDesc = (c.descripcion_cargo || "").toLowerCase().includes(txt);
        const mDiag = (c.diagnostico || "").toLowerCase().includes(txt);
        if (!mCargo && !mDesc && !mDiag) return false;
      }
      const cSep = c.cant_sep ?? 0;
      const cConv = c.items_convocatoria ?? 0;
      if (filtroModalEstado === "AMBOS" && (cSep === 0 || cConv === 0)) return false;
      if (filtroModalEstado === "SOLO_SEP" && (cSep === 0 || cConv > 0)) return false;
      if (filtroModalEstado === "SOLO_CONV" && (cConv === 0 || cSep > 0)) return false;
      if (filtroModalEstado === "DIFERENCIA" && cConv === cSep) return false;
      return true;
    });
  }, [cargosDeInstitucion, filtroModalTexto, filtroModalEstado]);

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
                <th style={{ textAlign: "center", width: "120px", padding: configDensidad.cellPadding, color: "#93c5fd" }}>
                  Comparativa
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
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
                    <td style={{ textAlign: "center", padding: configDensidad.cellPadding }}>
                      <button
                        onClick={() => {
                          setModalEsfm(row);
                          setFiltroModalTexto("");
                          setFiltroModalEstado("TODOS");
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 11px",
                          borderRadius: "6px",
                          background: "rgba(59, 130, 246, 0.16)",
                          border: "1px solid rgba(59, 130, 246, 0.45)",
                          color: "#93c5fd",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                        }}
                        title={`Ver comparación de cargos para ${row.esfm}`}
                      >
                        <Eye size={13} color="#60a5fa" />
                        <span>Ver Cargos</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL DE COMPARACIÓN DETALLADA DE CARGOS (SEP VS CONVOCATORIA) ── */}
      {modalEsfm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999999,
            background: "rgba(3, 7, 18, 0.82)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEsfm(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1150px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              background: "#0c1322",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: "14px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(59, 130, 246, 0.15)",
              overflow: "hidden",
            }}
          >
            {/* Header del Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "18px 24px",
                background: "rgba(17, 24, 39, 0.9)",
                borderBottom: "1px solid var(--border-subtle)",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Building2 size={20} color="var(--accent-blue)" />
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#ffffff" }}>
                    {modalEsfm.esfm}
                  </h3>
                  <span
                    style={{
                      background: "rgba(59, 130, 246, 0.2)",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                      color: "#93c5fd",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                    }}
                  >
                    {modalEsfm.departamento}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Comparación detallada cargo por cargo: <strong>Planilla SEP (Tope)</strong> vs <strong>Convocatoria Oficial ({labelCat})</strong>
                </p>
              </div>

              <button
                onClick={() => setModalEsfm(null)}
                style={{
                  background: "rgba(31, 41, 55, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                title="Cerrar modal (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* KPIs Resumen de la Institución */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                padding: "14px 24px",
                background: "rgba(15, 23, 42, 0.5)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div style={{ background: "rgba(17, 24, 39, 0.7)", border: "1px solid rgba(129, 140, 248, 0.3)", borderRadius: "8px", padding: "10px 14px" }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>Tope Planilla SEP</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#a5b4fc", fontFamily: "var(--font-mono, monospace)" }}>
                  {modalEsfm.topeSEP} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8" }}>ítems</span>
                </div>
              </div>

              <div style={{ background: "rgba(17, 24, 39, 0.7)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", padding: "10px 14px" }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>Convocatoria Oficial</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#93c5fd", fontFamily: "var(--font-mono, monospace)" }}>
                  {modalEsfm.convocadosTotal} <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "#94a3b8" }}>(3a: {modalEsfm.anios3} | 2a: {modalEsfm.anios2} | 1a: {modalEsfm.anios1})</span>
                </div>
              </div>

              <div style={{
                background: "rgba(17, 24, 39, 0.7)",
                border: "1px solid",
                borderColor: modalEsfm.diferencia > 0 ? "rgba(244, 63, 94, 0.3)" : modalEsfm.diferencia < 0 ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
              }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>Balance / Diferencia</div>
                <div style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  color: modalEsfm.diferencia > 0 ? "var(--accent-rose)" : modalEsfm.diferencia < 0 ? "var(--accent-amber)" : "var(--accent-emerald)",
                }}>
                  {modalEsfm.diferencia > 0 ? `+${modalEsfm.diferencia}` : modalEsfm.diferencia}
                  <span style={{ fontSize: "0.72rem", fontWeight: 500, marginLeft: "6px" }}>
                    {modalEsfm.diferencia > 0 ? "(Excede)" : modalEsfm.diferencia < 0 ? "(Faltan por convocar)" : "(Cuadre Exacto)"}
                  </span>
                </div>
              </div>

              <div style={{ background: "rgba(17, 24, 39, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "10px 14px" }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>Inamovilidad</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: modalEsfm.inamovilidadDocente > 0 ? "#f59e0b" : "#94a3b8", fontFamily: "var(--font-mono, monospace)" }}>
                  {modalEsfm.inamovilidadDocente > 0 ? `${modalEsfm.inamovilidadDocente} protegida(s)` : "—"}
                </div>
              </div>
            </div>

            {/* Barra de Filtros del Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                padding: "12px 24px",
                background: "rgba(17, 24, 39, 0.6)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {/* Buscador de cargo */}
              <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "420px" }}>
                <Search size={14} color="#9ca3af" style={{ position: "absolute", left: "10px", top: "9px" }} />
                <input
                  type="text"
                  placeholder="Buscar cargo o especialidad..."
                  value={filtroModalTexto}
                  onChange={(e) => setFiltroModalTexto(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "32px", fontSize: "0.8rem", width: "100%", padding: "6px 10px 6px 32px" }}
                />
              </div>

              {/* Botones de filtro por estado */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { id: "TODOS", label: `Todos (${cargosDeInstitucion.length})` },
                  { id: "AMBOS", label: "SEP y Convocatoria" },
                  { id: "SOLO_SEP", label: "Solo en SEP" },
                  { id: "SOLO_CONV", label: "Solo en Convocatoria" },
                  { id: "DIFERENCIA", label: "Con Diferencia" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFiltroModalEstado(f.id)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid",
                      background: filtroModalEstado === f.id ? "var(--accent-blue)" : "rgba(31, 41, 55, 0.6)",
                      borderColor: filtroModalEstado === f.id ? "var(--accent-blue)" : "var(--border-subtle)",
                      color: filtroModalEstado === f.id ? "#ffffff" : "#94a3b8",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla Detallada de Cargos */}
            <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
              <table className="custom-table" style={{ fontSize: "0.82rem", margin: 0 }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#111827" }}>
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>#</th>
                    <th style={{ textAlign: "left" }}>Cargo / Función Oficial</th>
                    <th style={{ textAlign: "left" }}>Especialidad / Área</th>
                    <th style={{ textAlign: "right", color: "#a5b4fc", width: "90px" }}>Planilla SEP</th>
                    <th style={{ textAlign: "right", color: "#93c5fd", width: "100px" }}>Convocatoria</th>
                    <th style={{ textAlign: "right", width: "85px" }}>Diferencia</th>
                    <th style={{ textAlign: "center", width: "170px" }}>Diagnóstico</th>
                    <th style={{ textAlign: "left", width: "160px" }}>Observación / Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {cargosFiltradosModal.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        {cargosDeInstitucion.length === 0
                          ? "No se hallaron cargos individuales desglosados para esta institución."
                          : "No hay cargos que coincidan con los filtros aplicados."}
                      </td>
                    </tr>
                  ) : (
                    cargosFiltradosModal.map((c, i) => {
                      const sepCant = c.cant_sep ?? 0;
                      const convCant = c.items_convocatoria ?? 0;
                      const dif = convCant - sepCant;
                      const a3 = c.anios_3 ?? 0;
                      const a2 = c.anios_2 ?? 0;
                      const a1 = c.anios_1 ?? 0;
                      const esInam = (c.detalle || "").toUpperCase().includes("INAMOBILIDAD");

                      return (
                        <tr key={i}>
                          <td style={{ textAlign: "center", color: "#64748b", fontSize: "0.75rem" }}>{i + 1}</td>
                          <td style={{ fontWeight: 600, color: "#f1f5f9" }}>
                            {c.cargo_oficial_homologado || c.cargo_display || c.cargo_key}
                          </td>
                          <td style={{ color: "#cbd5e1" }}>
                            {c.descripcion_cargo || "—"}
                          </td>
                          <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: sepCant > 0 ? "#a5b4fc" : "#64748b" }}>
                            {sepCant > 0 ? sepCant : "—"}
                          </td>
                          <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: convCant > 0 ? "#93c5fd" : "#64748b" }}>
                            {convCant > 0 ? (
                              <span>
                                {convCant}
                                {(a3 > 0 || a2 > 0 || a1 > 0) && (
                                  <span style={{ fontSize: "0.68em", color: "#64748b", display: "block", fontWeight: 400 }}>
                                    {[a3 > 0 && `${a3} (3a)`, a2 > 0 && `${a2} (2a)`, a1 > 0 && `${a1} (1a)`].filter(Boolean).join(" ")}
                                  </span>
                                )}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={{
                            textAlign: "right",
                            fontFamily: "var(--font-mono, monospace)",
                            fontWeight: 700,
                            color: dif > 0 ? "var(--accent-rose)" : dif < 0 ? "var(--accent-amber)" : "var(--accent-emerald)",
                          }}>
                            {dif > 0 ? `+${dif}` : dif === 0 ? "0" : dif}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                background: dif > 0
                                  ? "rgba(244, 63, 94, 0.15)"
                                  : dif < 0
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "rgba(16, 185, 129, 0.15)",
                                color: dif > 0
                                  ? "#fda4af"
                                  : dif < 0
                                    ? "#fde68a"
                                    : "#6ee7b7",
                                border: "1px solid",
                                borderColor: dif > 0
                                  ? "rgba(244, 63, 94, 0.3)"
                                  : dif < 0
                                    ? "rgba(245, 158, 11, 0.3)"
                                    : "rgba(16, 185, 129, 0.3)",
                              }}
                            >
                              {c.diagnostico || (dif === 0 ? "Ratificado" : dif > 0 ? "Nuevo en Convocatoria" : "Cubierto sin Convocatoria")}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.74rem", color: esInam ? "#f59e0b" : "#94a3b8" }}>
                            {c.detalle ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                {esInam && <Info size={12} color="#f59e0b" />}
                                {c.detalle}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer del Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 24px",
                background: "rgba(17, 24, 39, 0.95)",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                Mostrando <strong>{cargosFiltradosModal.length}</strong> de <strong>{cargosDeInstitucion.length}</strong> cargos registrados
              </span>

              <button
                onClick={() => setModalEsfm(null)}
                className="btn-secondary"
                style={{ padding: "6px 16px", fontSize: "0.8rem", fontWeight: 600 }}
              >
                Cerrar (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
