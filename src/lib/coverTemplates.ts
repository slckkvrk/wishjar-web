export const COVER_TEMPLATES: Record<string, string> = {
  "1": "linear-gradient(135deg, #3D1A24, #6B2D40)",
  "2": "linear-gradient(135deg, #C9973A, #F0D080)",
  "3": "linear-gradient(135deg, #EDE6FB, #F7F1FC)",
  "4": "#F5EDD5",
  "5": "linear-gradient(135deg, #3D1A24, #C9973A)",
  "6": "#FDFAF3",
};

export const DEFAULT_COVER_TEMPLATE = "3";

export function coverBackground(template: string | null | undefined): string {
  return COVER_TEMPLATES[template ?? DEFAULT_COVER_TEMPLATE] ?? COVER_TEMPLATES[DEFAULT_COVER_TEMPLATE];
}
