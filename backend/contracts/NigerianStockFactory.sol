// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./NigerianStockToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NigerianStockFactory
 * @dev Factory contract for deploying Nigerian Stock Exchange tokens on Bitfinity EVM
 */
contract NigerianStockFactory is Ownable, ReentrancyGuard {
    // Deployed token tracking
    mapping(string => address) public stockTokens;
    mapping(address => bool) public isStockToken;
    address[] public allTokens;
    
    // Events
    event StockTokenDeployed(
        string indexed stockSymbol,
        address indexed tokenAddress,
        string name,
        string companyName,
        uint256 maxSupply
    );
    
    event TokenUpdated(string indexed stockSymbol, address indexed oldAddress, address indexed newAddress);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deploy a new Nigerian stock token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _stockSymbol NGX stock symbol
     * @param _companyName Company name
     * @param _maxSupply Maximum supply
     * @param _initialSupply Initial supply
     * @param _admin Admin address for the token
     */
    function deployStockToken(
        string memory _name,
        string memory _symbol,
        string memory _stockSymbol,
        string memory _companyName,
        uint256 _maxSupply,
        uint256 _initialSupply,
        address _admin
    ) external onlyOwner nonReentrant returns (address) {
        require(bytes(_stockSymbol).length > 0, "Stock symbol cannot be empty");
        require(stockTokens[_stockSymbol] == address(0), "Stock token already exists");
        require(_admin != address(0), "Admin cannot be zero address");

        // Deploy new token
        NigerianStockToken newToken = new NigerianStockToken(
            _name,
            _symbol,
            _stockSymbol,
            _companyName,
            _maxSupply,
            _initialSupply,
            _admin
        );

        address tokenAddress = address(newToken);
        
        // Register token
        stockTokens[_stockSymbol] = tokenAddress;
        isStockToken[tokenAddress] = true;
        allTokens.push(tokenAddress);

        emit StockTokenDeployed(_stockSymbol, tokenAddress, _name, _companyName, _maxSupply);
        
        return tokenAddress;
    }

    /**
     * @dev Update token address for a stock symbol (in case of redeployment)
     * @param _stockSymbol Stock symbol
     * @param _newTokenAddress New token address
     */
    function updateStockToken(string memory _stockSymbol, address _newTokenAddress) external onlyOwner {
        require(bytes(_stockSymbol).length > 0, "Stock symbol cannot be empty");
        require(_newTokenAddress != address(0), "New token address cannot be zero");
        
        address oldAddress = stockTokens[_stockSymbol];
        stockTokens[_stockSymbol] = _newTokenAddress;
        
        if (oldAddress != address(0)) {
            isStockToken[oldAddress] = false;
        }
        
        isStockToken[_newTokenAddress] = true;
        allTokens.push(_newTokenAddress);

        emit TokenUpdated(_stockSymbol, oldAddress, _newTokenAddress);
    }

    /**
     * @dev Get token address by stock symbol
     * @param _stockSymbol Stock symbol
     * @return Token address
     */
    function getTokenAddress(string memory _stockSymbol) external view returns (address) {
        return stockTokens[_stockSymbol];
    }

    /**
     * @dev Check if address is a registered stock token
     * @param _tokenAddress Token address to check
     * @return True if registered stock token
     */
    function isRegisteredStockToken(address _tokenAddress) external view returns (bool) {
        return isStockToken[_tokenAddress];
    }

    /**
     * @dev Get all deployed token addresses
     * @return Array of token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @dev Get total number of deployed tokens
     * @return Number of tokens
     */
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    /**
     * @dev Get token information by stock symbol
     * @param _stockSymbol Stock symbol
     * @return tokenAddress Token contract address
     * @return name Token name
     * @return symbol Token symbol
     * @return companyName Company name
     * @return totalSupply Total token supply
     * @return maxSupply Maximum token supply
     * @return decimals Token decimals
     */
    function getTokenInfo(string memory _stockSymbol) external view returns (
        address tokenAddress,
        string memory name,
        string memory symbol,
        string memory companyName,
        uint256 totalSupply,
        uint256 maxSupply,
        uint8 decimals
    ) {
        address token = stockTokens[_stockSymbol];
        require(token != address(0), "Token not found");
        
        NigerianStockToken stockToken = NigerianStockToken(token);
        
        return (
            token,
            stockToken.name(),
            stockToken.symbol(),
            stockToken.companyName(),
            stockToken.totalSupply(),
            stockToken.maxSupply(),
            stockToken.decimals()
        );
    }

    /**
     * @dev Batch deploy multiple stock tokens
     * @param _tokenData Array of token deployment data
     * @param _admin Admin address for all tokens
     */
    function batchDeployStockTokens(
        TokenDeploymentData[] memory _tokenData,
        address _admin
    ) external onlyOwner nonReentrant returns (address[] memory) {
        require(_tokenData.length > 0, "No token data provided");
        require(_admin != address(0), "Admin cannot be zero address");
        
        address[] memory deployedTokens = new address[](_tokenData.length);
        
        for (uint256 i = 0; i < _tokenData.length; i++) {
            TokenDeploymentData memory data = _tokenData[i];
            
            require(bytes(data.stockSymbol).length > 0, "Stock symbol cannot be empty");
            require(stockTokens[data.stockSymbol] == address(0), "Stock token already exists");
            
            // Deploy token
            NigerianStockToken newToken = new NigerianStockToken(
                data.name,
                data.symbol,
                data.stockSymbol,
                data.companyName,
                data.maxSupply,
                data.initialSupply,
                _admin
            );
            
            address tokenAddress = address(newToken);
            
            // Register token
            stockTokens[data.stockSymbol] = tokenAddress;
            isStockToken[tokenAddress] = true;
            allTokens.push(tokenAddress);
            deployedTokens[i] = tokenAddress;
            
            emit StockTokenDeployed(
                data.stockSymbol,
                tokenAddress,
                data.name,
                data.companyName,
                data.maxSupply
            );
        }
        
        return deployedTokens;
    }

    // Struct for batch deployment
    struct TokenDeploymentData {
        string name;
        string symbol;
        string stockSymbol;
        string companyName;
        uint256 maxSupply;
        uint256 initialSupply;
    }
}
