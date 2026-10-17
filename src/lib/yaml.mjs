/** Minimal YAML for project.yaml template shape only. No external deps.
 * Supports one level of nesting (e.g. standards:, workflow:) and flow-style arrays. */
export function parseProjectYaml(text) {
  const root = {};
  let nested = null;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([\w]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    const isIndented = /^[ \t]+/.test(line);
    if (isIndented) {
      if (nested && root[nested] && typeof root[nested] === "object") {
        root[nested][key] = parseValue(raw);
      }
      continue;
    }
    if (raw === "") {
      nested = key;
      root[key] = {};
    } else {
      nested = null;
      root[key] = parseValue(raw);
    }
  }
  return root;
}

function parseValue(raw) {
  const s = raw.trim();
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  if (s.startsWith("[") && s.endsWith("]")) {
    return s
      .slice(1, -1)
      .split(",")
      .map((x) => parseValue(x))
      .filter((x) => x !== "");
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}
