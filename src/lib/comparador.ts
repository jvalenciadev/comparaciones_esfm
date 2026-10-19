import {
  BaseRecord,
  DataSources,
  FilaComparativa,
  FilaResumen,
  FilaControlTope,
  ConfiguracionConvocatoria,
} from "../types";
import {
  cargoInternoAOficiales,
  cargoOficialAInternos,
  normalizarCargo,
} from "./normalizar";

export const DEFAULT_CONFIG_CONVOCATORIA: ConfiguracionConvocatoria = {
  incluir3Anios: true,
  incluir2Anios: true,
  incluir1Anio: false, // Compulsa
  modoDetalle: "TODOS",
};

export function calcularItemsFila(
  row: BaseRecord,
  config: ConfiguracionConvocatoria
): number {
  const detalle = (row.detalle || "").trim().toUpperCase();
  const esInamovilidad = detalle.includes("INAMOBILIDAD");
  const esDocente =
    row.categoria === "DOCENTE" ||
    (row.cargo_raw || "").toUpperCase().includes("CATEDRATICO") ||
    (row.cargo_raw || "").toUpperCase().includes("DOCENTE");

  // Base de ítems según columnas seleccionadas
  let total = 0;
  if (config.incluir3Anios) total += row.anios_3 ?? 0;
  if (config.incluir2Anios) total += row.anios_2 ?? 0;
  if (config.incluir1Anio) total += row.anios_1 ?? 0;

  if (config.modoDetalle === "SOLO_OFICIAL") {
    // Oficial = filas con detalle vacío (sin modificaciones ni inamovilidades)
    if (detalle !== "") return 0;
  } else if (config.modoDetalle === "SIN_INAMOVILIDAD") {
    // Inamovilidad: solo se descuenta -1 en filas de docentes con inamovilidad (20 en total)
    if (esInamovilidad && esDocente) return Math.max(0, total - 1);
  } else if (config.modoDetalle === "SOLO_INAMOVILIDAD") {
    // Cada docente con inamovilidad = 1 plaza protegida (total = 20)
    if (!esInamovilidad || !esDocente) return 0;
    return 1;
  } else if (config.modoDetalle === "SOLO_COMPULSA") {
    // Compulsa = suma directa columna 1 año de TODAS las filas
    return row.anios_1 ?? 0;
  } else if (config.modoDetalle === "SOLO_MODIFICACIONES") {
    if (!detalle.includes("QUITO") && !detalle.includes("INCREMENT")) return 0;
  }

  return total;
}

export function construirTablaComparativa(
  dfs: DataSources,
  config: ConfiguracionConvocatoria = DEFAULT_CONFIG_CONVOCATORIA
): FilaComparativa[] {
  const registros: Array<{
    unique_key: string;
    departamento: string;
    esfm_key: string;
    esfm_display: string;
    categoria: string;
    cargo_key: string;
    cargo_display: string;
    descripcion_cargo: string;
    desc_key: string;
    detalle?: string;
  }> = [];

  const ordenFuentes: (keyof DataSources)[] = [
    "publicacion_convocatoria",
    "gestion_2023",
    "planilla_sep",
    "sifmweb",
  ];

  for (const fuente of ordenFuentes) {
    const list = dfs[fuente];
    if (!list || list.length === 0) continue;

    for (const row of list) {
      const dep = (row.departamento || "").trim();
      const esfm_k = (row.esfm_key || "").trim();
      const esfm_raw = (row.esfm_raw || "").trim();
      const c_raw = (row.cargo_raw || "").trim();
      const c_k = (row.cargo_key || "").trim();
      const d_raw = (row.descripcion || c_raw).trim();
      const d_k = (row.desc_key || normalizarCargo(d_raw)).trim();
      const cat = (row.categoria || "").trim();

      let unique_key: string;
      let categoria_final: string;

      if (c_k.includes("CATEDRATICO") || c_k.includes("DOCENTE")) {
        unique_key = `${esfm_k}_DOC_${d_k}`;
        categoria_final = "DOCENTE";
      } else {
        unique_key = `${esfm_k}_ADM_${c_k}`;
        categoria_final = cat || "ADMINISTRATIVO / DIRECTIVO";
      }

      registros.push({
        unique_key,
        departamento: dep,
        esfm_key: esfm_k,
        esfm_display: esfm_raw,
        categoria: categoria_final,
        cargo_key: c_k,
        cargo_display: c_raw,
        descripcion_cargo: d_raw,
        desc_key: d_k,
        detalle: row.detalle,
      });
    }
  }

  if (registros.length === 0) return [];

  const mapUniverso = new Map<string, (typeof registros)[0]>();
  for (const reg of registros) {
    if (!mapUniverso.has(reg.unique_key)) {
      mapUniverso.set(reg.unique_key, reg);
    }
  }

  let universo = Array.from(mapUniverso.values());

  const deptoMapByEsfm: Record<string, Set<string>> = {};
  for (const item of universo) {
    if (!deptoMapByEsfm[item.esfm_display]) {
      deptoMapByEsfm[item.esfm_display] = new Set();
    }
    deptoMapByEsfm[item.esfm_display].add(item.departamento);
  }

  const homonimos = new Set<string>();
  for (const [esfm, deptos] of Object.entries(deptoMapByEsfm)) {
    if (deptos.size > 1) {
      homonimos.add(esfm);
    }
  }

  universo.sort((a, b) => {
    const cmpDep = a.departamento.localeCompare(b.departamento);
    if (cmpDep !== 0) return cmpDep;
    const cmpEsfm = a.esfm_key.localeCompare(b.esfm_key);
    if (cmpEsfm !== 0) return cmpEsfm;
    const cmpCat = a.categoria.localeCompare(b.categoria);
    if (cmpCat !== 0) return cmpCat;
    return a.descripcion_cargo.localeCompare(b.descripcion_cargo);
  });

  const getSugerenciaOficial = (row: (typeof registros)[0]): string => {
    const c_raw = row.cargo_display;
    const d_raw = row.descripcion_cargo;
    if (row.categoria === "DOCENTE") {
      return d_raw ? `CATEDRÁTICO - ${d_raw}` : "CATEDRÁTICO ESFM";
    }
    let oficiales = cargoInternoAOficiales(c_raw);
    if (oficiales.length === 0 && d_raw) {
      oficiales = cargoInternoAOficiales(d_raw);
    }
    return oficiales.length > 0 ? oficiales.join(" / ") : c_raw;
  };

  const getConvocatoriaItems = (row: (typeof registros)[0]) => {
    const list = dfs.publicacion_convocatoria;
    if (!list || list.length === 0) return { total: 0, a3: 0, a2: 0, a1: 0, detalle: "" };
    const esfm = row.esfm_key;

    let sub: BaseRecord[];
    if (row.categoria === "DOCENTE") {
      sub = list.filter((r) => r.esfm_key === esfm && r.desc_key === row.desc_key);
    } else {
      sub = list.filter((r) => r.esfm_key === esfm && r.cargo_key === row.cargo_key);
      if (sub.length === 0) {
        const internos = cargoOficialAInternos(row.cargo_key).map(normalizarCargo);
        sub = list.filter((r) => r.esfm_key === esfm && internos.includes(r.cargo_key));
      }
    }

    if (sub.length > 0) {
      let a3 = 0, a2 = 0, a1 = 0, total = 0;
      const detalles: string[] = [];
      for (const item of sub) {
        a3 += item.anios_3 ?? 0;
        a2 += item.anios_2 ?? 0;
        a1 += item.anios_1 ?? 0;
        total += calcularItemsFila(item, config);
        if (item.detalle) detalles.push(item.detalle);
      }
      return { total, a3, a2, a1, detalle: detalles.join("; ") };
    }
    return { total: 0, a3: 0, a2: 0, a1: 0, detalle: "" };
  };

  const getGestion2023Items = (row: (typeof registros)[0]): number => {
    const list = dfs.gestion_2023;
    if (!list || list.length === 0) return 0;
    const esfm = row.esfm_key;

    let sub: BaseRecord[];
    if (row.categoria === "DOCENTE") {
      sub = list.filter((r) => r.esfm_key === esfm && r.desc_key === row.desc_key);
    } else {
      sub = list.filter((r) => r.esfm_key === esfm && r.cargo_key === row.cargo_key);
      if (sub.length === 0) {
        const internos = cargoOficialAInternos(row.cargo_key).map(normalizarCargo);
        sub = list.filter((r) => r.esfm_key === esfm && internos.includes(r.cargo_key));
      }
    }

    return sub.reduce((acc, curr) => acc + (curr.total_items ?? 1), 0);
  };

  const getPresenciaCount = (row: (typeof registros)[0], fuente: "planilla_sep" | "sifmweb"): number => {
    const list = dfs[fuente];
    if (!list || list.length === 0) return 0;
    const esfm = row.esfm_key;

    if (row.categoria === "DOCENTE") {
      return list.filter(
        (r) =>
          r.esfm_key === esfm &&
          (r.cargo_key.includes("CATEDRATICO") || r.cargo_key.includes("DOCENTE"))
      ).length;
    } else {
      let sub = list.filter((r) => r.esfm_key === esfm && r.cargo_key === row.cargo_key);
      if (sub.length === 0) {
        const internos = cargoOficialAInternos(row.cargo_key).map(normalizarCargo);
        sub = list.filter((r) => r.esfm_key === esfm && internos.includes(r.cargo_key));
      }
      return sub.length;
    }
  };

  const resultado: FilaComparativa[] = [];

  for (const u of universo) {
    const esfm_display = homonimos.has(u.esfm_display)
      ? `${u.esfm_display} (${u.departamento})`
      : u.esfm_display;

    const cargo_oficial_homologado = getSugerenciaOficial(u);
    const items_gestion_2023 = dfs.gestion_2023 ? getGestion2023Items(u) : undefined;
    const convInfo = dfs.publicacion_convocatoria ? getConvocatoriaItems(u) : { total: 0, a3: 0, a2: 0, a1: 0, detalle: "" };

    const cant_sep = dfs.planilla_sep ? getPresenciaCount(u, "planilla_sep") : undefined;
    const en_planilla_sep = cant_sep !== undefined ? (cant_sep > 0 ? `✅ (${cant_sep})` : "❌") : undefined;

    const cant_sifm = dfs.sifmweb ? getPresenciaCount(u, "sifmweb") : undefined;
    const en_sifmweb = cant_sifm !== undefined ? (cant_sifm > 0 ? `✅ (${cant_sifm})` : "❌") : undefined;

    const i_conv = convInfo.total;
    const i_23 = items_gestion_2023 ?? 0;
    const c_sep = cant_sep ?? 0;

    let diagnostico = "Ratificado en convocatoria";
    if (i_conv > 0 && c_sep === 0) {
      diagnostico = "Convocado en Oficial sin personal asignado en SEP";
    } else if (i_conv > 0 && i_23 === 0) {
      diagnostico = "Nuevo ítem incorporado en Convocatoria Oficial";
    } else if (i_23 > 0 && i_conv === 0) {
      diagnostico = "Convocado en 2023 pero no figura en Convocatoria";
    } else if (i_conv === 0 && c_sep > 0) {
      diagnostico = "Cubierto en SEP sin plaza en Convocatoria";
    }

    resultado.push({
      unique_key: u.unique_key,
      departamento: u.departamento,
      esfm_key: u.esfm_key,
      esfm_display,
      categoria: u.categoria,
      cargo_key: u.cargo_key,
      cargo_display: u.cargo_display,
      descripcion_cargo: u.descripcion_cargo,
      desc_key: u.desc_key,
      cargo_oficial_homologado,
      items_gestion_2023,
      items_convocatoria: i_conv,
      anios_3: convInfo.a3,
      anios_2: convInfo.a2,
      anios_1: convInfo.a1,
      detalle: convInfo.detalle || u.detalle,
      cant_sep,
      en_planilla_sep,
      cant_sifm,
      en_sifmweb,
      diagnostico,
    });
  }

  return resultado;
}

export function resumenPorEsfm(
  dfs: DataSources,
  config: ConfiguracionConvocatoria = DEFAULT_CONFIG_CONVOCATORIA
): FilaResumen[] {
  const convList = dfs.publicacion_convocatoria || [];
  const g23List = dfs.gestion_2023 || [];
  if (convList.length === 0 && g23List.length === 0) return [];

  const map = new Map<
    string,
    {
      departamento: string;
      esfm: string;
      items2023: number;
      itemsConvocatoria: number;
      anios3: number;
      anios2: number;
      anios1: number;
      conInamovilidad: number;
    }
  >();

  // 1. Gestión 2023
  for (const r of g23List) {
    const key = r.esfm_key;
    const existing = map.get(key);
    const cnt = r.total_items ?? 1;
    if (!existing) {
      map.set(key, {
        departamento: r.departamento,
        esfm: r.esfm_raw,
        items2023: cnt,
        itemsConvocatoria: 0,
        anios3: 0,
        anios2: 0,
        anios1: 0,
        conInamovilidad: 0,
      });
    } else {
      existing.items2023 += cnt;
    }
  }

  // 2. Publicación Convocatoria
  for (const r of convList) {
    const key = r.esfm_key;
    const existing = map.get(key);
    const a3 = r.anios_3 ?? 0;
    const a2 = r.anios_2 ?? 0;
    const a1 = r.anios_1 ?? 0;
    const itemsCalc = calcularItemsFila(r, config);
    const esDoc =
      r.categoria === "DOCENTE" ||
      (r.cargo_raw || "").toUpperCase().includes("CATEDRATICO") ||
      (r.cargo_raw || "").toUpperCase().includes("DOCENTE");
    const esInam = (r.detalle || "").toUpperCase().includes("INAMOBILIDAD") && esDoc ? 1 : 0;

    if (!existing) {
      map.set(key, {
        departamento: r.departamento,
        esfm: r.esfm_raw,
        items2023: 0,
        itemsConvocatoria: itemsCalc,
        anios3: a3,
        anios2: a2,
        anios1: a1,
        conInamovilidad: esInam,
      });
    } else {
      existing.itemsConvocatoria += itemsCalc;
      existing.anios3 += a3;
      existing.anios2 += a2;
      existing.anios1 += a1;
      existing.conInamovilidad += esInam;
    }
  }

  const resumen: FilaResumen[] = [];
  for (const item of map.values()) {
    resumen.push({
      departamento: item.departamento,
      esfm: item.esfm,
      items2023: item.items2023,
      itemsConvocatoria: item.itemsConvocatoria,
      anios3: item.anios3,
      anios2: item.anios2,
      anios1: item.anios1,
      diferencia: item.itemsConvocatoria - item.items2023,
      conInamovilidad: item.conInamovilidad,
    });
  }

  resumen.sort((a, b) => {
    const c = a.departamento.localeCompare(b.departamento);
    return c !== 0 ? c : a.esfm.localeCompare(b.esfm);
  });

  return resumen;
}

export function calcularControlTopes(
  dfs: DataSources,
  config: ConfiguracionConvocatoria = DEFAULT_CONFIG_CONVOCATORIA
): FilaControlTope[] {
  const df_sep = dfs.planilla_sep;
  const df_conv = dfs.publicacion_convocatoria;
  if (!df_sep || !df_conv) return [];

  // Docentes en Planilla SEP (Tope Máximo Presupuestario)
  const sepDocs = df_sep.filter(
    (r) => r.cargo_key.includes("CATEDRATICO") || r.cargo_key.includes("DOCENTE")
  );

  const topeMap = new Map<string, { departamento: string; esfm_raw: string; tope: number }>();
  for (const r of sepDocs) {
    const key = `${r.departamento}___${r.esfm_key}`;
    const item = topeMap.get(key);
    if (!item) {
      topeMap.set(key, { departamento: r.departamento, esfm_raw: r.esfm_raw, tope: 1 });
    } else {
      item.tope += 1;
    }
  }

  // Docentes Convocados en Publicación Convocatoria
  const convDocs = df_conv.filter((r) => r.categoria === "DOCENTE");
  const convMap = new Map<
    string,
    {
      departamento: string;
      esfm_raw: string;
      convocados: number;
      anios3: number;
      anios2: number;
      anios1: number;
      inamovilidadDocente: number;
    }
  >();

  for (const r of convDocs) {
    const key = `${r.departamento}___${r.esfm_key}`;
    const item = convMap.get(key);
    const cnt = calcularItemsFila(r, config);
    const a3 = r.anios_3 ?? 0;
    const a2 = r.anios_2 ?? 0;
    const a1 = r.anios_1 ?? 0;
    const esInam = (r.detalle || "").toUpperCase().includes("INAMOBILIDAD") ? 1 : 0;

    if (!item) {
      convMap.set(key, {
        departamento: r.departamento,
        esfm_raw: r.esfm_raw,
        convocados: cnt,
        anios3: a3,
        anios2: a2,
        anios1: a1,
        inamovilidadDocente: esInam,
      });
    } else {
      item.convocados += cnt;
      item.anios3 += a3;
      item.anios2 += a2;
      item.anios1 += a1;
      item.inamovilidadDocente += esInam;
    }
  }

  const allKeys = new Set([...topeMap.keys(), ...convMap.keys()]);
  const filas: FilaControlTope[] = [];

  for (const key of allKeys) {
    const sepItem = topeMap.get(key);
    const convItem = convMap.get(key);

    const departamento = sepItem?.departamento || convItem?.departamento || "";
    const esfm = sepItem?.esfm_raw || convItem?.esfm_raw || "";
    const topeSEP = sepItem?.tope || 0;
    const convocadosTotal = convItem?.convocados || 0;
    const diferencia = convocadosTotal - topeSEP;

    let estado: FilaControlTope["estado"];
    if (diferencia > 0) {
      estado = "🔴 EXCEDE TOPE (SOBREGIRO)";
    } else if (diferencia < 0) {
      estado = "🟡 FALTAN POR CONVOCAR";
    } else {
      estado = "🟢 CUADRE EXACTO";
    }

    filas.push({
      departamento,
      esfm,
      topeSEP,
      convocadosTotal,
      anios3: convItem?.anios3 || 0,
      anios2: convItem?.anios2 || 0,
      anios1: convItem?.anios1 || 0,
      diferencia,
      estado,
      inamovilidadDocente: convItem?.inamovilidadDocente || 0,
    });
  }

  filas.sort((a, b) => {
    const c = a.departamento.localeCompare(b.departamento);
    return c !== 0 ? c : a.esfm.localeCompare(b.esfm);
  });

  return filas;
}
