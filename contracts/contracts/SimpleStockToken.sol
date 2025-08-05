// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleStockToken
 * @dev A simplified stock token for Hedera deployment
 */
contract SimpleStockToken is ERC20, Ownable {
    string public stockSymbol;
    string public companyName;
    uint256 public maxSupply;
    
    event StockMinted(address indexed to, uint256 amount);
    event StockBurned(address indexed from, uint256 amount);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _stockSymbol,
        string memory _companyName,
        uint256 _maxSupply,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        stockSymbol = _stockSymbol;
        companyName = _companyName;
        maxSupply = _maxSupply;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
        emit StockMinted(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit StockBurned(msg.sender, amount);
    }
    
    function getStockInfo() external view returns (
        string memory _stockSymbol,
        string memory _companyName,
        uint256 _maxSupply,
        uint256 _totalSupply
    ) {
        return (stockSymbol, companyName, maxSupply, totalSupply());
    }
}
