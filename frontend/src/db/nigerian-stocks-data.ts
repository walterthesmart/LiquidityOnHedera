// MongoDB collections removed - using Turso database now
import { Stock } from "@/db/schema";
// Hedera token integration imports removed as they're not used in this data file

/**
 * Nigerian Stock Exchange (NGX) Blue-chip Stocks Data
 * Updated for Nigerian market focus with major companies
 * Now includes real Hedera token IDs from deployment
 */
export const NIGERIAN_STOCKS_DATA: Omit<
  Stock,
  "id" | "tokenID" | "hederaTokenAddress"
>[] = [
  // Banking Sector
  {
    symbol: "ZENITHBANK",
    name: "Zenith Bank Plc",
    totalShares: 31396493786,
    chain: "hedera",
    exchange: "NGX",
    sector: "Banking",
    marketCap: 1200000000000, // ~1.2 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "GTCO",
    name: "Guaranty Trust Holding Company Plc",
    totalShares: 29431127496,
    chain: "hedera",
    exchange: "NGX",
    sector: "Banking",
    marketCap: 1100000000000, // ~1.1 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "ACCESS",
    name: "Access Holdings Plc",
    totalShares: 35687500000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Banking",
    marketCap: 650000000000, // ~650 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "UBA",
    name: "United Bank for Africa Plc",
    totalShares: 35895292792,
    chain: "hedera",
    exchange: "NGX",
    sector: "Banking",
    marketCap: 500000000000, // ~500 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "FBNH",
    name: "FBN Holdings Plc",
    totalShares: 35895292792,
    chain: "hedera",
    exchange: "NGX",
    sector: "Banking",
    marketCap: 450000000000, // ~450 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "STANBIC",
    name: "Stanbic IBTC Holdings Plc",
    totalShares: 11745188917,
    chain: "hedera",
    exchange: "NGX",
    sector: "Banking",
    marketCap: 600000000000, // ~600 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Cement/Construction Sector
  {
    symbol: "DANGCEM",
    name: "Dangote Cement Plc",
    totalShares: 17040000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Cement",
    marketCap: 7500000000000, // ~7.5 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "BUACEMENT",
    name: "BUA Cement Plc",
    totalShares: 35000000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Cement",
    marketCap: 3200000000000, // ~3.2 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "WAPCO",
    name: "Lafarge Africa Plc",
    totalShares: 18000000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Cement",
    marketCap: 450000000000, // ~450 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Telecommunications Sector
  {
    symbol: "MTNN",
    name: "MTN Nigeria Communications Plc",
    totalShares: 20354513050,
    chain: "hedera",
    exchange: "NGX",
    sector: "Telecommunications",
    marketCap: 4000000000000, // ~4 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "AIRTELAFRI",
    name: "Airtel Africa Plc",
    totalShares: 3755000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Telecommunications",
    marketCap: 1800000000000, // ~1.8 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Consumer Goods Sector
  {
    symbol: "NB",
    name: "Nigerian Breweries Plc",
    totalShares: 8020000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 680000000000, // ~680 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "NESTLE",
    name: "Nestle Nigeria Plc",
    totalShares: 1200000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 1400000000000, // ~1.4 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "FLOURMILL",
    name: "Flour Mills of Nigeria Plc",
    totalShares: 39000000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 1200000000000, // ~1.2 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Oil & Gas Sector
  {
    symbol: "SEPLAT",
    name: "Seplat Energy Plc",
    totalShares: 5900000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Oil & Gas",
    marketCap: 2800000000000, // ~2.8 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Insurance Sector
  {
    symbol: "AIICO",
    name: "AIICO Insurance Plc",
    totalShares: 16000000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Insurance",
    marketCap: 80000000000, // ~80 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Additional Major Nigerian Stocks

  // Food & Beverages Sector
  {
    symbol: "BUAFOODS",
    name: "BUA Foods Plc",
    totalShares: 18000000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 8262000000000, // ~8.26 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "DANGSUGAR",
    name: "Dangote Sugar Refinery Plc",
    totalShares: 12150000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 607340000000, // ~607 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "GUINNESS",
    name: "Guinness Nigeria Plc",
    totalShares: 2190000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 212030000000, // ~212 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "CADBURY",
    name: "Cadbury Nigeria Plc",
    totalShares: 2280000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 136020000000, // ~136 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Conglomerate Sector
  {
    symbol: "TRANSCORP",
    name: "Transnational Corporation of Nigeria Plc",
    totalShares: 10160000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Conglomerate",
    marketCap: 515720000000, // ~516 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "UACN",
    name: "UAC of Nigeria Plc",
    totalShares: 2925000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Conglomerate",
    marketCap: 141040000000, // ~141 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Personal Care & Household Products
  {
    symbol: "UNILEVER",
    name: "Unilever Nigeria Plc",
    totalShares: 5745000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 333210000000, // ~333 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "PZ",
    name: "PZ Cussons Nigeria Plc",
    totalShares: 3970000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Consumer Goods",
    marketCap: 140160000000, // ~140 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Oil & Gas Sector (Additional)
  {
    symbol: "OANDO",
    name: "Oando Plc",
    totalShares: 13470000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Oil & Gas",
    marketCap: 700300000000, // ~700 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "CONOIL",
    name: "Conoil Plc",
    totalShares: 694000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Oil & Gas",
    marketCap: 162730000000, // ~163 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "TOTAL",
    name: "TotalEnergies Marketing Nigeria Plc",
    totalShares: 339500000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Oil & Gas",
    marketCap: 239360000000, // ~239 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "ETERNA",
    name: "Eterna Plc",
    totalShares: 1305000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Oil & Gas",
    marketCap: 55430000000, // ~55 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Power/Utilities Sector
  {
    symbol: "GEREGU",
    name: "Geregu Power Plc",
    totalShares: 2500000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Utilities",
    marketCap: 2853750000000, // ~2.85 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "TRANSPOWER",
    name: "Transcorp Power Plc",
    totalShares: 7500000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Utilities",
    marketCap: 2400000000000, // ~2.4 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Healthcare/Pharmaceuticals Sector
  {
    symbol: "FIDSON",
    name: "Fidson Healthcare Plc",
    totalShares: 2295000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Healthcare",
    marketCap: 105800000000, // ~106 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "MAYBAKER",
    name: "May & Baker Nigeria Plc",
    totalShares: 1725000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Healthcare",
    marketCap: 29330000000, // ~29 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Agriculture/Agribusiness Sector
  {
    symbol: "PRESCO",
    name: "Presco Plc",
    totalShares: 1000000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Agriculture",
    marketCap: 1233000000000, // ~1.23 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "OKOMUOIL",
    name: "The Okomu Oil Palm Company Plc",
    totalShares: 954000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Agriculture",
    marketCap: 887140000000, // ~887 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: "LIVESTOCK",
    name: "Livestock Feeds Plc",
    totalShares: 3000000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Agriculture",
    marketCap: 26400000000, // ~26 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Technology Sector
  {
    symbol: "CWG",
    name: "CWG Plc",
    totalShares: 2525000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Technology",
    marketCap: 40650000000, // ~41 billion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },

  // Hospitality Sector
  {
    symbol: "TRANSCOHOT",
    name: "Transcorp Hotels Plc",
    totalShares: 10240000000,
    chain: "hedera",
    exchange: "NGX",
    sector: "Hospitality",
    marketCap: 1458540000000, // ~1.46 trillion NGN
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
];

/**
 * Nigerian Stock Exchange trading hours and market information
 */
export const NGX_MARKET_INFO = {
  name: "Nigerian Stock Exchange",
  code: "NGX",
  timezone: "Africa/Lagos", // West Africa Time (WAT)
  currency: "NGN",
  tradingHours: {
    open: "09:30", // 9:30 AM WAT
    close: "14:30", // 2:30 PM WAT
    preMarket: "08:00", // 8:00 AM WAT
    afterMarket: "15:00", // 3:00 PM WAT
  },
  tradingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  holidays: [
    "New Year's Day",
    "Good Friday",
    "Easter Monday",
    "Workers' Day",
    "Children's Day",
    "Democracy Day",
    "Independence Day",
    "Christmas Day",
    "Boxing Day",
  ],
  regulators: [
    "Securities and Exchange Commission (SEC)",
    "Nigerian Stock Exchange",
  ],
  website: "https://ngxgroup.com",
  indices: [
    "NGX All-Share Index",
    "NGX 30 Index",
    "NGX Banking Index",
    "NGX Consumer Goods Index",
  ],
};

/**
 * Helper function to get stock by symbol
 */
export function getNigerianStockBySymbol(symbol: string) {
  return NIGERIAN_STOCKS_DATA.find((stock) => stock.symbol === symbol);
}

/**
 * Helper function to get stocks by sector
 */
export function getNigerianStocksBySector(sector: string) {
  return NIGERIAN_STOCKS_DATA.filter((stock) => stock.sector === sector);
}

/**
 * Helper function to get all sectors
 */
export function getNigerianStockSectors() {
  return [...new Set(NIGERIAN_STOCKS_DATA.map((stock) => stock.sector))];
}

/**
 * Helper function to check if market is open (Nigerian time)
 */
export function isNGXMarketOpen(): boolean {
  const now = new Date();
  const lagosTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  );
  const day = lagosTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = lagosTime.getHours();
  const minute = lagosTime.getMinutes();
  const currentTime = hour * 100 + minute; // Convert to HHMM format

  // Check if it's a weekday (Monday = 1, Friday = 5)
  if (day < 1 || day > 5) {
    return false;
  }

  // Check if it's within trading hours (9:30 AM - 2:30 PM WAT)
  return currentTime >= 930 && currentTime <= 1430;
}

/**
 * Convert NGN price to HBAR equivalent (mock conversion rate)
 * In production, this should fetch real-time exchange rates
 */
export function convertNGNToHBAR(ngnAmount: number): number {
  // Mock conversion rate: 1 HBAR = 800 NGN (this should be dynamic)
  const HBAR_TO_NGN_RATE = 800;
  return ngnAmount / HBAR_TO_NGN_RATE;
}

/**
 * Convert HBAR to NGN equivalent
 */
export function convertHBARToNGN(hbarAmount: number): number {
  const HBAR_TO_NGN_RATE = 800;
  return hbarAmount * HBAR_TO_NGN_RATE;
}
