export interface BaseRecord {
  departamento: string;
  esfm_raw: string;
  esfm_key: string;
  cargo_raw: string;
  cargo_key: string;
  descripcion: string;
  desc_key?: string;
  tipo_cargo?: string;
  categoria?: string;
  anios_3?: number;
  anios_2?: number;
  anios_1?: number;
  total_items?: number;
  detalle?: string;
  fuente: string;
}

export interface ConfiguracionConvocatoria {
  incluir3Anios: boolean;
  incluir2Anios: boolean;
  incluir1Anio: boolean;
  categoriaPersonal?: "DOCENTES" | "ADMINISTRATIVOS" | "SERVICIO" | "TODOS";
  modoDetalle:
  | "TODOS"
  | "SOLO_OFICIAL"
  | "SIN_INAMOVILIDAD"
  | "SOLO_INAMOVILIDAD"
  | "SOLO_COMPULSA"
  | "SOLO_MODIFICACIONES";
}

export interface FilaResumen {
  departamento: string;
  esfm: string;
  items2023: number;
  itemsConvocatoria: number;
  anios3: number;
  anios2: number;
  anios1: number;
  diferencia: number;
  conInamovilidad: number;
}

export interface FilaControlTope {
  departamento: string;
  esfm: string;
  esfm_key?: string;
  topeSEP: number;
  convocadosTotal: number;
  anios3: number;
  anios2: number;
  anios1: number;
  diferencia: number;
  estado: "🔴 EXCEDE TOPE (SOBREGIRO)" | "🟡 FALTAN POR CONVOCAR" | "🟢 CUADRE EXACTO";
  inamovilidadDocente: number;
}

export interface DataSources {
  planilla_sep?: BaseRecord[];
  sifmweb?: BaseRecord[];
  gestion_2023?: BaseRecord[];
  publicacion_convocatoria?: BaseRecord[];
}

export interface FilaComparativa {
  unique_key: string;
  departamento: string;
  esfm_key: string;
  esfm_display: string;
  categoria: string;
  cargo_key: string;
  cargo_display: string;
  descripcion_cargo: string;
  desc_key: string;
  cargo_oficial_homologado: string;
  items_gestion_2023?: number;
  items_convocatoria?: number;
  anios_3?: number;
  anios_2?: number;
  anios_1?: number;
  detalle?: string;
  cant_sep?: number;
  en_planilla_sep?: string;
  cant_sifm?: number;
  en_sifmweb?: string;
  diagnostico: string;
}
