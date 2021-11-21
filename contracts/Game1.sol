//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

contract Game1 {
  bool public isWon;
  bool public unlocked;
  address a;
  constructor(address pasa){
    a = pasa;
  }
  function unlock() external {
    unlocked = true;
  }

  function win() external {
    require(unlocked, "Nope. Try again!");

    isWon = true;
  }
}
