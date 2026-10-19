import { BaseRecord, DataSources, FilaComparativa, FilaResumen, FilaControlTope } from "../types";
import {
  cargoInternoAOficiales,
  cargoOficialAInternos,
  normalizarCargo,
} from "./normalizar";

export function construirTablaComparativa(dfs: DataSources): FilaComparativa[] {
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
  }> = [];

  const ordenFuentes: (keyof DataSources)[] = [
    "oficial_publicado",
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
      });
    }
  }

  if (registros.length === 0) return [];

  // Deduplicación por unique_key
  const mapUniverso = new Map<string, typeof registros[0]>();
  for (const reg of registros) {
    if (!mapUniverso.has(reg.unique_key)) {
      mapUniverso.set(reg.unique_key, reg);
    }
  }

  let universo = Array.from(mapUniverso.values());

  // Detectar instituciones homónimas en distintos departamentos
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

  // Ordenar
  universo.sort((a, b) => {
    const cmpDep = a.departamento.localeCompare(b.departamento);
    if (cmpDep !== 0) return cmpDep;
    const cmpEsfm = a.esfm_key.localeCompare(b.esfm_key);
    if (cmpEsfm !== 0) return cmpEsfm;
    const cmpCat = a.categoria.localeCompare(b.categoria);
    if (cmpCat !== 0) return cmpCat;
    return a.descripcion_cargo.localeCompare(b.descripcion_cargo);
  });

  const getSugerenciaOficial = (row: typeof registros[0]): string => {
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

  const getItemsCount = (row: typeof registros[0], fuente: "gestion_2023" | "oficial_publicado"): number => {
    const list = dfs[fuente];
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

    if (sub.length > 0) {
      return sub.reduce((acc, curr) => acc + (curr.total_items ?? 1), 0);
    }
    return 0;
  };

  const getPresenciaCount = (row: typeof registros[0], fuente: "planilla_sep" | "sifmweb"): number => {
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
    const items_gestion_2023 = dfs.gestion_2023 ? getItemsCount(u, "gestion_2023") : undefined;
    const items_oficial_publicado = dfs.oficial_publicado ? getItemsCount(u, "oficial_publicado") : undefined;

    const cant_sep = dfs.planilla_sep ? getPresenciaCount(u, "planilla_sep") : undefined;
    const en_planilla_sep = cant_sep !== undefined ? (cant_sep > 0 ? `✅ (${cant_sep})` : "❌") : undefined;

    const cant_sifm = dfs.sifmweb ? getPresenciaCount(u, "sifmweb") : undefined;
    const en_sifmweb = cant_sifm !== undefined ? (cant_sifm > 0 ? `✅ (${cant_sifm})` : "❌") : undefined;

    // Diagnóstico
    const i_pub = items_oficial_publicado ?? 0;
    const i_23 = items_gestion_2023 ?? 0;
    const c_sep = cant_sep ?? 0;

    let diagnostico = "Ratificado en convocatoria";
    if (i_pub > 0 && c_sep === 0) {
      diagnostico = "Convocado en Oficial sin personal asignado en SEP";
    } else if (i_pub > 0 && i_23 === 0) {
      diagnostico = "Nuevo ítem incorporado en Convocatoria Oficial";
    } else if (i_23 > 0 && i_pub === 0) {
      diagnostico = "Convocado en 2023 pero no figura en Oficial Publicado";
    } else if (i_pub === 0 && c_sep > 0) {
      diagnostico = "Cubierto en SEP sin plaza en Convocatoria Oficial";
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
      items_oficial_publicado,
      cant_sep,
      en_planilla_sep,
      cant_sifm,
      en_sifmweb,
      diagnostico,
    });
  }

  return resultado;
}

export function resumenPorEsfm(tabla: FilaComparativa[]): FilaResumen[] {
  if (!tabla || tabla.length === 0) return [];

  const map = new Map<string, { departamento: string; esfm: string; items2023: number; itemsOficial: number }>();

  for (const r of tabla) {
    const key = r.esfm_key;
    const existing = map.get(key);
    const i23 = r.items_gestion_2023 ?? 0;
    const iPub = r.items_oficial_publicado ?? 0;

    if (!existing) {
      map.set(key, {
        departamento: r.departamento,
        esfm: r.esfm_display,
        items2023: i23,
        itemsOficial: iPub,
      });
    } else {
      existing.items2023 += i23;
      existing.itemsOficial += iPub;
    }
  }

  const resumen: FilaResumen[] = [];
  for (const item of map.values()) {
    resumen.push({
      departamento: item.departamento,
      esfm: item.esfm,
      items2023: item.items2023,
      itemsOficial: item.itemsOficial,
      diferencia: item.itemsOficial - item.items2023,
    });
  }

  resumen.sort((a, b) => {
    const c = a.departamento.localeCompare(b.departamento);
    return c !== 0 ? c : a.esfm.localeCompare(b.esfm);
  });

  return resumen;
}

export function calcularControlTopes(dfs: DataSources): FilaControlTope[] {
  const df_sep = dfs.planilla_sep;
  const df_pub = dfs.oficial_publicado;
  if (!df_sep || !df_pub) return [];

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

  const pubDocs = df_pub.filter((r) => r.categoria === "DOCENTE");
  const pubMap = new Map<string, { departamento: string; esfm_raw: string; convocados: number }>();
  for (const r of pubDocs) {
    const key = `${r.departamento}___${r.esfm_key}`;
    const item = pubMap.get(key);
    const cnt = r.total_items ?? 1;
    if (!item) {
      pubMap.set(key, { departamento: r.departamento, esfm_raw: r.esfm_raw, convocados: cnt });
    } else {
      item.convocados += cnt;
    }
  }

  const allKeys = new Set([...topeMap.keys(), ...pubMap.keys()]);
  const filas: FilaControlTope[] = [];

  for (const key of allKeys) {
    const sepItem = topeMap.get(key);
    const pubItem = pubMap.get(key);

    const departamento = sepItem?.departamento || pubItem?.departamento || "";
    const esfm = sepItem?.esfm_raw || pubItem?.esfm_raw || "";
    const topeSEP = sepItem?.tope || 0;
    const convocadosOficial = pubItem?.convocados || 0;
    const diferencia = convocadosOficial - topeSEP;

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
      convocadosOficial,
      diferencia,
      estado,
    });
  }

  filas.sort((a, b) => {
    const c = a.departamento.localeCompare(b.departamento);
    return c !== 0 ? c : a.esfm.localeCompare(b.esfm);
  });

  return filas;
}
