// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SimpleStockToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleStockFactory
 * @dev A simplified factory for creating stock tokens on Hedera
 */
contract SimpleStockFactory is Ownable {
    mapping(string => address) public stockTokens;
    string[] public deployedSymbols;
    uint256 public totalDeployedTokens;
    
    event StockTokenDeployed(
        string indexed symbol,
        address indexed tokenAddress,
        string name,
        address owner
    );
    
    constructor(address _owner) Ownable(_owner) {}
    
    function deployStockToken(
        string memory _name,
        string memory _symbol,
        string memory _stockSymbol,
        string memory _companyName,
        uint256 _maxSupply
    ) external onlyOwner returns (address) {
        require(stockTokens[_stockSymbol] == address(0), "Token already exists");
        
        SimpleStockToken newToken = new SimpleStockToken(
            _name,
            _symbol,
            _stockSymbol,
            _companyName,
            _maxSupply,
            owner()
        );
        
        address tokenAddress = address(newToken);
        stockTokens[_stockSymbol] = tokenAddress;
        deployedSymbols.push(_stockSymbol);
        totalDeployedTokens++;
        
        emit StockTokenDeployed(_stockSymbol, tokenAddress, _name, owner());
        
        return tokenAddress;
    }
    
    function getTokenAddress(string memory _symbol) external view returns (address) {
        return stockTokens[_symbol];
    }
    
    function getAllDeployedSymbols() external view returns (string[] memory) {
        return deployedSymbols;
    }
    
    function getTokenCount() external view returns (uint256) {
        return totalDeployedTokens;
    }
}
