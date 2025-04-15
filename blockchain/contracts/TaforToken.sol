// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TaforToken is ERC20, Ownable {
    // 最大供应量：10亿代币
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // 当前已铸造总量
    uint256 public totalMinted;
    
    // 铸造事件
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("TaforToken", "TAFOR") {
        // 初始铸造 10亿代币
        _mint(msg.sender, MAX_SUPPLY);
        totalMinted = MAX_SUPPLY;
        
        emit TokensMinted(msg.sender, MAX_SUPPLY);
    }
    
    /**
     * @dev 铸造新代币（仅限所有者）
     * @param to 接收代币的地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        // 检查是否超过最大供应量
        require(totalMinted + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(to, amount);
        totalMinted += amount;
        
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev 返回剩余可铸造数量
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
} 