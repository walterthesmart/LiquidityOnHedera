// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NigerianStockToken
 * @dev Enhanced ERC20 token representing Nigerian Stock Exchange (NGX) stocks
 * @dev Implements comprehensive security measures and batch operations for gas efficiency
 */
contract NigerianStockToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Pausable, 
    AccessControl, 
    ReentrancyGuard 
{
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    // Stock metadata
    struct StockMetadata {
        string symbol;
        string companyName;
        string sector;
        uint256 totalShares;
        uint256 marketCap;
        bool isActive;
        uint256 lastUpdated;
    }

    StockMetadata public stockInfo;
    
    // Trading controls
    uint256 public maxTransferAmount;
    uint256 public minTransferAmount;
    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public lastTransferTime;
    uint256 public transferCooldown = 0; // No cooldown by default
    
    // Events
    event StockMetadataUpdated(
        string symbol,
        string companyName,
        string sector,
        uint256 totalShares,
        uint256 marketCap
    );
    event TransferLimitsUpdated(uint256 minAmount, uint256 maxAmount);
    event AddressBlacklisted(address indexed account, bool status);
    event BatchTransferCompleted(uint256 totalRecipients, uint256 totalAmount);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    // Custom errors
    error InvalidAmount(uint256 amount);
    error TransferLimitExceeded(uint256 amount, uint256 limit);
    error BlacklistedAddress(address account);
    error TransferCooldownActive(uint256 remainingTime);
    error InvalidArrayLength();
    error ZeroAddress();
    error InsufficientBalance(uint256 requested, uint256 available);

    /**
     * @dev Constructor to initialize the Nigerian stock token
     * @param _name Token name (e.g., "Dangote Cement Token")
     * @param _symbol Token symbol (e.g., "DANGCEM")
     * @param _initialSupply Initial token supply
     * @param _stockMetadata Stock metadata information
     * @param _admin Admin address
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        StockMetadata memory _stockMetadata,
        address _admin
    ) ERC20(_name, _symbol) {
        if (_admin == address(0)) revert ZeroAddress();
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(BURNER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        _grantRole(TRANSFER_ROLE, _admin);

        // Initialize stock metadata
        stockInfo = _stockMetadata;
        stockInfo.lastUpdated = block.timestamp;

        // Set default transfer limits (can be updated by admin)
        minTransferAmount = 1e18; // 1 token minimum
        maxTransferAmount = _initialSupply / 100; // 1% of total supply maximum

        // Mint initial supply to admin
        _mint(_admin, _initialSupply);

        emit StockMetadataUpdated(
            _stockMetadata.symbol,
            _stockMetadata.companyName,
            _stockMetadata.sector,
            _stockMetadata.totalShares,
            _stockMetadata.marketCap
        );
    }

    /**
     * @dev Batch transfer tokens to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant whenNotPaused {
        if (recipients.length != amounts.length) revert InvalidArrayLength();
        if (recipients.length == 0) revert InvalidArrayLength();

        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert InvalidAmount(amounts[i]);
            
            totalAmount += amounts[i];
            _transfer(msg.sender, recipients[i], amounts[i]);
        }

        emit BatchTransferCompleted(recipients.length, totalAmount);
    }

    /**
     * @dev Mint tokens to specified address (only MINTER_ROLE)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount(amount);
        
        _mint(to, amount);
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
    {
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount(amount);
        if (balanceOf(from) < amount) revert InsufficientBalance(amount, balanceOf(from));
        
        super.burnFrom(from, amount);
    }

    /**
     * @dev Pause all token transfers (only PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers (only PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Update stock metadata (only ADMIN_ROLE)
     * @param _stockMetadata New stock metadata
     */
    function updateStockMetadata(StockMetadata calldata _stockMetadata) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        stockInfo = _stockMetadata;
        stockInfo.lastUpdated = block.timestamp;

        emit StockMetadataUpdated(
            _stockMetadata.symbol,
            _stockMetadata.companyName,
            _stockMetadata.sector,
            _stockMetadata.totalShares,
            _stockMetadata.marketCap
        );
    }

    /**
     * @dev Set transfer limits (only ADMIN_ROLE)
     * @param _minAmount Minimum transfer amount
     * @param _maxAmount Maximum transfer amount
     */
    function setTransferLimits(uint256 _minAmount, uint256 _maxAmount) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (_minAmount > _maxAmount) revert InvalidAmount(_minAmount);
        
        minTransferAmount = _minAmount;
        maxTransferAmount = _maxAmount;

        emit TransferLimitsUpdated(_minAmount, _maxAmount);
    }

    /**
     * @dev Set blacklist status for an address (only ADMIN_ROLE)
     * @param account Address to blacklist/unblacklist
     * @param status Blacklist status
     */
    function setBlacklist(address account, bool status) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (account == address(0)) revert ZeroAddress();
        
        blacklisted[account] = status;
        emit AddressBlacklisted(account, status);
    }

    /**
     * @dev Set transfer cooldown period (only ADMIN_ROLE)
     * @param _cooldown Cooldown period in seconds
     */
    function setTransferCooldown(uint256 _cooldown) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        transferCooldown = _cooldown;
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
            // Check blacklist
            if (blacklisted[from] || blacklisted[to]) {
                revert BlacklistedAddress(blacklisted[from] ? from : to);
            }

            // Check transfer limits
            if (value < minTransferAmount) revert TransferLimitExceeded(value, minTransferAmount);
            if (value > maxTransferAmount) revert TransferLimitExceeded(value, maxTransferAmount);

            // Check transfer cooldown
            if (transferCooldown > 0 && lastTransferTime[from] + transferCooldown > block.timestamp) {
                revert TransferCooldownActive(
                    lastTransferTime[from] + transferCooldown - block.timestamp
                );
            }

            lastTransferTime[from] = block.timestamp;
        }

        super._update(from, to, value);
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

        emit EmergencyWithdrawal(token, amount);
    }

    /**
     * @dev Get comprehensive stock information
     */
    function getStockInfo() external view returns (StockMetadata memory) {
        return stockInfo;
    }

    /**
     * @dev Check if address has specific role
     */
    function hasRole(bytes32 role, address account) 
        public 
        view 
        override 
        returns (bool) 
    {
        return super.hasRole(role, account);
    }

    /**
     * @dev Support for receiving ETH
     */
    receive() external payable {}
}
