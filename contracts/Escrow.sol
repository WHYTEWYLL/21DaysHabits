//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.5;

import "./interfaces/IERC20.sol";
import "./interfaces/IWETHGateway.sol";
import "./interfaces/ILendingPool.sol";
import "hardhat/console.sol";

contract Escrow {

    address arbiter;
    address inFavor;
    address opposing;
    uint public initialDeposit;
    uint public initTime;
    uint public timeChecker;
    uint rangeTime = 21 days;

    bool inited;
    enum Winner {None, P1, P2}
    
   IWETHGateway gateway;
   IERC20 aWETH;
    
    Winner[] public checks = new Winner[](21);
    
    constructor( IWETHGateway _gateway, IERC20 _aWETH , address _inFavor, address _opposing, uint _amount )  {
        aWETH = _aWETH;
        gateway  = _gateway;

        arbiter = msg.sender;
        inFavor = _inFavor;
        opposing = _opposing;

        initialDeposit = _amount;        
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

    event Approved();

   function approve() external {
    require(inited, "First you have to call inicialice");
    console.log(initTime, rangeTime, block.timestamp);
    require(msg.sender == arbiter, "Approve must be called by the arbiter!");
    require(initTime + rangeTime < block.timestamp, "21 days minim");
    console.log("1");

   // (uint8 opposingScore, uint8 inFavorScore) = score();
    // uint balance = aWETH.balanceOf(address(this));
//
   // aWETH.approve(address(gateway), balance);
   // if(checks.length == opposingScore + inFavorScore){
   // 
   //   if (opposingScore > inFavorScore){
   //     gateway.withdrawETH(initialDeposit, opposing);  
   //   }
   //   if ( inFavorScore > opposingScore){
   //     gateway.withdrawETH( initialDeposit, inFavor);  
   //   }
   //   gateway.withdrawETH( type(uint).max, arbiter);
   // } else{
   //   uint amountinvalid = type(uint).max / 2;
   //   if (opposingScore > inFavorScore){
   //     gateway.withdrawETH(amountinvalid, opposing);  
   //   }
   //   if ( inFavorScore > opposingScore){
   //     gateway.withdrawETH(amountinvalid, inFavor);  
   //   }
   // }
   		emit Approved();
   }

    receive() external payable { }

}
