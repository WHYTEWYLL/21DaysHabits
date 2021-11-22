const { BigNumber } = require("@ethersproject/bignumber");
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
    let escrow;

    beforeEach(async () => {
        [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();
        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy(anFavor, opositor, ethers.utils.parseEther("10"));
        await escrow.deployed();
        
    });

    it("should not hold Eth", async function () {
        const balance = await ethers.provider.getBalance(escrow.address);
        assert.equal(balance.toString(), "0");
    });

    it("Inicial amunt should be 10 ", async function () {
        const balance = await escrow.initialDeposit();
        assert.equal(balance.toString(), ethers.utils.parseEther("10"));
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

    it("Initial amount no enought", async function () {
        let ex;
        try{
            await escrow.inicialice();
        }catch(_ex){
            ex = _ex;
        }
        assert( ex, "Deposit not enough.");
    });

    it("initTime not a member", async function () {
        let ex;
        try{
            await escrow.connect(tester).inicialice();
        }catch(_ex){
            ex = _ex;
        }
        console.log(ex);
        assert( ex, "Not a member.");
    });

    it("timeChecker", async function () {
        const [owner] = await ethers.getSigners();
        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("10.0"), // Sends exactly 10.0 ether
          });
        console.log(await ethers.provider.getBalance(escrow.address));
        console.log(await escrow.initialDeposit());

        await escrow.inicialice();
        

        
        
            
        
    });


});
