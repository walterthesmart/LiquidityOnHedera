// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NGNStablecoin
 * @dev Nigerian Naira (NGN) Stablecoin - ERC20 compliant stablecoin for tokenized asset trading
 * @dev Implements comprehensive security measures and stablecoin-specific features
 * 
 * Features:
 * - ERC20 compliant with standard stablecoin functionality
 * - Role-based access control (OpenZeppelin AccessControl)
 * - Reentrancy protection for all state-changing functions
 * - Pausable for emergency stops
 * - Minting and burning capabilities with proper controls
 * - Transfer restrictions and compliance features
 * - Multi-network deployment support
 * - Integration with DEX and trading systems
 */
contract NGNStablecoin is 
    ERC20, 
    ERC20Burnable, 
    ERC20Pausable, 
    AccessControl, 
    ReentrancyGuard 
{
    // Role definitions following OpenZeppelin patterns
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant DEX_ROLE = keccak256("DEX_ROLE"); // For DEX contract integration

    // Stablecoin metadata and configuration
    struct StablecoinConfig {
        string name;
        string symbol;
        uint8 decimals;
        uint256 maxSupply;
        uint256 mintingCap; // Daily minting cap
        uint256 lastMintReset; // Timestamp of last minting cap reset
        uint256 currentDayMinted; // Amount minted in current day
        bool mintingEnabled;
        bool burningEnabled;
        bool transfersEnabled;
    }

    StablecoinConfig public config;

    // Compliance and security features
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public whitelisted;
    mapping(address => uint256) public lastTransferTime;
    mapping(address => uint256) public dailyTransferAmount;
    mapping(address => uint256) public lastDailyReset;
    
    // Transfer limits and controls
    uint256 public maxTransferAmount;
    uint256 public minTransferAmount;
    uint256 public dailyTransferLimit;
    uint256 public transferCooldown;
    bool public whitelistRequired;

    // DEX integration
    mapping(address => bool) public authorizedDEXContracts;
    uint256 public dexTransferLimit;

    // Events
    event StablecoinConfigUpdated(
        uint256 maxSupply,
        uint256 mintingCap,
        bool mintingEnabled,
        bool burningEnabled,
        bool transfersEnabled
    );
    event MintingCapReset(uint256 newCap, uint256 timestamp);
    event TransferLimitsUpdated(
        uint256 minAmount, 
        uint256 maxAmount, 
        uint256 dailyLimit
    );
    event ComplianceStatusUpdated(address indexed account, bool blacklisted, bool whitelisted);
    event DEXContractAuthorized(address indexed dexContract, bool authorized);
    event EmergencyAction(string action, address indexed target, uint256 amount);

    // Custom errors for gas efficiency
    error InvalidAmount(uint256 amount);
    error TransferLimitExceeded(uint256 amount, uint256 limit);
    error DailyLimitExceeded(uint256 amount, uint256 limit);
    error MintingCapExceeded(uint256 amount, uint256 cap);
    error BlacklistedAddress(address account);
    error NotWhitelisted(address account);
    error TransferCooldownActive(uint256 remainingTime);
    error MintingDisabled();
    error BurningDisabled();
    error TransfersDisabled();
    error MaxSupplyExceeded(uint256 amount, uint256 maxSupply);
    error UnauthorizedDEXContract(address dexContract);
    error ZeroAddress();
    error InvalidConfiguration();

    /**
     * @dev Constructor to initialize the NGN Stablecoin
     * @param _admin Admin address with full control
     * @param _initialConfig Initial stablecoin configuration
     */
    constructor(
        address _admin,
        StablecoinConfig memory _initialConfig
    ) ERC20(_initialConfig.name, _initialConfig.symbol) {
        if (_admin == address(0)) revert ZeroAddress();
        if (_initialConfig.maxSupply == 0) revert InvalidConfiguration();
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(BURNER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        _grantRole(COMPLIANCE_ROLE, _admin);

        // Initialize configuration
        config = _initialConfig;
        config.lastMintReset = block.timestamp;
        config.currentDayMinted = 0;

        // Set default transfer limits
        minTransferAmount = 1e18; // 1 NGN minimum
        maxTransferAmount = 1000000e18; // 1M NGN maximum per transaction
        dailyTransferLimit = 10000000e18; // 10M NGN daily limit
        dexTransferLimit = 100000000e18; // 100M NGN for DEX operations
        transferCooldown = 0; // No cooldown by default
        whitelistRequired = false; // Open transfers by default

        emit StablecoinConfigUpdated(
            config.maxSupply,
            config.mintingCap,
            config.mintingEnabled,
            config.burningEnabled,
            config.transfersEnabled
        );
    }

    /**
     * @dev Mint NGN tokens to specified address (only MINTER_ROLE)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        if (!config.mintingEnabled) revert MintingDisabled();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount(amount);
        
        // Check max supply
        if (totalSupply() + amount > config.maxSupply) {
            revert MaxSupplyExceeded(amount, config.maxSupply);
        }

        // Check daily minting cap
        _checkAndUpdateMintingCap(amount);
        
        _mint(to, amount);
    }

    /**
     * @dev Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused {
        if (!config.mintingEnabled) revert MintingDisabled();
        if (recipients.length != amounts.length || recipients.length == 0) {
            revert InvalidConfiguration();
        }

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        // Check max supply
        if (totalSupply() + totalAmount > config.maxSupply) {
            revert MaxSupplyExceeded(totalAmount, config.maxSupply);
        }

        // Check daily minting cap
        _checkAndUpdateMintingCap(totalAmount);

        // Mint to all recipients
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert InvalidAmount(amounts[i]);
            _mint(recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Burn tokens from specified address (only BURNER_ROLE)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) 
        public 
        override 
        onlyRole(BURNER_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        if (!config.burningEnabled) revert BurningDisabled();
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount(amount);
        
        super.burnFrom(from, amount);
    }

    /**
     * @dev Pause all token operations (only PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token operations (only PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Internal function to check and update daily minting cap
     * @param amount Amount to be minted
     */
    function _checkAndUpdateMintingCap(uint256 amount) internal {
        // Reset daily cap if 24 hours have passed
        if (block.timestamp >= config.lastMintReset + 1 days) {
            config.currentDayMinted = 0;
            config.lastMintReset = block.timestamp;
            emit MintingCapReset(config.mintingCap, block.timestamp);
        }

        // Check if minting amount exceeds daily cap
        if (config.currentDayMinted + amount > config.mintingCap) {
            revert MintingCapExceeded(amount, config.mintingCap - config.currentDayMinted);
        }

        config.currentDayMinted += amount;
    }

    /**
     * @dev Override transfer function to add security checks
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        // Skip checks for minting/burning
        if (from != address(0) && to != address(0)) {
            if (!config.transfersEnabled) revert TransfersDisabled();
            
            // Check compliance
            _checkCompliance(from, to, value);
            
            // Check transfer limits
            _checkTransferLimits(from, value);
            
            // Update daily transfer tracking
            _updateDailyTransfers(from, value);
        }

        super._update(from, to, value);
    }

    /**
     * @dev Internal compliance checks
     */
    function _checkCompliance(address from, address to, uint256 /* value */) internal view {
        // Check blacklist
        if (blacklisted[from] || blacklisted[to]) {
            revert BlacklistedAddress(blacklisted[from] ? from : to);
        }

        // Check whitelist if required
        if (whitelistRequired && !whitelisted[from] && !whitelisted[to]) {
            // Allow DEX contracts even if whitelist is required
            if (!authorizedDEXContracts[from] && !authorizedDEXContracts[to]) {
                revert NotWhitelisted(from);
            }
        }
    }

    /**
     * @dev Internal transfer limit checks
     */
    function _checkTransferLimits(address from, uint256 value) internal view {
        // Check basic transfer limits
        if (value < minTransferAmount) {
            revert TransferLimitExceeded(value, minTransferAmount);
        }
        
        // Use DEX limit for authorized DEX contracts
        uint256 maxLimit = authorizedDEXContracts[from] ? dexTransferLimit : maxTransferAmount;
        if (value > maxLimit) {
            revert TransferLimitExceeded(value, maxLimit);
        }

        // Check transfer cooldown
        if (transferCooldown > 0 && 
            lastTransferTime[from] + transferCooldown > block.timestamp) {
            revert TransferCooldownActive(
                lastTransferTime[from] + transferCooldown - block.timestamp
            );
        }
    }

    /**
     * @dev Update daily transfer tracking
     */
    function _updateDailyTransfers(address from, uint256 value) internal {
        // Reset daily amount if 24 hours have passed
        if (block.timestamp >= lastDailyReset[from] + 1 days) {
            dailyTransferAmount[from] = 0;
            lastDailyReset[from] = block.timestamp;
        }

        // Check daily limit (skip for DEX contracts)
        if (!authorizedDEXContracts[from] && 
            dailyTransferAmount[from] + value > dailyTransferLimit) {
            revert DailyLimitExceeded(value, dailyTransferLimit - dailyTransferAmount[from]);
        }

        dailyTransferAmount[from] += value;
        lastTransferTime[from] = block.timestamp;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Update stablecoin configuration (only ADMIN_ROLE)
     * @param _newConfig New configuration parameters
     */
    function updateConfig(StablecoinConfig calldata _newConfig)
        external
        onlyRole(ADMIN_ROLE)
    {
        if (_newConfig.maxSupply == 0) revert InvalidConfiguration();

        config.maxSupply = _newConfig.maxSupply;
        config.mintingCap = _newConfig.mintingCap;
        config.mintingEnabled = _newConfig.mintingEnabled;
        config.burningEnabled = _newConfig.burningEnabled;
        config.transfersEnabled = _newConfig.transfersEnabled;

        emit StablecoinConfigUpdated(
            config.maxSupply,
            config.mintingCap,
            config.mintingEnabled,
            config.burningEnabled,
            config.transfersEnabled
        );
    }

    /**
     * @dev Set transfer limits (only ADMIN_ROLE)
     * @param _minAmount Minimum transfer amount
     * @param _maxAmount Maximum transfer amount
     * @param _dailyLimit Daily transfer limit
     */
    function setTransferLimits(
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _dailyLimit
    ) external onlyRole(ADMIN_ROLE) {
        if (_minAmount > _maxAmount) revert InvalidConfiguration();

        minTransferAmount = _minAmount;
        maxTransferAmount = _maxAmount;
        dailyTransferLimit = _dailyLimit;

        emit TransferLimitsUpdated(_minAmount, _maxAmount, _dailyLimit);
    }

    /**
     * @dev Set compliance status for addresses (only COMPLIANCE_ROLE)
     * @param accounts Array of addresses
     * @param _blacklisted Array of blacklist statuses
     * @param _whitelisted Array of whitelist statuses
     */
    function setComplianceStatus(
        address[] calldata accounts,
        bool[] calldata _blacklisted,
        bool[] calldata _whitelisted
    ) external onlyRole(COMPLIANCE_ROLE) {
        if (accounts.length != _blacklisted.length ||
            accounts.length != _whitelisted.length) {
            revert InvalidConfiguration();
        }

        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert ZeroAddress();

            blacklisted[accounts[i]] = _blacklisted[i];
            whitelisted[accounts[i]] = _whitelisted[i];

            emit ComplianceStatusUpdated(accounts[i], _blacklisted[i], _whitelisted[i]);
        }
    }

    /**
     * @dev Authorize DEX contracts (only ADMIN_ROLE)
     * @param dexContracts Array of DEX contract addresses
     * @param authorized Array of authorization statuses
     */
    function authorizeDEXContracts(
        address[] calldata dexContracts,
        bool[] calldata authorized
    ) external onlyRole(ADMIN_ROLE) {
        if (dexContracts.length != authorized.length) revert InvalidConfiguration();

        for (uint256 i = 0; i < dexContracts.length; i++) {
            if (dexContracts[i] == address(0)) revert ZeroAddress();

            authorizedDEXContracts[dexContracts[i]] = authorized[i];

            // Grant DEX_ROLE to authorized contracts
            if (authorized[i]) {
                _grantRole(DEX_ROLE, dexContracts[i]);
            } else {
                _revokeRole(DEX_ROLE, dexContracts[i]);
            }

            emit DEXContractAuthorized(dexContracts[i], authorized[i]);
        }
    }

    /**
     * @dev Set DEX transfer limit (only ADMIN_ROLE)
     * @param _dexLimit New DEX transfer limit
     */
    function setDEXTransferLimit(uint256 _dexLimit) external onlyRole(ADMIN_ROLE) {
        dexTransferLimit = _dexLimit;
    }

    /**
     * @dev Set transfer cooldown period (only ADMIN_ROLE)
     * @param _cooldown Cooldown period in seconds
     */
    function setTransferCooldown(uint256 _cooldown) external onlyRole(ADMIN_ROLE) {
        transferCooldown = _cooldown;
    }

    /**
     * @dev Set whitelist requirement (only ADMIN_ROLE)
     * @param _required Whether whitelist is required for transfers
     */
    function setWhitelistRequired(bool _required) external onlyRole(ADMIN_ROLE) {
        whitelistRequired = _required;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get current stablecoin configuration
     */
    function getConfig() external view returns (StablecoinConfig memory) {
        return config;
    }

    /**
     * @dev Get remaining daily minting capacity
     */
    function getRemainingMintingCapacity() external view returns (uint256) {
        if (block.timestamp >= config.lastMintReset + 1 days) {
            return config.mintingCap;
        }
        return config.mintingCap - config.currentDayMinted;
    }

    /**
     * @dev Get remaining daily transfer capacity for an address
     * @param account Address to check
     */
    function getRemainingDailyTransferCapacity(address account)
        external
        view
        returns (uint256)
    {
        if (authorizedDEXContracts[account]) {
            return type(uint256).max; // No limit for DEX contracts
        }

        if (block.timestamp >= lastDailyReset[account] + 1 days) {
            return dailyTransferLimit;
        }
        return dailyTransferLimit - dailyTransferAmount[account];
    }

    /**
     * @dev Check if an address can transfer a specific amount
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function canTransfer(address from, address to, uint256 amount)
        external
        view
        returns (bool, string memory)
    {
        if (!config.transfersEnabled) {
            return (false, "Transfers disabled");
        }

        if (blacklisted[from] || blacklisted[to]) {
            return (false, "Address blacklisted");
        }

        if (whitelistRequired && !whitelisted[from] && !whitelisted[to] &&
            !authorizedDEXContracts[from] && !authorizedDEXContracts[to]) {
            return (false, "Address not whitelisted");
        }

        if (amount < minTransferAmount) {
            return (false, "Amount below minimum");
        }

        uint256 maxLimit = authorizedDEXContracts[from] ? dexTransferLimit : maxTransferAmount;
        if (amount > maxLimit) {
            return (false, "Amount exceeds maximum");
        }

        if (transferCooldown > 0 &&
            lastTransferTime[from] + transferCooldown > block.timestamp) {
            return (false, "Transfer cooldown active");
        }

        // Check daily limit
        if (!authorizedDEXContracts[from]) {
            uint256 dailyUsed = dailyTransferAmount[from];
            if (block.timestamp >= lastDailyReset[from] + 1 days) {
                dailyUsed = 0;
            }
            if (dailyUsed + amount > dailyTransferLimit) {
                return (false, "Daily limit exceeded");
            }
        }

        return (true, "Transfer allowed");
    }

    /**
     * @dev Emergency withdrawal function (only ADMIN_ROLE)
     * @param token Token address to withdraw (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount)
        external
        onlyRole(ADMIN_ROLE)
        nonReentrant
    {
        if (token == address(0)) {
            // Withdraw ETH
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            // Withdraw ERC20 token
            IERC20(token).transfer(msg.sender, amount);
        }

        emit EmergencyAction("Emergency withdrawal", token, amount);
    }

    /**
     * @dev Support for receiving ETH
     */
    receive() external payable {}

    /**
     * @dev Get comprehensive token information for external integrations
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        uint256 maxSupply,
        bool mintingEnabled,
        bool burningEnabled,
        bool transfersEnabled
    ) {
        return (
            config.name,
            config.symbol,
            18, // Standard 18 decimals for stablecoin
            super.totalSupply(),
            config.maxSupply,
            config.mintingEnabled,
            config.burningEnabled,
            config.transfersEnabled
        );
    }
}
