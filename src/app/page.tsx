"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  DataSources,
  FilaComparativa,
  FilaResumen,
  FilaControlTope,
} from "../types";
import {
  cargarPlanillaSep,
  cargarSifmweb,
  cargarArchivoConAnios,
} from "../lib/cargadores";
import {
  construirTablaComparativa,
  resumenPorEsfm,
  calcularControlTopes,
} from "../lib/comparador";
import { MetricCards } from "../components/MetricCards";
import { ControlTopesTab } from "../components/tabs/ControlTopesTab";
import { ResumenEsfmTab } from "../components/tabs/ResumenEsfmTab";
import { EstadisticasTab } from "../components/tabs/EstadisticasTab";
import {
  FolderUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Zap,
  Filter,
  BarChart3,
  Building2,
  Target,
  Globe,
  Layers,
} from "lucide-react";

export default function Home() {
  const [dfs, setDfs] = useState<DataSources>({});
  const [tabla, setTabla] = useState<FilaComparativa[]>([]);
  const [resumen, setResumen] = useState<FilaResumen[]>([]);
  const [controlTopes, setControlTopes] = useState<FilaControlTope[]>([]);

  const [activeTab, setActiveTab] = useState<"topes" | "resumen" | "stats">("topes");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filtros
  const [filtroDepto, setFiltroDepto] = useState<string>("");
  const [filtroEsfm, setFiltroEsfm] = useState<string>("");

  // Listas de opciones para filtros
  const opcionesDepto = React.useMemo(() => {
    return Array.from(new Set(tabla.map((r) => r.departamento).filter(Boolean))).sort();
  }, [tabla]);

  const opcionesEsfm = React.useMemo(() => {
    const list = filtroDepto ? tabla.filter((r) => r.departamento === filtroDepto) : tabla;
    return Array.from(new Set(list.map((r) => r.esfm_display).filter(Boolean))).sort();
  }, [tabla, filtroDepto]);

  // Función para procesar y actualizar estado centralizado
  const procesarDatasets = (sources: DataSources) => {
    const t = construirTablaComparativa(sources);
    const r = resumenPorEsfm(t);
    const c = calcularControlTopes(sources);

    setTabla(t);
    setResumen(r);
    setControlTopes(c);
  };

  // Carga automática o por clic de los 4 archivos predeterminados del sistema
  const cargarArchivosPredeterminados = async () => {
    setIsLoading(true);
    setStatusMessage("Cargando y procesando los 4 archivos Excel del sistema...");
    try {
      const [resSep, resSifm, res2023, resPub] = await Promise.all([
        fetch("/data/PLA0926_DGFM SEPTIEMBRE.xlsx").then((r) => r.arrayBuffer()),
        fetch("/data/DATOS SIFMWEB.xlsx").then((r) => r.arrayBuffer()),
        fetch("/data/GESTION 2023.xlsx").then((r) => r.arrayBuffer()),
        fetch("/data/OFICIAL PUBLICADO.xlsx").then((r) => r.arrayBuffer()),
      ]);

      const planilla_sep = cargarPlanillaSep(resSep);
      const sifmweb = cargarSifmweb(resSifm);
      const gestion_2023 = cargarArchivoConAnios(res2023, "gestion_2023");
      const oficial_publicado = cargarArchivoConAnios(resPub, "oficial_publicado");

      const nuevosDfs: DataSources = {
        planilla_sep,
        sifmweb,
        gestion_2023,
        oficial_publicado,
      };

      setDfs(nuevosDfs);
      procesarDatasets(nuevosDfs);
      setStatusMessage(null);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error cargando archivos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Carga automática inicial en montaje
  useEffect(() => {
    cargarArchivosPredeterminados();
  }, []);

  // Manejo de subida manual de archivos
  const handleFileUpload = async (
    key: keyof DataSources,
    file: File
  ) => {
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
      } else if (key === "oficial_publicado") {
        records = cargarArchivoConAnios(buffer, "oficial_publicado");
      }

      const nuevosDfs = { ...dfs, [key]: records };
      setDfs(nuevosDfs);
      procesarDatasets(nuevosDfs);
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
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)"
            }}>
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
            Centralizador y comparador de convocatorias docentes y administrativas de Bolivia.
          </p>
        </div>

        {/* Botón de carga rápida de archivos del proyecto */}
        <button
          onClick={cargarArchivosPredeterminados}
          disabled={isLoading}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Zap size={16} />
          {isLoading ? "Procesando Datos..." : "Cargar 4 Archivos Base"}
        </button>

        {/* Fuentes de Datos Manuales */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FolderUp size={14} />
            Cargar / Actualizar Archivos
          </div>

          {[
            { key: "planilla_sep" as const, label: "1. Planilla SEP (Septiembre)", count: dfs.planilla_sep?.length },
            { key: "sifmweb" as const, label: "2. DATOS SIFMWEB", count: dfs.sifmweb?.length },
            { key: "gestion_2023" as const, label: "3. GESTIÓN 2023 (3/2 años)", count: dfs.gestion_2023?.length },
            { key: "oficial_publicado" as const, label: "4. OFICIAL PUBLICADO", count: dfs.oficial_publicado?.length },
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

        {/* Filtros dinámicos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
          <div className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} />
            Filtros del Sistema
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
              Auditoría y conciliación de plazas docentes y administrativas (SEP, SIFMWEB, Gestión 2023, Convocatoria Oficial).
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
          <div style={{
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            marginTop: "16px",
            fontSize: "0.85rem",
            color: "#bfdbfe"
          }}>
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
            🎯 Control de Topes (SEP vs Oficial)
          </button>

          <button
            onClick={() => setActiveTab("resumen")}
            className={`tab-button ${activeTab === "resumen" ? "active" : ""}`}
          >
            <Building2 size={17} />
            🏛️ Resumen por ESFM / UA
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
          >
            <BarChart3 size={17} />
            📈 Tablero Estadístico Nacional
          </button>
        </nav>

        {/* Vista Activa */}
        <div style={{ marginTop: "20px" }}>
          {activeTab === "topes" && (
            <ControlTopesTab
              controlTopes={controlTopes}
              filtroDepto={filtroDepto}
              filtroEsfm={filtroEsfm}
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
            />
          )}
        </div>
      </main>
    </div>
  );
}
