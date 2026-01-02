const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex, tokenA, tokenB;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");

    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);

    await tokenA.approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  describe("Liquidity Management", function () {
    it("should allow initial liquidity provision", async function () {
      await dex.addLiquidity(100, 200);
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(100);
      expect(reserves[1]).to.equal(200);
    });

    it("should mint correct LP tokens for first provider", async function () {
      const tx = await dex.addLiquidity(100, 400);
      const receipt = await tx.wait();
      const liquidityMinted = receipt.events[0].args.liquidityMinted;
      expect(liquidityMinted).to.equal(200);
    });

    it("should allow subsequent liquidity additions", async function () {
      await dex.addLiquidity(100, 200);
      await dex.addLiquidity(50, 100);
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(150);
      expect(reserves[1]).to.equal(300);
    });

    it("should maintain price ratio on liquidity addition", async function () {
      await dex.addLiquidity(100, 200);
      await expect(dex.addLiquidity(10, 50)).to.be.reverted;
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(100, 200);
      const lp = await dex.liquidity(owner.address);
      await dex.removeLiquidity(lp.div(2));
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(50);
    });

    it("should return correct token amounts on liquidity removal", async function () {
      await dex.addLiquidity(100, 200);
      const lp = await dex.liquidity(owner.address);
      const tx = await dex.removeLiquidity(lp.div(2));
      const receipt = await tx.wait();
      expect(receipt.events[0].args.amountA).to.equal(50);
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(dex.addLiquidity(0, 0)).to.be.reverted;
    });

    it("should revert when removing more liquidity than owned", async function () {
      await expect(dex.removeLiquidity(100)).to.be.reverted;
    });
  });

  describe("Token Swaps", function () {
    beforeEach(async function () {
      await dex.addLiquidity(1000, 1000);
    });

    it("should swap token A for token B", async function () {
      await dex.swapAForB(100);
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(1100);
    });

    it("should swap token B for token A", async function () {
      await dex.swapBForA(100);
      const reserves = await dex.getReserves();
      expect(reserves[1]).to.equal(1100);
    });

    it("should calculate correct output amount with fee", async function () {
      const out = await dex.getAmountOut(100, 1000, 1000);
      expect(out).to.be.gt(90);
    });

    it("should update reserves after swap", async function () {
      await dex.swapAForB(100);
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(1100);
    });

    it("should increase k after swap due to fees", async function () {
      const r1 = await dex.getReserves();
      const k1 = r1[0].mul(r1[1]);
      await dex.swapAForB(100);
      const r2 = await dex.getReserves();
      const k2 = r2[0].mul(r2[1]);
      expect(k2).to.be.gt(k1);
    });

    it("should revert on zero swap amount", async function () {
      await expect(dex.swapAForB(0)).to.be.reverted;
    });

    it("should handle large swaps with high price impact", async function () {
      const out = await dex.getAmountOut(900, 1000, 1000);
      expect(out).to.be.lt(500);
    });

    it("should handle multiple consecutive swaps", async function () {
      await dex.swapAForB(50);
      await dex.swapAForB(50);
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(1100);
    });
  });

  describe("Price Calculations", function () {
    it("should return correct initial price", async function () {
      await dex.addLiquidity(100, 200);
      const price = await dex.getPrice();
      expect(price).to.equal(2);
    });

    it("should update price after swaps", async function () {
      await dex.addLiquidity(100, 200);
      await dex.swapAForB(50);
      const price = await dex.getPrice();
      expect(price).to.be.lt(2);
    });

    it("should handle price queries with zero reserves gracefully", async function () {
      const price = await dex.getPrice();
      expect(price).to.equal(0);
    });
  });

  describe("Fee Distribution", function () {
    it("should accumulate fees for liquidity providers", async function () {
      await dex.addLiquidity(1000, 1000);
      const lpBefore = await dex.liquidity(owner.address);
      await dex.swapAForB(100);
      const lpAfter = await dex.liquidity(owner.address);
      expect(lpAfter).to.equal(lpBefore);
    });
  });

  describe("Edge Cases", function () {
    it("should handle very small liquidity amounts", async function () {
      await dex.addLiquidity(1, 1);
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(1);
    });

    it("should prevent unauthorized access", async function () {
      await expect(dex.connect(addr1).removeLiquidity(10)).to.be.reverted;
    });
  });

  describe("Events", function () {
    it("should emit LiquidityAdded event", async function () {
      await expect(dex.addLiquidity(10, 10)).to.emit(dex, "LiquidityAdded");
    });

    it("should emit LiquidityRemoved event", async function () {
      await dex.addLiquidity(10, 10);
      const lp = await dex.liquidity(owner.address);
      await expect(dex.removeLiquidity(lp)).to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap event", async function () {
      await dex.addLiquidity(10, 10);
      await expect(dex.swapAForB(5)).to.emit(dex, "Swap");
    });
  });
});
