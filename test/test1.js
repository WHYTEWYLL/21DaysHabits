const { BigNumber } = require("@ethersproject/bignumber");
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");


const IWETHGateway = "0xDcD33426BA191383f1c9B431A342498fdac73488";
let aWETH  = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";

describe("Escrow - Stage 4 - Chainlink & Score", function () {
    let escrow;
    const LINK_ADDR = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
    const VRF_ADDR = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";
    const keyHash = "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445";
    const fee = BigNumber.from(2);




    beforeEach(async () => {
        const [owner] = await ethers.getSigners();

        [depositor, anFavor, opositor, tester] = await ethers.provider.listAccounts();
        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy( IWETHGateway, aWETH , anFavor, opositor, ethers.utils.parseEther("10"), VRF_ADDR, LINK_ADDR, keyHash, fee);
        await escrow.deployed();
        aWETHcon = await ethers.getContractAt("IERC20", aWETH);
        const transactionHash = await owner.sendTransaction({
            to: escrow.address,
            value: ethers.utils.parseEther("10.0"), 
            });
        
//
    });

    it("Checker - 21 days minim ", async function () {
        await escrow.inicialice();

        const tester = await ethers.getSigner(5);
        const oneDay = 21 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        ethers.provider.send("evm_mine");

        const x = await escrow.approve()});
});


