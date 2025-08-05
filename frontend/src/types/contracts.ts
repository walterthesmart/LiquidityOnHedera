// Auto-generated contract types
// Generated on: 2025-07-21T11:55:03.126Z
// Network: hardhat (Chain ID: 31337)

export interface DeployedContract {
  address: string;
  symbol: string;
  name: string;
  companyName: string;
  maxSupply: string;
}

export interface ContractDeployment {
  network: {
    name: string;
    chainId: string;
  };
  deployer: string;
  factoryAddress: string;
  deployedAt: string;
  totalTokens: number;
  tokens: DeployedContract[];
}

// Deployed contracts for hardhat
export const DEPLOYED_CONTRACTS: ContractDeployment = {
  network: {
    name: "localhost",
    chainId: "31337",
  },
  deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  factoryAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  deployedAt: "2025-07-21T11:51:54.748Z",
  totalTokens: 39,
  tokens: [
    {
      symbol: "DANGCEM",
      name: "Dangote Cement Token",
      companyName: "Dangote Cement Plc",
      address: "0x75537828f2ce51be7289709686A69CbFDbB714F1",
      maxSupply: "17040000000000000000000000000",
    },
    {
      symbol: "MTNN",
      name: "MTN Nigeria Token",
      companyName: "MTN Nigeria Communications Plc",
      address: "0xE451980132E65465d0a498c53f0b5227326Dd73F",
      maxSupply: "20354513050000000000000000000",
    },
    {
      symbol: "ZENITHBANK",
      name: "Zenith Bank Token",
      companyName: "Zenith Bank Plc",
      address: "0x5392A33F7F677f59e833FEBF4016cDDD88fF9E67",
      maxSupply: "31396493786000000000000000000",
    },
    {
      symbol: "GTCO",
      name: "GTCO Token",
      companyName: "Guaranty Trust Holding Company Plc",
      address: "0xa783CDc72e34a174CCa57a6d9a74904d0Bec05A9",
      maxSupply: "29431127496000000000000000000",
    },
    {
      symbol: "NB",
      name: "Nigerian Breweries Token",
      companyName: "Nigerian Breweries Plc",
      address: "0xB30dAf0240261Be564Cea33260F01213c47AAa0D",
      maxSupply: "8020000000000000000000000000",
    },
    {
      symbol: "ACCESS",
      name: "Access Holdings Token",
      companyName: "Access Holdings Plc",
      address: "0x61ef99673A65BeE0512b8d1eB1aA656866D24296",
      maxSupply: "35687500000000000000000000000",
    },
    {
      symbol: "BUACEMENT",
      name: "BUA Cement Token",
      companyName: "BUA Cement Plc",
      address: "0xF45bcaDCc83dea176213Ae4E22f5aF918d08647b",
      maxSupply: "16000000000000000000000000000",
    },
    {
      symbol: "AIRTELAFRI",
      name: "Airtel Africa Token",
      companyName: "Airtel Africa Plc",
      address: "0xeCaE6Cc78251a4F3B8d70c9BD4De1B3742338489",
      maxSupply: "3700000000000000000000000000",
    },
    {
      symbol: "FBNH",
      name: "FBN Holdings Token",
      companyName: "FBN Holdings Plc",
      address: "0x09fe532dFA5FfcaD188ce19A70BB7645ce31a1C8",
      maxSupply: "35895292792000000000000000000",
    },
    {
      symbol: "UBA",
      name: "UBA Token",
      companyName: "United Bank for Africa Plc",
      address: "0x53F3788A62b46B8a45484F928Ef182Fd2c149C2b",
      maxSupply: "35130641814000000000000000000",
    },
    {
      symbol: "NESTLE",
      name: "Nestle Nigeria Token",
      companyName: "Nestle Nigeria Plc",
      address: "0x51f9613a79D56528622Bd31a5Fd4b88b78AE4F8A",
      maxSupply: "1500000000000000000000000000",
    },
    {
      symbol: "SEPLAT",
      name: "Seplat Energy Token",
      companyName: "Seplat Energy Plc",
      address: "0x9133c237A3f4Ce9F48A73Ea03e0448e10cd2f5C1",
      maxSupply: "5882353000000000000000000000",
    },
    {
      symbol: "STANBIC",
      name: "Stanbic IBTC Token",
      companyName: "Stanbic IBTC Holdings Plc",
      address: "0xC366737A5E66127E2dD410aF9D341945a889eF2E",
      maxSupply: "15557000000000000000000000000",
    },
    {
      symbol: "OANDO",
      name: "Oando Token",
      companyName: "Oando Plc",
      address: "0xF5A81C89bCe2c711BC0a91B19BA4c31d9aeA0875",
      maxSupply: "8000000000000000000000000000",
    },
    {
      symbol: "LAFARGE",
      name: "Lafarge Africa Token",
      companyName: "Lafarge Africa Plc",
      address: "0xFD4727f95FC2Df074C427158f9244FeB4B6d3076",
      maxSupply: "17040000000000000000000000000",
    },
    {
      symbol: "CONOIL",
      name: "Conoil Token",
      companyName: "Conoil Plc",
      address: "0x09Df20712491189de6607Fb27bB1DeE53ACB8555",
      maxSupply: "1200000000000000000000000000",
    },
    {
      symbol: "WAPCO",
      name: "WAPCO Token",
      companyName: "Lafarge Africa Plc (WAPCO)",
      address: "0x84D6E95B602df56E3637210F5Dbcc6d23a20C467",
      maxSupply: "17040000000000000000000000000",
    },
    {
      symbol: "FLOURMILL",
      name: "Flour Mills Token",
      companyName: "Flour Mills of Nigeria Plc",
      address: "0x57E1Fa3f9Bf8f4822A8590df964adFf6fd823c37",
      maxSupply: "39000000000000000000000000000",
    },
    {
      symbol: "PRESCO",
      name: "Presco Token",
      companyName: "Presco Plc",
      address: "0xeD0eBCc3159B74b353F31743a3e75112B050d1B7",
      maxSupply: "8000000000000000000000000000",
    },
    {
      symbol: "CADBURY",
      name: "Cadbury Nigeria Token",
      companyName: "Cadbury Nigeria Plc",
      address: "0xc4a43Ab416e3eEa727407607B1afbC1955e15788",
      maxSupply: "1800000000000000000000000000",
    },
    {
      symbol: "GUINNESS",
      name: "Guinness Nigeria Token",
      companyName: "Guinness Nigeria Plc",
      address: "0x27A0D478BABeb113179fFB3bFe329aBBaC64806c",
      maxSupply: "2000000000000000000000000000",
    },
    {
      symbol: "INTBREW",
      name: "International Breweries Token",
      companyName: "International Breweries Plc",
      address: "0xa74b36aE6b475959E7b1f766583190e3298CE9D3",
      maxSupply: "9000000000000000000000000000",
    },
    {
      symbol: "CHAMPION",
      name: "Champion Breweries Token",
      companyName: "Champion Breweries Plc",
      address: "0xF05496A5D9df8a64c0b5AaB0B628e355a72A66a7",
      maxSupply: "2500000000000000000000000000",
    },
    {
      symbol: "UNILEVER",
      name: "Unilever Nigeria Token",
      companyName: "Unilever Nigeria Plc",
      address: "0x610C6886918DEc150a1727140414f8C0c646cF80",
      maxSupply: "6000000000000000000000000000",
    },
    {
      symbol: "TRANSCORP",
      name: "Transcorp Token",
      companyName: "Transnational Corporation Plc",
      address: "0x266cf1ae44A2Ef11305cB056724ed58d79aefB6D",
      maxSupply: "40000000000000000000000000000",
    },
    {
      symbol: "BUAFOODS",
      name: "BUA Foods Token",
      companyName: "BUA Foods Plc",
      address: "0x99E8e6b2c39b9d5b5F8567b53D69cA7154Cb4B09",
      maxSupply: "18000000000000000000000000000",
    },
    {
      symbol: "DANGSUGAR",
      name: "Dangote Sugar Token",
      companyName: "Dangote Sugar Refinery Plc",
      address: "0x1ec4516806DFB8752F28c7e0ec97f0A19aB25E94",
      maxSupply: "12150000000000000000000000000",
    },
    {
      symbol: "UACN",
      name: "UACN Token",
      companyName: "UAC of Nigeria Plc",
      address: "0xC7799fFD68a5A4A9f33cDAB325573E73f005C587",
      maxSupply: "2925000000000000000000000000",
    },
    {
      symbol: "PZ",
      name: "PZ Cussons Token",
      companyName: "PZ Cussons Nigeria Plc",
      address: "0x1BD94602B398717659ecB1FE2E0749E548C69302",
      maxSupply: "3970000000000000000000000000",
    },
    {
      symbol: "TOTAL",
      name: "TotalEnergies Token",
      companyName: "TotalEnergies Marketing Nigeria Plc",
      address: "0xccE9d1E247b0F1aC51962A5bf376aA676fa07661",
      maxSupply: "339500000000000000000000000",
    },
    {
      symbol: "ETERNA",
      name: "Eterna Token",
      companyName: "Eterna Plc",
      address: "0x808511C76D781507a0C79Aad53eAf92b47c25322",
      maxSupply: "1305000000000000000000000000",
    },
    {
      symbol: "GEREGU",
      name: "Geregu Power Token",
      companyName: "Geregu Power Plc",
      address: "0xC6aF5F360d4ca749B4e0931290fac47a042E08D8",
      maxSupply: "2500000000000000000000000000",
    },
    {
      symbol: "TRANSPOWER",
      name: "Transcorp Power Token",
      companyName: "Transcorp Power Plc",
      address: "0x454675c325841EFddEF2704c13F0b5ACA960B947",
      maxSupply: "7500000000000000000000000000",
    },
    {
      symbol: "FIDSON",
      name: "Fidson Healthcare Token",
      companyName: "Fidson Healthcare Plc",
      address: "0xF002E5376D5965779035038E7F2a91738f7bd522",
      maxSupply: "2295000000000000000000000000",
    },
    {
      symbol: "MAYBAKER",
      name: "May & Baker Token",
      companyName: "May & Baker Nigeria Plc",
      address: "0xBC6F5E556F90DBaCd247dfe7ff1688DA9D40d4a6",
      maxSupply: "1725000000000000000000000000",
    },
    {
      symbol: "OKOMUOIL",
      name: "Okomu Oil Token",
      companyName: "The Okomu Oil Palm Company Plc",
      address: "0xCeAb4Eaee687Bb34af797136999a239839274626",
      maxSupply: "954000000000000000000000000",
    },
    {
      symbol: "LIVESTOCK",
      name: "Livestock Feeds Token",
      companyName: "Livestock Feeds Plc",
      address: "0xc4FAc83331E171ce8C00b3F74C3856f8Cc58fFbd",
      maxSupply: "3000000000000000000000000000",
    },
    {
      symbol: "CWG",
      name: "CWG Token",
      companyName: "CWG Plc",
      address: "0xea50f1A4E432FfcfBA47E9AC37401D0C07CCC739",
      maxSupply: "2525000000000000000000000000",
    },
    {
      symbol: "TRANSCOHOT",
      name: "Transcorp Hotels Token",
      companyName: "Transcorp Hotels Plc",
      address: "0x6Bc9a0cD10C8F69de903504EC2676e1B4a3aDA49",
      maxSupply: "10240000000000000000000000000",
    },
  ],
};

// Contract addresses by symbol
export const TOKEN_ADDRESSES: Record<string, string> = {
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
};

// Factory contract address
export const FACTORY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// Network information
export const DEPLOYMENT_NETWORK = {
  name: "hardhat",
  chainId: "31337",
};
