import * as XLSX from "xlsx";
import { FilaControlTope, FilaResumen } from "../types";

export function exportarExcelTopes(
  controlTopes: FilaControlTope[],
  filename = "reporte_control_topes_docentes_sep.xlsx"
) {
  const wb = XLSX.utils.book_new();

  const dataTopes = controlTopes.map((r) => ({
    Departamento: r.departamento,
    "ESFM / UA": r.esfm,
    "Tope Docentes Planilla SEP": r.topeSEP,
    "Docentes Convocatoria Total": r.convocadosTotal,
    "3 Años": r.anios3,
    "2 Años": r.anios2,
    "1 Año (Compulsa)": r.anios1,
    "Inamovilidad Docente": r.inamovilidadDocente,
    "Diferencia (Conv - Tope)": r.diferencia,
    "Estado de Presupuesto": r.estado,
  }));

  const wsTopes = XLSX.utils.json_to_sheet(dataTopes);
  XLSX.utils.book_append_sheet(wb, wsTopes, "Control_Topes_Docentes");

  XLSX.writeFile(wb, filename);
}

export function exportarExcelResumen(
  resumen: FilaResumen[],
  filename = "reporte_resumen_institucional_convocatoria.xlsx"
) {
  const wb = XLSX.utils.book_new();

  const dataResumen = resumen.map((r) => ({
    Departamento: r.departamento,
    "ESFM / UA": r.esfm,
    "Total Ítems Gestión 2023": r.items2023,
    "Total Convocatoria": r.itemsConvocatoria,
    "3 Años": r.anios3,
    "2 Años": r.anios2,
    "1 Año (Compulsa)": r.anios1,
    "Plazas con Inamovilidad": r.conInamovilidad,
    "Diferencia Convocatoria (Conv - 2023)": r.diferencia,
  }));

  const wsRes = XLSX.utils.json_to_sheet(dataResumen);
  XLSX.utils.book_append_sheet(wb, wsRes, "Resumen_Institucional");

  XLSX.writeFile(wb, filename);
}
