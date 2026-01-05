// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title QBS Token - Quantum Breakthrough Shares
 * @dev ERC20 token for the Sovereign Lattice ecosystem
 * Represents ownership of scientific breakthroughs and mining rewards
 */
contract QBSToken is ERC20, Ownable, Pausable {
    // Maximum supply: 10,000 QBS tokens
    uint256 public constant MAX_SUPPLY = 10000 * 10**18;
    
    // Mapping of authorized miners who can mint rewards
    mapping(address => bool) public authorizedMiners;
    
    // Mapping to track mining rewards per user
    mapping(address => uint256) public totalMiningRewards;
    
    // Events
    event MinerAuthorized(address indexed miner);
    event MinerRevoked(address indexed miner);
    event MiningReward(address indexed miner, uint256 amount, string blockId, string grade);
    event EvolutionReward(address indexed user, uint256 amount, string blockId, uint256 newLevel);
    
    constructor(address initialOwner) ERC20("Quantum Breakthrough Shares", "QBS") Ownable(initialOwner) {
        // Initial supply goes to contract deployer
        _mint(initialOwner, 1000 * 10**18); // 1,000 QBS for initial liquidity
    }
    
    /**
     * @dev Add an authorized miner who can mint rewards
     * @param miner Address to authorize for mining rewards
     */
    function authorizeMiner(address miner) external onlyOwner {
        require(miner != address(0), "QBS: Invalid miner address");
        require(!authorizedMiners[miner], "QBS: Miner already authorized");
        
        authorizedMiners[miner] = true;
        emit MinerAuthorized(miner);
    }
    
    /**
     * @dev Remove mining authorization from an address
     * @param miner Address to revoke mining authorization
     */
    function revokeMiner(address miner) external onlyOwner {
        require(authorizedMiners[miner], "QBS: Miner not authorized");
        
        authorizedMiners[miner] = false;
        emit MinerRevoked(miner);
    }
    
    /**
     * @dev Mint mining rewards to a user
     * @param to Address to receive the reward
     * @param amount Amount of QBS tokens to mint
     * @param blockId Unique identifier for the solved block
     * @param grade Scientific grade achieved (S, A, B, C)
     */
    function mintMiningReward(
        address to,
        uint256 amount,
        string memory blockId,
        string memory grade
    ) external whenNotPaused returns (bool) {
        require(authorizedMiners[msg.sender], "QBS: Not authorized miner");
        require(to != address(0), "QBS: Invalid recipient");
        require(amount > 0, "QBS: Invalid amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "QBS: Exceeds max supply");
        
        _mint(to, amount);
        totalMiningRewards[to] += amount;
        
        emit MiningReward(to, amount, blockId, grade);
        return true;
    }
    
    /**
     * @dev Mint evolution rewards for breakthrough advancement
     * @param to Address to receive the reward
     * @param amount Amount of QBS tokens to mint
     * @param blockId Unique identifier for the evolved block
     * @param newLevel New advancement level achieved
     */
    function mintEvolutionReward(
        address to,
        uint256 amount,
        string memory blockId,
        uint256 newLevel
    ) external whenNotPaused returns (bool) {
        require(authorizedMiners[msg.sender], "QBS: Not authorized miner");
        require(to != address(0), "QBS: Invalid recipient");
        require(amount > 0, "QBS: Invalid amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "QBS: Exceeds max supply");
        
        _mint(to, amount);
        
        emit EvolutionReward(to, amount, blockId, newLevel);
        return true;
    }
    
    /**
     * @dev Burn tokens from the caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "QBS: Invalid burn amount");
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from a specific address (requires allowance)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external {
        require(amount > 0, "QBS: Invalid burn amount");
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "QBS: Burn amount exceeds allowance");
        
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
    }
    
    /**
     * @dev Get total mining rewards earned by an address
     * @param user Address to check
     * @return Total mining rewards earned
     */
    function getMiningRewards(address user) external view returns (uint256) {
        return totalMiningRewards[user];
    }
    
    /**
     * @dev Check if an address is an authorized miner
     * @param miner Address to check
     * @return True if authorized, false otherwise
     */
    function isAuthorizedMiner(address miner) external view returns (bool) {
        return authorizedMiners[miner];
    }
    
    /**
     * @dev Get remaining mintable supply
     * @return Remaining tokens that can be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @dev Pause the contract (emergency use)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}