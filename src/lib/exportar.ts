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

export function exportarExcelInamovilidadesModificaciones(
  filas: Array<{
    departamento: string;
    esfm: string;
    cargo: string;
    especialidad: string;
    anios3: number;
    anios2: number;
    anios1: number;
    clasificacion: string;
    detalle: string;
  }>,
  filename = "reporte_inamovilidades_y_modificaciones.xlsx"
) {
  const wb = XLSX.utils.book_new();

  const data = filas.map((r) => ({
    Departamento: r.departamento,
    "ESFM / UA": r.esfm,
    Cargo: r.cargo,
    "Especialidad / Área": r.especialidad,
    "3 Años": r.anios3,
    "2 Años": r.anios2,
    "1 Año (Compulsa)": r.anios1,
    Clasificación: r.clasificacion,
    "Detalle / Justificación Oficial": r.detalle,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Inamovilidades_Modificaciones");

  XLSX.writeFile(wb, filename);
}

export function exportarExcelEstadisticasDepto(
  datos: Array<{
    departamento: string;
    instituciones: number;
    totalSep: number;
    total2023: number;
    totalConv: number;
    difVsSep: number;
    difVs2023: number;
  }>,
  filename = "tablero_estadistico_departamental_sep_2023_conv.xlsx"
) {
  const wb = XLSX.utils.book_new();
  const data = datos.map((d) => ({
    Departamento: d.departamento,
    "Nro Instituciones (ESFM/UA)": d.instituciones,
    "Planilla SEP (Tope Presupuestario)": d.totalSep,
    "Gestión 2023 (Línea Base)": d.total2023,
    "Convocatoria Oficial": d.totalConv,
    "Diferencia vs SEP (Conv - SEP)": d.difVsSep,
    "Diferencia vs 2023 (Conv - 2023)": d.difVs2023,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Estadisticas_Departamentales");
  XLSX.writeFile(wb, filename);
}

