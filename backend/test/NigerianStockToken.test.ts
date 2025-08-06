import { expect } from "chai";
import { ethers } from "hardhat";
import { NigerianStockToken, NigerianStockFactory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("NigerianStockToken", function () {
  let token: NigerianStockToken;
  let factory: NigerianStockFactory;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const TOKEN_NAME = "Dangote Cement Token";
  const TOKEN_SYMBOL = "DANGCEM";
  const STOCK_SYMBOL = "DANGCEM";
  const COMPANY_NAME = "Dangote Cement Plc";
  const MAX_SUPPLY = ethers.parseEther("17040000000"); // 17.04 billion
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy factory
    const NigerianStockFactory = await ethers.getContractFactory("NigerianStockFactory");
    factory = await NigerianStockFactory.deploy();
    await factory.waitForDeployment();

    // Deploy token through factory
    await factory.deployStockToken(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      STOCK_SYMBOL,
      COMPANY_NAME,
      MAX_SUPPLY,
      INITIAL_SUPPLY,
      owner.address
    );

    const tokenAddress = await factory.getTokenAddress(STOCK_SYMBOL);
    token = await ethers.getContractAt("NigerianStockToken", tokenAddress);
  });

  describe("Deployment", function () {
    it("Should set the correct token details", async function () {
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await token.stockSymbol()).to.equal(STOCK_SYMBOL);
      expect(await token.companyName()).to.equal(COMPANY_NAME);
      expect(await token.maxSupply()).to.equal(MAX_SUPPLY);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.decimals()).to.equal(18);
    });

    it("Should assign initial supply to owner", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should grant admin roles to owner", async function () {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await token.MINTER_ROLE();
      const BURNER_ROLE = await token.BURNER_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();
      const COMPLIANCE_ROLE = await token.COMPLIANCE_ROLE();

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(BURNER_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(COMPLIANCE_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(user1.address, mintAmount);
      
      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
    });

    it("Should not allow minting beyond max supply", async function () {
      const excessAmount = MAX_SUPPLY - INITIAL_SUPPLY + ethers.parseEther("1");
      
      await expect(token.mint(user1.address, excessAmount))
        .to.be.revertedWith("Exceeds maximum supply");
    });

    it("Should not allow non-minter to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(token.connect(user1).mint(user1.address, mintAmount))
        .to.be.reverted;
    });
  });

  describe("Compliance Features", function () {
    beforeEach(async function () {
      // Mint tokens to users for testing
      await token.mint(user1.address, ethers.parseEther("1000"));
      await token.mint(user2.address, ethers.parseEther("1000"));
    });

    it("Should allow compliance officer to blacklist addresses", async function () {
      await token.setBlacklisted(user1.address, true);
      expect(await token.blacklisted(user1.address)).to.be.true;
      
      // Should prevent transfers from blacklisted address
      await expect(token.connect(user1).transfer(user2.address, ethers.parseEther("100")))
        .to.be.revertedWith("Transfer not allowed");
    });

    it("Should enforce maximum transaction amount", async function () {
      const maxTxAmount = ethers.parseEther("100");
      await token.setMaxTransactionAmount(maxTxAmount);
      
      await expect(token.connect(user1).transfer(user2.address, ethers.parseEther("150")))
        .to.be.revertedWith("Transfer not allowed");
    });
  });

  describe("Pausable", function () {
    it("Should allow pauser to pause and unpause", async function () {
      await token.pause();
      expect(await token.paused()).to.be.true;
      
      await token.unpause();
      expect(await token.paused()).to.be.false;
    });
  });
});

describe("NigerianStockFactory", function () {
  let factory: NigerianStockFactory;
  let owner: HardhatEthersSigner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const NigerianStockFactory = await ethers.getContractFactory("NigerianStockFactory");
    factory = await NigerianStockFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Token Deployment", function () {
    it("Should deploy stock token correctly", async function () {
      const tx = await factory.deployStockToken(
        "Test Token",
        "TEST",
        "TEST",
        "Test Company",
        ethers.parseEther("1000000"),
        ethers.parseEther("100000"),
        owner.address
      );

      await expect(tx)
        .to.emit(factory, "StockTokenDeployed");

      expect(await factory.getTokenAddress("TEST")).to.not.equal(ethers.ZeroAddress);
      expect(await factory.getTokenCount()).to.equal(1);
    });

    it("Should not allow duplicate stock symbols", async function () {
      await factory.deployStockToken(
        "Test Token",
        "TEST",
        "TEST",
        "Test Company",
        ethers.parseEther("1000000"),
        ethers.parseEther("100000"),
        owner.address
      );

      await expect(factory.deployStockToken(
        "Test Token 2",
        "TEST2",
        "TEST", // Same stock symbol
        "Test Company 2",
        ethers.parseEther("1000000"),
        ethers.parseEther("100000"),
        owner.address
      )).to.be.revertedWith("Stock token already exists");
    });
  });
});
