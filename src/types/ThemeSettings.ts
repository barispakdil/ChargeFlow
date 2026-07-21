export type ThemeMode = "system" | "light" | "dark";
export type ColorTheme = "midnight" | "ocean" | "emerald" | "sunset" | "crimson" | "purple" | "graphite";
export type CardStyle = "modern" | "glass" | "minimal";

export interface ThemeSettings {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  cardStyle: CardStyle;
}
