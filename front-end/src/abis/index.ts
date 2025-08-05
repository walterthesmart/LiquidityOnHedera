/**
 * Contract ABIs for Nigerian Stock Exchange tokens
 *
 * This file exports the ABIs for the deployed contracts on multiple networks.
 * The ABIs are extracted from the compiled contract artifacts.
 */

import NigerianStockTokenFactoryArtifact from "./NigerianStockTokenFactory.json";
import NigerianStockTokenArtifact from "./NigerianStockToken.json";
import NGNStablecoinArtifact from "./NGNStablecoin.json";
import StockNGNDEXArtifact from "./StockNGNDEX.json";
import TradingPairManagerArtifact from "./TradingPairManager.json";

// Export the ABI arrays for use with ethers.js and wagmi
export const NigerianStockTokenFactoryABI =
  NigerianStockTokenFactoryArtifact.abi;
export const NigerianStockTokenABI = NigerianStockTokenArtifact.abi;
export const NGNStablecoinABI = NGNStablecoinArtifact;
export const StockNGNDEXABI = StockNGNDEXArtifact;
export const TradingPairManagerABI = TradingPairManagerArtifact;

// Export contract artifacts for advanced usage
export {
  NigerianStockTokenFactoryArtifact,
  NigerianStockTokenArtifact,
  NGNStablecoinArtifact,
  StockNGNDEXArtifact,
  TradingPairManagerArtifact,
};

// Type definitions for the ABIs (for TypeScript support)
export type NigerianStockTokenFactoryABI = typeof NigerianStockTokenFactoryABI;
export type NigerianStockTokenABI = typeof NigerianStockTokenABI;
export type NGNStablecoinABI = typeof NGNStablecoinABI;
export type StockNGNDEXABI = typeof StockNGNDEXABI;
export type TradingPairManagerABI = typeof TradingPairManagerABI;

/**
 * Contract addresses by network
 * Updated automatically by deployment scripts
 */
export const CONTRACT_ADDRESSES = {
  // Ethereum Sepolia Testnet
  11155111: {
    factoryAddress: "0xF1098eDaaB7a7D7b3bD42e7DeD9554781dfA625A",
    ngnStablecoin: "0xc6FDE8a6D23B2A0e7f39F90bc5B7c062159e9A36",
    stockNGNDEX: "0x1fb6d61A02eF94564e90e14BeACbba17A0C9482a",
    tradingPairManager: "0x5b23a4caCE30BFDa4326d784e82A24bA5D8f56b9",
    tokens: {
      // All 38 deployed Nigerian stock tokens on Sepolia
      // Updated from sepolia-contracts.json deployment file (2025-07-23)
      DANGCEM: "0xc4cB0e9A47FFb17F927c94e590E4D3CCd03B40DB",
      MTNN: "0x26FB154F273Ec41469a4423b9C6828d07CbFc085",
      ZENITHBANK: "0x402F234048d41cB8031aF7B59E9d2Fbfc4BEF678",
      GTCO: "0x2E323Fc3FdE45b33B3143Db18BBc8c6F5B765183",
      NB: "0xff7ab2b0FcC6f9E4689a5e5bbDd692bf48eE3FeE",
      ACCESS: "0xe17F10218Ff46FA0B2D8F82483eC6D8958B24bC9",
      BUACEMENT: "0x2d0940D2160248D851601703626d7933DC2b5298",
      AIRTELAFRI: "0x3A366d23CeFaF01C710894dAFD86009E6bA8E86D",
      FBNH: "0xbE34d21903CEdB7268C1b0BcE9a027812F5EC834",
      UBA: "0xf0926AD7B56b65C12Fe1D005d38BD67F6c7C6CBC",
      NESTLE: "0x78836734F5398375Ea463010c4D1a0c857634D1A",
      SEPLAT: "0xf0BD07108e4B5B926f219f38E04b0eE6E2E8Ad45",
      STANBIC: "0xEbcD1b3bB7d9bd171e35bf65a0C14F67E58A225D",
      OANDO: "0xF384aB95bcf03836e06dEf9e79609d94d9612aDc",
      CONOIL: "0xD27e008b63bE96FBA40DB046Ca17a944841B2Be2",
      WAPCO: "0xD3A3999200d166b30decd53131D66EEC22D9FC4d",
      FLOURMILL: "0xd7A55E1098163e13a5f3B50ED339134bD4658De6",
      PRESCO: "0xC7D24f4D51fc9943663191fBa27958fFc5a7a5Aa",
      CADBURY: "0x096352CCb386114873A9847e7Ae083603FE4c84B",
      GUINNESS: "0x4D20a560da2c7cD407b67FE1f62D2BE142e1DF45",
      INTBREW: "0xd2E3F7fc768E0C32fc7EDdDC5052Fc4E594Ec40F",
      CHAMPION: "0x8bC8924B95A5459e995C62B6752B6aFd2860a12f",
      UNILEVER: "0xa0a2e8D34049c795d2Ccd78cC5bc354a3199e13F",
      TRANSCORP: "0x4af5B35688511E6AFD4738a641Ad87517ef60404",
      BUAFOODS: "0x3E0edd3A58a13C1421f8C7f646127f801caeE3ED",
      DANGSUGAR: "0x1A959C4357173dFE5E4ACd373cd4A8e358AeDC09",
      UACN: "0xc16A32564BFf3A778087eDd9E1185D9C29d96dC7",
      PZ: "0x3d9F99f3c479DC6f3d9a1390AadC33aD6b83A707",
      TOTAL: "0xBb11F71ae636307898F922dbC8793BB4443A6276",
      ETERNA: "0x80E70d7784F4452d3D15E8dFc84E7d9310275a09",
      GEREGU: "0x99d76D737847c7079A8B3acFc9420a57bCc72fe7",
      TRANSPOWER: "0x6b209251003793275e302E7d4512866a86dF26b4",
      FIDSON: "0x0887DcA31922b24Cb447CF106b9dEc0F53A92E55",
      MAYBAKER: "0xB7D1d82e2564fc8E92a8F4000e281bC7022A5579",
      OKOMUOIL: "0xddAF08c8DBC520e54983746c615c5F9a1E1C8940",
      LIVESTOCK: "0x615E8B54820a8797C2B7dBa6202dC5aB78fc4A65",
      CWG: "0x9bF27FB85dB4751d9bF2C33Be689948405A489Af",
      TRANSCOHOT: "0x05DB17284C867BAA98aCa5D4177731235c764E9A",
    },
  },
  // Bitfinity Testnet (to be updated)
  355113: {
    factoryAddress: "",
    ngnStablecoin: "",
    stockNGNDEX: "",
    tradingPairManager: "",
    tokens: {},
  },
  // Bitfinity Mainnet (to be updated)
  355110: {
    factoryAddress: "",
    ngnStablecoin: "",
    stockNGNDEX: "",
    tradingPairManager: "",
    tokens: {},
  },
  // Local development
  31337: {
    factoryAddress: "",
    ngnStablecoin: "",
    stockNGNDEX: "",
    tradingPairManager: "",
    tokens: {},
  },
};

/**
 * Helper function to get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
}

/**
 * Helper function to get factory address for a specific chain
 */
export function getFactoryAddress(chainId: number): string {
  const addresses = getContractAddresses(chainId);
  return addresses?.factoryAddress || "";
}

/**
 * Helper function to get token address by symbol for a specific chain
 */
export function getTokenAddress(chainId: number, symbol: string): string {
  const addresses = getContractAddresses(chainId);
  return (addresses?.tokens as Record<string, string>)?.[symbol] || "";
}

/**
 * Helper function to get all available tokens for a specific chain
 */
export function getAvailableTokens(chainId: number): string[] {
  const addresses = getContractAddresses(chainId);
  return Object.keys(addresses?.tokens || {});
}

/**
 * Helper function to get NGN Stablecoin address for a specific chain
 */
export function getNGNStablecoinAddress(chainId: number): string {
  const addresses = getContractAddresses(chainId);
  return (addresses as { ngnStablecoin?: string })?.ngnStablecoin || "";
}

/**
 * Helper function to get StockNGNDEX address for a specific chain
 */
export function getStockNGNDEXAddress(chainId: number): string {
  const addresses = getContractAddresses(chainId);
  return (addresses as { stockNGNDEX?: string })?.stockNGNDEX || "";
}

/**
 * Helper function to get TradingPairManager address for a specific chain
 */
export function getTradingPairManagerAddress(chainId: number): string {
  const addresses = getContractAddresses(chainId);
  return (
    (addresses as { tradingPairManager?: string })?.tradingPairManager || ""
  );
}
