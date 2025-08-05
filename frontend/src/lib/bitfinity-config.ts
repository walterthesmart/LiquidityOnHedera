/**
 * Bitfinity EVM Configuration
 * Network settings and contract addresses for Nigerian Stock Exchange tokens
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet?: boolean;
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  bitfinity_testnet: {
    chainId: 355113,
    name: "Bitfinity Testnet",
    rpcUrl: "https://testnet.bitfinity.network",
    blockExplorer: "https://explorer.testnet.bitfinity.network",
    nativeCurrency: {
      name: "Bitfinity Token",
      symbol: "BTF",
      decimals: 18,
    },
    testnet: true,
  },
  bitfinity_mainnet: {
    chainId: 355110,
    name: "Bitfinity Mainnet",
    rpcUrl: "https://mainnet.bitfinity.network",
    blockExplorer: "https://explorer.bitfinity.network",
    nativeCurrency: {
      name: "Bitfinity Token",
      symbol: "BTF",
      decimals: 18,
    },
    testnet: false,
  },
  sepolia: {
    chainId: 11155111,
    name: "Ethereum Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: true,
  },
};

// Backward compatibility
export const BITFINITY_NETWORKS = {
  testnet: SUPPORTED_NETWORKS.bitfinity_testnet,
  mainnet: SUPPORTED_NETWORKS.bitfinity_mainnet,
};

export const DEFAULT_NETWORK = "bitfinity_testnet";

/**
 * Contract addresses (to be updated after deployment)
 */
export interface ContractAddresses {
  factoryAddress: string;
  tokens: Record<string, string>;
}

export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = {
  // Local development (Hardhat)
  "31337": {
    factoryAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    tokens: {
      DANGCEM: "0x75537828f2ce51be7289709686A69CbFDbB714F1",
      MTNN: "0xE451980132E65465d0a498c53f0b5227326Dd73F",
      ZENITHBANK: "0x5392A33F7F677f59e833FEBF4016cDDD88fF9E67",
      GTCO: "0xa783CDc72e34a174CCa57a6d9a74904d0Bec05A9",
      NB: "0xB30dAf0240261Be564Cea33260F01213c47AAa0D",
      ACCESS: "0x61ef99673A65BeE0512b8d1eB1aA656866D24296",
      BUACEMENT: "0xF45bcaDCc83dea176213Ae4E22f5aF918d08647b",
      AIRTELAFRI: "0xeCaE6Cc78251a4F3B8d70c9BD4De1B3742338489",
      FBNH: "0x09fe532dFA5FfcaD188ce19A70BB7645ce31a1C8",
      UBA: "0x53F3788A62b46B8a45484F928Ef182Fd2c149C2b",
      NESTLE: "0x51f9613a79D56528622Bd31a5Fd4b88b78AE4F8A",
      SEPLAT: "0x9133c237A3f4Ce9F48A73Ea03e0448e10cd2f5C1",
      STANBIC: "0xC366737A5E66127E2dD410aF9D341945a889eF2E",
      OANDO: "0xF5A81C89bCe2c711BC0a91B19BA4c31d9aeA0875",
      LAFARGE: "0xFD4727f95FC2Df074C427158f9244FeB4B6d3076",
      CONOIL: "0x09Df20712491189de6607Fb27bB1DeE53ACB8555",
      WAPCO: "0x84D6E95B602df56E3637210F5Dbcc6d23a20C467",
      FLOURMILL: "0x57E1Fa3f9Bf8f4822A8590df964adFf6fd823c37",
      PRESCO: "0xeD0eBCc3159B74b353F31743a3e75112B050d1B7",
      CADBURY: "0xc4a43Ab416e3eEa727407607B1afbC1955e15788",
      GUINNESS: "0x27A0D478BABeb113179fFB3bFe329aBBaC64806c",
      INTBREW: "0xa74b36aE6b475959E7b1f766583190e3298CE9D3",
      CHAMPION: "0xF05496A5D9df8a64c0b5AaB0B628e355a72A66a7",
      UNILEVER: "0x610C6886918DEc150a1727140414f8C0c646cF80",
      TRANSCORP: "0x266cf1ae44A2Ef11305cB056724ed58d79aefB6D",
      BUAFOODS: "0x99E8e6b2c39b9d5b5F8567b53D69cA7154Cb4B09",
      DANGSUGAR: "0x1ec4516806DFB8752F28c7e0ec97f0A19aB25E94",
      UACN: "0xC7799fFD68a5A4A9f33cDAB325573E73f005C587",
      PZ: "0x1BD94602B398717659ecB1FE2E0749E548C69302",
      TOTAL: "0xccE9d1E247b0F1aC51962A5bf376aA676fa07661",
      ETERNA: "0x808511C76D781507a0C79Aad53eAf92b47c25322",
      GEREGU: "0xC6aF5F360d4ca749B4e0931290fac47a042E08D8",
      TRANSPOWER: "0x454675c325841EFddEF2704c13F0b5ACA960B947",
      FIDSON: "0xF002E5376D5965779035038E7F2a91738f7bd522",
      MAYBAKER: "0xBC6F5E556F90DBaCd247dfe7ff1688DA9D40d4a6",
      OKOMUOIL: "0xCeAb4Eaee687Bb34af797136999a239839274626",
      LIVESTOCK: "0xc4FAc83331E171ce8C00b3F74C3856f8Cc58fFbd",
      CWG: "0xea50f1A4E432FfcfBA47E9AC37401D0C07CCC739",
      TRANSCOHOT: "0x6Bc9a0cD10C8F69de903504EC2676e1B4a3aDA49",
    },
  },
  // Ethereum Sepolia Testnet (deployed with all 39 tokens)
  "11155111": {
    factoryAddress: "0xF1098eDaaB7a7D7b3bD42e7DeD9554781dfA625A",
    tokens: {
      DANGCEM: "0x2EC5d749D0DF8Aa8b1Af4128d0b0Cb76417A8DeE",
      MTNN: "0xa19FB869e72ecC01797BcF57B690Ecee3101888A",
      ZENITHBANK: "0x00b41E1164843E291bB5B496b50E3b143C278016",
      GTCO: "0x2f6c483D1ad3659B9b915cA164Fd6BA4089788EE",
      NB: "0x085b9cD55F29b89362C80429e8C406Cf809625C6",
      ACCESS: "0x9C251e779e993d0B757dA882F837EbaDf52A7A95",
      BUACEMENT: "0xD2a65Ab7eF6f1e9e84b239897b21eBE1f4E3D6D6",
      AIRTELAFRI: "0xDaa7B36c9C39F541835d232a6d2a678C1010e39D",
      FBNH: "0xaC8eAFC05924D9D1c403201367a39FA328913617",
      UBA: "0xA84d9C136c1A6e20fc94Fb696691cDecb9DEf298",
      NESTLE: "0x8CF279306e3C53D221ed246c945957B1Bea49272",
      SEPLAT: "0x1619A6E81A1c53d5cD271E1082920a9174fA04D8",
      STANBIC: "0x8cd78917AF75EF19c15a62279A203DDAbe276d08",
      OANDO: "0x0BFe75e4C91954a39b123405b1e000E0E79bfDCD",
      LAFARGE: "0x5569ef609EE30c45e30a34a5d2B83EDFb9E75DC9",
      CONOIL: "0xAd29d8381bEeF1495a6640dBC2846b5a5e224667",
      WAPCO: "0x11cbB6f35A4d4DEEc403A1435dF52026C93d5Cdf",
      FLOURMILL: "0x525edf72C9F089e1D0AA03d7bfafdb11583846d6",
      PRESCO: "0x4525eC617c538ee868D8Ba86F9fC678705BFB6Df",
      CADBURY: "0x14ccb368E0CF3cbFECD7cd00773d7630c4c4D099",
      GUINNESS: "0x9A303032fA4aA0829fA014DAa6aDab816FE7e8bC",
      INTBREW: "0x635728614b1e9BA124E24E7Fae1D2053D436088F",
      CHAMPION: "0x0ACc4716264B8cDDFb5A32403f21c9676DeCA94F",
      UNILEVER: "0xdE6d00036f3824Fb3D946Ba49Cc659004AAD3152",
      TRANSCORP: "0x1DC1322088A53127357c55A9D57446A4aDf4F1Ee",
      BUAFOODS: "0xB3d6608A716A69777BFfAaEC73fbE65C1b7D4A59",
      DANGSUGAR: "0x2f2e9AF8b5cdd8E3535b4A56229D06E390e7fB57",
      UACN: "0x30921E1E9C2C24DbB66aC2B4DEf49bD78e882CBa",
      PZ: "0x52EbaBc92B65A32f975e178D04b120F202856F87",
      TOTAL: "0xee34f2995c8464249a500647762729cC85546796",
      ETERNA: "0xce49f5200517D0994eD1b68D91A0f5d9e0F5B65C",
      GEREGU: "0x96776DFa7f79dDd40D3D08923ca1d8bF17116B5e",
      TRANSPOWER: "0xd05D14e44208CbB39670237F76c7cf7F517c0793",
      FIDSON: "0x72499820efe88ffb0253deF2081aBE0C12Ad3A49",
      MAYBAKER: "0x98cde370aC0191C5617A9e9BC25c7b577FB29c3A",
      OKOMUOIL: "0xbdF14077E9c3F8Ee4C2ea2620a1561ba25FBAb37",
      LIVESTOCK: "0xA0c54cD234fdcD908318ac65aDC5c7aF040ee6Ad",
      CWG: "0x8E19Ad1a4d1bf8bAde2f734785352531f98ffcBb",
      TRANSCOHOT: "0xC9d205FA491891fe0f5886cdA0E892ccfF0c2904",
    },
  },
  // Bitfinity Testnet (to be updated after deployment)
  "355113": {
    factoryAddress: "", // Will be updated after deployment
    tokens: {},
  },
  // Bitfinity Mainnet (to be updated after deployment)
  "355110": {
    factoryAddress: "", // Will be updated after deployment
    tokens: {},
  },
};

/**
 * Nigerian Stock Exchange tokens data
 */
export interface NigerianStockData {
  symbol: string;
  name: string;
  companyName: string;
  totalSupply: string;
  sector: string;
  description: string;
}

export const NIGERIAN_STOCKS: NigerianStockData[] = [
  {
    symbol: "DANGCEM",
    name: "Dangote Cement Token",
    companyName: "Dangote Cement Plc",
    totalSupply: "17040000000000000000000000000",
    sector: "Industrial/Cement",
    description: "Leading cement manufacturer in Nigeria",
  },
  {
    symbol: "MTNN",
    name: "MTN Nigeria Token",
    companyName: "MTN Nigeria Communications Plc",
    totalSupply: "20354513050000000000000000000",
    sector: "Telecommunications",
    description: "Largest telecommunications company in Nigeria",
  },
  {
    symbol: "ZENITHBANK",
    name: "Zenith Bank Token",
    companyName: "Zenith Bank Plc",
    totalSupply: "31396493786000000000000000000",
    sector: "Banking",
    description: "Leading commercial bank in Nigeria",
  },
  {
    symbol: "GTCO",
    name: "GTCO Token",
    companyName: "Guaranty Trust Holding Company Plc",
    totalSupply: "29431127496000000000000000000",
    sector: "Banking",
    description: "Premier financial services group in Nigeria",
  },
  {
    symbol: "NB",
    name: "Nigerian Breweries Token",
    companyName: "Nigerian Breweries Plc",
    totalSupply: "8020000000000000000000000000",
    sector: "Consumer Goods",
    description: "Leading brewery and beverage company",
  },
  {
    symbol: "ACCESS",
    name: "Access Holdings Token",
    companyName: "Access Holdings Plc",
    totalSupply: "35687500000000000000000000000",
    sector: "Banking",
    description: "Major commercial bank in Nigeria",
  },
  {
    symbol: "BUACEMENT",
    name: "BUA Cement Token",
    companyName: "BUA Cement Plc",
    totalSupply: "16000000000000000000000000000",
    sector: "Industrial/Cement",
    description: "Major cement producer in Nigeria",
  },
  {
    symbol: "AIRTELAFRI",
    name: "Airtel Africa Token",
    companyName: "Airtel Africa Plc",
    totalSupply: "3700000000000000000000000000",
    sector: "Telecommunications",
    description: "Leading telecommunications and mobile money services",
  },
  {
    symbol: "FBNH",
    name: "FBN Holdings Token",
    companyName: "FBN Holdings Plc",
    totalSupply: "35895292792000000000000000000",
    sector: "Banking",
    description: "Nigeria's oldest commercial bank holding company",
  },
  {
    symbol: "UBA",
    name: "UBA Token",
    companyName: "United Bank for Africa Plc",
    totalSupply: "35130641814000000000000000000",
    sector: "Banking",
    description: "Pan-African financial services group",
  },
  {
    symbol: "NESTLE",
    name: "Nestle Nigeria Token",
    companyName: "Nestle Nigeria Plc",
    totalSupply: "1500000000000000000000000000",
    sector: "Consumer Goods",
    description: "Leading food and beverage company",
  },
  {
    symbol: "SEPLAT",
    name: "Seplat Energy Token",
    companyName: "Seplat Energy Plc",
    totalSupply: "5882353000000000000000000000",
    sector: "Oil & Gas",
    description: "Independent oil and gas exploration company",
  },
  {
    symbol: "STANBIC",
    name: "Stanbic IBTC Token",
    companyName: "Stanbic IBTC Holdings Plc",
    totalSupply: "15557000000000000000000000000",
    sector: "Banking",
    description: "Leading financial services group",
  },
  {
    symbol: "OANDO",
    name: "Oando Token",
    companyName: "Oando Plc",
    totalSupply: "8000000000000000000000000000",
    sector: "Oil & Gas",
    description: "Integrated energy solutions company",
  },
  {
    symbol: "LAFARGE",
    name: "Lafarge Africa Token",
    companyName: "Lafarge Africa Plc",
    totalSupply: "17040000000000000000000000000",
    sector: "Industrial/Cement",
    description: "Leading cement and building materials company",
  },
  {
    symbol: "CONOIL",
    name: "Conoil Token",
    companyName: "Conoil Plc",
    totalSupply: "1200000000000000000000000000",
    sector: "Oil & Gas",
    description: "Petroleum products marketing and lubricants company",
  },
  {
    symbol: "WAPCO",
    name: "WAPCO Token",
    companyName: "Lafarge Africa Plc (WAPCO)",
    totalSupply: "17040000000000000000000000000",
    sector: "Industrial/Cement",
    description: "West African Portland Cement Company",
  },
  {
    symbol: "FLOURMILL",
    name: "Flour Mills Token",
    companyName: "Flour Mills of Nigeria Plc",
    totalSupply: "39000000000000000000000000000",
    sector: "Consumer Goods",
    description: "Leading food and agro-allied company",
  },
  {
    symbol: "PRESCO",
    name: "Presco Token",
    companyName: "Presco Plc",
    totalSupply: "8000000000000000000000000000",
    sector: "Agriculture",
    description: "Palm oil plantation and processing company",
  },
  {
    symbol: "CADBURY",
    name: "Cadbury Nigeria Token",
    companyName: "Cadbury Nigeria Plc",
    totalSupply: "1800000000000000000000000000",
    sector: "Consumer Goods",
    description: "Confectionery and beverage company",
  },
  {
    symbol: "GUINNESS",
    name: "Guinness Nigeria Token",
    companyName: "Guinness Nigeria Plc",
    totalSupply: "2000000000000000000000000000",
    sector: "Consumer Goods",
    description: "Brewery and beverage company",
  },
  {
    symbol: "INTBREW",
    name: "International Breweries Token",
    companyName: "International Breweries Plc",
    totalSupply: "9000000000000000000000000000",
    sector: "Consumer Goods",
    description: "Beer and malt drinks producer",
  },
  {
    symbol: "CHAMPION",
    name: "Champion Breweries Token",
    companyName: "Champion Breweries Plc",
    totalSupply: "2500000000000000000000000000",
    sector: "Consumer Goods",
    description: "Beer and malt drinks company",
  },
  {
    symbol: "UNILEVER",
    name: "Unilever Nigeria Token",
    companyName: "Unilever Nigeria Plc",
    totalSupply: "6000000000000000000000000000",
    sector: "Consumer Goods",
    description: "Consumer goods and personal care products",
  },
  {
    symbol: "TRANSCORP",
    name: "Transcorp Token",
    companyName: "Transnational Corporation Plc",
    totalSupply: "40000000000000000000000000000",
    sector: "Conglomerate",
    description:
      "Diversified conglomerate with interests in power, hospitality, and oil & gas",
  },
  {
    symbol: "BUAFOODS",
    name: "BUA Foods Token",
    companyName: "BUA Foods Plc",
    totalSupply: "18000000000000000000000000000",
    sector: "Consumer Goods",
    description: "Leading food and sugar manufacturing company",
  },
  {
    symbol: "DANGSUGAR",
    name: "Dangote Sugar Token",
    companyName: "Dangote Sugar Refinery Plc",
    totalSupply: "12150000000000000000000000000",
    sector: "Consumer Goods",
    description: "Leading sugar refinery and manufacturing company",
  },
  {
    symbol: "UACN",
    name: "UACN Token",
    companyName: "UAC of Nigeria Plc",
    totalSupply: "2925000000000000000000000000",
    sector: "Conglomerate",
    description:
      "Diversified conglomerate with interests in food, real estate, and logistics",
  },
  {
    symbol: "PZ",
    name: "PZ Cussons Token",
    companyName: "PZ Cussons Nigeria Plc",
    totalSupply: "3970000000000000000000000000",
    sector: "Consumer Goods",
    description: "Personal care and household products manufacturer",
  },
  {
    symbol: "TOTAL",
    name: "TotalEnergies Token",
    companyName: "TotalEnergies Marketing Nigeria Plc",
    totalSupply: "339500000000000000000000000",
    sector: "Oil & Gas",
    description: "Petroleum products marketing and distribution",
  },
  {
    symbol: "ETERNA",
    name: "Eterna Token",
    companyName: "Eterna Plc",
    totalSupply: "1305000000000000000000000000",
    sector: "Oil & Gas",
    description: "Petroleum products marketing and distribution company",
  },
  {
    symbol: "GEREGU",
    name: "Geregu Power Token",
    companyName: "Geregu Power Plc",
    totalSupply: "2500000000000000000000000000",
    sector: "Power",
    description: "Independent power producer and electricity generation",
  },
  {
    symbol: "TRANSPOWER",
    name: "Transcorp Power Token",
    companyName: "Transcorp Power Plc",
    totalSupply: "7500000000000000000000000000",
    sector: "Power",
    description: "Power generation and electricity distribution",
  },
  {
    symbol: "FIDSON",
    name: "Fidson Healthcare Token",
    companyName: "Fidson Healthcare Plc",
    totalSupply: "2295000000000000000000000000",
    sector: "Healthcare",
    description: "Pharmaceutical manufacturing and healthcare services",
  },
  {
    symbol: "MAYBAKER",
    name: "May & Baker Token",
    companyName: "May & Baker Nigeria Plc",
    totalSupply: "1725000000000000000000000000",
    sector: "Healthcare",
    description: "Pharmaceutical manufacturing and healthcare products",
  },
  {
    symbol: "OKOMUOIL",
    name: "Okomu Oil Token",
    companyName: "The Okomu Oil Palm Company Plc",
    totalSupply: "954000000000000000000000000",
    sector: "Agriculture",
    description: "Palm oil plantation and processing company",
  },
  {
    symbol: "LIVESTOCK",
    name: "Livestock Feeds Token",
    companyName: "Livestock Feeds Plc",
    totalSupply: "3000000000000000000000000000",
    sector: "Agriculture",
    description: "Animal feed production and agribusiness",
  },
  {
    symbol: "CWG",
    name: "CWG Token",
    companyName: "CWG Plc",
    totalSupply: "2525000000000000000000000000",
    sector: "Technology",
    description: "Information technology and digital services company",
  },
  {
    symbol: "TRANSCOHOT",
    name: "Transcorp Hotels Token",
    companyName: "Transcorp Hotels Plc",
    totalSupply: "10240000000000000000000000000",
    sector: "Hospitality",
    description: "Hospitality and hotel management services",
  },
];

/**
 * Get stock data by symbol
 */
export function getStockBySymbol(
  symbol: string,
): NigerianStockData | undefined {
  return NIGERIAN_STOCKS.find((stock) => stock.symbol === symbol);
}

/**
 * Get all stocks by sector
 */
export function getStocksBySector(sector: string): NigerianStockData[] {
  return NIGERIAN_STOCKS.filter((stock) => stock.sector === sector);
}

/**
 * Get all unique sectors
 */
export function getAllSectors(): string[] {
  return [...new Set(NIGERIAN_STOCKS.map((stock) => stock.sector))];
}

/**
 * Network utility functions
 */

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(
  chainId: number,
): NetworkConfig | undefined {
  return Object.values(SUPPORTED_NETWORKS).find(
    (network) => network.chainId === chainId,
  );
}

/**
 * Get network configuration by key
 */
export function getNetworkByKey(key: string): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS[key];
}

/**
 * Check if a network is a testnet
 */
export function isTestnet(chainId: number): boolean {
  const network = getNetworkByChainId(chainId);
  return network?.testnet ?? false;
}

/**
 * Get contract addresses for a specific chain ID
 */
export function getContractAddresses(
  chainId: number,
): ContractAddresses | undefined {
  return CONTRACT_ADDRESSES[chainId.toString()];
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(SUPPORTED_NETWORKS).map((network) => network.chainId);
}

/**
 * Get testnet networks only
 */
export function getTestnetNetworks(): Record<string, NetworkConfig> {
  return Object.fromEntries(
    Object.entries(SUPPORTED_NETWORKS).filter(([, network]) => network.testnet),
  );
}

/**
 * Get mainnet networks only
 */
export function getMainnetNetworks(): Record<string, NetworkConfig> {
  return Object.fromEntries(
    Object.entries(SUPPORTED_NETWORKS).filter(
      ([, network]) => !network.testnet,
    ),
  );
}

/**
 * Format network name for display
 */
export function formatNetworkName(chainId: number): string {
  const network = getNetworkByChainId(chainId);
  return network?.name ?? `Unknown Network (${chainId})`;
}

/**
 * Get block explorer URL for a transaction
 */
export function getTransactionUrl(chainId: number, txHash: string): string {
  const network = getNetworkByChainId(chainId);
  if (!network) return "";
  return `${network.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getAddressUrl(chainId: number, address: string): string {
  const network = getNetworkByChainId(chainId);
  if (!network) return "";
  return `${network.blockExplorer}/address/${address}`;
}
