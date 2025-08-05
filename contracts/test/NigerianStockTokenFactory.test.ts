import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NigerianStockTokenFactory", function () {
  async function deployFactoryFixture() {
    const [owner, admin, deployer, user1] = await ethers.getSigners();

    const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockTokenFactory");
    const factory = await NigerianStockTokenFactory.deploy(admin.address);
    await factory.waitForDeployment();

    return { factory, owner, admin, deployer, user1 };
  }

  const sampleStockMetadata = {
    symbol: "DANGCEM",
    companyName: "Dangote Cement Plc",
    sector: "Industrial Goods",
    totalShares: ethers.parseEther("17040000000"),
    marketCap: 7710000000000n,
    isActive: true,
    lastUpdated: Math.floor(Date.now() / 1000),
  };

  describe("Deployment", function () {
    it("Should deploy with correct admin", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      const ADMIN_ROLE = await factory.ADMIN_ROLE();
      expect(await factory.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should revert if admin address is zero", async function () {
      const NigerianStockTokenFactory = await ethers.getContractFactory(
        "NigerianStockTokenFactory"
      );

      await expect(
        NigerianStockTokenFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(NigerianStockTokenFactory, "ZeroAddress");
    });

    it("Should initialize with zero deployed tokens", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const stats = await factory.getFactoryStats();
      expect(stats._totalDeployedTokens).to.equal(0);
      expect(stats._totalMarketCap).to.equal(0);
      expect(stats._totalSymbols).to.equal(0);
    });
  });

  describe("Token Deployment", function () {
    it("Should deploy a stock token successfully", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      const tx = await factory
        .connect(admin)
        .deployStockToken(
          "Dangote Cement Token",
          "DANGCEM",
          ethers.parseEther("1000000"),
          sampleStockMetadata,
          admin.address
        );

      await expect(tx)
        .to.emit(factory, "StockTokenDeployed")
        .withArgs(
          "DANGCEM",
          await factory.getTokenAddress("DANGCEM"),
          "Dangote Cement Token",
          ethers.parseEther("1000000"),
          admin.address
        );

      // Verify token was registered
      const tokenAddress = await factory.getTokenAddress("DANGCEM");
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
      expect(await factory.isValidToken(tokenAddress)).to.be.true;
    });

    it("Should prevent duplicate token deployment", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      // Deploy first token
      await factory
        .connect(admin)
        .deployStockToken(
          "Dangote Cement Token",
          "DANGCEM",
          ethers.parseEther("1000000"),
          sampleStockMetadata,
          admin.address
        );

      // Try to deploy duplicate
      await expect(
        factory
          .connect(admin)
          .deployStockToken(
            "Dangote Cement Token 2",
            "DANGCEM",
            ethers.parseEther("2000000"),
            sampleStockMetadata,
            admin.address
          )
      ).to.be.revertedWithCustomError(factory, "TokenAlreadyExists");
    });

    it("Should prevent non-deployer from deploying tokens", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory
          .connect(user1)
          .deployStockToken(
            "Dangote Cement Token",
            "DANGCEM",
            ethers.parseEther("1000000"),
            sampleStockMetadata,
            user1.address
          )
      ).to.be.reverted;
    });

    it("Should update factory statistics after deployment", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await factory
        .connect(admin)
        .deployStockToken(
          "Dangote Cement Token",
          "DANGCEM",
          ethers.parseEther("1000000"),
          sampleStockMetadata,
          admin.address
        );

      const stats = await factory.getFactoryStats();
      expect(stats._totalDeployedTokens).to.equal(1);
      expect(stats._totalMarketCap).to.equal(sampleStockMetadata.marketCap);
      expect(stats._totalSymbols).to.equal(1);
    });
  });

  describe("Batch Deployment", function () {
    it("Should deploy multiple tokens in batch", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      const tokenData = [
        {
          name: "Dangote Cement Token",
          symbol: "DANGCEM",
          initialSupply: ethers.parseEther("1000000"),
          stockMetadata: sampleStockMetadata,
          tokenAdmin: admin.address,
        },
        {
          name: "MTN Nigeria Token",
          symbol: "MTNN",
          initialSupply: ethers.parseEther("2000000"),
          stockMetadata: {
            ...sampleStockMetadata,
            symbol: "MTNN",
            companyName: "MTN Nigeria Communications Plc",
            sector: "Telecommunications",
          },
          tokenAdmin: admin.address,
        },
      ];

      const tx = await factory.connect(admin).batchDeployStockTokens(tokenData);

      await expect(tx).to.emit(factory, "BatchDeploymentCompleted").withArgs(2);

      // Verify both tokens were deployed
      expect(await factory.getTokenAddress("DANGCEM")).to.not.equal(ethers.ZeroAddress);
      expect(await factory.getTokenAddress("MTNN")).to.not.equal(ethers.ZeroAddress);

      const stats = await factory.getFactoryStats();
      expect(stats._totalDeployedTokens).to.equal(2);
    });

    it("Should revert batch deployment with empty array", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await expect(factory.connect(admin).batchDeployStockTokens([])).to.be.revertedWithCustomError(
        factory,
        "InvalidArrayLength"
      );
    });
  });

  describe("Token Management", function () {
    it("Should return correct token information", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await factory
        .connect(admin)
        .deployStockToken(
          "Dangote Cement Token",
          "DANGCEM",
          ethers.parseEther("1000000"),
          sampleStockMetadata,
          admin.address
        );

      const tokenInfo = await factory.getTokenInfo("DANGCEM");
      expect(tokenInfo.symbol).to.equal(sampleStockMetadata.symbol);
      expect(tokenInfo.companyName).to.equal(sampleStockMetadata.companyName);
      expect(tokenInfo.sector).to.equal(sampleStockMetadata.sector);
    });

    it("Should return all deployed symbols", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      // Deploy two tokens
      await factory
        .connect(admin)
        .deployStockToken(
          "Dangote Cement Token",
          "DANGCEM",
          ethers.parseEther("1000000"),
          sampleStockMetadata,
          admin.address
        );

      const mtnnMetadata = { ...sampleStockMetadata, symbol: "MTNN" };
      await factory
        .connect(admin)
        .deployStockToken(
          "MTN Nigeria Token",
          "MTNN",
          ethers.parseEther("2000000"),
          mtnnMetadata,
          admin.address
        );

      const symbols = await factory.getAllDeployedSymbols();
      expect(symbols).to.have.lengthOf(2);
      expect(symbols).to.include("DANGCEM");
      expect(symbols).to.include("MTNN");
    });

    it("Should support paginated token listing", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      // Deploy multiple tokens
      const symbols = ["DANGCEM", "MTNN", "ZENITHBANK"];
      for (const symbol of symbols) {
        const metadata = { ...sampleStockMetadata, symbol };
        await factory
          .connect(admin)
          .deployStockToken(
            `${symbol} Token`,
            symbol,
            ethers.parseEther("1000000"),
            metadata,
            admin.address
          );
      }

      // Test pagination
      const [paginatedSymbols, addresses] = await factory.getDeployedTokensPaginated(0, 2);
      expect(paginatedSymbols).to.have.lengthOf(2);
      expect(addresses).to.have.lengthOf(2);

      // Verify addresses are not zero
      for (const address of addresses) {
        expect(address).to.not.equal(ethers.ZeroAddress);
      }
    });
  });

  describe("Market Cap Management", function () {
    it("Should allow admin to update token market cap", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await factory
        .connect(admin)
        .deployStockToken(
          "Dangote Cement Token",
          "DANGCEM",
          ethers.parseEther("1000000"),
          sampleStockMetadata,
          admin.address
        );

      // Get the token address and grant factory admin role on the token
      const tokenAddress = await factory.getTokenAddress("DANGCEM");
      const token = await ethers.getContractAt("NigerianStockToken", tokenAddress);
      const ADMIN_ROLE = await token.ADMIN_ROLE();
      await token.connect(admin).grantRole(ADMIN_ROLE, await factory.getAddress());

      const newMarketCap = 8000000000000n; // 8 trillion NGN
      await factory.connect(admin).updateTokenMarketCap("DANGCEM", newMarketCap);

      const tokenInfo = await factory.getTokenInfo("DANGCEM");
      expect(tokenInfo.marketCap).to.equal(newMarketCap);

      const stats = await factory.getFactoryStats();
      expect(stats._totalMarketCap).to.equal(newMarketCap);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow pauser to pause and unpause factory", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await factory.connect(admin).pause();
      expect(await factory.paused()).to.be.true;

      await factory.connect(admin).unpause();
      expect(await factory.paused()).to.be.false;
    });

    it("Should prevent token deployment when paused", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await factory.connect(admin).pause();

      await expect(
        factory
          .connect(admin)
          .deployStockToken(
            "Dangote Cement Token",
            "DANGCEM",
            ethers.parseEther("1000000"),
            sampleStockMetadata,
            admin.address
          )
      ).to.be.reverted;
    });
  });

  describe("Registry Management", function () {
    it("Should allow admin to remove token from registry", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await factory
        .connect(admin)
        .deployStockToken(
          "Dangote Cement Token",
          "DANGCEM",
          ethers.parseEther("1000000"),
          sampleStockMetadata,
          admin.address
        );

      const tokenAddress = await factory.getTokenAddress("DANGCEM");
      expect(await factory.isValidToken(tokenAddress)).to.be.true;

      await factory.connect(admin).removeTokenFromRegistry("DANGCEM");

      expect(await factory.isValidToken(tokenAddress)).to.be.false;

      await expect(factory.getTokenAddress("DANGCEM")).to.be.revertedWithCustomError(
        factory,
        "TokenNotFound"
      );
    });
  });
});
