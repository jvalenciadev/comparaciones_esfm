import * as XLSX from "xlsx";
import { BaseRecord } from "../types";
import {
  normalizarDepartamento,
  normalizarEsfm,
  claveInstitucion,
  normalizarCargo,
  stripAccents,
} from "./normalizar";

function colFuzzy(columns: string[], candidatos: string[]): string | undefined {
  const normMap: Record<string, string> = {};
  for (const col of columns) {
    const clean = stripAccents(col.trim().toUpperCase());
    normMap[clean] = col;
  }

  for (const cand of candidatos) {
    const cleanCand = stripAccents(cand.trim().toUpperCase());
    if (normMap[cleanCand]) {
      return normMap[cleanCand];
    }
  }
  return undefined;
}

function parseWorkbook(buffer: ArrayBuffer): Record<string, any>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const ws = wb.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
}

export function cargarPlanillaSep(buffer: ArrayBuffer): BaseRecord[] {
  const rawRows = parseWorkbook(buffer);
  if (rawRows.length === 0) return [];

  const columns = Object.keys(rawRows[0] || {});
  const colDep = colFuzzy(columns, ["departamento", "depto", "dpto"]);
  const colEsfm = colFuzzy(columns, ["des_ue", "nombre_ue", "ue", "esfm"]);
  const colCargo = colFuzzy(columns, ["descripcion", "descripción", "cargo", "desc_cargo"]);
  const colEst = colFuzzy(columns, ["estado", "est"]);

  const filtered = colEst
    ? rawRows.filter((r) => String(r[colEst] ?? "").trim() === "1")
    : rawRows;

  const records: BaseRecord[] = [];
  for (const row of filtered) {
    const depRaw = colDep ? String(row[colDep] ?? "") : "";
    const departamento = normalizarDepartamento(depRaw);
    const esfm_raw = colEsfm ? String(row[colEsfm] ?? "").trim().toUpperCase() : "";
    if (!esfm_raw) continue;

    const esfm_key = claveInstitucion(departamento, esfm_raw);
    const cargo_raw = colCargo ? String(row[colCargo] ?? "").trim().toUpperCase() : "";
    const cargo_key = normalizarCargo(cargo_raw);

    records.push({
      departamento,
      esfm_raw,
      esfm_key,
      cargo_raw,
      cargo_key,
      descripcion: cargo_raw,
      desc_key: cargo_key,
      fuente: "planilla_sep",
    });
  }

  return records;
}

export function cargarSifmweb(buffer: ArrayBuffer): BaseRecord[] {
  const rawRows = parseWorkbook(buffer);
  if (rawRows.length === 0) return [];

  const columns = Object.keys(rawRows[0] || {});
  const colDep = colFuzzy(columns, ["departamento", "depto", "dpto"]);
  const colEsfm = colFuzzy(columns, ["nom_ins", "nombre_institucion", "institucion", "esfm"]);
  const colTipo = colFuzzy(columns, ["tipo_cargo", "tipo cargo", "tipo"]);
  const colCargo = colFuzzy(columns, ["cargo", "nom_cargo", "descripcion", "descripción"]);

  const records: BaseRecord[] = [];
  for (const row of rawRows) {
    const depRaw = colDep ? String(row[colDep] ?? "") : "";
    const departamento = normalizarDepartamento(depRaw);
    const esfm_raw = colEsfm ? String(row[colEsfm] ?? "").trim().toUpperCase() : "";
    if (!esfm_raw) continue;

    const esfm_key = claveInstitucion(departamento, esfm_raw);
    const cargo_raw = colCargo ? String(row[colCargo] ?? "").trim().toUpperCase() : "";
    const cargo_key = normalizarCargo(cargo_raw);
    const tipo_cargo = colTipo ? String(row[colTipo] ?? "").trim().toUpperCase() : "";

    records.push({
      departamento,
      esfm_raw,
      esfm_key,
      cargo_raw,
      cargo_key,
      tipo_cargo,
      descripcion: cargo_raw,
      desc_key: cargo_key,
      fuente: "sifmweb",
    });
  }

  return records;
}

const CATEGORIAS_GENERICAS = new Set(["ADMINISTRATIVO", "DIRECTIVO"]);

export function cargarArchivoConAnios(
  buffer: ArrayBuffer,
  fuenteLabel: "gestion_2023" | "oficial_publicado"
): BaseRecord[] {
  const rawRows = parseWorkbook(buffer);
  if (rawRows.length === 0) return [];

  const columns = Object.keys(rawRows[0] || {});
  const colDep = colFuzzy(columns, ["departamento", "depto", "dpto"]);
  const colEsfm = colFuzzy(columns, ["esfm", "esfm/ua", "ua", "nom_ins", "institucion"]);
  const colCargo = colFuzzy(columns, ["cargo", "nom_cargo"]);
  const colDesc = colFuzzy(columns, ["descripcion_cargo", "descripcion", "descripción", "desc"]);
  const col3a = colFuzzy(columns, ["3_anos", "3 años", "3anos", "tres_anos", "3_a"]);
  const col2a = colFuzzy(columns, ["2_anos", "2 años", "2anos", "dos_anos", "2_a"]);

  const records: BaseRecord[] = [];
  for (const row of rawRows) {
    const depRaw = colDep ? String(row[colDep] ?? "") : "";
    const departamento = normalizarDepartamento(depRaw);
    const esfm_raw = colEsfm ? String(row[colEsfm] ?? "").trim().toUpperCase() : "";
    if (!esfm_raw) continue;

    const esfm_key = claveInstitucion(departamento, esfm_raw);
    let c_raw = colCargo ? String(row[colCargo] ?? "").trim().toUpperCase() : "";
    let d_raw = colDesc ? String(row[colDesc] ?? "").trim().toUpperCase() : c_raw;

    if (c_raw === "NAN" || c_raw === "NONE" || c_raw === "NULL") c_raw = "";
    if (d_raw === "NAN" || d_raw === "NONE" || d_raw === "NULL") d_raw = "";

    let finalCargo = "";
    let finalDesc = "";
    let categoria = "";

    if (CATEGORIAS_GENERICAS.has(c_raw) && d_raw && !CATEGORIAS_GENERICAS.has(d_raw)) {
      finalCargo = d_raw;
      finalDesc = d_raw;
      categoria = c_raw;
    } else if (c_raw.includes("CATEDRATICO") || c_raw.includes("DOCENTE")) {
      finalCargo = "CATEDRATICO - DOCENTE";
      finalDesc = d_raw || "CATEDRATICO - DOCENTE";
      categoria = "DOCENTE";
    } else {
      finalCargo = c_raw || d_raw;
      finalDesc = d_raw || c_raw;
      categoria = c_raw.includes("TECNICO") || c_raw.includes("SECRETARIA") ? "ADMINISTRATIVO" : "GENERAL";
    }

    const n3 = col3a ? parseInt(String(row[col3a] || "0"), 10) : 0;
    const n2 = col2a ? parseInt(String(row[col2a] || "0"), 10) : 0;
    const anios_3 = isNaN(n3) ? 0 : n3;
    const anios_2 = isNaN(n2) ? 0 : n2;
    const total_items = anios_3 + anios_2;

    records.push({
      departamento,
      esfm_raw,
      esfm_key,
      cargo_raw: finalCargo,
      cargo_key: normalizarCargo(finalCargo),
      descripcion: finalDesc,
      desc_key: normalizarCargo(finalDesc),
      categoria,
      anios_3,
      anios_2,
      total_items,
      fuente: fuenteLabel,
    });
  }

  return records;
}
