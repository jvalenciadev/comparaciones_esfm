"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FilaControlTope, BaseRecord } from "../../types";
import { exportarExcelTopes } from "../../lib/exportar";
import { cumpleCategoriaPersonal } from "../../lib/comparador";
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
  Columns,
} from "lucide-react";

interface Props {
  controlTopes: FilaControlTope[];
  convocatoriaRecords?: BaseRecord[];
  planillaSepRecords?: BaseRecord[];
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
  convocatoriaRecords = [],
  planillaSepRecords = [],
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

  // Estados del modal de cargos por ESFM (al hacer clic en el ojo)
  const [modalEsfm, setModalEsfm] = useState<FilaControlTope | null>(null);
  const [tabModal, setTabModal] = useState<"JUNTOS" | "CONVOCATORIA" | "SEP">("JUNTOS");
  const [modoSep, setModoSep] = useState<"AGRUPADO" | "DETALLE">("AGRUPADO");
  const [filtroModalTexto, setFiltroModalTexto] = useState<string>("");

  // Ordenamiento independiente para Convocatoria
  const [sortConvField, setSortConvField] = useState<string>("cargo");
  const [sortConvOrder, setSortConvOrder] = useState<"asc" | "desc">("asc");

  // Ordenamiento independiente para Planilla SEP
  const [sortSepField, setSortSepField] = useState<string>("cantidad");
  const [sortSepOrder, setSortSepOrder] = useState<"asc" | "desc">("desc");

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

  const handleSortConv = (field: string) => {
    if (sortConvField === field) {
      setSortConvOrder(sortConvOrder === "asc" ? "desc" : "asc");
    } else {
      setSortConvField(field);
      setSortConvOrder("asc");
    }
  };

  const handleSortSep = (field: string) => {
    if (sortSepField === field) {
      setSortSepOrder(sortSepOrder === "asc" ? "desc" : "asc");
    } else {
      setSortSepField(field);
      setSortSepOrder(field === "cantidad" ? "desc" : "asc");
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

  // Cargos convocados oficiales de la institución seleccionada
  const cargosConvocados = useMemo(() => {
    if (!modalEsfm || !convocatoriaRecords || convocatoriaRecords.length === 0) return [];
    const depTarget = modalEsfm.departamento.toUpperCase().trim();
    const esfmRawTarget = modalEsfm.esfm.toUpperCase().trim();
    const esfmKeyTarget = modalEsfm.esfm_key || "";

    return convocatoriaRecords.filter((r) => {
      if (r.departamento.toUpperCase().trim() !== depTarget) return false;
      if (!cumpleCategoriaPersonal(r, categoriaPersonal)) return false;
      if (esfmKeyTarget && r.esfm_key === esfmKeyTarget) return true;
      const raw = (r.esfm_raw || "").toUpperCase().trim();
      return raw.includes(esfmRawTarget) || esfmRawTarget.includes(raw);
    });
  }, [modalEsfm, convocatoriaRecords, categoriaPersonal]);

  // Ítems en planilla SEP de la institución seleccionada
  const cargosSep = useMemo(() => {
    if (!modalEsfm || !planillaSepRecords || planillaSepRecords.length === 0) return [];
    const depTarget = modalEsfm.departamento.toUpperCase().trim();
    const esfmRawTarget = modalEsfm.esfm.toUpperCase().trim();
    const esfmKeyTarget = modalEsfm.esfm_key || "";

    return planillaSepRecords.filter((r) => {
      if (r.departamento.toUpperCase().trim() !== depTarget) return false;
      if (!cumpleCategoriaPersonal(r, categoriaPersonal)) return false;
      if (esfmKeyTarget && r.esfm_key === esfmKeyTarget) return true;
      const raw = (r.esfm_raw || "").toUpperCase().trim();
      return raw.includes(esfmRawTarget) || esfmRawTarget.includes(raw);
    });
  }, [modalEsfm, planillaSepRecords, categoriaPersonal]);

  // Cargos SEP agrupados por denominación de cargo
  const cargosSepAgrupados = useMemo(() => {
    const map = new Map<string, { cargo: string; descripcion: string; cantidad: number }>();
    for (const r of cargosSep) {
      const c = r.cargo_raw || "SIN CARGO";
      const d = r.descripcion || "";
      const key = `${c}___${d}`;
      const item = map.get(key);
      if (!item) {
        map.set(key, { cargo: c, descripcion: d, cantidad: 1 });
      } else {
        item.cantidad += 1;
      }
    }
    return Array.from(map.values());
  }, [cargosSep]);

  // Lista ordenada de Convocatoria Oficial
  const cargosConvocadosOrdenados = useMemo(() => {
    let list = cargosConvocados.filter((r) => {
      if (filtroModalTexto) {
        const txt = filtroModalTexto.toLowerCase().trim();
        const mCargo = (r.cargo_raw || "").toLowerCase().includes(txt);
        const mDesc = (r.descripcion || "").toLowerCase().includes(txt);
        const mDet = (r.detalle || "").toLowerCase().includes(txt);
        if (!mCargo && !mDesc && !mDet) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let va: any = "";
      let vb: any = "";
      if (sortConvField === "cargo") {
        va = a.cargo_raw || "";
        vb = b.cargo_raw || "";
      } else if (sortConvField === "descripcion") {
        va = a.descripcion || "";
        vb = b.descripcion || "";
      } else if (sortConvField === "a3") {
        va = a.anios_3 || 0;
        vb = b.anios_3 || 0;
      } else if (sortConvField === "a2") {
        va = a.anios_2 || 0;
        vb = b.anios_2 || 0;
      } else if (sortConvField === "a1") {
        va = a.anios_1 || 0;
        vb = b.anios_1 || 0;
      } else if (sortConvField === "total") {
        va = (a.anios_3 || 0) + (a.anios_2 || 0) + (a.anios_1 || 0) || 1;
        vb = (b.anios_3 || 0) + (b.anios_2 || 0) + (b.anios_1 || 0) || 1;
      }
      if (typeof va === "string") {
        const cmp = va.localeCompare(vb);
        return sortConvOrder === "asc" ? cmp : -cmp;
      }
      return sortConvOrder === "asc" ? va - vb : vb - va;
    });

    return list;
  }, [cargosConvocados, filtroModalTexto, sortConvField, sortConvOrder]);

  // Lista ordenada de Planilla SEP
  const cargosSepOrdenados = useMemo(() => {
    if (modoSep === "AGRUPADO") {
      let list = cargosSepAgrupados.filter((r) => {
        if (filtroModalTexto) {
          const txt = filtroModalTexto.toLowerCase().trim();
          const mCargo = (r.cargo || "").toLowerCase().includes(txt);
          const mDesc = (r.descripcion || "").toLowerCase().includes(txt);
          if (!mCargo && !mDesc) return false;
        }
        return true;
      });

      list.sort((a, b) => {
        let va: any = "";
        let vb: any = "";
        if (sortSepField === "cargo") {
          va = a.cargo || "";
          vb = b.cargo || "";
        } else if (sortSepField === "descripcion") {
          va = a.descripcion || "";
          vb = b.descripcion || "";
        } else if (sortSepField === "cantidad" || sortSepField === "total") {
          va = a.cantidad || 0;
          vb = b.cantidad || 0;
        }
        if (typeof va === "string") {
          const cmp = va.localeCompare(vb);
          return sortSepOrder === "asc" ? cmp : -cmp;
        }
        return sortSepOrder === "asc" ? va - vb : vb - va;
      });
      return list;
    } else {
      let list = cargosSep.filter((r) => {
        if (filtroModalTexto) {
          const txt = filtroModalTexto.toLowerCase().trim();
          const mCargo = (r.cargo_raw || "").toLowerCase().includes(txt);
          const mDesc = (r.descripcion || "").toLowerCase().includes(txt);
          if (!mCargo && !mDesc) return false;
        }
        return true;
      });

      list.sort((a, b) => {
        let va: any = a.cargo_raw || "";
        let vb: any = b.cargo_raw || "";
        if (sortSepField === "descripcion") {
          va = a.descripcion || "";
          vb = b.descripcion || "";
        }
        const cmp = String(va).localeCompare(String(vb));
        return sortSepOrder === "asc" ? cmp : -cmp;
      });
      return list.map((r, i) => ({
        cargo: r.cargo_raw || "SIN CARGO",
        descripcion: r.descripcion || "",
        cantidad: 1,
        detalle: r.detalle,
      }));
    }
  }, [cargosSep, cargosSepAgrupados, modoSep, filtroModalTexto, sortSepField, sortSepOrder]);

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

  const renderHeader = (label: string, field: SortField, align: "left" | "right" | "center" = "left") => (
    <th
      onClick={() => handleSort(field)}
      style={{
        textAlign: align,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        padding: configDensidad.cellPadding,
      }}
      title={`Ordenar por ${label}`}
    >
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
        width: "100%",
      }}>
        <span>{label}</span>
        {sortField === field ? (
          sortOrder === "asc" ? <ArrowUp size={13} color="var(--accent-blue)" /> : <ArrowDown size={13} color="var(--accent-blue)" />
        ) : (
          <ArrowUpDown size={12} color="#64748b" style={{ opacity: 0.6 }} />
        )}
      </div>
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Encabezado y Acción de Exportar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Target size={22} color="var(--accent-blue)" />
            Control de Topes Presupuestarios (Planilla SEP vs Convocatoria Oficial)
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Comparación oficial de plazas asignadas en Planilla SEP contra plazas publicadas en Convocatoria Oficial ({labelCat}).
          </p>
        </div>

        <button onClick={() => exportarExcelTopes(filtrados)} className="btn-primary">
          <Download size={16} />
          Exportar Control de Topes
        </button>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="title">Tope Planilla SEP</div>
          <div className="val" style={{ color: "var(--accent-blue)" }}>{totTope.toLocaleString()}</div>
          <span className="badge badge-blue">Techo Presupuestario</span>
        </div>

        <div className="metric-card">
          <div className="title">Convocados Oficiales</div>
          <div className="val" style={{ color: "#93c5fd" }}>{totConv.toLocaleString()}</div>
          <span className="badge badge-green">
            3a: {tot3a} | 2a: {tot2a} | 1a: {tot1a}
          </span>
        </div>

        <div className="metric-card">
          <div className="title">Diferencia Neta Global</div>
          <div className="val" style={{ color: totDif > 0 ? "var(--accent-rose)" : totDif < 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
            {totDif > 0 ? `+${totDif.toLocaleString()}` : totDif.toLocaleString()}
          </div>
          <span className={`badge ${totDif > 0 ? "badge-red" : totDif < 0 ? "badge-yellow" : "badge-green"}`}>
            {totDif > 0 ? "Sobregiro Presupuestario" : totDif < 0 ? "Capacidad Disponible" : "Cuadre Exacto"}
          </span>
        </div>

        <div className="metric-card">
          <div className="title">Inamovilidades</div>
          <div className="val" style={{ color: "var(--accent-amber)" }}>{totInam.toLocaleString()}</div>
          <span className="badge badge-yellow">Plazas Protegidas</span>
        </div>
      </div>

      {/* Alerta de Sobregiros si existen */}
      {exceden.length > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "var(--radius-md)",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <AlertOctagon size={22} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: "var(--accent-rose)", fontSize: "0.9rem" }}>
              Alerta de Sobregiro Presupuestario: {exceden.length} {exceden.length === 1 ? "institución sobrepasa" : "instituciones sobrepasan"} el tope SEP asignado
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2px" }}>
              Instituciones con exceso: {exceden.map((e) => `${e.esfm} (+${e.diferencia})`).join(", ")}
            </div>
          </div>
        </div>
      )}

      {/* Filtros de Estado */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>Filtrar Estado:</span>
        {[
          { id: "TODOS", label: "Todas las ESFM / UA" },
          { id: "EXCEDE", label: "Solo Sobregiro (Exceden Tope)" },
          { id: "FALTA", label: "Solo con Plazas Disponibles (Faltan)" },
          { id: "CUADRE", label: "Solo Cuadre Exacto" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltroEstado(f.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              background: filtroEstado === f.id ? "var(--accent-blue)" : "rgba(31, 41, 55, 0.6)",
              borderColor: filtroEstado === f.id ? "var(--accent-blue)" : "var(--border-subtle)",
              color: filtroEstado === f.id ? "#ffffff" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contenedor Principal de la Tabla */}
      <div
        className={isFullscreen ? "fullscreen-table-overlay" : "glass-panel"}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: isFullscreen ? "18px 24px" : "16px",
          ...(isFullscreen
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
              overflow: "hidden",
            }
            : {}),
        }}
      >
        {isFullscreen && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
              paddingBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Target size={20} color="var(--accent-blue)" />
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#ffffff" }}>
                Control de Topes Presupuestarios — Vista Pantalla Completa
              </span>
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

        {/* Barra de Controles: Buscador Rápido y Selector de Tamaño */}
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
                  Ver Cargos
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
                          setTabModal("JUNTOS");
                          setFiltroModalTexto("");
                          setSortConvField("cargo");
                          setSortConvOrder("asc");
                          setSortSepField("cantidad");
                          setSortSepOrder("desc");
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          background: "rgba(59, 130, 246, 0.18)",
                          border: "1px solid rgba(59, 130, 246, 0.5)",
                          color: "#93c5fd",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                        }}
                        title={`Ver cargos de ${row.esfm}`}
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

      {/* ── MODAL DINÁMICO: VISTA JUNTOS / LADO A LADO DE CARGOS ── */}
      {modalEsfm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999999,
            background: "rgba(3, 7, 18, 0.88)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEsfm(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1350px",
              height: "92vh",
              maxHeight: "95vh",
              display: "flex",
              flexDirection: "column",
              background: "#0c1322",
              border: "1px solid rgba(59, 130, 246, 0.45)",
              borderRadius: "14px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(59, 130, 246, 0.2)",
              overflow: "hidden",
            }}
          >
            {/* Header del Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 22px",
                background: "rgba(17, 24, 39, 0.95)",
                borderBottom: "1px solid var(--border-subtle)",
                gap: "14px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Building2 size={20} color="var(--accent-blue)" />
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
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
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Comparación visual de cargos ({labelCat}): consulta y ordena directamente ambas fuentes para ver cuál corresponde a cuál.
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

            {/* Pestañas de Vista y Buscador Global */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                padding: "10px 22px",
                background: "rgba(15, 23, 42, 0.7)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setTabModal("JUNTOS")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1.5px solid",
                    background: tabModal === "JUNTOS" ? "var(--accent-blue)" : "rgba(31, 41, 55, 0.5)",
                    borderColor: tabModal === "JUNTOS" ? "var(--accent-blue)" : "var(--border-subtle)",
                    color: tabModal === "JUNTOS" ? "#ffffff" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Columns size={14} />
                  Vista Paralela (Juntos Lado a Lado)
                </button>

                <button
                  onClick={() => setTabModal("CONVOCATORIA")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    background: tabModal === "CONVOCATORIA" ? "var(--accent-blue)" : "rgba(31, 41, 55, 0.5)",
                    borderColor: tabModal === "CONVOCATORIA" ? "var(--accent-blue)" : "var(--border-subtle)",
                    color: tabModal === "CONVOCATORIA" ? "#ffffff" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                >
                  Solo Convocatoria ({cargosConvocados.length})
                </button>

                <button
                  onClick={() => setTabModal("SEP")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    background: tabModal === "SEP" ? "#6366f1" : "rgba(31, 41, 55, 0.5)",
                    borderColor: tabModal === "SEP" ? "#6366f1" : "var(--border-subtle)",
                    color: tabModal === "SEP" ? "#ffffff" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                >
                  Solo Planilla SEP ({cargosSep.length})
                </button>
              </div>

              {/* Buscador Rápido */}
              <div style={{ position: "relative", minWidth: "260px", maxWidth: "340px" }}>
                <Search size={14} color="#9ca3af" style={{ position: "absolute", left: "10px", top: "9px" }} />
                <input
                  type="text"
                  placeholder="Buscar cargo en ambas tablas..."
                  value={filtroModalTexto}
                  onChange={(e) => setFiltroModalTexto(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "32px", fontSize: "0.8rem", width: "100%", padding: "6px 10px 6px 32px" }}
                />
              </div>
            </div>

            {/* CUERPO DEL MODAL */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "14px 20px" }}>
              {tabModal === "JUNTOS" ? (
                /* ── VISTA PARALELA LADO A LADO (JUNTOS) ── */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", height: "100%", overflow: "hidden" }}>
                  {/* PANEL IZQUIERDO: CONVOCATORIA OFICIAL */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "rgba(15, 23, 42, 0.5)",
                      borderRadius: "10px",
                      border: "1px solid rgba(59, 130, 246, 0.35)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Header Panel Convocatoria */}
                    <div
                      style={{
                        padding: "10px 16px",
                        background: "rgba(59, 130, 246, 0.15)",
                        borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Target size={16} color="var(--accent-blue)" />
                        <span style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.85rem" }}>
                          Cargos Convocatoria Oficial ({cargosConvocadosOrdenados.length})
                        </span>
                      </div>
                      <span style={{ fontSize: "0.76rem", color: "#60a5fa", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>
                        {modalEsfm.convocadosTotal} plazas totales
                      </span>
                    </div>

                    {/* Tabla Convocatoria Ordenable */}
                    <div style={{ flex: 1, overflow: "auto" }}>
                      <table className="custom-table" style={{ fontSize: "0.78rem", margin: 0 }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 5, background: "#111827" }}>
                          <tr>
                            <th style={{ width: "32px", textAlign: "center", padding: "8px 6px" }}>#</th>
                            <th
                              onClick={() => handleSortConv("cargo")}
                              style={{ textAlign: "left", cursor: "pointer", userSelect: "none", padding: "8px 10px" }}
                              title="Clic para ordenar por Cargo"
                            >
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <span>Cargo Convocado</span>
                                {sortConvField === "cargo" ? (
                                  sortConvOrder === "asc" ? <ArrowUp size={12} color="var(--accent-blue)" /> : <ArrowDown size={12} color="var(--accent-blue)" />
                                ) : (
                                  <ArrowUpDown size={11} color="#64748b" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortConv("descripcion")}
                              style={{ textAlign: "left", cursor: "pointer", userSelect: "none", padding: "8px 10px" }}
                              title="Clic para ordenar por Especialidad"
                            >
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <span>Especialidad / Área</span>
                                {sortConvField === "descripcion" ? (
                                  sortConvOrder === "asc" ? <ArrowUp size={12} color="var(--accent-blue)" /> : <ArrowDown size={12} color="var(--accent-blue)" />
                                ) : (
                                  <ArrowUpDown size={11} color="#64748b" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortConv("total")}
                              style={{ textAlign: "right", width: "70px", cursor: "pointer", userSelect: "none", padding: "8px 10px" }}
                              title="Clic para ordenar por Plazas"
                            >
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                                <span>Plazas</span>
                                {sortConvField === "total" ? (
                                  sortConvOrder === "asc" ? <ArrowUp size={12} color="var(--accent-blue)" /> : <ArrowDown size={12} color="var(--accent-blue)" />
                                ) : (
                                  <ArrowUpDown size={11} color="#64748b" />
                                )}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cargosConvocadosOrdenados.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                                No se encontraron cargos convocados.
                              </td>
                            </tr>
                          ) : (
                            cargosConvocadosOrdenados.map((r, i) => {
                              const a3 = r.anios_3 || 0;
                              const a2 = r.anios_2 || 0;
                              const a1 = r.anios_1 || 0;
                              const tot = (a3 + a2 + a1) || 1;
                              const esInam = (r.detalle || "").toUpperCase().includes("INAMOBILIDAD");

                              return (
                                <tr key={i}>
                                  <td style={{ textAlign: "center", color: "#64748b", padding: "7px 6px" }}>{i + 1}</td>
                                  <td style={{ fontWeight: 600, color: "#f1f5f9", padding: "7px 10px" }}>
                                    {r.cargo_raw}
                                    {esInam && (
                                      <span style={{ marginLeft: "5px", fontSize: "0.68em", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "3px", padding: "1px 4px" }}>
                                        Inamovible
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ color: "#cbd5e1", padding: "7px 10px" }}>{r.descripcion || "—"}</td>
                                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#93c5fd", padding: "7px 10px" }}>
                                    {tot}
                                    {(a3 > 0 || a2 > 0 || a1 > 0) && (
                                      <span style={{ fontSize: "0.72em", color: "#64748b", display: "block", fontWeight: 400 }}>
                                        {[a3 > 0 && `${a3}a3`, a2 > 0 && `${a2}a2`, a1 > 0 && `${a1}a1`].filter(Boolean).join(" ")}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PANEL DERECHO: PLANILLA SEP */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "rgba(15, 23, 42, 0.5)",
                      borderRadius: "10px",
                      border: "1px solid rgba(129, 140, 248, 0.35)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Header Panel Planilla SEP */}
                    <div
                      style={{
                        padding: "8px 16px",
                        background: "rgba(129, 140, 248, 0.15)",
                        borderBottom: "1px solid rgba(129, 140, 248, 0.3)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Layers size={16} color="#818cf8" />
                        <span style={{ fontWeight: 700, color: "#c7d2fe", fontSize: "0.85rem" }}>
                          Ítems Planilla SEP ({cargosSep.length})
                        </span>
                      </div>

                      {/* Selector Agrupado vs Detalle */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => setModoSep("AGRUPADO")}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "1px solid",
                            background: modoSep === "AGRUPADO" ? "#6366f1" : "transparent",
                            borderColor: modoSep === "AGRUPADO" ? "#818cf8" : "rgba(255,255,255,0.1)",
                            color: modoSep === "AGRUPADO" ? "#ffffff" : "#94a3b8",
                          }}
                        >
                          Agrupado ({cargosSepAgrupados.length})
                        </button>
                        <button
                          onClick={() => setModoSep("DETALLE")}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "1px solid",
                            background: modoSep === "DETALLE" ? "#6366f1" : "transparent",
                            borderColor: modoSep === "DETALLE" ? "#818cf8" : "rgba(255,255,255,0.1)",
                            color: modoSep === "DETALLE" ? "#ffffff" : "#94a3b8",
                          }}
                        >
                          Ítem x Ítem ({cargosSep.length})
                        </button>
                        <span style={{ fontSize: "0.76rem", color: "#a5b4fc", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", marginLeft: "4px" }}>
                          {modalEsfm.topeSEP} ítems
                        </span>
                      </div>
                    </div>

                    {/* Tabla Planilla SEP Ordenable */}
                    <div style={{ flex: 1, overflow: "auto" }}>
                      <table className="custom-table" style={{ fontSize: "0.78rem", margin: 0 }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 5, background: "#111827" }}>
                          <tr>
                            <th style={{ width: "32px", textAlign: "center", padding: "8px 6px" }}>#</th>
                            <th
                              onClick={() => handleSortSep("cargo")}
                              style={{ textAlign: "left", cursor: "pointer", userSelect: "none", padding: "8px 10px" }}
                              title="Clic para ordenar por Cargo"
                            >
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <span>Cargo en Planilla SEP</span>
                                {sortSepField === "cargo" ? (
                                  sortSepOrder === "asc" ? <ArrowUp size={12} color="#818cf8" /> : <ArrowDown size={12} color="#818cf8" />
                                ) : (
                                  <ArrowUpDown size={11} color="#64748b" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortSep("descripcion")}
                              style={{ textAlign: "left", cursor: "pointer", userSelect: "none", padding: "8px 10px" }}
                              title="Clic para ordenar por Descripción"
                            >
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <span>Descripción / Detalle</span>
                                {sortSepField === "descripcion" ? (
                                  sortSepOrder === "asc" ? <ArrowUp size={12} color="#818cf8" /> : <ArrowDown size={12} color="#818cf8" />
                                ) : (
                                  <ArrowUpDown size={11} color="#64748b" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortSep("cantidad")}
                              style={{ textAlign: "right", width: "70px", cursor: "pointer", userSelect: "none", padding: "8px 10px" }}
                              title="Clic para ordenar por Cantidad de Ítems"
                            >
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                                <span>Ítems</span>
                                {sortSepField === "cantidad" ? (
                                  sortSepOrder === "asc" ? <ArrowUp size={12} color="#818cf8" /> : <ArrowDown size={12} color="#818cf8" />
                                ) : (
                                  <ArrowUpDown size={11} color="#64748b" />
                                )}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cargosSepOrdenados.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                                No se encontraron ítems en planilla SEP.
                              </td>
                            </tr>
                          ) : (
                            cargosSepOrdenados.map((r, i) => (
                              <tr key={i}>
                                <td style={{ textAlign: "center", color: "#64748b", padding: "7px 6px" }}>{i + 1}</td>
                                <td style={{ fontWeight: 600, color: "#f1f5f9", padding: "7px 10px" }}>{r.cargo}</td>
                                <td style={{ color: "#cbd5e1", padding: "7px 10px" }}>{r.descripcion || "—"}</td>
                                <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#a5b4fc", padding: "7px 10px" }}>
                                  {r.cantidad}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : tabModal === "CONVOCATORIA" ? (
                /* ── VISTA COMPLETA SOLO CONVOCATORIA ── */
                <div style={{ flex: 1, overflow: "auto", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px" }}>
                  <table className="custom-table" style={{ fontSize: "0.82rem", margin: 0 }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#111827" }}>
                      <tr>
                        <th style={{ width: "38px", textAlign: "center", padding: "10px 8px" }}>#</th>
                        <th onClick={() => handleSortConv("cargo")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Cargo Convocado {sortConvField === "cargo" && (sortConvOrder === "asc" ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSortConv("descripcion")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Especialidad / Área {sortConvField === "descripcion" && (sortConvOrder === "asc" ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSortConv("a3")} style={{ textAlign: "right", width: "85px", cursor: "pointer", userSelect: "none" }}>
                          3 Años
                        </th>
                        <th onClick={() => handleSortConv("a2")} style={{ textAlign: "right", width: "85px", cursor: "pointer", userSelect: "none" }}>
                          2 Años
                        </th>
                        <th onClick={() => handleSortConv("a1")} style={{ textAlign: "right", width: "95px", cursor: "pointer", userSelect: "none" }}>
                          1 Año (Comp.)
                        </th>
                        <th onClick={() => handleSortConv("total")} style={{ textAlign: "right", width: "95px", cursor: "pointer", userSelect: "none" }}>
                          Total Plazas
                        </th>
                        <th style={{ textAlign: "left", width: "160px" }}>Inamovilidad / Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cargosConvocadosOrdenados.map((r, i) => {
                        const a3 = r.anios_3 || 0;
                        const a2 = r.anios_2 || 0;
                        const a1 = r.anios_1 || 0;
                        const tot = a3 + a2 + a1 || 1;
                        const esInam = (r.detalle || "").toUpperCase().includes("INAMOBILIDAD");

                        return (
                          <tr key={i}>
                            <td style={{ textAlign: "center", color: "#64748b" }}>{i + 1}</td>
                            <td style={{ fontWeight: 600, color: "#f1f5f9" }}>{r.cargo_raw}</td>
                            <td style={{ color: "#cbd5e1" }}>{r.descripcion || "—"}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: a3 > 0 ? "#93c5fd" : "#64748b" }}>{a3 > 0 ? a3 : "—"}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: a2 > 0 ? "#fde68a" : "#64748b" }}>{a2 > 0 ? a2 : "—"}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: a1 > 0 ? "#c4b5fd" : "#64748b" }}>{a1 > 0 ? a1 : "—"}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#ffffff" }}>{tot}</td>
                            <td style={{ fontSize: "0.75rem", color: esInam ? "#f59e0b" : "#94a3b8" }}>{r.detalle || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ── VISTA COMPLETA SOLO PLANILLA SEP ── */
                <div style={{ flex: 1, overflow: "auto", border: "1px solid rgba(129, 140, 248, 0.3)", borderRadius: "8px" }}>
                  <table className="custom-table" style={{ fontSize: "0.82rem", margin: 0 }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#111827" }}>
                      <tr>
                        <th style={{ width: "38px", textAlign: "center", padding: "10px 8px" }}>#</th>
                        <th onClick={() => handleSortSep("cargo")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Cargo en Planilla SEP {sortSepField === "cargo" && (sortSepOrder === "asc" ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSortSep("descripcion")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Descripción {sortSepField === "descripcion" && (sortSepOrder === "asc" ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSortSep("cantidad")} style={{ textAlign: "right", width: "110px", cursor: "pointer", userSelect: "none" }}>
                          Ítems {sortSepField === "cantidad" && (sortSepOrder === "asc" ? "▲" : "▼")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cargosSepOrdenados.map((r, i) => (
                        <tr key={i}>
                          <td style={{ textAlign: "center", color: "#64748b" }}>{i + 1}</td>
                          <td style={{ fontWeight: 600, color: "#f1f5f9" }}>{r.cargo}</td>
                          <td style={{ color: "#cbd5e1" }}>{r.descripcion || "—"}</td>
                          <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#a5b4fc" }}>{r.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 22px",
                background: "rgba(17, 24, 39, 0.95)",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", gap: "18px", fontSize: "0.8rem", color: "#94a3b8" }}>
                <span>
                  Convocatoria Oficial: <strong style={{ color: "#93c5fd" }}>{modalEsfm.convocadosTotal} plazas</strong> ({cargosConvocados.length} cargos)
                </span>
                <span>
                  Planilla SEP: <strong style={{ color: "#a5b4fc" }}>{modalEsfm.topeSEP} ítems</strong> ({cargosSepAgrupados.length} denominaciones)
                </span>
                <span style={{ color: modalEsfm.diferencia > 0 ? "var(--accent-rose)" : modalEsfm.diferencia < 0 ? "var(--accent-amber)" : "var(--accent-emerald)", fontWeight: 700 }}>
                  Diferencia: {modalEsfm.diferencia > 0 ? `+${modalEsfm.diferencia}` : modalEsfm.diferencia}
                </span>
              </div>

              <button
                onClick={() => setModalEsfm(null)}
                className="btn-secondary"
                style={{ padding: "6px 18px", fontSize: "0.82rem", fontWeight: 600 }}
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
