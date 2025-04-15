// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";



/*
部署流程：
部署 TreasuryManager
部署各资金池合约
在 TreasuryManager 中设置各池地址
授权相关合约调用权限

*/

// 总资金管理合约，负责管理和分配所有资金池
contract TreasuryManager is Ownable, ReentrancyGuard {
    // 各资金池合约地址
    address public miningPool;        // 挖矿奖励池
    address public platformPool;      // 平台收入池
    address public lotteryPool;       // 抽奖奖池
    address public stakingPool;       // 质押池(TAFOR)
    address public bnbStakingPool;    // BNB质押池
    
    // 权限管理
    mapping(address => bool) public isAuthorizedCaller;
    
    event PoolUpdated(string poolName, address poolAddress);
    event StakeReceived(uint256 indexed storyId, uint256 amount, bool isBNB);
    event StakeReleased(uint256 indexed storyId, address recipient, uint256 amount, bool isBNB);
    
    modifier onlyAuthorized() {
        require(isAuthorizedCaller[msg.sender], "Not authorized");
        _;
    }
    
    // 设置资金池地址
    function setPool(string memory poolName, address poolAddress) external onlyOwner {
        require(poolAddress != address(0), "Invalid address");
        
        if (keccak256(bytes(poolName)) == keccak256(bytes("mining"))) {
            miningPool = poolAddress;
        } else if (keccak256(bytes(poolName)) == keccak256(bytes("staking"))) {
            stakingPool = poolAddress;
        } else if (keccak256(bytes(poolName)) == keccak256(bytes("bnbStaking"))) {
            bnbStakingPool = poolAddress;
        } else if (keccak256(bytes(poolName)) == keccak256(bytes("lottery"))) {
            lotteryPool = poolAddress;
        } else if (keccak256(bytes(poolName)) == keccak256(bytes("platform"))) {
            platformPool = poolAddress;
        } else {
            revert("Invalid pool name");
        }
        
        emit PoolUpdated(poolName, poolAddress);
    }
    
    // 授权调用者
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        isAuthorizedCaller[caller] = authorized;
    }

    // // 添加释放质押的函数（tafor）
    // function releaseStake(uint256 storyId, address recipient, uint256 amount) external onlyAuthorized {
    //     require(TokenStakingPool(stakingPool).releaseStake(recipient, amount), "Transfer failed");
    //     emit StakeReleased(storyId, recipient, amount, false);
    // }
    
    // // 释放BNB质押
    // function releaseStakeBNB(uint256 storyId, address recipient, uint256 amount) external onlyAuthorized {
    //     require(BNBStakingPool(bnbStakingPool).releaseStake(recipient, amount), "Transfer failed");
    //     emit StakeReleased(storyId, recipient, amount, true);
    // }
    
    // 接收BNB
    receive() external payable {}
}

// 基础资金池合约，其他资金池继承此合约
contract BasePool is Ownable, ReentrancyGuard {
    address public treasuryManager;
    IERC20 public taforToken;
    
    modifier onlyTreasuryManager() {
        require(msg.sender == treasuryManager, "Only treasury manager");
        _;
    }
    
    constructor(address _treasuryManager, address _taforToken) {
        treasuryManager = _treasuryManager;
        taforToken = IERC20(_taforToken);
    }
    
    // 接收 BNB
    receive() external payable {}
}

// 平台收入池
contract PlatformPool is BasePool {
    event RevenueReceived(uint256 amountBNB, uint256 amountToken);
    
    constructor(address _treasuryManager, address _taforToken) 
        BasePool(_treasuryManager, _taforToken) {}
    
    // 接收平台收入 （BNB）
    function receiveRevenue() external payable onlyTreasuryManager {
        emit RevenueReceived(msg.value, 0);
    }
    
    // 接收代币收入
    function receiveTokenRevenue(uint256 amount) external onlyTreasuryManager {
        require(taforToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit RevenueReceived(0, amount);
    }
}

// 抽奖奖池
contract LotteryPool is BasePool {
    event PrizeDistributed(address winner, uint256 amount);
    
    constructor(address _treasuryManager, address _taforToken) 
        BasePool(_treasuryManager, _taforToken) {}
    
    // 分发奖金
    function distributePrize(address winner, uint256 amount) external onlyTreasuryManager {
        require(taforToken.transfer(winner, amount), "Prize transfer failed");
        emit PrizeDistributed(winner, amount);
    }
}

// 质押池基类
contract BaseStakingPool is BasePool {
  
    // 单位转换常量
    uint256 public constant BNB_BASE = 1 ether;  // 1 BNB = 1e18 wei
    uint256 public constant TOKEN_BASE = 1e18;   // 1 TAFOR = 1e18 units
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }
    
    mapping(uint256 => StakeInfo) public storyStakes; // storyId => StakeInfo
    
    constructor(address _treasuryManager, address _taforToken) 
        BasePool(_treasuryManager, _taforToken) {}
    
    event StakeReceived(uint256 storyId, uint256 amount);
    event StakeReleased(uint256 storyId, address author, uint256 amount);
    
    // 记录质押
    function recordStake(uint256 storyId, uint256 amount) internal {
        StakeInfo storage stake = storyStakes[storyId];
        stake.amount += amount;
        stake.timestamp = block.timestamp;
        emit StakeReceived(storyId, amount);
    }
}

// TAFOR 质押池
contract TokenStakingPool is BaseStakingPool {
    constructor(address _treasuryManager, address _taforToken) 
        BaseStakingPool(_treasuryManager, _taforToken) {}
    
    // 接收质押 （TAFOR）
    function receiveStake(uint256 storyId, uint256 amount) external onlyTreasuryManager {
        require(taforToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        recordStake(storyId, amount/TOKEN_BASE);
    }
    
    // 释放质押
    function releaseStake(address recipient, uint256 amount) external onlyTreasuryManager returns (bool) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        require(taforToken.transfer(recipient, amount), "Transfer failed");
        return true;
    }
}

// BNB 质押池
contract BNBStakingPool is BaseStakingPool {
    constructor(address _treasuryManager, address _taforToken) 
        BaseStakingPool(_treasuryManager, _taforToken) {}
    
    // 接收质押
    function receiveStake(uint256 storyId) external payable onlyTreasuryManager {
        recordStake(storyId, msg.value/BNB_BASE);
    }
    
    // 释放质押
    function releaseStake(address recipient, uint256 amount) external onlyTreasuryManager returns (bool) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        (bool success,) = payable(recipient).call{value: amount}("");
        return success;
    }
} 