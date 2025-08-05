import { expect } from "chai";
import { ethers } from "hardhat";
import { StockNGNDEX, NGNStablecoin, NigerianStockToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StockNGNDEX", function () {
  let stockNGNDEX: StockNGNDEX;
  let ngnStablecoin: NGNStablecoin;
  let stockToken: NigerianStockToken;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let liquidityProvider: SignerWithAddress;
  let trader1: SignerWithAddress;
  let trader2: SignerWithAddress;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
  const LIQUIDITY_PROVIDER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LIQUIDITY_PROVIDER_ROLE"));

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
    defaultFeeRate: 30, // 0.3%
    maxPriceImpact: 500, // 5%
    minLiquidity: ethers.parseEther("1000"),
    swapDeadline: 1800,
    emergencyMode: false,
  };

  const stockMetadata = {
    symbol: "DANGCEM",
    companyName: "Dangote Cement Plc",
    sector: "Industrial Goods",
    totalShares: ethers.parseEther("17040000000"),
    marketCap: ethers.parseEther("5000000000"),
    isActive: true,
    lastUpdated: 0,
  };

  beforeEach(async function () {
    [admin, operator, liquidityProvider, trader1, trader2] = await ethers.getSigners();

    // Deploy NGN Stablecoin
    const NGNStablecoinFactory = await ethers.getContractFactory("NGNStablecoin");
    ngnStablecoin = await NGNStablecoinFactory.deploy(admin.address, ngnConfig);
    await ngnStablecoin.waitForDeployment();

    // Deploy Stock Token
    const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockToken");
    stockToken = await NigerianStockTokenFactory.deploy(
      "Dangote Cement Token",
      "DANGCEM",
      ethers.parseEther("1000000"), // 1M initial supply
      stockMetadata,
      admin.address
    );
    await stockToken.waitForDeployment();

    // Deploy DEX
    const StockNGNDEXFactory = await ethers.getContractFactory("StockNGNDEX");
    stockNGNDEX = await StockNGNDEXFactory.deploy(
      await ngnStablecoin.getAddress(),
      admin.address,
      dexConfig
    );
    await stockNGNDEX.waitForDeployment();

    // Grant roles
    await stockNGNDEX.connect(admin).grantRole(OPERATOR_ROLE, operator.address);
    await stockNGNDEX.connect(admin).grantRole(LIQUIDITY_PROVIDER_ROLE, liquidityProvider.address);

    // Authorize DEX in NGN stablecoin
    await ngnStablecoin
      .connect(admin)
      .authorizeDEXContracts([await stockNGNDEX.getAddress()], [true]);

    // Mint initial tokens
    await ngnStablecoin
      .connect(admin)
      .mint(liquidityProvider.address, ethers.parseEther("1000000"));
    await ngnStablecoin.connect(admin).mint(trader1.address, ethers.parseEther("100000"));
    await ngnStablecoin.connect(admin).mint(trader2.address, ethers.parseEther("100000"));

    await stockToken.connect(admin).mint(liquidityProvider.address, ethers.parseEther("10000"));
    await stockToken.connect(admin).mint(trader1.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the correct initial configuration", async function () {
      expect(await stockNGNDEX.ngnToken()).to.equal(await ngnStablecoin.getAddress());

      const config = await stockNGNDEX.config();
      expect(config.defaultFeeRate).to.equal(30);
      expect(config.maxPriceImpact).to.equal(500);
      expect(config.emergencyMode).to.be.false;
    });

    it("Should grant admin roles correctly", async function () {
      expect(await stockNGNDEX.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await stockNGNDEX.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
      expect(await stockNGNDEX.hasRole(LIQUIDITY_PROVIDER_ROLE, liquidityProvider.address)).to.be
        .true;
    });
  });

  describe("Trading Pair Creation", function () {
    it("Should create a trading pair successfully", async function () {
      const initialNGN = ethers.parseEther("50000");
      const initialStock = ethers.parseEther("1000");
      const feeRate = 30;

      // Approve tokens
      await ngnStablecoin.connect(operator).approve(await stockNGNDEX.getAddress(), initialNGN);
      await stockToken.connect(admin).mint(operator.address, initialStock);
      await stockToken.connect(operator).approve(await stockNGNDEX.getAddress(), initialStock);

      await expect(
        stockNGNDEX
          .connect(operator)
          .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, feeRate)
      )
        .to.emit(stockNGNDEX, "TradingPairCreated")
        .withArgs(await stockToken.getAddress(), initialNGN, initialStock, feeRate);

      const pair = await stockNGNDEX.getTradingPair(await stockToken.getAddress());
      expect(pair.isActive).to.be.true;
      expect(pair.ngnReserve).to.equal(initialNGN);
      expect(pair.stockReserve).to.equal(initialStock);
      expect(pair.feeRate).to.equal(feeRate);
    });

    it("Should not allow creating duplicate trading pairs", async function () {
      const initialNGN = ethers.parseEther("50000");
      const initialStock = ethers.parseEther("1000");

      // Create first pair
      await ngnStablecoin.connect(operator).approve(await stockNGNDEX.getAddress(), initialNGN);
      await stockToken.connect(admin).mint(operator.address, initialStock);
      await stockToken.connect(operator).approve(await stockNGNDEX.getAddress(), initialStock);

      await stockNGNDEX
        .connect(operator)
        .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, 30);

      // Try to create duplicate
      await expect(
        stockNGNDEX
          .connect(operator)
          .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, 30)
      ).to.be.revertedWithCustomError(stockNGNDEX, "TradingPairExists");
    });

    it("Should not allow non-operator to create trading pairs", async function () {
      const initialNGN = ethers.parseEther("50000");
      const initialStock = ethers.parseEther("1000");

      await expect(
        stockNGNDEX
          .connect(trader1)
          .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, 30)
      ).to.be.revertedWithCustomError(stockNGNDEX, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Liquidity Management", function () {
    beforeEach(async function () {
      // Create a trading pair first
      const initialNGN = ethers.parseEther("50000");
      const initialStock = ethers.parseEther("1000");

      await ngnStablecoin
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialNGN);
      await stockToken
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialStock);

      await stockNGNDEX
        .connect(operator)
        .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, 30);
    });

    it("Should add liquidity successfully", async function () {
      const ngnAmount = ethers.parseEther("10000");
      const stockAmount = ethers.parseEther("200");

      await ngnStablecoin
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), ngnAmount);
      await stockToken
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), stockAmount);

      await expect(
        stockNGNDEX.connect(liquidityProvider).addLiquidity(
          await stockToken.getAddress(),
          ngnAmount,
          stockAmount,
          0 // min liquidity out
        )
      ).to.emit(stockNGNDEX, "LiquidityAdded");

      const position = await stockNGNDEX.getLiquidityPosition(
        liquidityProvider.address,
        await stockToken.getAddress()
      );
      expect(position.liquidityTokens).to.be.gt(0);
    });

    it("Should remove liquidity successfully", async function () {
      const position = await stockNGNDEX.getLiquidityPosition(
        liquidityProvider.address,
        await stockToken.getAddress()
      );
      const liquidityToRemove = position.liquidityTokens / 2n;

      const ngnBalanceBefore = await ngnStablecoin.balanceOf(liquidityProvider.address);
      const stockBalanceBefore = await stockToken.balanceOf(liquidityProvider.address);

      await expect(
        stockNGNDEX.connect(liquidityProvider).removeLiquidity(
          await stockToken.getAddress(),
          liquidityToRemove,
          0, // min NGN out
          0 // min stock out
        )
      ).to.emit(stockNGNDEX, "LiquidityRemoved");

      const ngnBalanceAfter = await ngnStablecoin.balanceOf(liquidityProvider.address);
      const stockBalanceAfter = await stockToken.balanceOf(liquidityProvider.address);

      expect(ngnBalanceAfter).to.be.gt(ngnBalanceBefore);
      expect(stockBalanceAfter).to.be.gt(stockBalanceBefore);
    });
  });

  describe("Swapping", function () {
    beforeEach(async function () {
      // Create a trading pair with substantial liquidity
      const initialNGN = ethers.parseEther("100000");
      const initialStock = ethers.parseEther("2000");

      await ngnStablecoin
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialNGN);
      await stockToken
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialStock);

      await stockNGNDEX
        .connect(operator)
        .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, 30);
    });

    it("Should swap NGN for stock tokens", async function () {
      const ngnAmountIn = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Get quote first
      const [expectedStockOut] = await stockNGNDEX.getQuoteNGNToStock(
        await stockToken.getAddress(),
        ngnAmountIn
      );

      const minStockOut = (expectedStockOut * 95n) / 100n; // 5% slippage tolerance

      const stockBalanceBefore = await stockToken.balanceOf(trader1.address);
      const ngnBalanceBefore = await ngnStablecoin.balanceOf(trader1.address);

      await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), ngnAmountIn);

      await expect(
        stockNGNDEX
          .connect(trader1)
          .swapNGNForStock(await stockToken.getAddress(), ngnAmountIn, minStockOut, deadline)
      ).to.emit(stockNGNDEX, "SwapExecuted");

      const stockBalanceAfter = await stockToken.balanceOf(trader1.address);
      const ngnBalanceAfter = await ngnStablecoin.balanceOf(trader1.address);

      expect(stockBalanceAfter).to.be.gt(stockBalanceBefore);
      expect(ngnBalanceAfter).to.equal(ngnBalanceBefore - ngnAmountIn);
    });

    it("Should swap stock tokens for NGN", async function () {
      const stockAmountIn = ethers.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Get quote first
      const [expectedNGNOut] = await stockNGNDEX.getQuoteStockToNGN(
        await stockToken.getAddress(),
        stockAmountIn
      );

      const minNGNOut = (expectedNGNOut * 95n) / 100n; // 5% slippage tolerance

      const stockBalanceBefore = await stockToken.balanceOf(trader1.address);
      const ngnBalanceBefore = await ngnStablecoin.balanceOf(trader1.address);

      await stockToken.connect(trader1).approve(await stockNGNDEX.getAddress(), stockAmountIn);

      await expect(
        stockNGNDEX
          .connect(trader1)
          .swapStockForNGN(await stockToken.getAddress(), stockAmountIn, minNGNOut, deadline)
      ).to.emit(stockNGNDEX, "SwapExecuted");

      const stockBalanceAfter = await stockToken.balanceOf(trader1.address);
      const ngnBalanceAfter = await ngnStablecoin.balanceOf(trader1.address);

      expect(stockBalanceAfter).to.equal(stockBalanceBefore - stockAmountIn);
      expect(ngnBalanceAfter).to.be.gt(ngnBalanceBefore);
    });

    it("Should revert on excessive slippage", async function () {
      const ngnAmountIn = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Get quote
      const [expectedStockOut] = await stockNGNDEX.getQuoteNGNToStock(
        await stockToken.getAddress(),
        ngnAmountIn
      );

      // Set unrealistic minimum (higher than expected)
      const unrealisticMin = expectedStockOut * 2n;

      await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), ngnAmountIn);

      await expect(
        stockNGNDEX
          .connect(trader1)
          .swapNGNForStock(await stockToken.getAddress(), ngnAmountIn, unrealisticMin, deadline)
      ).to.be.revertedWithCustomError(stockNGNDEX, "SlippageExceeded");
    });

    it("Should revert on expired deadline", async function () {
      const ngnAmountIn = ethers.parseEther("1000");
      const expiredDeadline = Math.floor(Date.now() / 1000) - 1; // Past deadline

      await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), ngnAmountIn);

      await expect(
        stockNGNDEX
          .connect(trader1)
          .swapNGNForStock(await stockToken.getAddress(), ngnAmountIn, 0, expiredDeadline)
      ).to.be.revertedWithCustomError(stockNGNDEX, "DeadlineExceeded");
    });

    it("Should enforce price impact limits", async function () {
      // Try to swap a very large amount that would cause high price impact
      const largeAmount = ethers.parseEther("50000"); // 50% of liquidity
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      await ngnStablecoin.connect(admin).mint(trader1.address, largeAmount);
      await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), largeAmount);

      await expect(
        stockNGNDEX
          .connect(trader1)
          .swapNGNForStock(await stockToken.getAddress(), largeAmount, 0, deadline)
      ).to.be.revertedWithCustomError(stockNGNDEX, "ExcessivePriceImpact");
    });
  });

  describe("Price Tracking", function () {
    beforeEach(async function () {
      // Create a trading pair
      const initialNGN = ethers.parseEther("100000");
      const initialStock = ethers.parseEther("2000");

      await ngnStablecoin
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialNGN);
      await stockToken
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialStock);

      await stockNGNDEX
        .connect(operator)
        .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, 30);
    });

    it("Should track price correctly", async function () {
      const currentPrice = await stockNGNDEX.getCurrentPrice(await stockToken.getAddress());
      expect(currentPrice).to.be.gt(0);

      // Price should be approximately 50 NGN per stock token (100000/2000)
      const expectedPrice = ethers.parseEther("50");
      const tolerance = ethers.parseEther("1"); // 1 NGN tolerance

      expect(currentPrice).to.be.closeTo(expectedPrice, tolerance);
    });

    it("Should update price after swaps", async function () {
      const priceBefore = await stockNGNDEX.getCurrentPrice(await stockToken.getAddress());

      // Execute a swap
      const ngnAmountIn = ethers.parseEther("5000");
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), ngnAmountIn);
      await stockNGNDEX
        .connect(trader1)
        .swapNGNForStock(await stockToken.getAddress(), ngnAmountIn, 0, deadline);

      const priceAfter = await stockNGNDEX.getCurrentPrice(await stockToken.getAddress());

      // Price should increase after buying stock tokens with NGN
      expect(priceAfter).to.be.gt(priceBefore);
    });

    it("Should maintain price history", async function () {
      // Execute multiple swaps to generate price history
      for (let i = 0; i < 3; i++) {
        const ngnAmountIn = ethers.parseEther("1000");
        const deadline = Math.floor(Date.now() / 1000) + 1800;

        await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), ngnAmountIn);
        await stockNGNDEX
          .connect(trader1)
          .swapNGNForStock(await stockToken.getAddress(), ngnAmountIn, 0, deadline);
      }

      const priceHistory = await stockNGNDEX.getPriceHistory(await stockToken.getAddress());
      expect(priceHistory.length).to.be.gte(3);
    });
  });

  describe("Fee Collection", function () {
    beforeEach(async function () {
      // Create a trading pair
      const initialNGN = ethers.parseEther("100000");
      const initialStock = ethers.parseEther("2000");

      await ngnStablecoin
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialNGN);
      await stockToken
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialStock);

      await stockNGNDEX.connect(operator).createTradingPair(
        await stockToken.getAddress(),
        initialNGN,
        initialStock,
        30 // 0.3% fee
      );
    });

    it("Should collect fees on swaps", async function () {
      const ngnAmountIn = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      const feesBefore = await stockNGNDEX.collectedFees(await stockToken.getAddress());

      await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), ngnAmountIn);
      await stockNGNDEX
        .connect(trader1)
        .swapNGNForStock(await stockToken.getAddress(), ngnAmountIn, 0, deadline);

      const feesAfter = await stockNGNDEX.collectedFees(await stockToken.getAddress());
      expect(feesAfter).to.be.gt(feesBefore);

      // Fee should be approximately 0.3% of input amount
      const expectedFee = (ngnAmountIn * 30n) / 10000n;
      expect(feesAfter).to.be.closeTo(expectedFee, ethers.parseEther("0.1"));
    });

    it("Should allow admin to withdraw fees", async function () {
      // Generate some fees first
      const ngnAmountIn = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      await ngnStablecoin.connect(trader1).approve(await stockNGNDEX.getAddress(), ngnAmountIn);
      await stockNGNDEX
        .connect(trader1)
        .swapNGNForStock(await stockToken.getAddress(), ngnAmountIn, 0, deadline);

      const collectedFees = await stockNGNDEX.collectedFees(await stockToken.getAddress());
      const adminBalanceBefore = await ngnStablecoin.balanceOf(admin.address);

      await stockNGNDEX.connect(admin).withdrawFees(await stockToken.getAddress(), admin.address);

      const adminBalanceAfter = await ngnStablecoin.balanceOf(admin.address);
      expect(adminBalanceAfter).to.equal(adminBalanceBefore + collectedFees);
      expect(await stockNGNDEX.collectedFees(await stockToken.getAddress())).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update DEX configuration", async function () {
      const newConfig = {
        defaultFeeRate: 50, // 0.5%
        maxPriceImpact: 300, // 3%
        minLiquidity: ethers.parseEther("500"),
        swapDeadline: 3600,
        emergencyMode: true,
      };

      await stockNGNDEX.connect(admin).updateDEXConfig(newConfig);

      const config = await stockNGNDEX.config();
      expect(config.defaultFeeRate).to.equal(50);
      expect(config.maxPriceImpact).to.equal(300);
      expect(config.emergencyMode).to.be.true;
    });

    it("Should allow pausing and unpausing", async function () {
      await stockNGNDEX.connect(admin).pause();
      expect(await stockNGNDEX.paused()).to.be.true;

      // Operations should be paused
      await expect(
        stockNGNDEX
          .connect(operator)
          .createTradingPair(
            await stockToken.getAddress(),
            ethers.parseEther("1000"),
            ethers.parseEther("100"),
            30
          )
      ).to.be.revertedWithCustomError(stockNGNDEX, "EnforcedPause");

      await stockNGNDEX.connect(admin).unpause();
      expect(await stockNGNDEX.paused()).to.be.false;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create a trading pair
      const initialNGN = ethers.parseEther("100000");
      const initialStock = ethers.parseEther("2000");

      await ngnStablecoin
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialNGN);
      await stockToken
        .connect(liquidityProvider)
        .approve(await stockNGNDEX.getAddress(), initialStock);

      await stockNGNDEX
        .connect(operator)
        .createTradingPair(await stockToken.getAddress(), initialNGN, initialStock, 30);
    });

    it("Should return accurate swap quotes", async function () {
      const ngnAmountIn = ethers.parseEther("1000");

      const [stockAmountOut, fee, priceImpact] = await stockNGNDEX.getQuoteNGNToStock(
        await stockToken.getAddress(),
        ngnAmountIn
      );

      expect(stockAmountOut).to.be.gt(0);
      expect(fee).to.be.gt(0);
      expect(priceImpact).to.be.gt(0);

      // Fee should be 0.3% of input
      const expectedFee = (ngnAmountIn * 30n) / 10000n;
      expect(fee).to.equal(expectedFee);
    });

    it("Should return DEX statistics", async function () {
      const [totalPairs, , , totalLiquidity] = await stockNGNDEX.getDEXStats();

      expect(totalPairs).to.equal(1);
      expect(totalLiquidity).to.be.gt(0);
    });

    it("Should return all stock tokens", async function () {
      const allTokens = await stockNGNDEX.getAllStockTokens();
      expect(allTokens.length).to.equal(1);
      expect(allTokens[0]).to.equal(await stockToken.getAddress());
    });
  });
});
