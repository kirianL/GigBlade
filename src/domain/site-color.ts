const HEX = /^#([0-9a-fA-F]{6})$/;

export function normalizeBrandColor(value: string): string | undefined {
  const hex = value.trim();
  if (!HEX.test(hex)) return undefined;
  return `#${hex.slice(1).toLowerCase()}`;
}
