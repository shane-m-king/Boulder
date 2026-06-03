// Escapes regex metacharacters in user-provided input so it can be used
// safely in RegExp / $regex queries without ReDoS or injection surprises.
export const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
