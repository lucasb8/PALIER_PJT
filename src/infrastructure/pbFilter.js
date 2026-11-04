export function quote(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function where(field, value) {
  return `${field} = "${quote(value)}"`;
}

export function and(...parts) {
  return parts.filter(Boolean).join(' && ');
}
