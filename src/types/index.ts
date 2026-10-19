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
  total_items?: number;
  fuente: string;
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
  items_oficial_publicado?: number;
  cant_sep?: number;
  en_planilla_sep?: string;
  cant_sifm?: number;
  en_sifmweb?: string;
  diagnostico: string;
}

export interface FilaResumen {
  departamento: string;
  esfm: string;
  items2023: number;
  itemsOficial: number;
  diferencia: number;
}

export interface FilaControlTope {
  departamento: string;
  esfm: string;
  topeSEP: number;
  convocadosOficial: number;
  diferencia: number;
  estado: "🔴 EXCEDE TOPE (SOBREGIRO)" | "🟡 FALTAN POR CONVOCAR" | "🟢 CUADRE EXACTO";
}

export interface DataSources {
  planilla_sep?: BaseRecord[];
  sifmweb?: BaseRecord[];
  gestion_2023?: BaseRecord[];
  oficial_publicado?: BaseRecord[];
}

export interface DatasetState {
  dfs: DataSources;
  tabla: FilaComparativa[];
  resumen: FilaResumen[];
  controlTopes: FilaControlTope[];
  opcionesDepto: string[];
  opcionesEsfm: string[];
  opcionesCat: string[];
  isLoading: boolean;
  error?: string | null;
}
