/**
 * Stock Logo Mapping Utility
 *
 * This utility provides functions to map stock symbols to their corresponding
 * logo files and handle fallback cases for missing logos.
 */

// Stock symbol to logo file mapping
// Based on available files in public/logo/png/ and all 38 deployed stocks on Sepolia
// Updated to match exactly the deployed tokens from sepolia-contracts.json
const STOCK_LOGO_MAP: Record<string, string> = {
  // All 38 deployed Nigerian stock tokens with their logo mappings
  ACCESS: "ACCESS.png",
  AIRTELAFRI: "AIRTEL.png",
  BUACEMENT: "BUACEMENT.png",
  BUAFOODS: "BUAFOODS.png",
  CADBURY: "CADBURY.png",
  CHAMPION: "CHAMPION.png",
  CONOIL: "CONOIL.png",
  CWG: "CWG.png",
  DANGCEM: "DANGCEM.png",
  DANGSUGAR: "DANGSUGAR.png",
  ETERNA: "ETERNA.png",
  FBNH: "FBNH.png",
  FIDSON: "FIDSON.png",
  FLOURMILL: "FLOURMILLS.png", // Note: file is named FLOURMILLS.png
  GEREGU: "GEREGU.png",
  GTCO: "GTCO.png",
  GUINNESS: "GUINESS.png", // Note: file is named GUINESS.png (missing 'N')
  INTBREW: "logo-no-background.png", // No specific logo found, using fallback
  LIVESTOCK: "LIVESTOCK.png",
  MAYBAKER: "MAYBAKER.png",
  MTNN: "MTNN.png",
  NB: "NB.png",
  NESTLE: "NESTLE.png",
  OANDO: "OANDO.png",
  OKOMUOIL: "OKOMUOIL.png",
  PRESCO: "PRESCO.png",
  PZ: "PZ.png",
  SEPLAT: "SEPLAT.png",
  STANBIC: "STANBIC.png",
  TOTAL: "TOTAL.png",
  TRANSCOHOT: "TRANSCORP.png", // Note: file is named TRANSCORP.png
  TRANSCORP: "TRANSCORP.png",
  TRANSPOWER: "logo-no-background.png", // No specific logo found, using fallback
  UACN: "UACN.png",
  UBA: "UBA.png",
  UNILEVER: "UNILEVER.png",
  WAPCO: "WAPCO.jpg", // This one is actually .jpg
  ZENITHBANK: "ZENITH.png",
};

// Fallback logo for stocks without specific logos
const FALLBACK_LOGO = "/logo/png/logo-no-background.png";

/**
 * Get the logo path for a given stock symbol
 * @param symbol - The stock symbol (e.g., 'DANGCEM', 'GTCO')
 * @returns The path to the logo file or fallback logo
 */
export function getStockLogoPath(symbol: string): string {
  const logoFile = STOCK_LOGO_MAP[symbol.toUpperCase()];

  if (logoFile) {
    return `/logo/png/${logoFile}`;
  }

  return FALLBACK_LOGO;
}

/**
 * Check if a stock has a specific logo available
 * @param symbol - The stock symbol
 * @returns True if a specific logo exists, false if fallback will be used
 */
export function hasStockLogo(symbol: string): boolean {
  return symbol.toUpperCase() in STOCK_LOGO_MAP;
}

/**
 * Get all available stock symbols that have logos
 * @returns Array of stock symbols with available logos
 */
export function getAvailableStockLogos(): string[] {
  return Object.keys(STOCK_LOGO_MAP);
}

/**
 * Get logo alt text for accessibility
 * @param symbol - The stock symbol
 * @param companyName - The full company name (optional)
 * @returns Alt text for the logo image
 */
export function getStockLogoAlt(symbol: string, companyName?: string): string {
  if (companyName) {
    return `${companyName} (${symbol}) logo`;
  }
  return `${symbol} company logo`;
}
