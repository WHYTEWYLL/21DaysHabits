const { BigNumber } = require("@ethersproject/bignumber");
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");


const IWETHGateway = "0xDcD33426BA191383f1c9B431A342498fdac73488";
let aWETH  = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";

describe("Escrow- Stage 1 - constructor and inicialice", function () {
    let escrow;

    beforeEach(async () => {
        [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();
        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( IWETHGateway, aWETH , anFavor, opositor, ethers.utils.parseEther("10"));
        await escrow.deployed();
        aWETHcon = await ethers.getContractAt("IERC20", aWETH);
        
    });

    it("should not hold Eth", async function () {
        const balance = await ethers.provider.getBalance(escrow.address);
        assert.equal(balance.toString(), "0");
    });

    it("initialDeposit amunt should be 10 ", async function () {
        const balance = await escrow.initialDeposit();
        assert.equal(balance.toString(), ethers.utils.parseEther("10"));
    });

    it("Balance should be 1 ", async function () {
        const [owner] = await ethers.getSigners();
        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("1.0"), 
          });
        
        const balance = await ethers.provider.getBalance(escrow.address);
        assert.equal( ethers.utils.formatEther(balance.toString()), "1.0");
    });

    it("Initial amount no enought", async function () {

        await expect(escrow.inicialice()).to.be.revertedWith('Deposit not enough.');
    });

    it("initTime not a member", async function () {
        const a = await ethers.getSigner(9);
        
        await expect( escrow.connect(a).inicialice()).to.be.revertedWith("Not a member.");
    });

    it("timeChecker , all to aWETH", async function () {

        const owner = await ethers.getSigner();
        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("10.0"), // Sends exactly 10.0 ether
          });

        const balance = await ethers.provider.getBalance(escrow.address);

        await escrow.inicialice();

        const balanceaWETH = await aWETHcon.balanceOf(escrow.address);
        
        expect(balanceaWETH.toString()).to.be.equal(balance.toString());
    });


});

describe("Escrow - Stage 2 - Checker & Score", function () {
    
    let escrow;

    beforeEach(async () => {
        [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();
        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( IWETHGateway, aWETH , anFavor, opositor, ethers.utils.parseEther("10"));
        await escrow.deployed();
        aWETHcon = await ethers.getContractAt("IERC20", aWETH);

        const owner = await ethers.getSigner();
        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("10.0"), // Sends exactly 10.0 ether
          });
        
          await escrow.inicialice();
    
        });

    it("Score should be 0,0", async function () {
        const x = await escrow.score();
        expect(x.toString()).to.be.equal("0,0");
    });

    it("Checker - Vote per 24 h ", async function () {
        await expect( escrow.checker(1)).to.be.revertedWith("One input per 24h");
        });

    it("Checker - only arbiter ", async function () {
        const tester = await ethers.getSigner(5);
        await expect( escrow.connect(tester).checker(1)).to.be.revertedWith("Only the arbiter");
        });

    it("Checker - new vote in 24h", async function () {
        const oneDay = 1 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        ethers.provider.send("evm_mine")    
        await escrow.checker(1);
        const score = await escrow.score();
        expect( score.toString()).to.be.equal("1,0");

    });
    });

    describe("Escrow - Stage 3 - Checker & Score", function () {
        let escrow;

        beforeEach(async () => {
            [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();
            const Escrow = await ethers.getContractFactory("Escrow");
            escrow = await Escrow.deploy( IWETHGateway, aWETH , anFavor, opositor, ethers.utils.parseEther("10"));
            await escrow.deployed();
            aWETHcon = await ethers.getContractAt("IERC20", aWETH);
            const [owner] = await ethers.getSigners();
            const transactionHash = await owner.sendTransaction({
                to: escrow.address,
                value: ethers.utils.parseEther("10.0"), 
              });
            

        });

        it("Checker - first inicialice ", async function () {

            const tester = await ethers.getSigner(5);
            const oneDay = 21 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine")  
            await expect( escrow.approve()).to.be.revertedWith('First you have to call inicialice');
            });

        it("Checker - Approve must be called by the arbiter ", async function () {

            await escrow.inicialice();

            const tester = await ethers.getSigner(5);
            const oneDay = 21 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine")  
            await expect( escrow.connect( tester ).approve()).to.be.revertedWith('Approve must be called by the arbiter!');
            });

        it("Checker - 21 days minim ", async function () {

            await escrow.inicialice();

            const tester = await ethers.getSigner(5);
            const oneDay = 2 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine")  
            await expect( escrow.approve()).to.be.revertedWith('21 days minim');
            });

        it("Checker - 1-0  ", async function () {

            await escrow.inicialice();

            const day = 1 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [day]);
            ethers.provider.send("evm_mine")    
            await escrow.checker(1);

            const tester = await ethers.getSigner(5);
            const oneDay = 21 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine");

            const x = await escrow.approve()

            const anFavorBalanceAfter = (await ethers.provider.getBalance(anFavor)).toString();
            const opositorBalanceAfter = (await ethers.provider.getBalance(opositor)).toString();

            console.log("Balances (Favor / Oposite) -> ",anFavorBalanceAfter, opositorBalanceAfter)

            expect((await aWETHcon.balanceOf(escrow.address)).toString()).to.equal('5000020625360840241');

            });
    });

    describe("Escrow - Stage 4 - Chainlink & Score", function () {
        let escrow;
        const LINK_ADDR = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
        const VRF_ADDR = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";
        const keyHash = "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445";
        const fee = BigNumber.from(2);
        beforeEach(async () => {

            
            const Chainlink = await ethers.getContractFactory("RandomNumberConsumer");
            chainLink = await Chainlink.deploy(VRF_ADDR, LINK_ADDR, keyHash, fee);
            await chainLink.deployed();

            
            [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();
            const Escrow = await ethers.getContractFactory("Escrow");
//
            escrow = await Escrow.deploy( IWETHGateway, aWETH , anFavor, opositor, ethers.utils.parseEther("10"));
            await escrow.deployed();
            aWETHcon = await ethers.getContractAt("IERC20", aWETH);
            const [owner] = await ethers.getSigners();
            const transactionHash = await owner.sendTransaction({
                to: escrow.address,
                value: ethers.utils.parseEther("10.0"), 
                });
            
//
        });

        it("Checker - 21 days minim ", async function () {
            console.log("Chainlink address", chainLink.address);
    });
});

    
