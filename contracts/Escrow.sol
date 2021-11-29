//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.5;

import "./interfaces/IERC20.sol";
import "./interfaces/IWETHGateway.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/ILendingPool.sol";
import "hardhat/console.sol";

import "@chainlink/contracts/src/v0.7/VRFConsumerBase.sol";



contract Escrow is VRFConsumerBase {

    address arbiter;
    address inFavor;
    address opposing;
    address randomer;
    uint public initialDeposit;
    uint public initTime;
    uint public timeChecker;
    uint rangeTime = 21 days;

    bytes32 public keyHash;
    uint256 public fee;
    uint public randomResult;


    bool inited;
    enum Winner {None, P1, P2}
    
    IWETHGateway gateway;
    ILendingPool pool;
    IERC20 aWETH;
    
    address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;
    

    
    IUniswapV2Router02 public uniswapRouter;

    Winner[] public checks = new Winner[](21);

    
    constructor( IWETHGateway _gateway, IERC20 _aWETH , address _inFavor, address _opposing, uint _amount, 
                address _vrfCoordinator,
                address _link,
                bytes32 _keyHash,
                uint _fee) VRFConsumerBase(
                              _vrfCoordinator, // VRF Coordinator
                              _link  // LINK Token
        ) public {
        aWETH = _aWETH;
        gateway  = _gateway;

        arbiter = msg.sender;
        inFavor = _inFavor;
        opposing = _opposing;
        initialDeposit = _amount;      
        keyHash = _keyHash;
        fee = _fee;
    }
    
    function getRandomNumber() public returns (bytes32) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(keyHash, fee);
    }
    
    function fulfillRandomness(bytes32, uint256 ramdoness) internal override {
        randomResult = ramdoness;
    }  
    
    function inicialice() external{

      require(msg.sender == arbiter || msg.sender == inFavor || msg.sender == opposing ,"Not a member.");
      require(address(this).balance == initialDeposit, "Deposit not enough.");

      initTime = block.timestamp;
      timeChecker = block.timestamp;


      gateway.depositETH{value: address(this).balance}( address(this), 0 );

      inited = true;
    }


    function checker(Winner stateOfDay) external{
      require(msg.sender == arbiter, "Only the arbiter");
      require(timeChecker + 1 days < block.timestamp, "One input per 24h");

      timeChecker = block.timestamp;
      checks.push(stateOfDay);
    }

    function score() public view returns(uint8, uint8){
      uint8 gambler;
      uint8 fighter;

      for(uint i = 0; i < checks.length; i++){

        if(checks[i] == Winner.P1){
          fighter++;
        } else if(checks[i] == Winner.P2){
          gambler++;
        }
      }
      return ( fighter , gambler );
    }


  function withdrawLogic(uint opposingScore, uint inFavorScore, uint _amount) internal {
    if (opposingScore > inFavorScore){
      gateway.withdrawETH(_amount, opposing);  
     }
    else if ( inFavorScore > opposingScore){
      gateway.withdrawETH( _amount, inFavor);  
     }
  }

    event Approved();

  function getLinkWithArbiterFee() private{


    pool = ILendingPool(0x398eC7346DcD622eDc5ae82352F02bE94C62d119);

    uint balanceaWETH = aWETH.balanceOf(address(this));
    uint balanceforLink = balanceaWETH - initialDeposit;

    gateway.withdrawETH(balanceforLink, address(this));
    
    console.log(address(this).balance);
    
    //pool.withdraw(address(aWETH), balanceforLink, address(this)); // Trying withdraw aWETH to WETH , not working Test1.js
    
    uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS);
    address[] memory path = new address[](2);
    path[0] = uniswapRouter.WETH();
    path[1] = address(0x514910771AF9Ca656af840dff83E8264EcF986CA);
    uint deadline = block.timestamp + 15; 

    uniswapRouter.swapETHForExactTokens{value: 10}(fee, path, address(this), deadline);

  }
   function approve() external {
    require(inited, "First you have to call inicialice");
    require(msg.sender == arbiter, "Approve must be called by the arbiter!");
    require(initTime + rangeTime < block.timestamp, "21 days minim");
    //require(checks.length == opposingScore + inFavorScore);


    (uint8 opposingScore, uint8 inFavorScore) = score();
    uint balance = aWETH.balanceOf(address(this));

    aWETH.approve(address(gateway), balance);
   
    if(checks.length == opposingScore + inFavorScore){
        withdrawLogic(opposingScore, inFavorScore, initialDeposit);
        gateway.withdrawETH( type(uint).max, arbiter);
    } else if (opposingScore == inFavorScore) {
      getLinkWithArbiterFee();
      bytes32 la =  getRandomNumber();
    }else{
        uint amountinvalid = balance / 2;
        withdrawLogic(opposingScore, inFavorScore, amountinvalid);
    }

      emit Approved();
   }

    receive() external payable { }

}
