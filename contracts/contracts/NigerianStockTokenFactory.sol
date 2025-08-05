// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./NigerianStockToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NigerianStockTokenFactory
 * @dev Factory contract for deploying and managing Nigerian Stock Exchange tokens
 * @dev Provides centralized management and batch operations for all stock tokens
 */
contract NigerianStockTokenFactory is AccessControl, ReentrancyGuard, Pausable {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Deployed tokens registry
    mapping(string => address) public stockTokens; // symbol => token address
    mapping(address => bool) public isValidStockToken;
    string[] public deployedSymbols;
    
    // Factory statistics
    uint256 public totalDeployedTokens;
    uint256 public totalMarketCap;
    
    // Events
    event StockTokenDeployed(
        string indexed symbol,
        address indexed tokenAddress,
        string name,
        uint256 initialSupply,
        address admin
    );
    event StockTokenUpdated(string indexed symbol, address indexed tokenAddress);
    event BatchDeploymentCompleted(uint256 totalTokens);
    event MarketCapUpdated(uint256 newTotalMarketCap);

    // Custom errors
    error TokenAlreadyExists(string symbol);
    error TokenNotFound(string symbol);
    error InvalidTokenAddress(address tokenAddress);
    error InvalidArrayLength();
    error ZeroAddress();

    /**
     * @dev Constructor
     * @param _admin Admin address for the factory
     */
    constructor(address _admin) {
        if (_admin == address(0)) revert ZeroAddress();
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(DEPLOYER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    /**
     * @dev Deploy a new Nigerian stock token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _initialSupply Initial token supply
     * @param _stockMetadata Stock metadata
     * @param _tokenAdmin Admin address for the token
     */
    function deployStockToken(
        string calldata _name,
        string calldata _symbol,
        uint256 _initialSupply,
        NigerianStockToken.StockMetadata calldata _stockMetadata,
        address _tokenAdmin
    ) external onlyRole(DEPLOYER_ROLE) nonReentrant whenNotPaused returns (address) {
        return _deployStockTokenInternal(_name, _symbol, _initialSupply, _stockMetadata, _tokenAdmin);
    }

    /**
     * @dev Internal function to deploy a stock token
     */
    function _deployStockTokenInternal(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        NigerianStockToken.StockMetadata memory _stockMetadata,
        address _tokenAdmin
    ) internal returns (address) {
        if (stockTokens[_symbol] != address(0)) revert TokenAlreadyExists(_symbol);
        if (_tokenAdmin == address(0)) revert ZeroAddress();

        // Deploy new token
        NigerianStockToken newToken = new NigerianStockToken(
            _name,
            _symbol,
            _initialSupply,
            _stockMetadata,
            _tokenAdmin
        );

        address tokenAddress = address(newToken);

        // Register token
        stockTokens[_symbol] = tokenAddress;
        isValidStockToken[tokenAddress] = true;
        deployedSymbols.push(_symbol);
        totalDeployedTokens++;
        totalMarketCap += _stockMetadata.marketCap;

        emit StockTokenDeployed(_symbol, tokenAddress, _name, _initialSupply, _tokenAdmin);

        return tokenAddress;
    }

    /**
     * @dev Batch deploy multiple stock tokens
     * @param _tokenData Array of token deployment data
     */
    function batchDeployStockTokens(
        TokenDeploymentData[] calldata _tokenData
    ) external onlyRole(DEPLOYER_ROLE) nonReentrant whenNotPaused {
        if (_tokenData.length == 0) revert InvalidArrayLength();

        for (uint256 i = 0; i < _tokenData.length; i++) {
            TokenDeploymentData calldata data = _tokenData[i];

            if (stockTokens[data.symbol] == address(0)) {
                _deployStockTokenInternal(
                    data.name,
                    data.symbol,
                    data.initialSupply,
                    data.stockMetadata,
                    data.tokenAdmin
                );
            }
        }

        emit BatchDeploymentCompleted(_tokenData.length);
    }

    /**
     * @dev Get token address by symbol
     * @param _symbol Token symbol
     */
    function getTokenAddress(string calldata _symbol) external view returns (address) {
        address tokenAddress = stockTokens[_symbol];
        if (tokenAddress == address(0)) revert TokenNotFound(_symbol);
        return tokenAddress;
    }

    /**
     * @dev Get all deployed token symbols
     */
    function getAllDeployedSymbols() external view returns (string[] memory) {
        return deployedSymbols;
    }

    /**
     * @dev Get token information by symbol
     * @param _symbol Token symbol
     */
    function getTokenInfo(string calldata _symbol)
        external
        view
        returns (NigerianStockToken.StockMetadata memory)
    {
        address payable tokenAddress = payable(stockTokens[_symbol]);
        if (tokenAddress == address(0)) revert TokenNotFound(_symbol);

        return NigerianStockToken(tokenAddress).getStockInfo();
    }

    /**
     * @dev Update market cap for a token (only ADMIN_ROLE)
     * @param _symbol Token symbol
     * @param _newMarketCap New market cap value
     */
    function updateTokenMarketCap(string calldata _symbol, uint256 _newMarketCap)
        external
        onlyRole(ADMIN_ROLE) {
        address payable tokenAddress = payable(stockTokens[_symbol]);
        if (tokenAddress == address(0)) revert TokenNotFound(_symbol);

        NigerianStockToken token = NigerianStockToken(tokenAddress);
        NigerianStockToken.StockMetadata memory currentInfo = token.getStockInfo();

        // Update total market cap
        totalMarketCap = totalMarketCap - currentInfo.marketCap + _newMarketCap;

        // Update token metadata
        currentInfo.marketCap = _newMarketCap;
        currentInfo.lastUpdated = block.timestamp;

        token.updateStockMetadata(currentInfo);

        emit MarketCapUpdated(totalMarketCap);
    }

    /**
     * @dev Pause the factory (only PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the factory (only PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Get factory statistics
     */
    function getFactoryStats() external view returns (
        uint256 _totalDeployedTokens,
        uint256 _totalMarketCap,
        uint256 _totalSymbols
    ) {
        return (totalDeployedTokens, totalMarketCap, deployedSymbols.length);
    }

    /**
     * @dev Check if a token address is valid
     * @param _tokenAddress Token address to check
     */
    function isValidToken(address _tokenAddress) external view returns (bool) {
        return isValidStockToken[_tokenAddress];
    }

    // Struct for batch deployment
    struct TokenDeploymentData {
        string name;
        string symbol;
        uint256 initialSupply;
        NigerianStockToken.StockMetadata stockMetadata;
        address tokenAdmin;
    }

    /**
     * @dev Emergency function to remove a token from registry (only ADMIN_ROLE)
     * @param _symbol Token symbol to remove
     */
    function removeTokenFromRegistry(string calldata _symbol) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        address tokenAddress = stockTokens[_symbol];
        if (tokenAddress == address(0)) revert TokenNotFound(_symbol);

        // Remove from mappings
        delete stockTokens[_symbol];
        isValidStockToken[tokenAddress] = false;
        
        // Remove from array (expensive operation, use carefully)
        for (uint256 i = 0; i < deployedSymbols.length; i++) {
            if (keccak256(bytes(deployedSymbols[i])) == keccak256(bytes(_symbol))) {
                deployedSymbols[i] = deployedSymbols[deployedSymbols.length - 1];
                deployedSymbols.pop();
                break;
            }
        }
        
        totalDeployedTokens--;
    }

    /**
     * @dev Get paginated list of deployed tokens
     * @param _offset Starting index
     * @param _limit Number of tokens to return
     */
    function getDeployedTokensPaginated(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (string[] memory symbols, address[] memory addresses) 
    {
        uint256 totalSymbols = deployedSymbols.length;
        if (_offset >= totalSymbols) {
            return (new string[](0), new address[](0));
        }

        uint256 end = _offset + _limit;
        if (end > totalSymbols) {
            end = totalSymbols;
        }

        uint256 length = end - _offset;
        symbols = new string[](length);
        addresses = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            symbols[i] = deployedSymbols[_offset + i];
            addresses[i] = stockTokens[symbols[i]];
        }
    }
}
