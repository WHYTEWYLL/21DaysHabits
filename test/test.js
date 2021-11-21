const { BigNumber } = require("@ethersproject/bignumber");
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
    let escrow;

    before(async () => {
            [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();
            const Escrow = await ethers.getContractFactory("Escrow");
            escrow = await Escrow.deploy(anFavor, opositor, "10");
            await escrow.deployed();
        
    });

    it("should not hold Eth", async function () {
        const balance = await ethers.provider.getBalance(escrow.address);
        assert.equal(balance.toString(), "0");
    });

    it("Inicial amunt should be 10 ", async function () {
        const balance = await escrow.initialDeposit();
        assert.equal(balance.toString(), "10");
    });

    it("Inicial amunt should be 10 ", async function () {
        const [owner] = await ethers.getSigners();
        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
          });
        
        const balance = await ethers.provider.getBalance(escrow.address);
        assert.equal( ethers.utils.formatEther(balance.toString()), "1.0");
    });


    it("initTime no enought", async function () {
        let ex;
        try{
            await escrow.inicialice();
        }catch(_ex){
            ex = _ex;
        }
        assert( ex, "Deposit not enought.");
    });

    it("initTime not a member", async function () {
        let ex;
        try{
            await escrow.connect(tester).inicialice();
        }catch(_ex){
            ex = _ex;
        }
        assert( ex, "Not a member.");
    });


});
