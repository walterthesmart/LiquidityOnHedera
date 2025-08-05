import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NigerianStockToken", function () {
  // Test fixtures
  async function deployTokenFixture() {
    const [owner, admin, user1, user2, minter, burner, pauser] = await ethers.getSigners();

    const stockMetadata = {
      symbol: "DANGCEM",
      companyName: "Dangote Cement Plc",
      sector: "Industrial Goods",
      totalShares: ethers.parseEther("17040000000"), // 17.04 billion
      marketCap: 7710000000000n, // 7.71 trillion NGN
      isActive: true,
      lastUpdated: Math.floor(Date.now() / 1000),
    };

    const NigerianStockToken = await ethers.getContractFactory("NigerianStockToken");
    const token = await NigerianStockToken.deploy(
      "Dangote Cement Token",
      "DANGCEM",
      ethers.parseEther("1000000"), // 1M initial supply
      stockMetadata,
      admin.address
    );

    await token.waitForDeployment();

    return {
      token,
      owner,
      admin,
      user1,
      user2,
      minter,
      burner,
      pauser,
      stockMetadata,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial parameters", async function () {
      const { token, admin, stockMetadata } = await loadFixture(deployTokenFixture);

      expect(await token.name()).to.equal("Dangote Cement Token");
      expect(await token.symbol()).to.equal("DANGCEM");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000"));
      expect(await token.balanceOf(admin.address)).to.equal(ethers.parseEther("1000000"));

      const storedMetadata = await token.getStockInfo();
      expect(storedMetadata.symbol).to.equal(stockMetadata.symbol);
      expect(storedMetadata.companyName).to.equal(stockMetadata.companyName);
      expect(storedMetadata.sector).to.equal(stockMetadata.sector);
      expect(storedMetadata.isActive).to.equal(stockMetadata.isActive);
    });

    it("Should set up roles correctly", async function () {
      const { token, admin } = await loadFixture(deployTokenFixture);

      const ADMIN_ROLE = await token.ADMIN_ROLE();
      const MINTER_ROLE = await token.MINTER_ROLE();
      const BURNER_ROLE = await token.BURNER_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();

      expect(await token.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(BURNER_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
    });

    it("Should revert if admin address is zero", async function () {
      const NigerianStockToken = await ethers.getContractFactory("NigerianStockToken");

      const stockMetadata = {
        symbol: "TEST",
        companyName: "Test Company",
        sector: "Test",
        totalShares: 1000000n,
        marketCap: 1000000n,
        isActive: true,
        lastUpdated: Math.floor(Date.now() / 1000),
      };

      await expect(
        NigerianStockToken.deploy(
          "Test Token",
          "TEST",
          ethers.parseEther("1000000"),
          stockMetadata,
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(NigerianStockToken, "ZeroAddress");
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to grant roles", async function () {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);

      const MINTER_ROLE = await token.MINTER_ROLE();

      await token.connect(admin).grantRole(MINTER_ROLE, user1.address);
      expect(await token.hasRole(MINTER_ROLE, user1.address)).to.be.true;
    });

    it("Should prevent non-admin from granting roles", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);

      const MINTER_ROLE = await token.MINTER_ROLE();

      await expect(token.connect(user1).grantRole(MINTER_ROLE, user2.address)).to.be.reverted;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);

      const mintAmount = ethers.parseEther("1000");
      await token.connect(admin).mint(user1.address, mintAmount);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should prevent non-minter from minting", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);

      const mintAmount = ethers.parseEther("1000");
      await expect(token.connect(user1).mint(user2.address, mintAmount)).to.be.reverted;
    });

    it("Should revert minting to zero address", async function () {
      const { token, admin } = await loadFixture(deployTokenFixture);

      const mintAmount = ethers.parseEther("1000");
      await expect(
        token.connect(admin).mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWithCustomError(token, "ZeroAddress");
    });

    it("Should revert minting zero amount", async function () {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);

      await expect(token.connect(admin).mint(user1.address, 0)).to.be.revertedWithCustomError(
        token,
        "InvalidAmount"
      );
    });
  });

  describe("Burning", function () {
    it("Should allow burner to burn tokens", async function () {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);

      // First mint some tokens to user1
      const mintAmount = ethers.parseEther("1000");
      await token.connect(admin).mint(user1.address, mintAmount);

      // User1 approves admin to burn their tokens
      await token.connect(user1).approve(admin.address, mintAmount);

      // Admin burns the tokens
      const burnAmount = ethers.parseEther("500");
      await token.connect(admin).burnFrom(user1.address, burnAmount);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should prevent burning more than balance", async function () {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);

      const mintAmount = ethers.parseEther("1000");
      await token.connect(admin).mint(user1.address, mintAmount);
      await token.connect(user1).approve(admin.address, ethers.parseEther("2000"));

      const burnAmount = ethers.parseEther("1500"); // More than balance
      await expect(
        token.connect(admin).burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(token, "InsufficientBalance");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow pauser to pause and unpause", async function () {
      const { token, admin } = await loadFixture(deployTokenFixture);

      await token.connect(admin).pause();
      expect(await token.paused()).to.be.true;

      await token.connect(admin).unpause();
      expect(await token.paused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      const { token, admin, user1, user2 } = await loadFixture(deployTokenFixture);

      // Mint some tokens to user1
      await token.connect(admin).mint(user1.address, ethers.parseEther("1000"));

      // Pause the contract
      await token.connect(admin).pause();

      // Try to transfer - should fail
      await expect(token.connect(user1).transfer(user2.address, ethers.parseEther("100"))).to.be
        .reverted;
    });
  });

  describe("Batch Transfer", function () {
    it("Should allow batch transfers", async function () {
      const { token, admin, user1, user2 } = await loadFixture(deployTokenFixture);

      // Mint tokens to admin for distribution
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("500"), ethers.parseEther("300")];

      await token.connect(admin).batchTransfer(recipients, amounts);

      expect(await token.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await token.balanceOf(user2.address)).to.equal(amounts[1]);
    });

    it("Should revert batch transfer with mismatched arrays", async function () {
      const { token, admin, user1, user2 } = await loadFixture(deployTokenFixture);

      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("500")]; // Mismatched length

      await expect(
        token.connect(admin).batchTransfer(recipients, amounts)
      ).to.be.revertedWithCustomError(token, "InvalidArrayLength");
    });
  });

  describe("Transfer Limits", function () {
    it("Should enforce minimum transfer amount", async function () {
      const { token, admin, user1, user2 } = await loadFixture(deployTokenFixture);

      // Mint tokens to user1
      await token.connect(admin).mint(user1.address, ethers.parseEther("1000"));

      // Try to transfer less than minimum (1 token)
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(token, "TransferLimitExceeded");
    });

    it("Should allow admin to update transfer limits", async function () {
      const { token, admin } = await loadFixture(deployTokenFixture);

      const newMin = ethers.parseEther("10");
      const newMax = ethers.parseEther("100000");

      await token.connect(admin).setTransferLimits(newMin, newMax);

      expect(await token.minTransferAmount()).to.equal(newMin);
      expect(await token.maxTransferAmount()).to.equal(newMax);
    });
  });

  describe("Blacklist Functionality", function () {
    it("Should allow admin to blacklist addresses", async function () {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);

      await token.connect(admin).setBlacklist(user1.address, true);
      expect(await token.blacklisted(user1.address)).to.be.true;
    });

    it("Should prevent blacklisted addresses from transferring", async function () {
      const { token, admin, user1, user2 } = await loadFixture(deployTokenFixture);

      // Mint tokens to user1
      await token.connect(admin).mint(user1.address, ethers.parseEther("1000"));

      // Blacklist user1
      await token.connect(admin).setBlacklist(user1.address, true);

      // Try to transfer - should fail
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "BlacklistedAddress");
    });
  });

  describe("Stock Metadata", function () {
    it("Should allow admin to update stock metadata", async function () {
      const { token, admin } = await loadFixture(deployTokenFixture);

      const newMetadata = {
        symbol: "DANGCEM",
        companyName: "Dangote Cement Plc Updated",
        sector: "Industrial Goods Updated",
        totalShares: ethers.parseEther("20000000000"),
        marketCap: 8000000000000n,
        isActive: true,
        lastUpdated: Math.floor(Date.now() / 1000),
      };

      await token.connect(admin).updateStockMetadata(newMetadata);

      const storedMetadata = await token.getStockInfo();
      expect(storedMetadata.companyName).to.equal(newMetadata.companyName);
      expect(storedMetadata.sector).to.equal(newMetadata.sector);
      expect(storedMetadata.marketCap).to.equal(newMetadata.marketCap);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow admin to perform emergency withdrawal", async function () {
      const { token, admin } = await loadFixture(deployTokenFixture);

      // Send some ETH to the contract
      await admin.sendTransaction({
        to: await token.getAddress(),
        value: ethers.parseEther("1"),
      });

      const initialBalance = await ethers.provider.getBalance(admin.address);

      // Emergency withdraw ETH
      await token.connect(admin).emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1"));

      // Check that ETH was withdrawn (accounting for gas costs)
      const finalBalance = await ethers.provider.getBalance(admin.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});
