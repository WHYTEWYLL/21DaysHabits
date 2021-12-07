//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.5;
pragma abicoder v2;
import "./interfaces/IERC20.sol";
import "./interfaces/IWETHGateway.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/ILendingPool.sol";
import "hardhat/console.sol";

import "@chainlink/contracts/src/v0.7/VRFConsumerBase.sol";



contract Escrow is VRFConsumerBase {

  address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;
  address arbiter;
  address inFavor;
  address opposing;
  address link;

  uint public initialDeposit;
  uint public initTime;
  uint public timeChecker;
  uint public randomResult;
  uint public fee;

  bytes32 public keyHash;


  bool inited;
  bool public approved;
  bool withdraw;
  enum Winner {None, P1, P2}
  
  IWETHGateway gateway;
  ILendingPool pool;
  IERC20 aWETH;
  
  
  IUniswapV2Router02 public uniswapRouter;

  Winner[] public checks;

  struct Essentials { 
    IWETHGateway gateway;
    IERC20 aWETH;
    address inFavor;
    address opposing;
    uint amount;
    address vrf;
    address link;
    bytes32 keyHash;
    uint fee;
  }
  constructor( Essentials memory inicial
              ) VRFConsumerBase( inicial.vrf,inicial.link ) {
    aWETH = inicial.aWETH;
    gateway  = inicial.gateway;

    arbiter = msg.sender;
    inFavor = inicial.inFavor;
    opposing = inicial.opposing;
    initialDeposit = inicial.amount;      
    keyHash = inicial.keyHash;
    fee =  inicial.fee;
    link = inicial.link;
  }
    
  /**
   * @dev Repays a borrowed `amount` on a specific reserve, burning the equivalent debt tokens owned
   **/
  function inicialice() external{

    require(msg.sender == arbiter || msg.sender == inFavor || msg.sender == opposing ,"Not a member.");
    require(address(this).balance == initialDeposit, "Deposit not enough.");

    initTime = block.timestamp;
    timeChecker = block.timestamp;


    gateway.depositETH{value: address(this).balance}( address(this), 0 );

    inited = true;
    emit Inicialiced(msg.sender);
  }

  /**
   * @dev  Input the result of the day, did the person do the habit or not 
   * @param stateOfDay Resulto of the day - Winner ( None, P1, P2)
   **/
  function checker(Winner stateOfDay) external{
    //
    require(msg.sender == arbiter, "Only the arbiter");
    require(inited,"Init first");
    require(timeChecker + 1 days < block.timestamp, "One input per 24h");
    require(checks.length <= 21);

    timeChecker = block.timestamp;
    checks.push(stateOfDay);
    emit Checker();
  }

  /**
   * @dev  returns the score of both persons, the one trying to set the habit, and the other
   * against
   * @return score 
   **/
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

  /**
   * @dev  Executes de withdraw from the aAve Lending Pool, based of the score
   **/
  function withdrawLogic(uint opposingScore, uint inFavorScore, uint _amount) internal {
    // Sends the initalamount for the winner
    if (opposingScore > inFavorScore){
      gateway.withdrawETH(_amount, opposing);  
     }
    else if ( inFavorScore > opposingScore){
      gateway.withdrawETH( _amount, inFavor);  
     }
  }

  
  /**
   * @dev  Provides us Link. In case of tie, we need Link for that we take 
   * some of the aWETH -> WETH -> Link. For being available to call Chainlink's VRF
   **/
  function getLinkWithArbiterFee() private {

    pool = ILendingPool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);

    uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS);
    address[] memory path = new address[](2);
    uint balanceaWETH = aWETH.balanceOf(address(this));
    uint deadline = block.timestamp + 15; 

    path[0] = uniswapRouter.WETH();
    path[1] = address(link); 
    
    pool.withdraw(uniswapRouter.WETH(), balanceaWETH, address(this));

    IERC20(uniswapRouter.WETH()).approve(address(uniswapRouter), balanceaWETH);
    uniswapRouter.swapTokensForExactTokens(fee, balanceaWETH, path, address(this), deadline);


  }

  
  /**
   * @dev  Approves withdraw, and calls getRandomNumber in case of tie
   **/
  function approve() external {
    require(inited, "First you have to call inicialice");
    require(msg.sender == arbiter, "Approve must be called by the arbiter!");
    require(initTime + 21 days < block.timestamp, "21 days minim");
    require(!approved, "Was already approved, if u ended up in a tie call withdrawByRandom!");
    (uint8 opposingScore, uint8 inFavorScore) = score();
    uint balance = aWETH.balanceOf(address(this));

    aWETH.approve(address(gateway), type(uint).max);

    if(checks.length == 21){
          withdrawLogic(opposingScore, inFavorScore, initialDeposit);
          gateway.withdrawETH( type(uint).max, arbiter);
    } else {

        if(opposingScore != inFavorScore){

          uint amountinvalid = balance / 2;
          gateway.withdrawETH( amountinvalid, inFavor); 
          gateway.withdrawETH( type(uint).max, opposing); 

        } else{
          getLinkWithArbiterFee();
          getRandomNumber();
          
        }
    approved = true;
    }
    
    emit Approved();
  }


  /**
   * @dev  Logic used when randomness  is required. All the funds are sent on WETH, 
   * the winner would have to unwrapper it.
   **/
  function withdrawByRandom() external{
    require(approved);

    IERC20 WETH = IERC20(uniswapRouter.WETH());
    uint total = WETH.balanceOf(address(this));
    if(randomResult>0){
      WETH.transfer( inFavor, total); 
    }else{
      WETH.transfer( opposing, total);
    }
  }

  receive() external payable {}

  /**
   * @dev Allows our contract to request a random number thought ChainLinks Oracle VRF
   **/
  function getRandomNumber() private returns (bytes32) {
      require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
      return requestRandomness(keyHash, fee);
  }
  
  /**
   * @dev Allows Oracle to fufill the randomnumber we requested
   * @param ramdoness random number fufilled by ChainShot's Oracle
   **/
  function fulfillRandomness(bytes32, uint256 ramdoness) internal override {
      randomResult = ramdoness % 2 ;
  }  
  
  event Approved();
  event Inicialiced(address indexed initializer);
  event Checker();
  event Scored(uint8 P1, uint8 P2);
  event Depositor(address indexed depositor, uint amount);
}