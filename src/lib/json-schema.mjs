/**
 * Minimal JSON Schema (draft 2020-12 subset) validator for project-config.schema.json.
 * Fail-closed: unsupported schema keywords reject validation (no silent ignore).
 */

const SCHEMA_META_KEYS = new Set(["$schema", "$id", "title"]);
const SCHEMA_VALIDATION_KEYS = new Set([
  "type",
  "const",
  "enum",
  "required",
  "properties",
  "additionalProperties",
  "minLength",
  "pattern",
]);

const ALLOWED_SCHEMA_KEYS = new Set([...SCHEMA_META_KEYS, ...SCHEMA_VALIDATION_KEYS]);

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function collectUnsupportedSchemaKeywords(schema, pointer = "#", errors = []) {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) return errors;
  for (const key of Object.keys(schema)) {
    if (!ALLOWED_SCHEMA_KEYS.has(key)) {
      errors.push(`unsupported schema keyword '${key}' at ${pointer}`);
    }
  }
  if (schema.properties && typeof schema.properties === "object") {
    for (const [k, sub] of Object.entries(schema.properties)) {
      collectUnsupportedSchemaKeywords(sub, `${pointer}/properties/${k}`, errors);
    }
  }
  return errors;
}

export function assertSchemaSupported(schema) {
  const unsupported = collectUnsupportedSchemaKeywords(schema);
  if (unsupported.length) {
    throw new Error(`JSON Schema not supported by validator: ${unsupported.join("; ")}`);
  }
}

export function validateJsonSchema(value, schema, pointer = "$", errors = []) {
  if (schema.const !== undefined) {
    if (value !== schema.const) errors.push(`${pointer}: must be ${JSON.stringify(schema.const)}`);
    return errors;
  }

  if (schema.type) {
    const t = typeOf(value);
    if (schema.type === "object") {
      if (t !== "object" || value === null || Array.isArray(value)) {
        errors.push(`${pointer}: must be object`);
        return errors;
      }
    } else if (t !== schema.type) {
      errors.push(`${pointer}: must be ${schema.type}`);
      return errors;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${pointer}: must be one of ${schema.enum.join(", ")}`);
    return errors;
  }

  if (schema.type === "string" || typeof value === "string") {
    if (typeof value === "string") {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${pointer}: minLength ${schema.minLength}`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${pointer}: pattern ${schema.pattern}`);
      }
    }
  }

  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    if (schema.required) {
      for (const k of schema.required) {
        if (value[k] === undefined) errors.push(`${pointer}: missing required property '${k}'`);
      }
    }
    const props = schema.properties || {};
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) {
        if (!props[k]) errors.push(`${pointer}: additional property '${k}' not allowed`);
      }
    }
    for (const [k, sub] of Object.entries(props)) {
      if (value[k] !== undefined) validateJsonSchema(value[k], sub, `${pointer}.${k}`, errors);
    }
  }

  return errors;
}
