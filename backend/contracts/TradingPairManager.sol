// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./StockNGNDEX.sol";
import "./NGNStablecoin.sol";
import "./NigerianStockToken.sol";
import "./NigerianStockTokenFactory.sol";

/**
 * @title TradingPairManager
 * @dev Unified interface for managing multiple stock-to-NGN trading pairs
 * @dev Provides centralized management, batch operations, and integration utilities
 * 
 * Features:
 * - Unified interface for multiple DEX contracts
 * - Batch trading pair creation and management
 * - Cross-network compatibility
 * - Integration with existing Sepolia stock contracts
 * - Automated liquidity management
 * - Fee optimization and distribution
 * - Emergency controls and monitoring
 */
contract TradingPairManager is AccessControl, ReentrancyGuard, Pausable {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant LIQUIDITY_MANAGER_ROLE = keccak256("LIQUIDITY_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Core contracts
    NGNStablecoin public immutable ngnToken;
    StockNGNDEX public immutable dexContract;
    NigerianStockTokenFactory public immutable stockFactory;

    // Trading pair management
    struct ManagedPair {
        address stockToken;
        string symbol;
        string companyName;
        bool isActive;
        uint256 createdAt;
        uint256 initialNGNLiquidity;
        uint256 initialStockLiquidity;
        uint256 feeRate;
        uint256 targetLiquidityNGN; // Target liquidity in NGN
        bool autoRebalance; // Whether to automatically rebalance liquidity
        uint256 lastRebalance;
    }

    // Cross-network integration
    struct NetworkConfig {
        uint256 chainId;
        string networkName;
        address factoryAddress;
        bool isSupported;
        uint256 gasLimit;
        uint256 maxSlippage;
    }

    // State variables
    mapping(address => ManagedPair) public managedPairs; // stockToken => ManagedPair
    mapping(string => address) public symbolToToken; // symbol => stockToken address
    address[] public allManagedTokens;
    
    // Network configurations
    mapping(uint256 => NetworkConfig) public networkConfigs;
    uint256[] public supportedChainIds;
    
    // Liquidity management
    mapping(address => uint256) public liquidityTargets; // stockToken => target NGN liquidity
    mapping(address => uint256) public rebalanceThresholds; // stockToken => threshold percentage
    
    // Statistics and monitoring
    uint256 public totalManagedPairs;
    uint256 public totalLiquidityManaged;
    uint256 public totalVolumeProcessed;
    
    // Configuration
    struct ManagerConfig {
        uint256 defaultFeeRate;
        uint256 defaultLiquidityTarget;
        uint256 defaultRebalanceThreshold;
        uint256 maxPairsPerBatch;
        bool autoLiquidityEnabled;
        uint256 emergencyWithdrawDelay;
    }

    ManagerConfig public config;

    // Events
    event PairCreated(
        address indexed stockToken,
        string symbol,
        uint256 initialNGNLiquidity,
        uint256 initialStockLiquidity,
        uint256 feeRate
    );
    event PairUpdated(address indexed stockToken, bool isActive, uint256 newFeeRate);
    event LiquidityRebalanced(
        address indexed stockToken,
        uint256 oldNGNAmount,
        uint256 newNGNAmount,
        uint256 oldStockAmount,
        uint256 newStockAmount
    );
    event BatchOperationCompleted(string operation, uint256 pairsProcessed);
    event NetworkConfigUpdated(uint256 indexed chainId, string networkName, bool isSupported);
    event EmergencyAction(string action, address indexed target, uint256 amount);

    // Custom errors
    error PairAlreadyExists(address stockToken);
    error PairNotFound(address stockToken);
    error InvalidConfiguration();
    error NetworkNotSupported(uint256 chainId);
    error InsufficientLiquidity(uint256 available, uint256 required);
    error BatchSizeExceeded(uint256 requested, uint256 maximum);
    error ZeroAddress();
    error InvalidAmount(uint256 amount);
    error RebalanceThresholdNotMet(uint256 current, uint256 threshold);

    /**
     * @dev Constructor
     * @param _ngnToken Address of the NGN stablecoin contract
     * @param _dexContract Address of the DEX contract
     * @param _stockFactory Address of the stock token factory
     * @param _admin Admin address
     * @param _initialConfig Initial manager configuration
     */
    constructor(
        address _ngnToken,
        address _dexContract,
        address _stockFactory,
        address _admin,
        ManagerConfig memory _initialConfig
    ) {
        if (_ngnToken == address(0) || _dexContract == address(0) || 
            _stockFactory == address(0) || _admin == address(0)) {
            revert ZeroAddress();
        }
        
        ngnToken = NGNStablecoin(payable(_ngnToken));
        dexContract = StockNGNDEX(payable(_dexContract));
        stockFactory = NigerianStockTokenFactory(_stockFactory);
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(LIQUIDITY_MANAGER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        // Initialize configuration
        config = _initialConfig;
        
        // Add current network configuration
        networkConfigs[block.chainid] = NetworkConfig({
            chainId: block.chainid,
            networkName: _getNetworkName(block.chainid),
            factoryAddress: _stockFactory,
            isSupported: true,
            gasLimit: 500000,
            maxSlippage: 300 // 3%
        });
        supportedChainIds.push(block.chainid);
    }

    /**
     * @dev Create a new managed trading pair
     * @param stockToken Address of the stock token
     * @param initialNGNLiquidity Initial NGN liquidity amount
     * @param initialStockLiquidity Initial stock token liquidity amount
     * @param feeRate Fee rate in basis points
     * @param targetLiquidity Target liquidity in NGN for auto-rebalancing
     */
    function createManagedPair(
        address stockToken,
        uint256 initialNGNLiquidity,
        uint256 initialStockLiquidity,
        uint256 feeRate,
        uint256 targetLiquidity
    ) external onlyRole(OPERATOR_ROLE) nonReentrant whenNotPaused {
        _createManagedPairInternal(
            stockToken,
            initialNGNLiquidity,
            initialStockLiquidity,
            feeRate,
            targetLiquidity
        );
    }

    /**
     * @dev Internal function to create a managed trading pair
     * @param stockToken Address of the stock token
     * @param initialNGNLiquidity Initial NGN liquidity amount
     * @param initialStockLiquidity Initial stock token liquidity amount
     * @param feeRate Fee rate in basis points
     * @param targetLiquidity Target liquidity in NGN for auto-rebalancing
     */
    function _createManagedPairInternal(
        address stockToken,
        uint256 initialNGNLiquidity,
        uint256 initialStockLiquidity,
        uint256 feeRate,
        uint256 targetLiquidity
    ) internal {
        if (stockToken == address(0)) revert ZeroAddress();
        if (managedPairs[stockToken].stockToken != address(0)) {
            revert PairAlreadyExists(stockToken);
        }
        if (initialNGNLiquidity == 0 || initialStockLiquidity == 0) {
            revert InvalidAmount(0);
        }

        // Get stock token information
        NigerianStockToken.StockMetadata memory stockInfo = 
            NigerianStockToken(payable(stockToken)).getStockInfo();

        // Create trading pair in DEX
        // First approve tokens for DEX
        ngnToken.approve(address(dexContract), initialNGNLiquidity);
        IERC20(stockToken).approve(address(dexContract), initialStockLiquidity);
        
        // Create the pair
        dexContract.createTradingPair(
            stockToken,
            initialNGNLiquidity,
            initialStockLiquidity,
            feeRate
        );

        // Create managed pair record
        managedPairs[stockToken] = ManagedPair({
            stockToken: stockToken,
            symbol: stockInfo.symbol,
            companyName: stockInfo.companyName,
            isActive: true,
            createdAt: block.timestamp,
            initialNGNLiquidity: initialNGNLiquidity,
            initialStockLiquidity: initialStockLiquidity,
            feeRate: feeRate,
            targetLiquidityNGN: targetLiquidity,
            autoRebalance: config.autoLiquidityEnabled,
            lastRebalance: block.timestamp
        });

        // Update mappings and arrays
        symbolToToken[stockInfo.symbol] = stockToken;
        allManagedTokens.push(stockToken);
        liquidityTargets[stockToken] = targetLiquidity;
        rebalanceThresholds[stockToken] = config.defaultRebalanceThreshold;
        
        // Update statistics
        totalManagedPairs++;
        totalLiquidityManaged += initialNGNLiquidity;

        emit PairCreated(
            stockToken,
            stockInfo.symbol,
            initialNGNLiquidity,
            initialStockLiquidity,
            feeRate
        );
    }

    /**
     * @dev Batch create multiple trading pairs
     * @param stockTokens Array of stock token addresses
     * @param ngnAmounts Array of initial NGN liquidity amounts
     * @param stockAmounts Array of initial stock liquidity amounts
     * @param feeRates Array of fee rates
     * @param targetLiquidities Array of target liquidities
     */
    function batchCreatePairs(
        address[] calldata stockTokens,
        uint256[] calldata ngnAmounts,
        uint256[] calldata stockAmounts,
        uint256[] calldata feeRates,
        uint256[] calldata targetLiquidities
    ) external onlyRole(OPERATOR_ROLE) nonReentrant whenNotPaused {
        if (stockTokens.length != ngnAmounts.length ||
            stockTokens.length != stockAmounts.length ||
            stockTokens.length != feeRates.length ||
            stockTokens.length != targetLiquidities.length) {
            revert InvalidConfiguration();
        }
        
        if (stockTokens.length > config.maxPairsPerBatch) {
            revert BatchSizeExceeded(stockTokens.length, config.maxPairsPerBatch);
        }

        for (uint256 i = 0; i < stockTokens.length; i++) {
            // Skip if pair already exists
            if (managedPairs[stockTokens[i]].stockToken == address(0)) {
                _createManagedPairInternal(
                    stockTokens[i],
                    ngnAmounts[i],
                    stockAmounts[i],
                    feeRates[i],
                    targetLiquidities[i]
                );
            }
        }

        emit BatchOperationCompleted("Batch pair creation", stockTokens.length);
    }

    /**
     * @dev Update managed pair configuration
     * @param stockToken Address of the stock token
     * @param isActive Whether the pair is active
     * @param newFeeRate New fee rate
     * @param newTargetLiquidity New target liquidity
     * @param autoRebalance Whether to enable auto-rebalancing
     */
    function updateManagedPair(
        address stockToken,
        bool isActive,
        uint256 newFeeRate,
        uint256 newTargetLiquidity,
        bool autoRebalance
    ) external onlyRole(OPERATOR_ROLE) {
        ManagedPair storage pair = managedPairs[stockToken];
        if (pair.stockToken == address(0)) revert PairNotFound(stockToken);

        pair.isActive = isActive;
        pair.feeRate = newFeeRate;
        pair.targetLiquidityNGN = newTargetLiquidity;
        pair.autoRebalance = autoRebalance;

        // Update DEX pair configuration
        dexContract.updateTradingPair(stockToken, newFeeRate, 500, isActive); // 5% max price impact

        // Update targets
        liquidityTargets[stockToken] = newTargetLiquidity;

        emit PairUpdated(stockToken, isActive, newFeeRate);
    }

    /**
     * @dev Rebalance liquidity for a trading pair
     * @param stockToken Address of the stock token
     */
    function rebalanceLiquidity(address stockToken)
        external
        onlyRole(LIQUIDITY_MANAGER_ROLE)
        nonReentrant
        whenNotPaused
    {
        ManagedPair storage pair = managedPairs[stockToken];
        if (pair.stockToken == address(0)) revert PairNotFound(stockToken);
        if (!pair.autoRebalance) revert InvalidConfiguration();

        // Get current reserves from DEX
        StockNGNDEX.TradingPair memory dexPair = dexContract.getTradingPair(stockToken);
        uint256 currentNGNReserve = dexPair.ngnReserve;
        uint256 currentStockReserve = dexPair.stockReserve;

        uint256 targetNGN = pair.targetLiquidityNGN;
        uint256 threshold = rebalanceThresholds[stockToken];

        // Check if rebalancing is needed
        uint256 deviation = currentNGNReserve > targetNGN ?
            ((currentNGNReserve - targetNGN) * 10000) / targetNGN :
            ((targetNGN - currentNGNReserve) * 10000) / targetNGN;

        if (deviation < threshold) {
            revert RebalanceThresholdNotMet(deviation, threshold);
        }

        // Calculate required adjustments
        if (currentNGNReserve < targetNGN) {
            // Need to add liquidity
            uint256 ngnToAdd = targetNGN - currentNGNReserve;
            uint256 stockToAdd = (ngnToAdd * currentStockReserve) / currentNGNReserve;

            // Add liquidity
            ngnToken.approve(address(dexContract), ngnToAdd);
            IERC20(stockToken).approve(address(dexContract), stockToAdd);

            dexContract.addLiquidity(stockToken, ngnToAdd, stockToAdd, 0);

        } else {
            // Need to remove liquidity
            uint256 ngnToRemove = currentNGNReserve - targetNGN;
            uint256 liquidityToRemove = (ngnToRemove * dexPair.totalLiquidity) / currentNGNReserve;

            // Remove liquidity
            dexContract.removeLiquidity(stockToken, liquidityToRemove, 0, 0);
        }

        pair.lastRebalance = block.timestamp;

        emit LiquidityRebalanced(
            stockToken,
            currentNGNReserve,
            targetNGN,
            currentStockReserve,
            (targetNGN * currentStockReserve) / currentNGNReserve
        );
    }

    /**
     * @dev Batch rebalance multiple pairs
     * @param stockTokens Array of stock token addresses to rebalance
     */
    function batchRebalance(address[] calldata stockTokens)
        external
        onlyRole(LIQUIDITY_MANAGER_ROLE)
        nonReentrant
        whenNotPaused
    {
        if (stockTokens.length > config.maxPairsPerBatch) {
            revert BatchSizeExceeded(stockTokens.length, config.maxPairsPerBatch);
        }

        uint256 rebalanced = 0;
        for (uint256 i = 0; i < stockTokens.length; i++) {
            try this.rebalanceLiquidity(stockTokens[i]) {
                rebalanced++;
            } catch {
                // Continue with next pair if rebalancing fails
                continue;
            }
        }

        emit BatchOperationCompleted("Batch rebalance", rebalanced);
    }

    /**
     * @dev Add network configuration for cross-chain support
     * @param chainId Chain ID of the network
     * @param networkName Name of the network
     * @param factoryAddress Address of the stock factory on that network
     * @param gasLimit Gas limit for transactions
     * @param maxSlippage Maximum slippage allowed
     */
    function addNetworkConfig(
        uint256 chainId,
        string calldata networkName,
        address factoryAddress,
        uint256 gasLimit,
        uint256 maxSlippage
    ) external onlyRole(ADMIN_ROLE) {
        if (factoryAddress == address(0)) revert ZeroAddress();

        networkConfigs[chainId] = NetworkConfig({
            chainId: chainId,
            networkName: networkName,
            factoryAddress: factoryAddress,
            isSupported: true,
            gasLimit: gasLimit,
            maxSlippage: maxSlippage
        });

        // Add to supported chains if not already present
        bool exists = false;
        for (uint256 i = 0; i < supportedChainIds.length; i++) {
            if (supportedChainIds[i] == chainId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            supportedChainIds.push(chainId);
        }

        emit NetworkConfigUpdated(chainId, networkName, true);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get managed pair information
     * @param stockToken Address of the stock token
     */
    function getManagedPair(address stockToken) external view returns (ManagedPair memory) {
        return managedPairs[stockToken];
    }

    /**
     * @dev Get all managed token addresses
     */
    function getAllManagedTokens() external view returns (address[] memory) {
        return allManagedTokens;
    }

    /**
     * @dev Get token address by symbol
     * @param symbol Stock symbol
     */
    function getTokenBySymbol(string calldata symbol) external view returns (address) {
        return symbolToToken[symbol];
    }

    /**
     * @dev Get manager statistics
     */
    function getManagerStats() external view returns (
        uint256 totalPairs,
        uint256 totalLiquidity,
        uint256 totalVolume,
        uint256 activePairs
    ) {
        totalPairs = totalManagedPairs;
        totalLiquidity = totalLiquidityManaged;
        totalVolume = totalVolumeProcessed;

        activePairs = 0;
        for (uint256 i = 0; i < allManagedTokens.length; i++) {
            if (managedPairs[allManagedTokens[i]].isActive) {
                activePairs++;
            }
        }
    }

    /**
     * @dev Get supported networks
     */
    function getSupportedNetworks() external view returns (uint256[] memory) {
        return supportedChainIds;
    }

    /**
     * @dev Get network configuration
     * @param chainId Chain ID to query
     */
    function getNetworkConfig(uint256 chainId) external view returns (NetworkConfig memory) {
        return networkConfigs[chainId];
    }

    /**
     * @dev Check if rebalancing is needed for a pair
     * @param stockToken Address of the stock token
     */
    function needsRebalancing(address stockToken) external view returns (bool, uint256) {
        ManagedPair memory pair = managedPairs[stockToken];
        if (pair.stockToken == address(0) || !pair.autoRebalance) {
            return (false, 0);
        }

        StockNGNDEX.TradingPair memory dexPair = dexContract.getTradingPair(stockToken);
        uint256 currentNGN = dexPair.ngnReserve;
        uint256 targetNGN = pair.targetLiquidityNGN;

        if (targetNGN == 0) return (false, 0);

        uint256 deviation = currentNGN > targetNGN ?
            ((currentNGN - targetNGN) * 10000) / targetNGN :
            ((targetNGN - currentNGN) * 10000) / targetNGN;

        return (deviation >= rebalanceThresholds[stockToken], deviation);
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Update manager configuration
     * @param newConfig New configuration
     */
    function updateConfig(ManagerConfig calldata newConfig) external onlyRole(ADMIN_ROLE) {
        config = newConfig;
    }

    /**
     * @dev Set rebalance threshold for a token
     * @param stockToken Address of the stock token
     * @param threshold Threshold percentage in basis points
     */
    function setRebalanceThreshold(address stockToken, uint256 threshold)
        external
        onlyRole(ADMIN_ROLE)
    {
        rebalanceThresholds[stockToken] = threshold;
    }

    /**
     * @dev Pause the manager
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the manager
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address token, uint256 amount, address to)
        external
        onlyRole(ADMIN_ROLE)
        nonReentrant
    {
        if (to == address(0)) revert ZeroAddress();

        if (token == address(0)) {
            // Withdraw ETH
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            // Withdraw ERC20 token
            IERC20(token).transfer(to, amount);
        }

        emit EmergencyAction("Emergency withdrawal", token, amount);
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Get network name by chain ID
     * @param chainId Chain ID
     */
    function _getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 355113) return "Bitfinity Testnet";
        if (chainId == 355110) return "Bitfinity Mainnet";
        if (chainId == 31337) return "Hardhat Local";
        return "Unknown Network";
    }

    /**
     * @dev Support for receiving ETH
     */
    receive() external payable {}
}
