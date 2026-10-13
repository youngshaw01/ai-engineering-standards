/** Minimal YAML for project.yaml template shape only. No external deps. */
export function parseProjectYaml(text) {
  const root = {};
  let nested = null;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    if (t === "standards:") {
      nested = "standards";
      root.standards = {};
      continue;
    }
    const m = t.match(/^([\w]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    const val = parseScalar(raw);
    if (nested === "standards" && line.startsWith("  ")) {
      root.standards[key] = val;
    } else {
      nested = null;
      root[key] = val;
    }
  }
  return root;
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}
