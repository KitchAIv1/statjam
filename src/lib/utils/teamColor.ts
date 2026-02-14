/**
 * Returns a display-safe color for team branding.
 * When the primary color is white or near-white (high luminance), returns a dark fallback
 * to avoid invisible borders, icons, and text on light backgrounds.
 */
export function getTeamDisplayColor(primary: string | undefined): string | undefined {
  if (!primary || typeof primary !== 'string') return undefined;

  const hex = primary.replace(/^#/, '');
  if (hex.length !== 3 && hex.length !== 6 && hex.length !== 8) return primary;

  // Expand 3-digit to 6-digit
  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return primary;

  // Relative luminance (WCAG) - linearize sRGB then weighted sum
  const toLinear = (c: number) => {
    const norm = c / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  if (luminance >= 0.9) return '#1a1a1a';
  return primary;
}
