// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NigerianStockToken
 * @dev ERC20 token representing Nigerian Stock Exchange (NGX) stocks on Bitfinity EVM
 * 
 * Features:
 * - ERC20 compliant with permit functionality
 * - Role-based access control
 * - Pausable for emergency stops
 * - Reentrancy protection
 * - Minting and burning capabilities
 * - Transfer restrictions for compliance
 */
contract NigerianStockToken is ERC20, ERC20Permit, ERC20Pausable, AccessControl, ReentrancyGuard {
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // Token metadata
    string public stockSymbol;
    string public companyName;
    uint256 public maxSupply;
    
    // Compliance and security features
    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public dailyTransferLimits;
    mapping(address => mapping(uint256 => uint256)) public dailyTransferAmounts;
    
    uint256 public defaultDailyLimit = 1000000 * 10**18; // 1M tokens default
    uint256 public maxTransactionAmount = 100000 * 10**18; // 100K tokens per transaction
    
    // Events
    event Blacklisted(address indexed account, bool status);
    event DailyLimitSet(address indexed account, uint256 limit);
    event MaxTransactionAmountUpdated(uint256 newAmount);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @dev Constructor
     * @param _name Token name (e.g., "Dangote Cement Token")
     * @param _symbol Token symbol (e.g., "DANGCEM")
     * @param _stockSymbol NGX stock symbol (e.g., "DANGCEM")
     * @param _companyName Full company name
     * @param _maxSupply Maximum token supply
     * @param _initialSupply Initial token supply to mint
     * @param _admin Admin address
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _stockSymbol,
        string memory _companyName,
        uint256 _maxSupply,
        uint256 _initialSupply,
        address _admin
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        require(_admin != address(0), "Admin cannot be zero address");
        require(_maxSupply > 0, "Max supply must be greater than 0");
        require(_initialSupply <= _maxSupply, "Initial supply exceeds max supply");
        
        stockSymbol = _stockSymbol;
        companyName = _companyName;
        maxSupply = _maxSupply;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(BURNER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        _grantRole(COMPLIANCE_ROLE, _admin);
        
        // Mint initial supply
        if (_initialSupply > 0) {
            _mint(_admin, _initialSupply);
            emit TokensMinted(_admin, _initialSupply);
        }
    }

    /**
     * @dev Mint tokens to specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= maxSupply, "Exceeds maximum supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from specified address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) nonReentrant {
        require(from != address(0), "Cannot burn from zero address");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");
        
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Pause all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Add/remove address from blacklist
     * @param account Address to blacklist/unblacklist
     * @param status True to blacklist, false to unblacklist
     */
    function setBlacklisted(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        blacklisted[account] = status;
        emit Blacklisted(account, status);
    }

    /**
     * @dev Set daily transfer limit for an address
     * @param account Address to set limit for
     * @param limit Daily transfer limit
     */
    function setDailyLimit(address account, uint256 limit) external onlyRole(COMPLIANCE_ROLE) {
        dailyTransferLimits[account] = limit;
        emit DailyLimitSet(account, limit);
    }

    /**
     * @dev Set maximum transaction amount
     * @param amount New maximum transaction amount
     */
    function setMaxTransactionAmount(uint256 amount) external onlyRole(COMPLIANCE_ROLE) {
        maxTransactionAmount = amount;
        emit MaxTransactionAmountUpdated(amount);
    }

    /**
     * @dev Get current day (for daily limits)
     */
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /**
     * @dev Check if transfer is allowed
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transfer amount
     */
    function _isTransferAllowed(address from, address to, uint256 amount) internal view returns (bool) {
        // Check blacklist
        if (blacklisted[from] || blacklisted[to]) {
            return false;
        }
        
        // Check max transaction amount
        if (amount > maxTransactionAmount) {
            return false;
        }
        
        // Check daily limits
        uint256 currentDay = getCurrentDay();
        uint256 dailyLimit = dailyTransferLimits[from] > 0 ? dailyTransferLimits[from] : defaultDailyLimit;
        uint256 dailyAmount = dailyTransferAmounts[from][currentDay];
        
        if (dailyAmount + amount > dailyLimit) {
            return false;
        }
        
        return true;
    }

    /**
     * @dev Override transfer to add compliance checks
     */
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        // Skip checks for minting and burning
        if (from != address(0) && to != address(0)) {
            require(_isTransferAllowed(from, to, value), "Transfer not allowed");
            
            // Update daily transfer amount
            uint256 currentDay = getCurrentDay();
            dailyTransferAmounts[from][currentDay] += value;
        }
        
        super._update(from, to, value);
    }

    /**
     * @dev Get token information
     */
    function getTokenInfo() external view returns (
        string memory _name,
        string memory _symbol,
        string memory _stockSymbol,
        string memory _companyName,
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint8 _decimals
    ) {
        return (
            name(),
            symbol(),
            stockSymbol,
            companyName,
            totalSupply(),
            maxSupply,
            decimals()
        );
    }
}
