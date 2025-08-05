import { expect } from "chai";
import { ethers } from "hardhat";
import { NGNStablecoin } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NGNStablecoin", function () {
  let ngnStablecoin: NGNStablecoin;
  let admin: SignerWithAddress;
  let minter: SignerWithAddress;
  let burner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let dexContract: SignerWithAddress;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
  const COMPLIANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPLIANCE_ROLE"));
  const DEX_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEX_ROLE"));

  const initialConfig = {
    name: "Nigerian Naira Stablecoin",
    symbol: "NGN",
    decimals: 18,
    maxSupply: ethers.parseEther("1000000000"), // 1B NGN
    mintingCap: ethers.parseEther("10000000"), // 10M NGN daily
    lastMintReset: 0,
    currentDayMinted: 0,
    mintingEnabled: true,
    burningEnabled: true,
    transfersEnabled: true,
  };

  beforeEach(async function () {
    [admin, minter, burner, user1, user2, dexContract] = await ethers.getSigners();

    const NGNStablecoinFactory = await ethers.getContractFactory("NGNStablecoin");
    ngnStablecoin = await NGNStablecoinFactory.deploy(admin.address, initialConfig);
    await ngnStablecoin.waitForDeployment();

    // Grant roles
    await ngnStablecoin.connect(admin).grantRole(MINTER_ROLE, minter.address);
    await ngnStablecoin.connect(admin).grantRole(BURNER_ROLE, burner.address);
  });

  describe("Deployment", function () {
    it("Should set the correct initial configuration", async function () {
      const config = await ngnStablecoin.getConfig();
      expect(config.name).to.equal("Nigerian Naira Stablecoin");
      expect(config.symbol).to.equal("NGN");
      expect(config.maxSupply).to.equal(ethers.parseEther("1000000000"));
      expect(config.mintingEnabled).to.be.true;
      expect(config.burningEnabled).to.be.true;
      expect(config.transfersEnabled).to.be.true;
    });

    it("Should grant admin roles correctly", async function () {
      expect(await ngnStablecoin.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await ngnStablecoin.hasRole(MINTER_ROLE, admin.address)).to.be.true;
      expect(await ngnStablecoin.hasRole(BURNER_ROLE, admin.address)).to.be.true;
      expect(await ngnStablecoin.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
      expect(await ngnStablecoin.hasRole(COMPLIANCE_ROLE, admin.address)).to.be.true;
    });

    it("Should set correct transfer limits", async function () {
      expect(await ngnStablecoin.minTransferAmount()).to.equal(ethers.parseEther("1"));
      expect(await ngnStablecoin.maxTransferAmount()).to.equal(ethers.parseEther("1000000"));
      expect(await ngnStablecoin.dailyTransferLimit()).to.equal(ethers.parseEther("10000000"));
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");

      await expect(ngnStablecoin.connect(minter).mint(user1.address, mintAmount))
        .to.emit(ngnStablecoin, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);

      expect(await ngnStablecoin.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await ngnStablecoin.totalSupply()).to.equal(mintAmount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");

      await expect(
        ngnStablecoin.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "AccessControlUnauthorizedAccount");
    });

    it("Should enforce daily minting cap", async function () {
      const dailyCap = ethers.parseEther("10000000");
      const exceedAmount = dailyCap + ethers.parseEther("1");

      await expect(
        ngnStablecoin.connect(minter).mint(user1.address, exceedAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "MintingCapExceeded");
    });

    it("Should enforce max supply limit", async function () {
      const maxSupply = ethers.parseEther("1000000000");
      const exceedAmount = maxSupply + ethers.parseEther("1");

      await expect(
        ngnStablecoin.connect(minter).mint(user1.address, exceedAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "MaxSupplyExceeded");
    });

    it("Should reset daily minting cap after 24 hours", async function () {
      const dailyCap = ethers.parseEther("10000000");

      // Mint up to daily cap
      await ngnStablecoin.connect(minter).mint(user1.address, dailyCap);

      // Should fail to mint more
      await expect(
        ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(ngnStablecoin, "MintingCapExceeded");

      // Fast forward 24 hours
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);

      // Should be able to mint again
      await expect(ngnStablecoin.connect(minter).mint(user2.address, ethers.parseEther("1000"))).to
        .not.be.reverted;
    });

    it("Should support batch minting", async function () {
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("1000"), ethers.parseEther("2000")];

      await expect(ngnStablecoin.connect(minter).batchMint(recipients, amounts))
        .to.emit(ngnStablecoin, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, amounts[0])
        .and.to.emit(ngnStablecoin, "Transfer")
        .withArgs(ethers.ZeroAddress, user2.address, amounts[1]);

      expect(await ngnStablecoin.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await ngnStablecoin.balanceOf(user2.address)).to.equal(amounts[1]);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Mint some tokens first
      await ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("10000"));
    });

    it("Should allow burner to burn tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialBalance = await ngnStablecoin.balanceOf(user1.address);

      // User needs to approve burner
      await ngnStablecoin.connect(user1).approve(burner.address, burnAmount);

      await expect(ngnStablecoin.connect(burner).burnFrom(user1.address, burnAmount))
        .to.emit(ngnStablecoin, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, burnAmount);

      expect(await ngnStablecoin.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should not allow non-burner to burn tokens", async function () {
      const burnAmount = ethers.parseEther("1000");

      await expect(
        ngnStablecoin.connect(user2).burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow burning more than balance", async function () {
      const balance = await ngnStablecoin.balanceOf(user1.address);
      const burnAmount = balance + ethers.parseEther("1");

      await ngnStablecoin.connect(user1).approve(burner.address, burnAmount);

      await expect(
        ngnStablecoin.connect(burner).burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "ERC20InsufficientBalance");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      // Mint tokens to user1
      await ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("10000"));
    });

    it("Should allow normal transfers", async function () {
      const transferAmount = ethers.parseEther("1000");

      await expect(ngnStablecoin.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(ngnStablecoin, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);

      expect(await ngnStablecoin.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should enforce minimum transfer amount", async function () {
      const minAmount = await ngnStablecoin.minTransferAmount();
      const belowMin = minAmount - 1n;

      await expect(
        ngnStablecoin.connect(user1).transfer(user2.address, belowMin)
      ).to.be.revertedWithCustomError(ngnStablecoin, "TransferLimitExceeded");
    });

    it("Should enforce maximum transfer amount", async function () {
      const maxAmount = await ngnStablecoin.maxTransferAmount();
      const aboveMax = maxAmount + ethers.parseEther("1");

      // First mint enough tokens
      await ngnStablecoin.connect(minter).mint(user1.address, aboveMax);

      await expect(
        ngnStablecoin.connect(user1).transfer(user2.address, aboveMax)
      ).to.be.revertedWithCustomError(ngnStablecoin, "TransferLimitExceeded");
    });

    it("Should enforce daily transfer limit", async function () {
      // First, let's set a lower daily transfer limit to make testing easier
      const newDailyLimit = ethers.parseEther("5000000"); // 5M NGN
      const newMaxTransfer = ethers.parseEther("6000000"); // 6M NGN max per transaction

      await ngnStablecoin.connect(admin).setTransferLimits(
        ethers.parseEther("1"), // min
        newMaxTransfer, // max (higher than daily limit)
        newDailyLimit // daily limit
      );

      // Mint enough tokens for the test
      const mintAmount = ethers.parseEther("6000000"); // 6M NGN
      await ngnStablecoin.connect(minter).mint(user1.address, mintAmount);

      // Try to transfer more than daily limit but less than max transfer
      const exceedAmount = newDailyLimit + ethers.parseEther("1");

      await expect(
        ngnStablecoin.connect(user1).transfer(user2.address, exceedAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "DailyLimitExceeded");
    });

    it("Should block transfers from blacklisted addresses", async function () {
      const transferAmount = ethers.parseEther("1000");

      // Blacklist user1
      await ngnStablecoin.connect(admin).setComplianceStatus(
        [user1.address],
        [true], // blacklisted
        [false] // not whitelisted
      );

      await expect(
        ngnStablecoin.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "BlacklistedAddress");
    });

    it("Should allow transfers for DEX contracts even with limits", async function () {
      const normalMaxAmount = await ngnStablecoin.maxTransferAmount();
      const transferAmount = normalMaxAmount + ethers.parseEther("1000000"); // Above normal max

      // Authorize DEX contract first
      await ngnStablecoin.connect(admin).authorizeDEXContracts([dexContract.address], [true]);

      // Mint tokens to DEX contract (since DEX contracts can transfer more)
      await ngnStablecoin.connect(minter).mint(dexContract.address, transferAmount);

      // Get initial balance of user1
      const initialBalance = await ngnStablecoin.balanceOf(user1.address);

      // Transfer from DEX to user1 should work even above normal limits
      await ngnStablecoin.connect(dexContract).transfer(user1.address, transferAmount);

      expect(await ngnStablecoin.balanceOf(user1.address)).to.equal(
        initialBalance + transferAmount
      );
    });
  });

  describe("Compliance", function () {
    beforeEach(async function () {
      await ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("10000"));
    });

    it("Should allow admin to set compliance status", async function () {
      await expect(
        ngnStablecoin.connect(admin).setComplianceStatus(
          [user1.address],
          [true], // blacklisted
          [false] // not whitelisted
        )
      )
        .to.emit(ngnStablecoin, "ComplianceStatusUpdated")
        .withArgs(user1.address, true, false);

      expect(await ngnStablecoin.blacklisted(user1.address)).to.be.true;
      expect(await ngnStablecoin.whitelisted(user1.address)).to.be.false;
    });

    it("Should enforce whitelist when required", async function () {
      const transferAmount = ethers.parseEther("1000");

      // Enable whitelist requirement
      await ngnStablecoin.connect(admin).setWhitelistRequired(true);

      // Transfer should fail without whitelist
      await expect(
        ngnStablecoin.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWithCustomError(ngnStablecoin, "NotWhitelisted");

      // Whitelist user1
      await ngnStablecoin.connect(admin).setComplianceStatus(
        [user1.address],
        [false], // not blacklisted
        [true] // whitelisted
      );

      // Transfer should now work
      await expect(ngnStablecoin.connect(user1).transfer(user2.address, transferAmount)).to.not.be
        .reverted;
    });
  });

  describe("DEX Integration", function () {
    it("Should authorize DEX contracts", async function () {
      await expect(
        ngnStablecoin.connect(admin).authorizeDEXContracts([dexContract.address], [true])
      )
        .to.emit(ngnStablecoin, "DEXContractAuthorized")
        .withArgs(dexContract.address, true);

      expect(await ngnStablecoin.authorizedDEXContracts(dexContract.address)).to.be.true;
      expect(await ngnStablecoin.hasRole(DEX_ROLE, dexContract.address)).to.be.true;
    });

    it("Should set DEX transfer limits", async function () {
      const newLimit = ethers.parseEther("50000000");

      await ngnStablecoin.connect(admin).setDEXTransferLimit(newLimit);

      expect(await ngnStablecoin.dexTransferLimit()).to.equal(newLimit);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update configuration", async function () {
      const newConfig = {
        ...initialConfig,
        maxSupply: ethers.parseEther("2000000000"),
        mintingEnabled: false,
      };

      await expect(ngnStablecoin.connect(admin).updateConfig(newConfig)).to.emit(
        ngnStablecoin,
        "StablecoinConfigUpdated"
      );

      const config = await ngnStablecoin.getConfig();
      expect(config.maxSupply).to.equal(ethers.parseEther("2000000000"));
      expect(config.mintingEnabled).to.be.false;
    });

    it("Should allow admin to set transfer limits", async function () {
      const newMin = ethers.parseEther("10");
      const newMax = ethers.parseEther("500000");
      const newDaily = ethers.parseEther("5000000");

      await expect(ngnStablecoin.connect(admin).setTransferLimits(newMin, newMax, newDaily))
        .to.emit(ngnStablecoin, "TransferLimitsUpdated")
        .withArgs(newMin, newMax, newDaily);

      expect(await ngnStablecoin.minTransferAmount()).to.equal(newMin);
      expect(await ngnStablecoin.maxTransferAmount()).to.equal(newMax);
      expect(await ngnStablecoin.dailyTransferLimit()).to.equal(newDaily);
    });

    it("Should allow pausing and unpausing", async function () {
      await ngnStablecoin.connect(admin).pause();
      expect(await ngnStablecoin.paused()).to.be.true;

      // Minting should be paused
      await expect(
        ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(ngnStablecoin, "EnforcedPause");

      await ngnStablecoin.connect(admin).unpause();
      expect(await ngnStablecoin.paused()).to.be.false;

      // Minting should work again
      await expect(ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("1000"))).to
        .not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return remaining minting capacity", async function () {
      const dailyCap = ethers.parseEther("10000000");
      const mintAmount = ethers.parseEther("1000000");

      // Initially should return full capacity
      expect(await ngnStablecoin.getRemainingMintingCapacity()).to.equal(dailyCap);

      // After minting, should return reduced capacity
      await ngnStablecoin.connect(minter).mint(user1.address, mintAmount);
      expect(await ngnStablecoin.getRemainingMintingCapacity()).to.equal(dailyCap - mintAmount);
    });

    it("Should return remaining daily transfer capacity", async function () {
      const dailyLimit = ethers.parseEther("10000000");

      // Mint tokens first
      await ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("5000000"));

      // Initially should return full capacity
      expect(await ngnStablecoin.getRemainingDailyTransferCapacity(user1.address)).to.equal(
        dailyLimit
      );

      // After transfer, should return reduced capacity
      const transferAmount = ethers.parseEther("1000000");
      await ngnStablecoin.connect(user1).transfer(user2.address, transferAmount);
      expect(await ngnStablecoin.getRemainingDailyTransferCapacity(user1.address)).to.equal(
        dailyLimit - transferAmount
      );
    });

    it("Should check if transfer is allowed", async function () {
      const transferAmount = ethers.parseEther("1000");

      // Mint tokens first
      await ngnStablecoin.connect(minter).mint(user1.address, ethers.parseEther("10000"));

      // Should be allowed initially
      const [canTransfer, reason] = await ngnStablecoin.canTransfer(
        user1.address,
        user2.address,
        transferAmount
      );
      expect(canTransfer).to.be.true;
      expect(reason).to.equal("Transfer allowed");

      // Should not be allowed if blacklisted
      await ngnStablecoin.connect(admin).setComplianceStatus([user1.address], [true], [false]);
      const [canTransfer2, reason2] = await ngnStablecoin.canTransfer(
        user1.address,
        user2.address,
        transferAmount
      );
      expect(canTransfer2).to.be.false;
      expect(reason2).to.equal("Address blacklisted");
    });
  });
});
