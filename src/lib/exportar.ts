import * as XLSX from "xlsx";
import { FilaComparativa, FilaControlTope, FilaResumen } from "../types";

export function exportarExcelComparativo(
  tabla: FilaComparativa[],
  resumen: FilaResumen[],
  filename = "reporte_comparativo_esfm_convocatoria.xlsx"
) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Comparativo Centralizado
  const dataComparativo = tabla.map((r) => ({
    Departamento: r.departamento,
    "ESFM / UA": r.esfm_display,
    Categoría: r.categoria,
    "Cargo / Especialidad": r.descripcion_cargo,
    "Cargo Oficial Sugerido": r.cargo_oficial_homologado,
    "Total Ítems 2023 (3a+2a)": r.items_gestion_2023 ?? "—",
    "Total Ítems Oficial (3a+2a)": r.items_oficial_publicado ?? "—",
    "Planilla SEP": r.en_planilla_sep ?? "—",
    SIFMWEB: r.en_sifmweb ?? "—",
    "Diagnóstico de Convocatoria": r.diagnostico,
  }));
  const wsComp = XLSX.utils.json_to_sheet(dataComparativo);
  XLSX.utils.book_append_sheet(wb, wsComp, "Comparativo_Centralizado");

  // Hoja 2: Resumen ESFM
  if (resumen && resumen.length > 0) {
    const dataResumen = resumen.map((r) => ({
      Departamento: r.departamento,
      "ESFM / UA": r.esfm,
      "Total Ítems Gestión 2023 (3a+2a)": r.items2023,
      "Total Ítems Oficial Publicado (3a+2a)": r.itemsOficial,
      "Diferencia Convocatoria (Pub vs 2023)": r.diferencia,
    }));
    const wsRes = XLSX.utils.json_to_sheet(dataResumen);
    XLSX.utils.book_append_sheet(wb, wsRes, "Resumen_ESFM");
  }

  XLSX.writeFile(wb, filename);
}

export function exportarExcelTopes(
  controlTopes: FilaControlTope[],
  filename = "reporte_control_topes_docentes_sep.xlsx"
) {
  const wb = XLSX.utils.book_new();

  const dataTopes = controlTopes.map((r) => ({
    Departamento: r.departamento,
    "ESFM / UA": r.esfm,
    "Tope Docentes Planilla SEP": r.topeSEP,
    "Convocados Oficial Publicado": r.convocadosOficial,
    "Diferencia (Pub - Tope)": r.diferencia,
    "Estado de Presupuesto": r.estado,
  }));

  const wsTopes = XLSX.utils.json_to_sheet(dataTopes);
  XLSX.utils.book_append_sheet(wb, wsTopes, "Control_Topes_Docentes");

  XLSX.writeFile(wb, filename);
}
