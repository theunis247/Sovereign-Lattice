const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QBSToken", function () {
  let qbsToken;
  let owner;
  let miner;
  let user;
  
  beforeEach(async function () {
    [owner, miner, user] = await ethers.getSigners();
    
    const QBSToken = await ethers.getContractFactory("QBSToken");
    qbsToken = await QBSToken.deploy(owner.address);
    await qbsToken.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await qbsToken.name()).to.equal("Quantum Breakthrough Shares");
      expect(await qbsToken.symbol()).to.equal("QBS");
    });
    
    it("Should set the correct decimals", async function () {
      expect(await qbsToken.decimals()).to.equal(18);
    });
    
    it("Should mint initial supply to owner", async function () {
      const initialSupply = ethers.parseEther("1000");
      expect(await qbsToken.balanceOf(owner.address)).to.equal(initialSupply);
    });
    
    it("Should set the correct max supply", async function () {
      const maxSupply = ethers.parseEther("10000");
      expect(await qbsToken.MAX_SUPPLY()).to.equal(maxSupply);
    });
  });
  
  describe("Miner Authorization", function () {
    it("Should allow owner to authorize miners", async function () {
      await qbsToken.authorizeMiner(miner.address);
      expect(await qbsToken.isAuthorizedMiner(miner.address)).to.be.true;
    });
    
    it("Should emit MinerAuthorized event", async function () {
      await expect(qbsToken.authorizeMiner(miner.address))
        .to.emit(qbsToken, "MinerAuthorized")
        .withArgs(miner.address);
    });
    
    it("Should allow owner to revoke miners", async function () {
      await qbsToken.authorizeMiner(miner.address);
      await qbsToken.revokeMiner(miner.address);
      expect(await qbsToken.isAuthorizedMiner(miner.address)).to.be.false;
    });
    
    it("Should not allow non-owner to authorize miners", async function () {
      await expect(qbsToken.connect(user).authorizeMiner(miner.address))
        .to.be.revertedWithCustomError(qbsToken, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Mining Rewards", function () {
    beforeEach(async function () {
      await qbsToken.authorizeMiner(miner.address);
    });
    
    it("Should allow authorized miner to mint rewards", async function () {
      const amount = ethers.parseEther("1");
      await qbsToken.connect(miner).mintMiningReward(
        user.address,
        amount,
        "BLOCK-001",
        "A"
      );
      
      expect(await qbsToken.balanceOf(user.address)).to.equal(amount);
      expect(await qbsToken.getMiningRewards(user.address)).to.equal(amount);
    });
    
    it("Should emit MiningReward event", async function () {
      const amount = ethers.parseEther("1");
      await expect(qbsToken.connect(miner).mintMiningReward(
        user.address,
        amount,
        "BLOCK-001",
        "S"
      )).to.emit(qbsToken, "MiningReward")
        .withArgs(user.address, amount, "BLOCK-001", "S");
    });
    
    it("Should not allow unauthorized address to mint rewards", async function () {
      const amount = ethers.parseEther("1");
      await expect(qbsToken.connect(user).mintMiningReward(
        user.address,
        amount,
        "BLOCK-001",
        "A"
      )).to.be.revertedWith("QBS: Not authorized miner");
    });
    
    it("Should not exceed max supply", async function () {
      const maxSupply = await qbsToken.MAX_SUPPLY();
      const currentSupply = await qbsToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseEther("1");
      
      await expect(qbsToken.connect(miner).mintMiningReward(
        user.address,
        excessAmount,
        "BLOCK-001",
        "S"
      )).to.be.revertedWith("QBS: Exceeds max supply");
    });
  });
  
  describe("Evolution Rewards", function () {
    beforeEach(async function () {
      await qbsToken.authorizeMiner(miner.address);
    });
    
    it("Should allow authorized miner to mint evolution rewards", async function () {
      const amount = ethers.parseEther("0.5");
      await qbsToken.connect(miner).mintEvolutionReward(
        user.address,
        amount,
        "BLOCK-001",
        2
      );
      
      expect(await qbsToken.balanceOf(user.address)).to.equal(amount);
    });
    
    it("Should emit EvolutionReward event", async function () {
      const amount = ethers.parseEther("0.5");
      await expect(qbsToken.connect(miner).mintEvolutionReward(
        user.address,
        amount,
        "BLOCK-001",
        3
      )).to.emit(qbsToken, "EvolutionReward")
        .withArgs(user.address, amount, "BLOCK-001", 3);
    });
  });
  
  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      await qbsToken.burn(burnAmount);
      
      const expectedBalance = ethers.parseEther("900"); // 1000 - 100
      expect(await qbsToken.balanceOf(owner.address)).to.equal(expectedBalance);
    });
    
    it("Should allow burning from another address with allowance", async function () {
      const burnAmount = ethers.parseEther("100");
      await qbsToken.approve(user.address, burnAmount);
      await qbsToken.connect(user).burnFrom(owner.address, burnAmount);
      
      const expectedBalance = ethers.parseEther("900");
      expect(await qbsToken.balanceOf(owner.address)).to.equal(expectedBalance);
    });
  });
  
  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      await qbsToken.pause();
      expect(await qbsToken.paused()).to.be.true;
      
      await qbsToken.unpause();
      expect(await qbsToken.paused()).to.be.false;
    });
    
    it("Should prevent transfers when paused", async function () {
      await qbsToken.pause();
      
      await expect(qbsToken.transfer(user.address, ethers.parseEther("1")))
        .to.be.revertedWithCustomError(qbsToken, "EnforcedPause");
    });
  });
});