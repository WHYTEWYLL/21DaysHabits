const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");
const vrfCoordinatorABI = require("@chainlink/contracts/abi/v0.6/VRFCoordinator.json");
const { assert, expect } = require("chai");


let WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

let UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

let AavePool = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
const IWETHGateway = "0xDcD33426BA191383f1c9B431A342498fdac73488";
let aWETH  = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";

let escrow;

const LINK_ADDR = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const VRF_ADDR = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";
const keyHash = "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445";
const fee = ethers.utils.parseEther("2") ;





describe("Escrow- Stage 1 - constructor and inicialice", function () {


    beforeEach(async () => {
        [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();

        const Essentials  = { 
            gateway : IWETHGateway,
            aWETH,
            pool : AavePool,
            uniswapRouter : UNISWAP_ROUTER_ADDRESS,
            inFavor:anFavor,
            opposing : opositor,
            amount : ethers.utils.parseEther("10"),
            vrf : VRF_ADDR,
            link :LINK_ADDR,
            keyHash : keyHash, 
            fee : fee
          }

        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( Essentials);
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

        const Essentials  = { 
            gateway : IWETHGateway,
            aWETH,
            uniswapRouter : UNISWAP_ROUTER_ADDRESS,
            pool : AavePool,
            inFavor:anFavor,
            opposing : opositor,
            amount : ethers.utils.parseEther("10"),
            vrf : VRF_ADDR,
            link :LINK_ADDR,
            keyHash : keyHash, 
            fee : fee
          }

        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( Essentials);
        
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

        const Essentials  = { 
            gateway : IWETHGateway,
            aWETH,
            uniswapRouter : UNISWAP_ROUTER_ADDRESS,
            pool : AavePool,
            inFavor:anFavor,
            opposing : opositor,
            amount : ethers.utils.parseEther("10"),
            vrf : VRF_ADDR,
            link :LINK_ADDR,
            keyHash : keyHash, 
            fee : fee
          }
        
        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( Essentials);

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
        ethers.provider.send("evm_mine");
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

        expect( (await escrow.score()).toString()).to.be.equal('1,0');

        });
});


describe("Escrow - Stage 4 - Chainlink & Score", function () {


    beforeEach(async () => {

        const [owner] = await ethers.getSigners();

        [depositor, anFavor, opositor] = await ethers.provider.listAccounts();

        const Essentials  = { 
            gateway : IWETHGateway,
            aWETH,
            uniswapRouter : UNISWAP_ROUTER_ADDRESS,
            pool : AavePool,
            inFavor:anFavor,
            opposing : opositor,
            amount : ethers.utils.parseEther("10"),
            vrf : VRF_ADDR,
            link :LINK_ADDR,
            keyHash : keyHash, 
            fee : fee
          }

        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( Essentials);

        await escrow.deployed();
        aWETHcon = await ethers.getContractAt("IERC20", aWETH);

        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("10.0"), 
            });

        await escrow.inicialice();

        const tester = await ethers.getSigner(5);
        const oneDay = 21 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        ethers.provider.send("evm_mine");

        x = await escrow.approve();
        receipt = await x.wait();
        const interface = new ethers.utils.Interface(vrfCoordinatorABI);
        const events = receipt.logs.filter(x => x.address === VRF_ADDR).map(x => interface.parseLog(x));
        randomnessRequestEvent = events.find(x => x.name === "RandomnessRequest");
        requestId = randomnessRequestEvent.args.requestID;
    });

    it('should return approved', async () => {
        assert.equal(await escrow.approved(), true);
    });

    it('should create the randomness request in the coordinator', async () => {
        assert(randomnessRequestEvent);
        assert.equal(randomnessRequestEvent.args.sender, escrow.address);
    });

    describe("After fulfilling the request", () => {
        const randomValue = (Math.round(Math.random()));
        beforeEach(async () => {
            // give gas money to the VRF coordinator 
            await network.provider.send("hardhat_setBalance", [
                VRF_ADDR,
                "0xde0b6b3a7640000"
            ]);
            // impersonate the VRF coordinator to fullfill randomness 
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [VRF_ADDR],
            });
            const signer = await ethers.provider.getSigner(VRF_ADDR);
            await escrow.connect(signer).rawFulfillRandomness(requestId, randomValue);
        });
    
        it("should store the randomness", async () => {
            const randomResult = await escrow.randomResult();   
            const fell = await escrow.withdrawByRandom();
            assert(randomResult.eq(randomValue));
        });
    });
});


describe("Escrow - Stage 5 - checks.length == opposingScore + inFavorScore ", function () {

    beforeEach(async () => {
        const [owner] = await ethers.getSigners();

        [depositor, anFavor, opositor] = await ethers.provider.listAccounts();
        
        const Essentials  = { 
            gateway : IWETHGateway,
            aWETH,
            uniswapRouter : UNISWAP_ROUTER_ADDRESS,
            pool : AavePool,
            inFavor:anFavor,
            opposing : opositor,
            amount : ethers.utils.parseEther("10"),
            vrf : VRF_ADDR,
            link :LINK_ADDR,
            keyHash : keyHash, 
            fee : fee
          }

        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( Essentials);
        await escrow.deployed();
        aWETHcon = await ethers.getContractAt("IERC20", aWETH);
        
        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("10.0"), 
            });

        await escrow.inicialice();

    });

    it("Checker - Double call to approve ", async function () {
        let score;
        for(let i = 0; i < 19; i++){
            const randomValue = (Math.random() <= 0.5) ? 1 : 2;
            const oneDay = 1 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine");
            await escrow.checker(randomValue);
            score = await escrow.score();
        }
        const tester = await ethers.getSigner(5);
        const oneDay = 21 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        ethers.provider.send("evm_mine");
        
        x = await escrow.approve();
        await expect(escrow.approve()).to.be.revertedWith('Was already approved, if u ended up in a tie call withdrawByRandom!');
    
        });

    it("Checker - approve length == 21", async function () {
    
        for(let i = 0; i < 21; i++){
            const randomValue = (Math.random() <= 0.5) ? 1 : 2;
            const oneDay = 1 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine");
            await escrow.checker(randomValue);
            const score = await escrow.score();
        }
    
        const tester = await ethers.getSigner(5);
        const oneDay = 21 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        ethers.provider.send("evm_mine");
    
        anFavorBalance = (await ethers.provider.getBalance(anFavor)).toString();
        opositorBalance = (await ethers.provider.getBalance(opositor)).toString();
        
        x = await escrow.approve();
        receipt = await x.wait();
    
        anFavorBalanceAfter = (await ethers.provider.getBalance(anFavor)).toString();
        opositorBalanceAfter = (await ethers.provider.getBalance(opositor)).toString();


        expect( opositorBalanceAfter > opositorBalance  || anFavorBalanceAfter > anFavorBalance).to.be.true;


    }); 

    it("Checker - approve length < 21 , and not a tie", async function () {
        let score;
        for(let i = 0; i < 19; i++){
            const randomValue = (Math.random() <= 0.5) ? 1 : 2;
            const oneDay = 1 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine");
            await escrow.checker(randomValue);
            score = await escrow.score();
        }
        const tester = await ethers.getSigner(5);
        const oneDay = 21 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        ethers.provider.send("evm_mine");
        
        anFavorBalance = (await ethers.provider.getBalance(anFavor)).toString();
        opositorBalance = (await ethers.provider.getBalance(opositor)).toString();
        
        x = await escrow.approve();
        receipt = await x.wait();
    
        anFavorBalanceAfter = (await ethers.provider.getBalance(anFavor)).toString();
        opositorBalanceAfter = (await ethers.provider.getBalance(opositor)).toString();


        expect( opositorBalanceAfter > opositorBalance  || anFavorBalanceAfter > anFavorBalance).to.be.true;

    
        });
   
    it("Checker - approve length != 21 , and a tie", async function () {
        let score;

        for(let i = 0; i < 10; i++){
            const randomValue = (Math.random() <= 0.5) ? 1 : 2;
            const oneDay = 1 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine");
            await escrow.checker(1);
            score = await escrow.score();
        }
        for(let i = 0; i < 10; i++){
            const randomValue = (Math.random() <= 0.5) ? 1 : 2;
            const oneDay = 1 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            ethers.provider.send("evm_mine");
            await escrow.checker(2);
            score = await escrow.score();
        }
        const tester = await ethers.getSigner(5);
        const oneDay = 21 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        ethers.provider.send("evm_mine");

        x = await escrow.approve();
        receipt = await x.wait();

        const interface = new ethers.utils.Interface(vrfCoordinatorABI);
        const events = receipt.logs.filter(x => x.address === VRF_ADDR).map(x => interface.parseLog(x));
        randomnessRequestEvent = events.find(x => x.name === "RandomnessRequest");
        requestId = randomnessRequestEvent.args.requestID;

        const randomValue = (Math.round(Math.random()));
        await network.provider.send("hardhat_setBalance", [
            VRF_ADDR,
            "0xde0b6b3a7640000"
        ]);
        // impersonate the VRF coordinator to fullfill randomness 
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [VRF_ADDR],
        });

        const signer = await ethers.provider.getSigner(VRF_ADDR);
        await escrow.connect(signer).rawFulfillRandomness(requestId, randomValue);

        const randomResult = await escrow.randomResult();   

        WETHcon = await ethers.getContractAt("IERC20", WETH);
        anFavorBalance = (await WETHcon.balanceOf(anFavor));
        opositorBalance = (await WETHcon.balanceOf(opositor));

        const fell = await escrow.withdrawByRandom();
        anFavorBalanceA = (await WETHcon.balanceOf(anFavor));
        opositorBalanceA = (await WETHcon.balanceOf(opositor));
 
        //console.log("Pre", anFavorBalance.toString(), opositorBalance.toString());
        //console.log("Despues", anFavorBalanceA.toString(), opositorBalanceA.toString());

        //console.log(opositorBalance < opositorBalanceA);
        //console.log(anFavorBalance <  anFavorBalanceA);
        //console.log(opositorBalance == opositorBalanceA);
        //console.log(anFavorBalance ==  anFavorBalanceA);

        //expect( opositorBalanceA > opositorBalance  || anFavorBalanceA > anFavorBalance).to.be.true;
    });

});
