import { ENTITY_CONFIG, PUBLIC_READ, PUBLIC_CREATE } from "../entityConfig.js";

function serializeRow(cfg, row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of cfg.arrayFields) {
    if (typeof out[f] === "string") {
      try { out[f] = JSON.parse(out[f]); } catch { out[f] = []; }
    } else if (out[f] == null) {
      out[f] = [];
    }
  }
  for (const f of cfg.boolFields) {
    out[f] = !!out[f];
  }
  return out;
}

function prepareValue(cfg, field, value) {
  if (cfg.arrayFields.includes(field)) return JSON.stringify(value ?? []);
  if (cfg.boolFields.includes(field)) return value ? 1 : 0;
  if (value === undefined) return null;
  return value;
}

function buildSortClause(sortParam) {
  if (!sortParam) return "ORDER BY created_date DESC";
  const desc = sortParam.startsWith("-");
  const field = desc ? sortParam.slice(1) : sortParam;
  if (!/^[a-zA-Z_]+$/.test(field)) return "ORDER BY created_date DESC";
  return `ORDER BY ${field} ${desc ? "DESC" : "ASC"}`;
}

export function getEntityConfig(name) {
  return ENTITY_CONFIG[name] || null;
}

export function canReadPublic(name) {
  return PUBLIC_READ.has(name);
}
export function canCreatePublic(name) {
  return PUBLIC_CREATE.has(name);
}

export async function listEntity(env, name, { sort, limit } = {}) {
  const cfg = getEntityConfig(name);
  const lim = Math.min(parseInt(limit || "500", 10) || 500, 1000);
  const sql = `SELECT * FROM ${cfg.table} ${buildSortClause(sort)} LIMIT ?`;
  const { results } = await env.DB.prepare(sql).bind(lim).all();
  return results.map((r) => serializeRow(cfg, r));
}

export async function filterEntity(env, name, { query = {}, sort, limit } = {}) {
  const cfg = getEntityConfig(name);
  const validFields = new Set(["id", "created_by", "created_date", "updated_date", ...cfg.columns]);
  const keys = Object.keys(query).filter((k) => validFields.has(k));
  const where = keys.length ? "WHERE " + keys.map((k) => `${k} = ?`).join(" AND ") : "";
  const lim = Math.min(parseInt(limit || "500", 10) || 500, 1000);
  const sql = `SELECT * FROM ${cfg.table} ${where} ${buildSortClause(sort)} LIMIT ?`;
  const binds = keys.map((k) => prepareValue(cfg, k, query[k]));
  const { results } = await env.DB.prepare(sql).bind(...binds, lim).all();
  return results.map((r) => serializeRow(cfg, r));
}

export async function getEntity(env, name, id) {
  const cfg = getEntityConfig(name);
  const row = await env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).bind(id).first();
  return row ? serializeRow(cfg, row) : null;
}

export async function createEntity(env, name, data, userId) {
  const cfg = getEntityConfig(name);
  const id = crypto.randomUUID();
  const fields = cfg.columns.filter((c) => data[c] !== undefined);
  const cols = ["id", "created_by", ...fields];
  const placeholders = cols.map(() => "?").join(", ");
  const values = [id, userId || null, ...fields.map((f) => prepareValue(cfg, f, data[f]))];
  await env.DB.prepare(
    `INSERT INTO ${cfg.table} (${cols.join(", ")}) VALUES (${placeholders})`
  ).bind(...values).run();
  return getEntity(env, name, id);
}

export async function updateEntity(env, name, id, data) {
  const cfg = getEntityConfig(name);
  const fields = cfg.columns.filter((c) => data[c] !== undefined);
  if (fields.length === 0) return getEntity(env, name, id);
  const setClause = fields.map((f) => `${f} = ?`).join(", ") + ", updated_date = datetime('now')";
  const values = fields.map((f) => prepareValue(cfg, f, data[f]));
  await env.DB.prepare(`UPDATE ${cfg.table} SET ${setClause} WHERE id = ?`).bind(...values, id).run();
  return getEntity(env, name, id);
}

export async function deleteEntity(env, name, id) {
  const cfg = getEntityConfig(name);
  await env.DB.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).bind(id).run();
  return { success: true };
}

// base44-style updateMany(query, { $set: {...} })
export async function updateManyEntity(env, name, query = {}, update = {}) {
  const cfg = getEntityConfig(name);
  const patch = update.$set || update;
  const matches = await filterEntity(env, name, { query, limit: 1000 });
  for (const row of matches) {
    await updateEntity(env, name, row.id, patch);
  }
  return { success: true, updated: matches.length };
}
