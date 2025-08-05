import { expect } from "chai";
import { ethers } from "hardhat";
import {
  TradingPairManager,
  StockNGNDEX,
  NGNStablecoin,
  NigerianStockToken,
  NigerianStockTokenFactory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TradingPairManager", function () {
  let tradingPairManager: TradingPairManager;
  let stockNGNDEX: StockNGNDEX;
  let ngnStablecoin: NGNStablecoin;
  let stockToken1: NigerianStockToken;
  let stockToken2: NigerianStockToken;
  let stockFactory: NigerianStockTokenFactory;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let liquidityManager: SignerWithAddress;
  let user1: SignerWithAddress;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
  const LIQUIDITY_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LIQUIDITY_MANAGER_ROLE"));

  const ngnConfig = {
    name: "Nigerian Naira Stablecoin",
    symbol: "NGN",
    decimals: 18,
    maxSupply: ethers.parseEther("1000000000"),
    mintingCap: ethers.parseEther("10000000"),
    lastMintReset: 0,
    currentDayMinted: 0,
    mintingEnabled: true,
    burningEnabled: true,
    transfersEnabled: true,
  };

  const dexConfig = {
    defaultFeeRate: 30,
    maxPriceImpact: 500,
    minLiquidity: ethers.parseEther("1000"),
    swapDeadline: 1800,
    emergencyMode: false,
  };

  const managerConfig = {
    defaultFeeRate: 30,
    defaultLiquidityTarget: ethers.parseEther("100000"),
    defaultRebalanceThreshold: 1000, // 10%
    maxPairsPerBatch: 10,
    autoLiquidityEnabled: true,
    emergencyWithdrawDelay: 86400,
  };

  const stockMetadata1 = {
    symbol: "DANGCEM",
    companyName: "Dangote Cement Plc",
    sector: "Industrial Goods",
    totalShares: ethers.parseEther("17040000000"),
    marketCap: ethers.parseEther("5000000000"),
    isActive: true,
    lastUpdated: 0,
  };

  const stockMetadata2 = {
    symbol: "MTNN",
    companyName: "MTN Nigeria Communications Plc",
    sector: "Telecommunications",
    totalShares: ethers.parseEther("20354000000"),
    marketCap: ethers.parseEther("3500000000"),
    isActive: true,
    lastUpdated: 0,
  };

  beforeEach(async function () {
    [admin, operator, liquidityManager, user1] = await ethers.getSigners();

    // Deploy NGN Stablecoin
    const NGNStablecoinFactory = await ethers.getContractFactory("NGNStablecoin");
    ngnStablecoin = await NGNStablecoinFactory.deploy(admin.address, ngnConfig);
    await ngnStablecoin.waitForDeployment();

    // Deploy Stock Factory
    const NigerianStockTokenFactoryFactory = await ethers.getContractFactory(
      "NigerianStockTokenFactory"
    );
    stockFactory = await NigerianStockTokenFactoryFactory.deploy(admin.address);
    await stockFactory.waitForDeployment();

    // Deploy Stock Tokens
    const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockToken");

    stockToken1 = await NigerianStockTokenFactory.deploy(
      "Dangote Cement Token",
      "DANGCEM",
      ethers.parseEther("1000000"),
      stockMetadata1,
      admin.address
    );
    await stockToken1.waitForDeployment();

    stockToken2 = await NigerianStockTokenFactory.deploy(
      "MTN Nigeria Token",
      "MTNN",
      ethers.parseEther("1000000"),
      stockMetadata2,
      admin.address
    );
    await stockToken2.waitForDeployment();

    // Deploy DEX
    const StockNGNDEXFactory = await ethers.getContractFactory("StockNGNDEX");
    stockNGNDEX = await StockNGNDEXFactory.deploy(
      await ngnStablecoin.getAddress(),
      admin.address,
      dexConfig
    );
    await stockNGNDEX.waitForDeployment();

    // Deploy Trading Pair Manager
    const TradingPairManagerFactory = await ethers.getContractFactory("TradingPairManager");
    tradingPairManager = await TradingPairManagerFactory.deploy(
      await ngnStablecoin.getAddress(),
      await stockNGNDEX.getAddress(),
      await stockFactory.getAddress(),
      admin.address,
      managerConfig
    );
    await tradingPairManager.waitForDeployment();

    // Grant roles
    await tradingPairManager.connect(admin).grantRole(OPERATOR_ROLE, operator.address);
    await tradingPairManager
      .connect(admin)
      .grantRole(LIQUIDITY_MANAGER_ROLE, liquidityManager.address);

    // Grant necessary roles to manager in DEX
    await stockNGNDEX
      .connect(admin)
      .grantRole(
        ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE")),
        await tradingPairManager.getAddress()
      );
    await stockNGNDEX
      .connect(admin)
      .grantRole(
        ethers.keccak256(ethers.toUtf8Bytes("LIQUIDITY_PROVIDER_ROLE")),
        await tradingPairManager.getAddress()
      );

    // Authorize DEX and manager in NGN stablecoin
    await ngnStablecoin
      .connect(admin)
      .authorizeDEXContracts(
        [await stockNGNDEX.getAddress(), await tradingPairManager.getAddress()],
        [true, true]
      );

    // Mint initial tokens
    await ngnStablecoin
      .connect(admin)
      .mint(await tradingPairManager.getAddress(), ethers.parseEther("1000000"));
    await stockToken1
      .connect(admin)
      .mint(await tradingPairManager.getAddress(), ethers.parseEther("10000"));
    await stockToken2
      .connect(admin)
      .mint(await tradingPairManager.getAddress(), ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set the correct initial configuration", async function () {
      expect(await tradingPairManager.ngnToken()).to.equal(await ngnStablecoin.getAddress());
      expect(await tradingPairManager.dexContract()).to.equal(await stockNGNDEX.getAddress());
      expect(await tradingPairManager.stockFactory()).to.equal(await stockFactory.getAddress());

      const config = await tradingPairManager.config();
      expect(config.defaultFeeRate).to.equal(30);
      expect(config.defaultLiquidityTarget).to.equal(ethers.parseEther("100000"));
      expect(config.autoLiquidityEnabled).to.be.true;
    });

    it("Should grant admin roles correctly", async function () {
      expect(await tradingPairManager.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await tradingPairManager.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
      expect(await tradingPairManager.hasRole(LIQUIDITY_MANAGER_ROLE, liquidityManager.address)).to
        .be.true;
    });

    it("Should add current network configuration", async function () {
      const networkConfig = await tradingPairManager.getNetworkConfig(31337); // Hardhat chain ID
      expect(networkConfig.isSupported).to.be.true;
      expect(networkConfig.factoryAddress).to.equal(await stockFactory.getAddress());
    });
  });

  describe("Managed Pair Creation", function () {
    it("Should create a managed pair successfully", async function () {
      const initialNGN = ethers.parseEther("50000");
      const initialStock = ethers.parseEther("1000");
      const feeRate = 30;
      const targetLiquidity = ethers.parseEther("100000");

      await expect(
        tradingPairManager
          .connect(operator)
          .createManagedPair(
            await stockToken1.getAddress(),
            initialNGN,
            initialStock,
            feeRate,
            targetLiquidity
          )
      )
        .to.emit(tradingPairManager, "PairCreated")
        .withArgs(await stockToken1.getAddress(), "DANGCEM", initialNGN, initialStock, feeRate);

      const managedPair = await tradingPairManager.getManagedPair(await stockToken1.getAddress());
      expect(managedPair.isActive).to.be.true;
      expect(managedPair.symbol).to.equal("DANGCEM");
      expect(managedPair.companyName).to.equal("Dangote Cement Plc");
      expect(managedPair.targetLiquidityNGN).to.equal(targetLiquidity);

      // Check that trading pair was created in DEX
      const dexPair = await stockNGNDEX.getTradingPair(await stockToken1.getAddress());
      expect(dexPair.isActive).to.be.true;
    });

    it("Should not allow creating duplicate managed pairs", async function () {
      const initialNGN = ethers.parseEther("50000");
      const initialStock = ethers.parseEther("1000");

      // Create first pair
      await tradingPairManager
        .connect(operator)
        .createManagedPair(
          await stockToken1.getAddress(),
          initialNGN,
          initialStock,
          30,
          ethers.parseEther("100000")
        );

      // Try to create duplicate
      await expect(
        tradingPairManager
          .connect(operator)
          .createManagedPair(
            await stockToken1.getAddress(),
            initialNGN,
            initialStock,
            30,
            ethers.parseEther("100000")
          )
      ).to.be.revertedWithCustomError(tradingPairManager, "PairAlreadyExists");
    });

    it("Should support batch pair creation", async function () {
      const stockTokens = [await stockToken1.getAddress(), await stockToken2.getAddress()];
      const ngnAmounts = [ethers.parseEther("50000"), ethers.parseEther("40000")];
      const stockAmounts = [ethers.parseEther("1000"), ethers.parseEther("800")];
      const feeRates = [30, 30];
      const targetLiquidities = [ethers.parseEther("100000"), ethers.parseEther("80000")];

      await expect(
        tradingPairManager
          .connect(operator)
          .batchCreatePairs(stockTokens, ngnAmounts, stockAmounts, feeRates, targetLiquidities)
      )
        .to.emit(tradingPairManager, "BatchOperationCompleted")
        .withArgs("Batch pair creation", 2);

      // Check both pairs were created
      const pair1 = await tradingPairManager.getManagedPair(await stockToken1.getAddress());
      const pair2 = await tradingPairManager.getManagedPair(await stockToken2.getAddress());

      expect(pair1.isActive).to.be.true;
      expect(pair2.isActive).to.be.true;

      const stats = await tradingPairManager.getManagerStats();
      expect(stats.totalPairs).to.equal(2);
      expect(stats.activePairs).to.equal(2);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create multiple managed pairs
      await tradingPairManager
        .connect(operator)
        .batchCreatePairs(
          [await stockToken1.getAddress(), await stockToken2.getAddress()],
          [ethers.parseEther("50000"), ethers.parseEther("40000")],
          [ethers.parseEther("1000"), ethers.parseEther("800")],
          [30, 30],
          [ethers.parseEther("100000"), ethers.parseEther("80000")]
        );
    });

    it("Should return all managed tokens", async function () {
      const allTokens = await tradingPairManager.getAllManagedTokens();
      expect(allTokens.length).to.equal(2);
      expect(allTokens).to.include(await stockToken1.getAddress());
      expect(allTokens).to.include(await stockToken2.getAddress());
    });

    it("Should return token by symbol", async function () {
      const dangcemAddress = await tradingPairManager.getTokenBySymbol("DANGCEM");
      const mtnnAddress = await tradingPairManager.getTokenBySymbol("MTNN");

      expect(dangcemAddress).to.equal(await stockToken1.getAddress());
      expect(mtnnAddress).to.equal(await stockToken2.getAddress());
    });

    it("Should return manager statistics", async function () {
      const [totalPairs, totalLiquidity, , activePairs] =
        await tradingPairManager.getManagerStats();

      expect(totalPairs).to.equal(2);
      expect(activePairs).to.equal(2);
      expect(totalLiquidity).to.be.gt(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update configuration", async function () {
      const newConfig = {
        ...managerConfig,
        defaultFeeRate: 50,
        maxPairsPerBatch: 20,
        autoLiquidityEnabled: false,
      };

      await tradingPairManager.connect(admin).updateConfig(newConfig);

      const config = await tradingPairManager.config();
      expect(config.defaultFeeRate).to.equal(50);
      expect(config.maxPairsPerBatch).to.equal(20);
      expect(config.autoLiquidityEnabled).to.be.false;
    });

    it("Should allow pausing and unpausing", async function () {
      await tradingPairManager.connect(admin).pause();
      expect(await tradingPairManager.paused()).to.be.true;

      await tradingPairManager.connect(admin).unpause();
      expect(await tradingPairManager.paused()).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should not allow non-operator to create pairs", async function () {
      await expect(
        tradingPairManager
          .connect(user1)
          .createManagedPair(
            await stockToken1.getAddress(),
            ethers.parseEther("1000"),
            ethers.parseEther("100"),
            30,
            ethers.parseEther("50000")
          )
      ).to.be.revertedWithCustomError(tradingPairManager, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow non-admin to update configuration", async function () {
      await expect(
        tradingPairManager.connect(user1).updateConfig(managerConfig)
      ).to.be.revertedWithCustomError(tradingPairManager, "AccessControlUnauthorizedAccount");
    });
  });
});
