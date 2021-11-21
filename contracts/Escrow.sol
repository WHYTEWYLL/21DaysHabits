//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.5;

import "./interfaces/IERC20.sol";
import "./interfaces/ILendingPool.sol";

contract Escrow {
    address arbiter;
    address inFavor;
    address opposing;
    uint public initialDeposit;
    uint initTime;
    uint timeChecker;
    uint rangeTime = 21 days;

    enum Winner {P1, P2}

    Winner[] public checks = new Winner[](21);

    ILendingPool pool  = ILendingPool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
    IERC20 aDai = IERC20(0x028171bCA77440897B824Ca71D1c56caC55b68A3);
    IERC20 dai = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    
    constructor(address _inFavor, address _opposing, uint _amount)  {
        arbiter = msg.sender;
        inFavor = _inFavor;
        opposing = _opposing;

        initialDeposit = _amount;        
   	}
    
    function inicialice() external{
      require(msg.sender == arbiter || msg.sender == inFavor || msg.sender == opposing ,"Not a member.");
      require(address(this).balance == initialDeposit, "Deposit not enought.");

      initTime = block.timestamp;
      timeChecker = block.timestamp;
      dai.transferFrom(msg.sender, address(this), initialDeposit);
      dai.approve(address(pool), initialDeposit);
      pool.deposit(address(dai), initialDeposit, address(this), 0);
    }


    function checker(Winner stateOfDay) external{
      require(msg.sender == arbiter);
      require(timeChecker + 1 days < block.timestamp);

      timeChecker = block.timestamp;
      checks.push(stateOfDay);
    }

    function score() public view returns(uint8, uint8){
      uint8 gambler;
      uint8 fighter;

      for(uint i = 0; i < checks.length; i++){
        if(checks[i] == Winner.P1){
          fighter++;
        }else{
          gambler++;
        }
      }
      return (gambler, fighter);
    }

    event Approved();

    function approve() external {
        require(msg.sender == arbiter, "Approve must be called by the arbiter!");
        require(initTime + rangeTime < block.timestamp);

        (uint8 opposingScore, uint8 inFavorScore) = score();

        uint balance = aDai.balanceOf(address(this));

        aDai.approve(address(pool), balance);

        if (checks.length == opposingScore + inFavorScore){
        
          if (opposingScore > inFavorScore){
            pool.withdraw(address(dai), initialDeposit, opposing);  
          }
          if ( inFavorScore > opposingScore){
            pool.withdraw(address(dai), initialDeposit, inFavor);  
          }

          pool.withdraw(address(dai), type(uint).max, arbiter);
        } else{
          uint amountinvalid = type(uint).max / 2;
          if (opposingScore > inFavorScore){
            pool.withdraw(address(dai), amountinvalid, opposing);  
          }
          if ( inFavorScore > opposingScore){
            pool.withdraw(address(dai), amountinvalid, inFavor);  
          }
        }

    		emit Approved();
    }

    receive() external payable { }

}
