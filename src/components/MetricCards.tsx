"use client";

import React from "react";
import { DataSources, FilaControlTope } from "../types";
import { FileText, Database, Calendar, Award, AlertTriangle } from "lucide-react";

interface Props {
  dfs: DataSources;
  controlTopes: FilaControlTope[];
}

export const MetricCards: React.FC<Props> = ({ dfs, controlTopes }) => {
  const countSep = dfs.planilla_sep?.length ?? 0;
  const countSifm = dfs.sifmweb?.length ?? 0;
  const count2023 = dfs.gestion_2023?.reduce((sum, r) => sum + (r.total_items ?? 0), 0) ?? 0;

  const convList = dfs.publicacion_convocatoria || [];
  const tot3a = convList.reduce((sum, r) => sum + (r.anios_3 ?? 0), 0);
  const tot2a = convList.reduce((sum, r) => sum + (r.anios_2 ?? 0), 0);
  const tot1a = convList.reduce((sum, r) => sum + (r.anios_1 ?? 0), 0);
  const countConv = tot3a + tot2a + tot1a;

  const sobregiros = controlTopes.filter((r) => r.diferencia > 0).length;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="title">
          <FileText size={16} color="#60a5fa" />
          Planilla SEP (Tope Presupuestario)
        </div>
        <div className="val">{countSep.toLocaleString()}</div>
        <span className="badge badge-blue">Plazas Asignadas (Est. 1)</span>
      </div>

      <div className="metric-card">
        <div className="title">
          <Database size={16} color="#a78bfa" />
          SIFMWEB
        </div>
        <div className="val">{countSifm.toLocaleString()}</div>
        <span className="badge badge-blue">Registros Base</span>
      </div>

      <div className="metric-card">
        <div className="title">
          <Calendar size={16} color="#f59e0b" />
          Gestión 2023 (Ítems)
        </div>
        <div className="val">{count2023.toLocaleString()}</div>
        <span className="badge badge-yellow">Línea Base Histórica</span>
      </div>

      <div className="metric-card">
        <div className="title">
          <Award size={16} color="#10b981" />
          Publicación Convocatoria
        </div>
        <div className="val">{countConv.toLocaleString()}</div>
        <span className="badge badge-green">
          3a: {tot3a} | 2a: {tot2a} | 1a: {tot1a}
        </span>
      </div>

      {controlTopes.length > 0 && (
        <div className="metric-card" style={{ borderColor: sobregiros > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)" }}>
          <div className="title">
            <AlertTriangle size={16} color={sobregiros > 0 ? "#ef4444" : "#10b981"} />
            Control de Topes
          </div>
          <div className="val" style={{ color: sobregiros > 0 ? "#ef4444" : "#10b981" }}>
            {sobregiros > 0 ? `${sobregiros} Exceden` : "100% Cuadrado"}
          </div>
          <span className={`badge ${sobregiros > 0 ? "badge-red" : "badge-green"}`}>
            {sobregiros > 0 ? "Sobregiro Detectado" : "Presupuesto OK"}
          </span>
        </div>
      )}
    </div>
  );
};
