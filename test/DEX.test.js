const { expect } = require("chai");
const { ethers } = require("hardhat");

function getAmountOut(amountIn, reserveIn, reserveOut) {
  const amountInWithFee = amountIn * 997;
  return Math.floor((amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee));
}

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
      const [a, b] = await dex.getReserves();
      expect(a).to.equal(100);
      expect(b).to.equal(200);
    });

    it("should mint correct LP tokens for first provider", async function () {
      await dex.addLiquidity(100, 400);
      expect(await dex.totalLiquidity()).to.equal(200);
    });

    it("should allow subsequent liquidity additions", async function () {
      await dex.addLiquidity(100, 200);
      await dex.addLiquidity(50, 100);
      const total = await dex.totalLiquidity();
      expect(total).to.equal(211);
    });

    it("should maintain price ratio on liquidity addition", async function () {
      await dex.addLiquidity(100, 200);
      await expect(dex.addLiquidity(50, 120)).to.be.reverted;
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(100, 200);
      const total = await dex.totalLiquidity();
      await dex.removeLiquidity(total.div(2));
      const [a, b] = await dex.getReserves();

      expect(a).to.be.closeTo(50, 1);
      expect(b).to.be.closeTo(100, 1);
    });

    it("should return correct token amounts on liquidity removal", async function () {
      await dex.addLiquidity(100, 200);
      const total = await dex.totalLiquidity();
      await dex.removeLiquidity(total.div(2));
      const [a, b] = await dex.getReserves();

      expect(a).to.be.closeTo(50, 1);
      expect(b).to.be.closeTo(100, 1);
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(dex.addLiquidity(0, 100)).to.be.reverted;
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
      const [, b] = await dex.getReserves();
      expect(b).to.be.lt(1000);
    });

    it("should swap token B for token A", async function () {
      await dex.swapBForA(100);
      const [a] = await dex.getReserves();
      expect(a).to.be.lt(1000);
    });

    it("should calculate correct output amount with fee", async function () {
      const out = await dex.getAmountOut(100, 1000, 1000);
      expect(out).to.equal(getAmountOut(100, 1000, 1000));
    });

    it("should update reserves after swap", async function () {
      await dex.swapAForB(100);
      const [a] = await dex.getReserves();
      expect(a).to.equal(1100);
    });

    it("should increase k after swap due to fees", async function () {
      const [a1, b1] = await dex.getReserves();
      await dex.swapAForB(100);
      const [a2, b2] = await dex.getReserves();
      expect(a2 * b2).to.be.gt(a1 * b1);
    });

    it("should revert on zero swap amount", async function () {
      await expect(dex.swapAForB(0)).to.be.reverted;
    });

    it("should handle large swaps with high price impact", async function () {
      await dex.swapAForB(900);
      const [, b] = await dex.getReserves();
      expect(b).to.be.lt(550);
    });

    it("should handle multiple consecutive swaps", async function () {
      await dex.swapAForB(50);
      await dex.swapAForB(50);
      const [a] = await dex.getReserves();
      expect(a).to.be.gt(1000);
    });
  });

  describe("Price Calculations", function () {
    it("should return correct initial price", async function () {
      await dex.addLiquidity(100, 200);
      expect(await dex.getPrice()).to.equal(2);
    });

    it("should update price after swaps", async function () {
      await dex.addLiquidity(100, 200);
      await dex.swapAForB(10);
      expect(await dex.getPrice()).to.not.equal(2);
    });

    it("should handle price queries with zero reserves gracefully", async function () {
      expect(await dex.getPrice()).to.equal(0);
    });
  });

  describe("Events", function () {
    it("should emit LiquidityAdded event", async function () {
      await expect(dex.addLiquidity(10, 20)).to.emit(dex, "LiquidityAdded");
    });

    it("should emit LiquidityRemoved event", async function () {
      await dex.addLiquidity(10, 20);
      await expect(dex.removeLiquidity(10)).to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap event", async function () {
      await dex.addLiquidity(100, 100);
      await expect(dex.swapAForB(10)).to.emit(dex, "Swap");
    });
  });
});
