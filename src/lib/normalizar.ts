export function stripAccents(s: string): string {
  if (!s) return "";
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizarDepartamento(dep: string): string {
  if (!dep || typeof dep !== "string") return "";
  const d = stripAccents(dep.trim().toUpperCase());
  if (d.includes("BENI")) return "BENI";
  if (d.includes("CHUQUISACA") || d.includes("SUCRE")) return "CHUQUISACA";
  if (d.includes("COCHABAMBA") || d.includes("CBBA")) return "COCHABAMBA";
  if (d.includes("LA PAZ")) return "LA PAZ";
  if (d.includes("ORURO")) return "ORURO";
  if (d.includes("PANDO")) return "PANDO";
  if (d.includes("POTOSI")) return "POTOSI";
  if (d.includes("SANTA CRUZ") || d.includes("SCZ")) return "SANTA CRUZ";
  if (d.includes("TARIJA")) return "TARIJA";
  return d;
}

const PREFIJOS = /^\s*(ESFM|U\.A\.|UA|UNIDAD ACADÉMICA|ESCUELA SUPERIOR DE FORMACION DE MAESTROS)\s*["'\-–]?\s*/i;
const SUFIJOS = /\s*[-–].*$/;
const COMILLAS_REGEX = /["'“”‘’]/g;

export function normalizarEsfm(nombre: string): string {
  if (!nombre || typeof nombre !== "string") return "";
  let s = stripAccents(nombre.trim().toUpperCase());
  s = s.replace(COMILLAS_REGEX, "");
  s = s.replace(PREFIJOS, "");
  s = s.replace(SUFIJOS, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function claveInstitucion(departamento: string, esfm: string): string {
  const depK = normalizarDepartamento(departamento);
  const esfmK = normalizarEsfm(esfm);
  return `${depK}___${esfmK}`;
}

export const MAPA_CARGO_INTERNO_A_OFICIAL: Record<string, string[]> = {
  "TECNICO II": [
    "TÉCNICO CAJERO",
    "TÉCNICO DE SISTEMAS Y SOPORTE INFORMÁTICO",
    "TÉCNICO DE BIBLIOTECA",
  ],
  "TECNICO I": [
    "TÉCNICO RESPONSABLE DE BIENES Y SERVICIOS",
    "TÉCNICO RESPONSABLE DE PRESUPUESTO Y CONTABILIDAD",
    "TÉCNICO RESPONSABLE DE SISTEMAS Y ARCHIVO KÁRDEX",
    "TÉCNICO RESPONSABLE DE SALUD PREVENTIVA",
  ],
  "SECRETARIA II": [
    "SECRETARIA/O DE DIRECCIÓN GENERAL",
    "SECRETARIA/O DE DIRECCIÓN ADMINISTRATIVA FINANCIERA",
    "SECRETARIA/O DE DIRECCIÓN ACADÉMICA",
    "SECRETARIA/O DE COORDINACIÓN DE UA",
  ],
  "SECRETARIA": [
    "SECRETARIA/O DE DIRECCIÓN GENERAL",
    "SECRETARIA/O DE DIRECCIÓN ADMINISTRATIVA FINANCIERA",
    "SECRETARIA/O DE DIRECCIÓN ACADÉMICA",
    "SECRETARIA/O DE COORDINACIÓN DE UA",
  ],
  "DIRECTOR ACADEMICO - ADMINISTRATIVO": [
    "DIRECTOR ACADÉMICO",
    "DIRECTOR ADMINISTRATIVO FINANCIERO",
  ],
  "DIRECTOR ACADEMICO": ["DIRECTOR ACADÉMICO"],
  "DIRECTOR ADMINISTRATIVO": ["DIRECTOR ADMINISTRATIVO FINANCIERO"],
  "DIRECTOR ADMINISTRATIVO FINANCIERO": ["DIRECTOR ADMINISTRATIVO FINANCIERO"],
  "DIRECTOR ASESOR LEGAL": ["ASESOR LEGAL"],
  "ASESOR JURIDICO": ["ASESOR LEGAL"],
  "ASESOR LEGAL": ["ASESOR LEGAL"],
  "COORDINADOR CARRERA": ["COORDINADOR ACADÉMICO - IEPC - PEC"],
  "COORDINADOR UNIDAD ACADEMICA": ["COORDINADOR ACADÉMICO - IEPC - PEC"],
  "COORDINADOR ACADEMICO": ["COORDINADOR ACADÉMICO - IEPC - PEC"],
  "COORDINADOR ACADEMICO - IEPC - PEC": ["COORDINADOR ACADÉMICO - IEPC - PEC"],
  "TECNICO III - SECRETARIA GRAL": [
    "SECRETARIA/O DE DIRECCIÓN GENERAL",
    "SECRETARIA/O DE DIRECCIÓN ADMINISTRATIVA FINANCIERA",
  ],
  "AUXILIAR - CHOFER": ["AUXILIAR - CHOFER"],
  "SERVICIO - PORTERO": ["SERVICIO - PORTERO"],
  "DIRECTOR GENERAL": ["DIRECTOR GENERAL"],
  "CATEDRATICO ESFM": ["CATEDRÁTICO ESFM"],
  "CATEDRATICO - DOCENTE": ["CATEDRÁTICO ESFM"],
  "CATEDRATICO": ["CATEDRÁTICO ESFM"],
};

export function normalizarCargo(cargo: string): string {
  if (!cargo || typeof cargo !== "string") return "";
  let s = stripAccents(cargo.trim().toUpperCase());
  s = s.replace(/[./]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

const MAPA_OFICIAL_A_INTERNO: Record<string, string[]> = {};
for (const [interno, oficiales] of Object.entries(MAPA_CARGO_INTERNO_A_OFICIAL)) {
  for (const of_ of oficiales) {
    const key = stripAccents(of_.toUpperCase()).trim();
    if (!MAPA_OFICIAL_A_INTERNO[key]) {
      MAPA_OFICIAL_A_INTERNO[key] = [];
    }
    MAPA_OFICIAL_A_INTERNO[key].push(interno);
  }
}

export function cargoInternoAOficiales(cargoInterno: string): string[] {
  const key = normalizarCargo(cargoInterno);
  for (const [k, v] of Object.entries(MAPA_CARGO_INTERNO_A_OFICIAL)) {
    if (normalizarCargo(k) === key) {
      return v;
    }
  }
  return [];
}

export function cargoOficialAInternos(cargoOficial: string): string[] {
  const key = normalizarCargo(cargoOficial);
  return MAPA_OFICIAL_A_INTERNO[key] || [];
}
