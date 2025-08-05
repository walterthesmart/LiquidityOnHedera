// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleTest
 * @dev A simple test contract to verify Hedera deployment
 */
contract SimpleTest {
    string public message;
    uint256 public number;
    address public owner;
    
    event MessageUpdated(string newMessage);
    event NumberUpdated(uint256 newNumber);
    
    constructor(string memory _message) {
        message = _message;
        number = 42;
        owner = msg.sender;
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
    
    function setMessage(string memory _message) public {
        message = _message;
        emit MessageUpdated(_message);
    }
    
    function getNumber() public view returns (uint256) {
        return number;
    }
    
    function setNumber(uint256 _number) public {
        number = _number;
        emit NumberUpdated(_number);
    }
    
    function getOwner() public view returns (address) {
        return owner;
    }
    
    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }
    
    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
