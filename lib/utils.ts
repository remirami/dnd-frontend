import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export const SIZE_NAMES: Record<string, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
  tiny: "Tiny",
  small: "Small",
  medium: "Medium",
  large: "Large",
  huge: "Huge",
  gargantuan: "Gargantuan",
};

export const SIZE_FOOTPRINTS: Record<string, string> = {
  Tiny: "2.5×2.5 ft.",
  Small: "5×5 ft.",
  Medium: "5×5 ft.",
  Large: "10×10 ft.",
  Huge: "15×15 ft.",
  Gargantuan: "20×20 ft. or larger",
};

export function resolveSizeDisplay(size?: string | null, sizeDisplay?: string | null): string {
  if (sizeDisplay && sizeDisplay.trim() && sizeDisplay.trim().length > 1) {
    return sizeDisplay.trim();
  }
  if (!size) return "Medium";
  const clean = size.trim();
  return SIZE_NAMES[clean] || SIZE_NAMES[clean.toUpperCase()] || clean;
}

export function getSizeFootprint(sizeName: string): string {
  const resolved = resolveSizeDisplay(sizeName);
  return SIZE_FOOTPRINTS[resolved] || "5×5 ft.";
}
