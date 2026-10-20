"use client";

import React, { useState, useMemo } from "react";
import { BaseRecord } from "../../types";
import { exportarExcelInamovilidadesModificaciones } from "../../lib/exportar";
import {
  Download,
  Search,
  ShieldAlert,
  PlusCircle,
  MinusCircle,
  FileText,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Layers,
} from "lucide-react";

interface Props {
  convocatoriaRecords: BaseRecord[];
  filtroDepto: string;
  filtroEsfm: string;
}

export const InamovilidadesModificacionesTab: React.FC<Props> = ({
  convocatoriaRecords,
  filtroDepto,
  filtroEsfm,
}) => {
  const [tipoFiltro, setTipoFiltro] = useState<
    "TODOS" | "INAMOVILIDAD" | "INCREMENTO" | "QUITA_PCD" | "COMPULSA"
  >("TODOS");
  const [filtroPersonal, setFiltroPersonal] = useState<"TODOS" | "DOCENTE" | "ADMINISTRATIVO">("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  // Extraer todas las filas con DETALLE o plazas de 1 año (Compulsa)
  const filasCasosEspeciales = useMemo(() => {
    return convocatoriaRecords.filter((r) => {
      const d = (r.detalle || "").trim();
      const a1 = r.anios_1 ?? 0;
      return d !== "" || a1 > 0;
    });
  }, [convocatoriaRecords]);

  // Clasificación para cada fila
  const filasClasificadas = useMemo(() => {
    return filasCasosEspeciales.map((r) => {
      const detUpper = (r.detalle || "").toUpperCase();
      let tipo: "INAMOVILIDAD" | "INCREMENTO" | "QUITA_PCD" | "COMPULSA" = "COMPULSA";
      let clasificacion = "📝 Compulsa (1 Año)";
      let badgeClass = "badge-blue";

      if (detUpper.includes("INAMOVILIDAD")) {
        tipo = "INAMOVILIDAD";
        clasificacion = "🛡️ Inamovilidad Funcionaria";
        badgeClass = "badge-yellow";
      } else if (detUpper.includes("INCREMENT")) {
        tipo = "INCREMENTO";
        clasificacion = "➕ Incremento Aprobado (+1)";
        badgeClass = "badge-green";
      } else if (detUpper.includes("QUITO")) {
        tipo = "QUITA_PCD";
        clasificacion = "➖ Quitado (-1 PCD)";
        badgeClass = "badge-red";
      } else if (detUpper.includes("COMPULSA") || (r.anios_1 ?? 0) > 0) {
        tipo = "COMPULSA";
        clasificacion = detUpper.includes("REPONER")
          ? "🔄 Reponer con Compulsa"
          : "📝 Compulsa / 1 Año";
        badgeClass = "badge-blue";
      }

      const esDoc = r.categoria === "DOCENTE" || (r.cargo_raw || "").includes("CATEDRATICO") || (r.cargo_raw || "").includes("DOCENTE");
      const estamento: "DOCENTE" | "ADMINISTRATIVO" = esDoc ? "DOCENTE" : "ADMINISTRATIVO";

      return {
        departamento: r.departamento,
        esfm: r.esfm_raw,
        cargo: r.cargo_raw,
        especialidad: r.descripcion,
        anios3: r.anios_3 ?? 0,
        anios2: r.anios_2 ?? 0,
        anios1: r.anios_1 ?? 0,
        tipo,
        clasificacion,
        badgeClass,
        estamento,
        detalle: r.detalle || (r.anios_1 ? "PLAZA DE 1 AÑO (COMPULSA TEMPORAL)" : "—"),
      };
    });
  }, [filasCasosEspeciales]);

  // Contadores para KPIs
  const totalInamovilidad = filasClasificadas.filter((f) => f.tipo === "INAMOVILIDAD").length;
  const totalIncremento = filasClasificadas.filter((f) => f.tipo === "INCREMENTO").length;
  const totalQuita = filasClasificadas.filter((f) => f.tipo === "QUITA_PCD").length;

  // Desglose inamovilidad: docente vs administrativo
  const filasInam = filasClasificadas.filter((f) => f.tipo === "INAMOVILIDAD");
  const inamDocente = filasInam.filter(
    (f) => f.cargo.includes("CATEDRATICO") || f.cargo.includes("DOCENTE")
  );
  const inamAdm = filasInam.filter(
    (f) => !f.cargo.includes("CATEDRATICO") && !f.cargo.includes("DOCENTE")
  );
  const totalInamovilidadDocente = inamDocente.length;   // esperado: 20
  const totalInamovilidadAdm = inamAdm.length;           // esperado: 22
  // Ítems totales de filas inamovilidad (suma 3a+2a+1a de cada fila)
  const itemsInamovilidad = filasInam.reduce((acc, f) => acc + f.anios3 + f.anios2 + f.anios1, 0);
  // Sin inamovilidad: itemsInamovilidad - totalInamovilidad (cada fila -1)
  const itemsSinInamovilidad = itemsInamovilidad - totalInamovilidad;

  // Filas con anios_1 > 0 = todas las plazas de 1 año (compulsa)
  const filasConAnio1 = convocatoriaRecords.filter((r) => (r.anios_1 ?? 0) > 0);
  const totalCompulsa = filasConAnio1.length;
  const totalCompulsaDocente = filasConAnio1.filter(
    (r) => r.categoria === "DOCENTE" || r.cargo_raw?.includes("CATEDRATICO") || r.cargo_raw?.includes("DOCENTE")
  ).length;
  // Suma real columna anios_1 de TODOS los registros
  const itemsCompulsa = convocatoriaRecords.reduce((acc, r) => acc + (r.anios_1 ?? 0), 0); // esperado: 133
  const itemsCompulsaDocente = filasConAnio1
    .filter((r) => r.categoria === "DOCENTE" || r.cargo_raw?.includes("CATEDRATICO") || r.cargo_raw?.includes("DOCENTE"))
    .reduce((acc, r) => acc + (r.anios_1 ?? 0), 0);


  // Filtrado reactivo por chips, departamento, ESFM, estamento y búsqueda
  const filtrados = useMemo(() => {
    return filasClasificadas.filter((r) => {
      if (filtroDepto && r.departamento !== filtroDepto) return false;
      if (filtroEsfm && r.esfm !== filtroEsfm) return false;
      if (tipoFiltro !== "TODOS" && r.tipo !== tipoFiltro) return false;
      if (filtroPersonal === "DOCENTE" && r.estamento !== "DOCENTE") return false;
      if (filtroPersonal === "ADMINISTRATIVO" && r.estamento !== "ADMINISTRATIVO") return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const mCargo = r.cargo.toLowerCase().includes(term);
        const mEsp = r.especialidad.toLowerCase().includes(term);
        const mEsfm = r.esfm.toLowerCase().includes(term);
        const mDet = r.detalle.toLowerCase().includes(term);
        if (!mCargo && !mEsp && !mEsfm && !mDet) return false;
      }

      return true;
    });
  }, [filasClasificadas, filtroDepto, filtroEsfm, tipoFiltro, filtroPersonal, searchTerm]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Encabezado del Tablero */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={20} color="var(--accent-blue)" />
            Informe Detallado de Inamovilidades y Modificaciones
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Registro pormenorizado con la justificación oficial de plazas con inamovilidad, incrementos, quitas de PCD y designaciones por compulsa.
          </p>
        </div>

        <button
          onClick={() => exportarExcelInamovilidadesModificaciones(filtrados)}
          className="btn-primary"
        >
          <Download size={16} />
          Descargar Informe en Excel
        </button>
      </div>

      {/* KPI Cards Superiores */}
      <div className="metrics-grid">
        <div
          onClick={() => setTipoFiltro(tipoFiltro === "INAMOVILIDAD" ? "TODOS" : "INAMOVILIDAD")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: tipoFiltro === "INAMOVILIDAD" ? "var(--accent-amber)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <ShieldAlert size={16} color="#f59e0b" />
            Inamovilidades
          </div>
          <div className="val" style={{ color: "#fde68a" }}>
            {totalInamovilidad} <span style={{ fontSize: "0.9rem", color: "#fbbf24" }}>filas totales</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTipoFiltro("INAMOVILIDAD");
                setFiltroPersonal(filtroPersonal === "DOCENTE" ? "TODOS" : "DOCENTE");
              }}
              className="badge badge-yellow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                border: filtroPersonal === "DOCENTE" ? "1.5px solid #ffffff" : "1px solid rgba(245,158,11,0.4)",
                background: filtroPersonal === "DOCENTE" ? "rgba(245,158,11,0.4)" : undefined,
                fontWeight: 700,
              }}
              title="Filtrar solo Inamovilidades de Docentes"
            >
              <GraduationCap size={12} /> Docente: {totalInamovilidadDocente} {filtroPersonal === "DOCENTE" ? "✓" : ""}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTipoFiltro("INAMOVILIDAD");
                setFiltroPersonal(filtroPersonal === "ADMINISTRATIVO" ? "TODOS" : "ADMINISTRATIVO");
              }}
              className="badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: filtroPersonal === "ADMINISTRATIVO" ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.15)",
                color: "#fbbf24",
                border: filtroPersonal === "ADMINISTRATIVO" ? "1.5px solid #ffffff" : "1px solid rgba(245,158,11,0.3)",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Filtrar solo Inamovilidades de Administrativos"
            >
              <Briefcase size={12} /> Adm: {totalInamovilidadAdm} {filtroPersonal === "ADMINISTRATIVO" ? "✓" : ""}
            </button>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "6px" }}>
            <span>{itemsInamovilidad} ítems en filas con INAMOVILIDAD</span>
            <br />
            Sin Inamovilidad: <strong style={{ color: "#a7f3d0" }}>{itemsSinInamovilidad}</strong> ítems (−1 por fila)
          </div>
        </div>

        <div
          onClick={() => setTipoFiltro(tipoFiltro === "INCREMENTO" ? "TODOS" : "INCREMENTO")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: tipoFiltro === "INCREMENTO" ? "var(--accent-emerald)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <PlusCircle size={16} color="#10b981" />
            Incrementos Aprobados
          </div>
          <div className="val" style={{ color: "#a7f3d0" }}>{totalIncremento}</div>
          <span className="badge badge-green">+1 Adicional Convocatoria</span>
        </div>

        <div
          onClick={() => setTipoFiltro(tipoFiltro === "QUITA_PCD" ? "TODOS" : "QUITA_PCD")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: tipoFiltro === "QUITA_PCD" ? "var(--accent-rose)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <MinusCircle size={16} color="#ef4444" />
            Quitas (Sin PCD)
          </div>
          <div className="val" style={{ color: "#fca5a5" }}>{totalQuita}</div>
          <span className="badge badge-red">−1 Retirado de Convocatoria</span>
        </div>

        <div
          onClick={() => setTipoFiltro(tipoFiltro === "COMPULSA" ? "TODOS" : "COMPULSA")}
          className="metric-card"
          style={{ cursor: "pointer", borderColor: tipoFiltro === "COMPULSA" ? "var(--accent-blue)" : "var(--border-subtle)" }}
        >
          <div className="title">
            <FileText size={16} color="#3b82f6" />
            Compulsas / 1 Año
          </div>
          <div className="val" style={{ color: "#bfdbfe" }}>
            {totalCompulsa} <span style={{ fontSize: "0.9rem", color: "#93c5fd" }}>filas</span>
          </div>
          <span className="badge badge-blue">{itemsCompulsa} ítems totales col. 1Año</span>
          <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "4px" }}>
            Docente: <strong style={{ color: "#93c5fd" }}>{totalCompulsaDocente} filas</strong>
            {" / "}<strong style={{ color: "#bfdbfe" }}>{itemsCompulsaDocente} ítems</strong>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Rápidos, Estamento y Buscador */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Selector de Estamento */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(31, 41, 55, 0.6)", padding: "3px 6px", borderRadius: "6px", border: "1px solid var(--border-subtle)", marginRight: "6px" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600, paddingLeft: "4px" }}>Estamento:</span>
            <button
              onClick={() => setFiltroPersonal("TODOS")}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: filtroPersonal === "TODOS" ? "var(--accent-blue)" : "transparent",
                color: filtroPersonal === "TODOS" ? "#ffffff" : "#94a3b8",
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroPersonal("DOCENTE")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: filtroPersonal === "DOCENTE" ? "#f59e0b" : "transparent",
                color: filtroPersonal === "DOCENTE" ? "#1e1b4b" : "#fde68a",
              }}
            >
              <GraduationCap size={12} /> Docentes
            </button>
            <button
              onClick={() => setFiltroPersonal("ADMINISTRATIVO")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: filtroPersonal === "ADMINISTRATIVO" ? "#6366f1" : "transparent",
                color: filtroPersonal === "ADMINISTRATIVO" ? "#ffffff" : "#c7d2fe",
              }}
            >
              <Briefcase size={12} /> Adm.
            </button>
          </div>
          <button
            onClick={() => setTipoFiltro("TODOS")}
            className={`btn-secondary ${tipoFiltro === "TODOS" ? "active" : ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(tipoFiltro === "TODOS" ? { borderColor: "var(--accent-blue)", background: "rgba(59, 130, 246, 0.2)" } : {})
            }}
          >
            <Layers size={14} />
            Todos ({filasClasificadas.length})
          </button>
          <button
            onClick={() => setTipoFiltro("INAMOVILIDAD")}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(tipoFiltro === "INAMOVILIDAD" ? { borderColor: "var(--accent-amber)", background: "rgba(245, 158, 11, 0.2)", color: "#fde68a" } : {})
            }}
          >
            <ShieldAlert size={14} color="#f59e0b" />
            Inamovilidad ({totalInamovilidad})
          </button>
          <button
            onClick={() => setTipoFiltro("INCREMENTO")}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(tipoFiltro === "INCREMENTO" ? { borderColor: "var(--accent-emerald)", background: "rgba(16, 185, 129, 0.2)", color: "#a7f3d0" } : {})
            }}
          >
            <PlusCircle size={14} color="#10b981" />
            Incrementos ({totalIncremento})
          </button>
          <button
            onClick={() => setTipoFiltro("QUITA_PCD")}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(tipoFiltro === "QUITA_PCD" ? { borderColor: "var(--accent-rose)", background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" } : {})
            }}
          >
            <MinusCircle size={14} color="#ef4444" />
            Quitas PCD ({totalQuita})
          </button>
          <button
            onClick={() => setTipoFiltro("COMPULSA")}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              ...(tipoFiltro === "COMPULSA" ? { borderColor: "var(--accent-blue)", background: "rgba(59, 130, 246, 0.2)", color: "#bfdbfe" } : {})
            }}
          >
            <FileText size={14} color="#3b82f6" />
            Compulsas ({totalCompulsa})
          </button>
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={15} color="#9ca3af" style={{ position: "absolute", left: "10px", top: "11px" }} />
          <input
            type="text"
            placeholder="Buscar por ESFM, cargo o justificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>
      </div>

      {/* Tabla del Informe */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>ESFM / UA</th>
              <th>Cargo</th>
              <th>Especialidad / Área</th>
              <th style={{ textAlign: "right" }}>3 Años</th>
              <th style={{ textAlign: "right" }}>2 Años</th>
              <th style={{ textAlign: "right" }}>1 Año</th>
              <th style={{ textAlign: "center" }}>Clasificación</th>
              <th style={{ width: "38%" }}>Detalle / Justificación Oficial</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No se encontraron registros con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtrados.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{row.departamento}</td>
                  <td>{row.esfm}</td>
                  <td style={{ color: "#cbd5e1" }}>
                    {row.cargo}
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.68rem",
                        color: row.estamento === "DOCENTE" ? "#fde68a" : "#c7d2fe",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      {row.estamento === "DOCENTE" ? "🎓 Docente" : "💼 Administrativo"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: "#ffffff" }}>{row.especialidad}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                    {row.anios3 || "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                    {row.anios2 || "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd" }}>
                    {row.anios1 || "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`badge ${row.badgeClass}`}>
                      {row.clasificacion}
                    </span>
                  </td>
                  <td style={{ color: "#e2e8f0", fontSize: "0.82rem", lineHeight: "1.35" }}>
                    {row.detalle}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
