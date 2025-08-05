// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./NGNStablecoin.sol";
import "./NigerianStockToken.sol";

/**
 * @title StockNGNDEX
 * @dev Decentralized Exchange for swapping NGN stablecoin with tokenized Nigerian stocks
 * @dev Implements Automated Market Maker (AMM) functionality with liquidity pools
 * 
 * Features:
 * - Bidirectional swapping (NGN ↔ Stock tokens)
 * - Multiple trading pairs support
 * - Liquidity pool management
 * - Price discovery mechanisms
 * - Fee collection and distribution
 * - Integration with existing Sepolia stock contracts
 * - Multi-network compatibility
 * - Emergency controls and security measures
 */
contract StockNGNDEX is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant LIQUIDITY_PROVIDER_ROLE = keccak256("LIQUIDITY_PROVIDER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Core contracts
    NGNStablecoin public immutable ngnToken;
    
    // Trading pair structure
    struct TradingPair {
        address stockToken;
        uint256 ngnReserve;
        uint256 stockReserve;
        uint256 totalLiquidity;
        uint256 feeRate; // Basis points (e.g., 30 = 0.3%)
        bool isActive;
        uint256 lastUpdateTime;
        uint256 priceImpactLimit; // Maximum allowed price impact in basis points
    }

    // Liquidity provider information
    struct LiquidityPosition {
        uint256 ngnAmount;
        uint256 stockAmount;
        uint256 liquidityTokens;
        uint256 timestamp;
        uint256 rewardDebt;
    }

    // DEX configuration
    struct DEXConfig {
        uint256 defaultFeeRate; // Default fee rate in basis points
        uint256 maxPriceImpact; // Maximum price impact allowed
        uint256 minLiquidity; // Minimum liquidity required
        uint256 swapDeadline; // Default swap deadline
        bool emergencyMode;
    }

    DEXConfig public config;

    // State variables
    mapping(address => TradingPair) public tradingPairs; // stockToken => TradingPair
    mapping(address => mapping(address => LiquidityPosition)) public liquidityPositions; // user => stockToken => position
    mapping(address => bool) public supportedStockTokens;
    address[] public allStockTokens;
    
    // Fee collection
    mapping(address => uint256) public collectedFees; // stockToken => collected NGN fees
    uint256 public totalFeesCollected;
    
    // Price tracking
    mapping(address => uint256) public lastPrice; // stockToken => price in NGN (18 decimals)
    mapping(address => uint256[]) public priceHistory; // stockToken => price history
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MINIMUM_LIQUIDITY = 1000; // Minimum liquidity to prevent division by zero
    uint256 public constant PRICE_PRECISION = 1e18;

    // Events
    event TradingPairCreated(
        address indexed stockToken,
        uint256 initialNGNReserve,
        uint256 initialStockReserve,
        uint256 feeRate
    );
    event SwapExecuted(
        address indexed user,
        address indexed stockToken,
        bool ngnToStock,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event LiquidityAdded(
        address indexed provider,
        address indexed stockToken,
        uint256 ngnAmount,
        uint256 stockAmount,
        uint256 liquidityTokens
    );
    event LiquidityRemoved(
        address indexed provider,
        address indexed stockToken,
        uint256 ngnAmount,
        uint256 stockAmount,
        uint256 liquidityTokens
    );
    event PriceUpdated(address indexed stockToken, uint256 newPrice, uint256 timestamp);
    event FeesCollected(address indexed stockToken, uint256 amount);
    event EmergencyAction(string action, address indexed target, uint256 amount);

    // Custom errors
    error InvalidStockToken(address stockToken);
    error TradingPairExists(address stockToken);
    error TradingPairNotFound(address stockToken);
    error InsufficientLiquidity(uint256 available, uint256 required);
    error InsufficientReserves(uint256 reserve, uint256 required);
    error ExcessivePriceImpact(uint256 impact, uint256 limit);
    error InvalidAmount(uint256 amount);
    error SlippageExceeded(uint256 expected, uint256 actual);
    error DeadlineExceeded(uint256 deadline);
    error ZeroAddress();
    error InvalidConfiguration();
    error EmergencyModeActive();

    /**
     * @dev Constructor
     * @param _ngnToken Address of the NGN stablecoin contract
     * @param _admin Admin address
     * @param _initialConfig Initial DEX configuration
     */
    constructor(
        address _ngnToken,
        address _admin,
        DEXConfig memory _initialConfig
    ) {
        if (_ngnToken == address(0) || _admin == address(0)) revert ZeroAddress();
        if (_initialConfig.defaultFeeRate > 1000) revert InvalidConfiguration(); // Max 10% fee
        
        ngnToken = NGNStablecoin(payable(_ngnToken));
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(LIQUIDITY_PROVIDER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        // Initialize configuration
        config = _initialConfig;
    }

    /**
     * @dev Create a new trading pair
     * @param stockToken Address of the stock token
     * @param initialNGNAmount Initial NGN liquidity
     * @param initialStockAmount Initial stock token liquidity
     * @param feeRate Fee rate in basis points
     */
    function createTradingPair(
        address stockToken,
        uint256 initialNGNAmount,
        uint256 initialStockAmount,
        uint256 feeRate
    ) external onlyRole(OPERATOR_ROLE) nonReentrant whenNotPaused {
        if (stockToken == address(0)) revert ZeroAddress();
        if (tradingPairs[stockToken].isActive) revert TradingPairExists(stockToken);
        if (initialNGNAmount == 0 || initialStockAmount == 0) revert InvalidAmount(0);
        if (feeRate > 1000) revert InvalidConfiguration(); // Max 10% fee

        // Verify it's a valid stock token (optional check)
        try NigerianStockToken(payable(stockToken)).getStockInfo() returns (NigerianStockToken.StockMetadata memory) {
            // Valid stock token
        } catch {
            revert InvalidStockToken(stockToken);
        }

        // Transfer tokens to the contract
        ngnToken.transferFrom(msg.sender, address(this), initialNGNAmount);
        IERC20(stockToken).safeTransferFrom(msg.sender, address(this), initialStockAmount);

        // Calculate initial liquidity tokens
        uint256 initialLiquidity = Math.sqrt(initialNGNAmount * initialStockAmount);
        if (initialLiquidity <= MINIMUM_LIQUIDITY) revert InsufficientLiquidity(initialLiquidity, MINIMUM_LIQUIDITY);

        // Create trading pair
        tradingPairs[stockToken] = TradingPair({
            stockToken: stockToken,
            ngnReserve: initialNGNAmount,
            stockReserve: initialStockAmount,
            totalLiquidity: initialLiquidity,
            feeRate: feeRate,
            isActive: true,
            lastUpdateTime: block.timestamp,
            priceImpactLimit: config.maxPriceImpact
        });

        // Add to supported tokens
        supportedStockTokens[stockToken] = true;
        allStockTokens.push(stockToken);

        // Create initial liquidity position for creator
        liquidityPositions[msg.sender][stockToken] = LiquidityPosition({
            ngnAmount: initialNGNAmount,
            stockAmount: initialStockAmount,
            liquidityTokens: initialLiquidity,
            timestamp: block.timestamp,
            rewardDebt: 0
        });

        // Update price
        _updatePrice(stockToken);

        emit TradingPairCreated(stockToken, initialNGNAmount, initialStockAmount, feeRate);
        emit LiquidityAdded(msg.sender, stockToken, initialNGNAmount, initialStockAmount, initialLiquidity);
    }

    /**
     * @dev Swap NGN for stock tokens
     * @param stockToken Address of the stock token to receive
     * @param ngnAmountIn Amount of NGN to swap
     * @param minStockAmountOut Minimum amount of stock tokens to receive
     * @param deadline Transaction deadline
     */
    function swapNGNForStock(
        address stockToken,
        uint256 ngnAmountIn,
        uint256 minStockAmountOut,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 stockAmountOut) {
        if (block.timestamp > deadline) revert DeadlineExceeded(deadline);
        if (config.emergencyMode) revert EmergencyModeActive();
        
        TradingPair storage pair = tradingPairs[stockToken];
        if (!pair.isActive) revert TradingPairNotFound(stockToken);
        if (ngnAmountIn == 0) revert InvalidAmount(ngnAmountIn);

        // Calculate output amount with fee
        uint256 fee;
        (stockAmountOut, fee) = _calculateSwapOutput(
            ngnAmountIn,
            pair.ngnReserve,
            pair.stockReserve,
            pair.feeRate,
            true // NGN to Stock
        );

        if (stockAmountOut < minStockAmountOut) {
            revert SlippageExceeded(minStockAmountOut, stockAmountOut);
        }

        // Check price impact
        uint256 priceImpact = _calculatePriceImpact(ngnAmountIn, pair.ngnReserve);
        if (priceImpact > pair.priceImpactLimit) {
            revert ExcessivePriceImpact(priceImpact, pair.priceImpactLimit);
        }

        // Execute swap
        ngnToken.transferFrom(msg.sender, address(this), ngnAmountIn);
        IERC20(stockToken).safeTransfer(msg.sender, stockAmountOut);

        // Update reserves
        pair.ngnReserve += ngnAmountIn;
        pair.stockReserve -= stockAmountOut;
        pair.lastUpdateTime = block.timestamp;

        // Collect fees
        collectedFees[stockToken] += fee;
        totalFeesCollected += fee;

        // Update price
        _updatePrice(stockToken);

        emit SwapExecuted(msg.sender, stockToken, true, ngnAmountIn, stockAmountOut, fee);
        emit FeesCollected(stockToken, fee);

        return stockAmountOut;
    }

    /**
     * @dev Swap stock tokens for NGN
     * @param stockToken Address of the stock token to swap
     * @param stockAmountIn Amount of stock tokens to swap
     * @param minNGNAmountOut Minimum amount of NGN to receive
     * @param deadline Transaction deadline
     */
    function swapStockForNGN(
        address stockToken,
        uint256 stockAmountIn,
        uint256 minNGNAmountOut,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 ngnAmountOut) {
        if (block.timestamp > deadline) revert DeadlineExceeded(deadline);
        if (config.emergencyMode) revert EmergencyModeActive();
        
        TradingPair storage pair = tradingPairs[stockToken];
        if (!pair.isActive) revert TradingPairNotFound(stockToken);
        if (stockAmountIn == 0) revert InvalidAmount(stockAmountIn);

        // Calculate output amount with fee
        uint256 fee;
        (ngnAmountOut, fee) = _calculateSwapOutput(
            stockAmountIn,
            pair.stockReserve,
            pair.ngnReserve,
            pair.feeRate,
            false // Stock to NGN
        );

        if (ngnAmountOut < minNGNAmountOut) {
            revert SlippageExceeded(minNGNAmountOut, ngnAmountOut);
        }

        // Check price impact
        uint256 priceImpact = _calculatePriceImpact(stockAmountIn, pair.stockReserve);
        if (priceImpact > pair.priceImpactLimit) {
            revert ExcessivePriceImpact(priceImpact, pair.priceImpactLimit);
        }

        // Execute swap
        IERC20(stockToken).safeTransferFrom(msg.sender, address(this), stockAmountIn);
        ngnToken.transfer(msg.sender, ngnAmountOut);

        // Update reserves
        pair.stockReserve += stockAmountIn;
        pair.ngnReserve -= ngnAmountOut;
        pair.lastUpdateTime = block.timestamp;

        // Collect fees (in NGN equivalent)
        collectedFees[stockToken] += fee;
        totalFeesCollected += fee;

        // Update price
        _updatePrice(stockToken);

        emit SwapExecuted(msg.sender, stockToken, false, stockAmountIn, ngnAmountOut, fee);
        emit FeesCollected(stockToken, fee);

        return ngnAmountOut;
    }

    /**
     * @dev Add liquidity to a trading pair
     * @param stockToken Address of the stock token
     * @param ngnAmount Amount of NGN to add
     * @param stockAmount Amount of stock tokens to add
     * @param minLiquidityOut Minimum liquidity tokens to receive
     */
    function addLiquidity(
        address stockToken,
        uint256 ngnAmount,
        uint256 stockAmount,
        uint256 minLiquidityOut
    ) external onlyRole(LIQUIDITY_PROVIDER_ROLE) nonReentrant whenNotPaused returns (uint256 liquidityOut) {
        TradingPair storage pair = tradingPairs[stockToken];
        if (!pair.isActive) revert TradingPairNotFound(stockToken);
        if (ngnAmount == 0 || stockAmount == 0) revert InvalidAmount(0);

        // Calculate optimal amounts to maintain ratio
        uint256 optimalNGNAmount = ngnAmount;
        uint256 optimalStockAmount = stockAmount;

        if (pair.totalLiquidity > 0) {
            uint256 ngnRatio = (ngnAmount * pair.stockReserve) / pair.ngnReserve;
            uint256 stockRatio = (stockAmount * pair.ngnReserve) / pair.stockReserve;

            if (ngnRatio < stockAmount) {
                optimalStockAmount = ngnRatio;
            } else {
                optimalNGNAmount = stockRatio;
            }
        }

        // Calculate liquidity tokens to mint
        if (pair.totalLiquidity == 0) {
            liquidityOut = Math.sqrt(optimalNGNAmount * optimalStockAmount);
        } else {
            liquidityOut = Math.min(
                (optimalNGNAmount * pair.totalLiquidity) / pair.ngnReserve,
                (optimalStockAmount * pair.totalLiquidity) / pair.stockReserve
            );
        }

        if (liquidityOut < minLiquidityOut) {
            revert SlippageExceeded(minLiquidityOut, liquidityOut);
        }

        // Transfer tokens
        ngnToken.transferFrom(msg.sender, address(this), optimalNGNAmount);
        IERC20(stockToken).safeTransferFrom(msg.sender, address(this), optimalStockAmount);

        // Update reserves and liquidity
        pair.ngnReserve += optimalNGNAmount;
        pair.stockReserve += optimalStockAmount;
        pair.totalLiquidity += liquidityOut;
        pair.lastUpdateTime = block.timestamp;

        // Update user's liquidity position
        LiquidityPosition storage position = liquidityPositions[msg.sender][stockToken];
        position.ngnAmount += optimalNGNAmount;
        position.stockAmount += optimalStockAmount;
        position.liquidityTokens += liquidityOut;
        position.timestamp = block.timestamp;

        emit LiquidityAdded(msg.sender, stockToken, optimalNGNAmount, optimalStockAmount, liquidityOut);

        return liquidityOut;
    }

    /**
     * @dev Remove liquidity from a trading pair
     * @param stockToken Address of the stock token
     * @param liquidityAmount Amount of liquidity tokens to burn
     * @param minNGNOut Minimum NGN to receive
     * @param minStockOut Minimum stock tokens to receive
     */
    function removeLiquidity(
        address stockToken,
        uint256 liquidityAmount,
        uint256 minNGNOut,
        uint256 minStockOut
    ) external nonReentrant whenNotPaused returns (uint256 ngnOut, uint256 stockOut) {
        TradingPair storage pair = tradingPairs[stockToken];
        if (!pair.isActive) revert TradingPairNotFound(stockToken);

        LiquidityPosition storage position = liquidityPositions[msg.sender][stockToken];
        if (position.liquidityTokens < liquidityAmount) {
            revert InsufficientLiquidity(position.liquidityTokens, liquidityAmount);
        }

        // Calculate amounts to return
        ngnOut = (liquidityAmount * pair.ngnReserve) / pair.totalLiquidity;
        stockOut = (liquidityAmount * pair.stockReserve) / pair.totalLiquidity;

        if (ngnOut < minNGNOut) revert SlippageExceeded(minNGNOut, ngnOut);
        if (stockOut < minStockOut) revert SlippageExceeded(minStockOut, stockOut);

        // Update reserves and liquidity
        pair.ngnReserve -= ngnOut;
        pair.stockReserve -= stockOut;
        pair.totalLiquidity -= liquidityAmount;
        pair.lastUpdateTime = block.timestamp;

        // Update user's liquidity position
        position.ngnAmount -= (position.ngnAmount * liquidityAmount) / position.liquidityTokens;
        position.stockAmount -= (position.stockAmount * liquidityAmount) / position.liquidityTokens;
        position.liquidityTokens -= liquidityAmount;

        // Transfer tokens back to user
        ngnToken.transfer(msg.sender, ngnOut);
        IERC20(stockToken).safeTransfer(msg.sender, stockOut);

        emit LiquidityRemoved(msg.sender, stockToken, ngnOut, stockOut, liquidityAmount);

        return (ngnOut, stockOut);
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Calculate swap output amount with fees
     * @param amountIn Input amount
     * @param reserveIn Input token reserve
     * @param reserveOut Output token reserve
     * @param feeRate Fee rate in basis points
     */
    function _calculateSwapOutput(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 feeRate,
        bool /* isNGNToStock */
    ) internal pure returns (uint256 amountOut, uint256 fee) {
        if (amountIn == 0 || reserveIn == 0 || reserveOut == 0) {
            return (0, 0);
        }

        // Calculate fee
        fee = (amountIn * feeRate) / BASIS_POINTS;
        uint256 amountInAfterFee = amountIn - fee;

        // Use constant product formula: x * y = k
        // amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee)
        uint256 numerator = amountInAfterFee * reserveOut;
        uint256 denominator = reserveIn + amountInAfterFee;

        amountOut = numerator / denominator;

        return (amountOut, fee);
    }

    /**
     * @dev Calculate price impact of a swap
     * @param amountIn Input amount
     * @param reserve Reserve of input token
     */
    function _calculatePriceImpact(uint256 amountIn, uint256 reserve) internal pure returns (uint256) {
        if (reserve == 0) return BASIS_POINTS; // 100% impact if no liquidity

        // Price impact = (amountIn / reserve) * BASIS_POINTS
        return (amountIn * BASIS_POINTS) / reserve;
    }

    /**
     * @dev Update price for a trading pair
     * @param stockToken Address of the stock token
     */
    function _updatePrice(address stockToken) internal {
        TradingPair storage pair = tradingPairs[stockToken];
        if (pair.stockReserve == 0) return;

        // Calculate price: NGN per stock token (18 decimals)
        uint256 newPrice = (pair.ngnReserve * PRICE_PRECISION) / pair.stockReserve;
        lastPrice[stockToken] = newPrice;

        // Add to price history (keep last 100 prices)
        priceHistory[stockToken].push(newPrice);
        if (priceHistory[stockToken].length > 100) {
            // Remove oldest price (expensive operation, consider optimization)
            for (uint256 i = 0; i < priceHistory[stockToken].length - 1; i++) {
                priceHistory[stockToken][i] = priceHistory[stockToken][i + 1];
            }
            priceHistory[stockToken].pop();
        }

        emit PriceUpdated(stockToken, newPrice, block.timestamp);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get quote for swapping NGN to stock
     * @param stockToken Address of the stock token
     * @param ngnAmountIn Amount of NGN to swap
     */
    function getQuoteNGNToStock(address stockToken, uint256 ngnAmountIn)
        external
        view
        returns (uint256 stockAmountOut, uint256 fee, uint256 priceImpact)
    {
        TradingPair memory pair = tradingPairs[stockToken];
        if (!pair.isActive) return (0, 0, 0);

        (stockAmountOut, fee) = _calculateSwapOutput(
            ngnAmountIn,
            pair.ngnReserve,
            pair.stockReserve,
            pair.feeRate,
            true
        );

        priceImpact = _calculatePriceImpact(ngnAmountIn, pair.ngnReserve);
    }

    /**
     * @dev Get quote for swapping stock to NGN
     * @param stockToken Address of the stock token
     * @param stockAmountIn Amount of stock tokens to swap
     */
    function getQuoteStockToNGN(address stockToken, uint256 stockAmountIn)
        external
        view
        returns (uint256 ngnAmountOut, uint256 fee, uint256 priceImpact)
    {
        TradingPair memory pair = tradingPairs[stockToken];
        if (!pair.isActive) return (0, 0, 0);

        (ngnAmountOut, fee) = _calculateSwapOutput(
            stockAmountIn,
            pair.stockReserve,
            pair.ngnReserve,
            pair.feeRate,
            false
        );

        priceImpact = _calculatePriceImpact(stockAmountIn, pair.stockReserve);
    }

    /**
     * @dev Get current price of a stock token in NGN
     * @param stockToken Address of the stock token
     */
    function getCurrentPrice(address stockToken) external view returns (uint256) {
        return lastPrice[stockToken];
    }

    /**
     * @dev Get price history for a stock token
     * @param stockToken Address of the stock token
     */
    function getPriceHistory(address stockToken) external view returns (uint256[] memory) {
        return priceHistory[stockToken];
    }

    /**
     * @dev Get trading pair information
     * @param stockToken Address of the stock token
     */
    function getTradingPair(address stockToken) external view returns (TradingPair memory) {
        return tradingPairs[stockToken];
    }

    /**
     * @dev Get liquidity position for a user
     * @param user User address
     * @param stockToken Address of the stock token
     */
    function getLiquidityPosition(address user, address stockToken)
        external
        view
        returns (LiquidityPosition memory)
    {
        return liquidityPositions[user][stockToken];
    }

    /**
     * @dev Get all supported stock tokens
     */
    function getAllStockTokens() external view returns (address[] memory) {
        return allStockTokens;
    }

    /**
     * @dev Get DEX statistics
     */
    function getDEXStats() external view returns (
        uint256 totalPairs,
        uint256 totalVolumeNGN,
        uint256 feesCollected,
        uint256 totalLiquidity
    ) {
        totalPairs = allStockTokens.length;
        totalVolumeNGN = 0; // Would need to track this separately
        feesCollected = totalFeesCollected;
        totalLiquidity = 0;

        // Calculate total liquidity across all pairs
        for (uint256 i = 0; i < allStockTokens.length; i++) {
            TradingPair memory pair = tradingPairs[allStockTokens[i]];
            totalLiquidity += pair.ngnReserve;
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Update DEX configuration (only ADMIN_ROLE)
     * @param newConfig New DEX configuration
     */
    function updateDEXConfig(DEXConfig calldata newConfig) external onlyRole(ADMIN_ROLE) {
        if (newConfig.defaultFeeRate > 1000) revert InvalidConfiguration(); // Max 10% fee

        config = newConfig;
    }

    /**
     * @dev Update trading pair parameters (only OPERATOR_ROLE)
     * @param stockToken Address of the stock token
     * @param feeRate New fee rate
     * @param priceImpactLimit New price impact limit
     * @param isActive Whether the pair is active
     */
    function updateTradingPair(
        address stockToken,
        uint256 feeRate,
        uint256 priceImpactLimit,
        bool isActive
    ) external onlyRole(OPERATOR_ROLE) {
        TradingPair storage pair = tradingPairs[stockToken];
        if (pair.stockToken == address(0)) revert TradingPairNotFound(stockToken);
        if (feeRate > 1000) revert InvalidConfiguration(); // Max 10% fee

        pair.feeRate = feeRate;
        pair.priceImpactLimit = priceImpactLimit;
        pair.isActive = isActive;
        pair.lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Withdraw collected fees (only ADMIN_ROLE)
     * @param stockToken Address of the stock token (or address(0) for all)
     * @param to Address to send fees to
     */
    function withdrawFees(address stockToken, address to) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        if (stockToken == address(0)) {
            // Withdraw all fees
            uint256 totalFees = 0;
            for (uint256 i = 0; i < allStockTokens.length; i++) {
                totalFees += collectedFees[allStockTokens[i]];
                collectedFees[allStockTokens[i]] = 0;
            }
            if (totalFees > 0) {
                ngnToken.transfer(to, totalFees);
            }
        } else {
            // Withdraw fees for specific token
            uint256 fees = collectedFees[stockToken];
            if (fees > 0) {
                collectedFees[stockToken] = 0;
                ngnToken.transfer(to, fees);
            }
        }
    }

    /**
     * @dev Pause the DEX (only PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the DEX (only PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function (only ADMIN_ROLE)
     * @param token Token address to withdraw (address(0) for ETH)
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
            IERC20(token).safeTransfer(to, amount);
        }

        emit EmergencyAction("Emergency withdrawal", token, amount);
    }

    /**
     * @dev Support for receiving ETH
     */
    receive() external payable {}
}
