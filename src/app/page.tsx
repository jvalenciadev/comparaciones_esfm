"use client";

import React, { useState, useEffect } from "react";
import {
  DataSources,
  FilaComparativa,
  FilaResumen,
  FilaControlTope,
  ConfiguracionConvocatoria,
} from "../types";
import {
  cargarPlanillaSep,
  cargarSifmweb,
  cargarArchivoConAnios,
  cargarPublicacionConvocatoria,
} from "../lib/cargadores";
import {
  construirTablaComparativa,
  resumenPorEsfm,
  calcularControlTopes,
  DEFAULT_CONFIG_CONVOCATORIA,
} from "../lib/comparador";
import { MetricCards } from "../components/MetricCards";
import { ControlTopesTab } from "../components/tabs/ControlTopesTab";
import { ResumenEsfmTab } from "../components/tabs/ResumenEsfmTab";
import { EstadisticasTab } from "../components/tabs/EstadisticasTab";
import { InamovilidadesModificacionesTab } from "../components/tabs/InamovilidadesModificacionesTab";
import {
  FolderUp,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Zap,
  Filter,
  BarChart3,
  Layers,
  Building2,
  Target,
  SlidersHorizontal,
  Globe,
} from "lucide-react";

export default function Home() {
  const [dfs, setDfs] = useState<DataSources>({});
  const [tabla, setTabla] = useState<FilaComparativa[]>([]);
  const [resumen, setResumen] = useState<FilaResumen[]>([]);
  const [controlTopes, setControlTopes] = useState<FilaControlTope[]>([]);

  const [activeTab, setActiveTab] = useState<"topes" | "resumen" | "stats" | "informe">("topes");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Configuración flexible de comparación (3 años, 2 años, 1 año compulsa, modo detalle)
  const [configConvocatoria, setConfigConvocatoria] =
    useState<ConfiguracionConvocatoria>(DEFAULT_CONFIG_CONVOCATORIA);

  // Filtros de navegación
  const [filtroDepto, setFiltroDepto] = useState<string>("");
  const [filtroEsfm, setFiltroEsfm] = useState<string>("");

  // Listas de opciones dinámicas para filtros
  const opcionesDepto = React.useMemo(() => {
    return Array.from(
      new Set(
        (dfs.planilla_sep || [])
          .map((r) => r.departamento)
          .concat((dfs.publicacion_convocatoria || []).map((r) => r.departamento))
          .filter(Boolean)
      )
    ).sort();
  }, [dfs]);

  const opcionesEsfm = React.useMemo(() => {
    const list = filtroDepto
      ? (dfs.planilla_sep || [])
        .concat(dfs.publicacion_convocatoria || [])
        .filter((r) => r.departamento === filtroDepto)
      : (dfs.planilla_sep || []).concat(dfs.publicacion_convocatoria || []);
    return Array.from(new Set(list.map((r) => r.esfm_raw).filter(Boolean))).sort();
  }, [dfs, filtroDepto]);

  // Procesamiento y actualización centralizada con la configuración activa
  const procesarDatasets = (sources: DataSources, config: ConfiguracionConvocatoria) => {
    const t = construirTablaComparativa(sources, config);
    const r = resumenPorEsfm(sources, config);
    const c = calcularControlTopes(sources, config);

    setTabla(t);
    setResumen(r);
    setControlTopes(c);
  };

  // Reaccionar a cambios en configConvocatoria
  useEffect(() => {
    if (Object.keys(dfs).length > 0) {
      procesarDatasets(dfs, configConvocatoria);
    }
  }, [configConvocatoria]);

  // Carga automática de los 4 archivos base
  const cargarArchivosPredeterminados = async () => {
    setIsLoading(true);
    setStatusMessage("Cargando y procesando los 4 archivos Excel oficiales...");
    try {
      const [resSep, resSifm, res2023, resConv] = await Promise.all([
        fetch("/data/PLA0926_DGFM SEPTIEMBRE.xlsx").then((r) => r.arrayBuffer()),
        fetch("/data/DATOS SIFMWEB.xlsx").then((r) => r.arrayBuffer()),
        fetch("/data/GESTION 2023.xlsx").then((r) => r.arrayBuffer()),
        fetch("/data/PUBLICACION CONVOCATORIA.xlsx").then((r) => r.arrayBuffer()),
      ]);

      const planilla_sep = cargarPlanillaSep(resSep);
      const sifmweb = cargarSifmweb(resSifm);
      const gestion_2023 = cargarArchivoConAnios(res2023, "gestion_2023");
      const publicacion_convocatoria = cargarPublicacionConvocatoria(resConv);

      const nuevosDfs: DataSources = {
        planilla_sep,
        sifmweb,
        gestion_2023,
        publicacion_convocatoria,
      };

      setDfs(nuevosDfs);
      procesarDatasets(nuevosDfs, configConvocatoria);
      setStatusMessage(null);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error cargando archivos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarArchivosPredeterminados();
  }, []);

  // Manejo de subida manual de archivos
  const handleFileUpload = async (key: keyof DataSources, file: File) => {
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      let records: any[] = [];
      if (key === "planilla_sep") {
        records = cargarPlanillaSep(buffer);
      } else if (key === "sifmweb") {
        records = cargarSifmweb(buffer);
      } else if (key === "gestion_2023") {
        records = cargarArchivoConAnios(buffer, "gestion_2023");
      } else if (key === "publicacion_convocatoria") {
        records = cargarPublicacionConvocatoria(buffer);
      }

      const nuevosDfs = { ...dfs, [key]: records };
      setDfs(nuevosDfs);
      procesarDatasets(nuevosDfs, configConvocatoria);
    } catch (err: any) {
      alert(`Error procesando archivo ${file.name}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className="app-sidebar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
              }}
            >
              <Layers size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
                ESFM / UA
              </h2>
              <span style={{ fontSize: "0.72rem", color: "#60a5fa", fontWeight: 600 }}>
                Control Comparativo
              </span>
            </div>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Auditoría y conciliación de plazas con Publicación Convocatoria oficial.
          </p>
        </div>

        {/* Botón de carga rápida */}
        <button
          onClick={cargarArchivosPredeterminados}
          disabled={isLoading}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Zap size={16} />
          {isLoading ? "Procesando..." : "Cargar Archivos Base"}
        </button>

        {/* ─── CONTROLES DE COMPARACIÓN PERSONALIZADA (QUE COMPARE COMO YO QUIERA) ─── */}
        <div style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          <div className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#60a5fa" }}>
            <SlidersHorizontal size={14} />
            Ajuste de Convocatoria
          </div>

          <div className="form-group" style={{ marginBottom: "8px" }}>
            <label className="form-label" style={{ fontSize: "0.72rem" }}>Personal / Categoría:</label>
            <select
              value={configConvocatoria.categoriaPersonal || "DOCENTES"}
              onChange={(e) =>
                setConfigConvocatoria({
                  ...configConvocatoria,
                  categoriaPersonal: e.target.value as ConfiguracionConvocatoria["categoriaPersonal"],
                })
              }
              className="form-select"
              style={{ fontSize: "0.78rem", padding: "6px 8px" }}
            >
              <option value="DOCENTES">Solo Docentes (Catedráticos)</option>
              <option value="ADMINISTRATIVOS">Solo Administrativos / Directivos (Sin Servicio)</option>
              <option value="SERVICIO">Solo Servicio (Chofer / Portero)</option>
              <option value="TODOS">General (Docentes + Adm. + Servicio)</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f3f4f6" }}>
              <input
                type="checkbox"
                checked={configConvocatoria.incluir3Anios}
                onChange={(e) =>
                  setConfigConvocatoria({ ...configConvocatoria, incluir3Anios: e.target.checked })
                }
                style={{ accentColor: "var(--accent-blue)" }}
              />
              Incluir 3 Años
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#f3f4f6" }}>
              <input
                type="checkbox"
                checked={configConvocatoria.incluir2Anios}
                onChange={(e) =>
                  setConfigConvocatoria({ ...configConvocatoria, incluir2Anios: e.target.checked })
                }
                style={{ accentColor: "var(--accent-blue)" }}
              />
              Incluir 2 Años
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: configConvocatoria.incluir1Anio ? "#c4b5fd" : "#9ca3af" }}>
              <input
                type="checkbox"
                checked={configConvocatoria.incluir1Anio}
                onChange={(e) =>
                  setConfigConvocatoria({ ...configConvocatoria, incluir1Anio: e.target.checked })
                }
                style={{ accentColor: "var(--accent-indigo)" }}
              />
              Incluir 1 Año (Compulsa)
            </label>
          </div>

          <div className="form-group" style={{ marginTop: "4px" }}>
            <label className="form-label" style={{ fontSize: "0.72rem" }}>Tratamiento de Detalle:</label>
            <select
              value={configConvocatoria.modoDetalle}
              onChange={(e) =>
                setConfigConvocatoria({
                  ...configConvocatoria,
                  modoDetalle: e.target.value as ConfiguracionConvocatoria["modoDetalle"],
                })
              }
              className="form-select"
              style={{ fontSize: "0.78rem", padding: "6px 8px" }}
            >
              <option value="TODOS">Todos (Convocatoria Completa)</option>
              <option value="SIN_INAMOVILIDAD">Sin Inamovilidad (Descontada)</option>
              <option value="SOLO_INAMOVILIDAD">Solo Inamovilidad</option>
              <option value="SOLO_COMPULSA">Solo Compulsa (1 Año / Reposición)</option>
              <option value="SOLO_MODIFICACIONES">Solo Modificaciones (Quitas / Incrementos)</option>
            </select>
          </div>
        </div>

        {/* Fuentes de Datos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FolderUp size={14} />
            Fuentes de Datos Excel
          </div>

          {[
            { key: "planilla_sep" as const, label: "1. Planilla SEP (Septiembre)", count: dfs.planilla_sep?.length },
            { key: "sifmweb" as const, label: "2. DATOS SIFMWEB", count: dfs.sifmweb?.length },
            { key: "gestion_2023" as const, label: "3. GESTIÓN 2023 (3/2 años)", count: dfs.gestion_2023?.length },
            { key: "publicacion_convocatoria" as const, label: "4. PUBLICACIÓN CONVOCATORIA", count: dfs.publicacion_convocatoria?.length },
          ].map(({ key, label, count }) => (
            <label
              key={key}
              className={`file-card ${count ? "loaded" : ""}`}
              style={{ cursor: "pointer", display: "block" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: count ? "#a7f3d0" : "#cbd5e1" }}>
                  {label}
                </span>
                {count ? (
                  <CheckCircle2 size={14} color="#10b981" />
                ) : (
                  <FileSpreadsheet size={14} color="#6b7280" />
                )}
              </div>
              <div style={{ fontSize: "0.7rem", color: count ? "#34d399" : "#64748b", marginTop: "2px" }}>
                {count ? `${count.toLocaleString()} registros activos` : "Click para subir .xlsx"}
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(key, f);
                }}
              />
            </label>
          ))}
        </div>

        {/* Filtros Geográficos e Institucionales */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
          <div className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} />
            Filtros
          </div>

          <div className="form-group">
            <label className="form-label">Departamento</label>
            <select
              value={filtroDepto}
              onChange={(e) => {
                setFiltroDepto(e.target.value);
                setFiltroEsfm("");
              }}
              className="form-select"
            >
              <option value="">Todos los Departamentos</option>
              {opcionesDepto.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ESFM / UA</label>
            <select
              value={filtroEsfm}
              onChange={(e) => setFiltroEsfm(e.target.value)}
              className="form-select"
            >
              <option value="">Todas las Instituciones</option>
              {opcionesEsfm.map((ins) => (
                <option key={ins} value={ins}>{ins}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", fontSize: "0.72rem", color: "var(--text-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Next.js + Vercel Ready</span>
          <span style={{ color: "var(--accent-emerald)" }}>● En Línea</span>
        </div>
      </aside>

      {/* ─── CONTENIDO PRINCIPAL ───────────────────────────────────────────── */}
      <main className="app-main">
        {/* Banner Superior Corporativo */}
        <header className="header-hero">
          <div>
            <h1>Sistema Comparativo ESFM/UA — Bolivia</h1>
            <p>
              Auditoría y conciliación de plazas con Publicación Convocatoria Oficial (Análisis a 3 años, 2 años, 1 año compulsa y detalle).
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="badge badge-blue">
              <Globe size={12} style={{ display: "inline", marginRight: "4px" }} />
              Vercel Deployed
            </span>
          </div>
        </header>

        {statusMessage && (
          <div
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              marginTop: "16px",
              fontSize: "0.85rem",
              color: "#bfdbfe",
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* KPIs Superiores */}
        <MetricCards dfs={dfs} controlTopes={controlTopes} />

        {/* Pestañas de Navegación */}
        <nav className="tabs-nav">
          <button
            onClick={() => setActiveTab("topes")}
            className={`tab-button ${activeTab === "topes" ? "active" : ""}`}
          >
            <Target size={17} />
            Control de Topes (SEP vs Convocatoria Oficial)
          </button>

          <button
            onClick={() => setActiveTab("resumen")}
            className={`tab-button ${activeTab === "resumen" ? "active" : ""}`}
          >
            <Building2 size={17} />
            Resumen por ESFM / UA
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
          >
            <BarChart3 size={17} />
            Tablero Estadístico Nacional
          </button>

          <button
            onClick={() => setActiveTab("informe")}
            className={`tab-button ${activeTab === "informe" ? "active" : ""}`}
          >
            <FileText size={17} />
            Inamovilidades y Modificaciones
          </button>
        </nav>

        {/* Vista Activa */}
        <div style={{ marginTop: "20px" }}>
          {activeTab === "topes" && (
            <ControlTopesTab
              controlTopes={controlTopes}
              convocatoriaRecords={dfs.publicacion_convocatoria || []}
              planillaSepRecords={dfs.planilla_sep || []}
              filtroDepto={filtroDepto}
              filtroEsfm={filtroEsfm}
              categoriaPersonal={configConvocatoria.categoriaPersonal}
            />
          )}

          {activeTab === "resumen" && (
            <ResumenEsfmTab
              resumen={resumen}
              filtroDepto={filtroDepto}
              filtroEsfm={filtroEsfm}
            />
          )}

          {activeTab === "stats" && (
            <EstadisticasTab
              tabla={tabla}
              resumen={resumen}
              controlTopes={controlTopes}
              sifmweb={dfs.sifmweb || []}
              categoriaPersonal={configConvocatoria.categoriaPersonal}
            />
          )}

          {activeTab === "informe" && (
            <InamovilidadesModificacionesTab
              convocatoriaRecords={dfs.publicacion_convocatoria || []}
              filtroDepto={filtroDepto}
              filtroEsfm={filtroEsfm}
            />
          )}
        </div>
      </main>
    </div>
  );
}
