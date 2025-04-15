// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./TaforToken.sol";
import "./StoryManager.sol";
import "./NovelNFT.sol";
import "./ReaderActivity.sol";
import "./TreasuryManager.sol";

contract MiningPool is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // 结构体定义
    struct AuthorStakingInfo {
        uint256 stakedAmount;      // 质押金额
        uint256 stakingTime;       // 质押时间
        uint256 storyId;          // 关联的故事ID
    }

    struct NFTStakingInfo {
        uint256 stakedAmount;
        uint256 stakingTime;
    }

    // 事件定义
    event RewardsDistributed(
        uint256 indexed storyId,
        uint256 totalReward,
        uint256 platformReward,
        uint256 authorReward,
        uint256 nftHoldersReward,
        uint256 timestamp
    );
    
    event EpochUpdated(
        uint256 indexed epochNumber,
        uint256 rewardRate,
        uint256 timestamp
    );

    event AuthorStakeUnlocked(
        address indexed author,
        uint256 indexed storyId,
        uint256 amount,
        bool completed
    );

    event AuthorStakePenalized(
        address indexed author,
        uint256 indexed storyId,
        uint256 platformShare,
        uint256 nftHoldersShare
    );

    event AuthorRewardDistributed(
        address indexed author,
        uint256 indexed storyId,
        uint256 directPayment,
        uint256 stakedAmount
    );

    event TipStakeReleased(
        uint256 indexed storyId,
        address indexed author,
        uint256 tokenAmount,
        uint256 bnbAmount
    );

    event TipStakePenalized(
        uint256 indexed storyId,
        uint256 platformTokenShare,
        uint256 platformBNBShare,
        uint256 nftHolderTokenShare,
        uint256 nftHolderBNBShare
    );

    // 状态变量
    TaforToken public taforToken;
    StoryManager public storyManager;
    NovelNFT public novelNFT;
    
    uint256 public startTime;//开始时间
    uint256 public lastRewardTime;//最后奖励时间
    uint256 public totalDistributed;//总分配
    uint256 public currentEpoch;//当前周期
    uint256 public totalMiningPower;//总挖矿算力
    uint256 public totalMiningPoolBalance;  // 添加矿池余额变量
    
    // 常量
    uint256 public constant EPOCH_DURATION = 3 * 365 days; // 3年一个周期
    uint256 public constant MIN_DISTRIBUTION_INTERVAL = 7 days; // 最小分发间隔，每周
    uint256 public constant PLATFORM_SHARE_PERCENTAGE = 10; // 平台分成10%
    uint256 public constant LOTTERY_SHARE_PERCENTAGE = 10; // 抽奖池分成10%
    uint256 public constant AUTHOR_SHARE_PERCENTAGE = 40; // 作者分成40%
    uint256 public constant NFT_HOLDERS_SHARE_PERCENTAGE = 40; // NFT持有者分成40%
    uint256 public constant TOTAL_MINING_SUPPLY = 1_000_000_000 * 10**18; // 修改为10亿代币，全部用于挖矿
    
    // 添加周期性分发相关变量
    uint256 public lastWeeklyDistribution; // 上次分发时间
    uint256 public constant DISTRIBUTION_PERIOD = 7 days; // 分发周期
    
    // 添加状态变量存储当前周期的每周奖励率
    uint256 public currentWeeklyReward;
    
    // NFT质押结构
    mapping(uint256 => NFTStakingInfo) public nftStakes;  // tokenId => NFTStakingInfo
    // 作者质押结构
    mapping(address => AuthorStakingInfo) public authorStakes;

    // 平台钱包地址，用于收取挖矿奖励分成
    address public platformWallet;
    // 抽奖池地址，用于收取抽奖池分成（平台不抽取分成）    
    // 读者活动合约地址
    address public readerActivity;
    
    TreasuryManager public treasuryManager;
    

    // 构造函数
    constructor(
        address _taforToken,
        address _storyManager,
        address _novelNFT,
        address payable _treasuryManager,
        uint256 _initialMiningPool
    ) {
        taforToken = TaforToken(_taforToken);
        storyManager = StoryManager(_storyManager);
        novelNFT = NovelNFT(_novelNFT);
        treasuryManager = TreasuryManager(_treasuryManager);
        startTime = block.timestamp;
        lastRewardTime = block.timestamp;
        currentEpoch = 0;
        
        // 验证初始矿池数量 （测试用，部署时需要放开）
        // require(_initialMiningPool == TOTAL_MINING_SUPPLY, "Invalid initial mining pool amount");
        
        // 初始化矿池余额
        totalMiningPoolBalance = _initialMiningPool;
        
        // 初始化第一个周期的每周奖励率
        currentWeeklyReward = TOTAL_MINING_SUPPLY.div(2).div(156);
    }

    //设置平台钱包地址
    function setPlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Invalid address");
        platformWallet = _platformWallet;
    }

    // 设置读者活动合约地址
    function setReaderActivity(address _readerActivity) external onlyOwner {
        require(_readerActivity != address(0), "Invalid address");
        readerActivity = _readerActivity;
    }

    // 分配挖矿奖励
    function distributeRewards() external nonReentrant {
        require(
            block.timestamp >= lastWeeklyDistribution + DISTRIBUTION_PERIOD,
            "Distribution period not reached"
        );
        
        // 更新挖矿周期
        updateEpoch();
        
        // 获取所有活跃故事
        uint256[] memory storyIds = storyManager.getActiveStories();
        require(storyIds.length > 0, "No active stories");
        
        // 更新所有故事的算力并计算总算力
        uint256 totalPower = 0;
        for(uint256 i = 0; i < storyIds.length; i++) {
            storyManager.updateMiningPower(storyIds[i]);
            StoryManager.StoryView memory story = storyManager.getStory(storyIds[i]);
            totalPower = totalPower.add(story.miningPower);
        }
        
        require(totalPower > 0, "No mining power");
        
        // 获取本周可分配的总奖励
        uint256 weeklyReward = getCurrentRewardRate();
        require(
            taforToken.balanceOf(address(this)) >= weeklyReward,
            "Insufficient mining pool balance"
        );

        // 先处理平台和读者奖励
        uint256 readerRewardAmount = weeklyReward.mul(10).div(100);  // 10%给读者抽奖
        uint256 platformAmount = weeklyReward.mul(10).div(100);//10%给平台
        
        require(
            taforToken.transfer(treasuryManager.platformPool(), platformAmount),
            "Platform transfer failed"
        );
        require(
            taforToken.transfer(treasuryManager.lotteryPool(), readerRewardAmount),
            "Reader reward transfer failed"
        );
        
        // 计算剩余可分配给作品的奖励
        uint256 remainingReward = weeklyReward.sub(platformAmount).sub(readerRewardAmount);
        
        // 按算力分配奖励给每个故事
        for(uint256 i = 0; i < storyIds.length; i++) {
            StoryManager.StoryView memory story = storyManager.getStory(storyIds[i]);
            if (story.miningPower > 0) {
                uint256 storyReward = remainingReward.mul(story.miningPower).div(totalPower);
                
                // 分配作者和NFT持有者奖励
                uint256 authorShare = storyReward.mul(AUTHOR_SHARE_PERCENTAGE).div(80); // 40/80的比例,也就是各占一半
                uint256 nftHoldersShare = storyReward.mul(NFT_HOLDERS_SHARE_PERCENTAGE).div(80); // 40/80的比例
                
                //TODO:注意我们挖币和发NFT条件并不是同时的，所以需要分开处理

                // 作者奖励分配
                distributeAuthorRewards(story.author, authorShare, storyIds[i]);
                
                // NFT持有者奖励分配
                distributeNFTHolderRewards(storyIds[i], nftHoldersShare);
                
                emit RewardsDistributed(
                    storyIds[i],
                    storyReward,
                    0, // 平台奖励已经单独处理
                    authorShare,
                    nftHoldersShare,
                    block.timestamp
                );
            }
        }
        
        // 更新状态
        totalDistributed = totalDistributed.add(weeklyReward);
        lastWeeklyDistribution = block.timestamp;
        lastRewardTime = block.timestamp;
        totalMiningPoolBalance = totalMiningPoolBalance.sub(weeklyReward);
    }


    // 更新挖矿周期
    function updateEpoch() internal {
        uint256 timeSinceStart = block.timestamp.sub(startTime);
        uint256 newEpoch = timeSinceStart.div(EPOCH_DURATION);
        
        if (newEpoch > currentEpoch) {
            currentEpoch = newEpoch;
            
            // 计算新周期的每周奖励率
            uint256 newEpochSupply = TOTAL_MINING_SUPPLY.div(2); // 从5亿开始
            for (uint256 i = 0; i < currentEpoch; i++) {
                newEpochSupply = newEpochSupply.div(2);
            }
            
            // 更新当前周期的每周奖励率
            currentWeeklyReward = newEpochSupply.div(156); // 156周 = 3年
            
            emit EpochUpdated(currentEpoch, currentWeeklyReward, block.timestamp);
        }
    }

    // 获取当前奖励率（每周）
    function getCurrentRewardRate() public view returns (uint256) {
        return currentWeeklyReward;
    }

    
    // 根据NFT稀有度获取质押时间（以秒为单位）
    function getStakingPeriodByRarity(NovelNFT.Rarity rarity) internal pure returns (uint256) {
        if (rarity == NovelNFT.Rarity.Legendary) return 0;           // 无需质押
        if (rarity == NovelNFT.Rarity.Epic) return 90 days;         // 质押3个月
        if (rarity == NovelNFT.Rarity.Rare) return 180 days;        // 质押6个月
        return 365 days;                                             // Common 质押1年
    }

    // 修改作者奖励分配函数
    function distributeAuthorRewards(address author, uint256 authorShare, uint256 storyId) internal {
        // 作者奖励分配（一半直接发放，一半质押）
        uint256 authorDirectPayment = authorShare.div(2);
        uint256 authorStakeAmount = authorShare.sub(authorDirectPayment);
        
        // 直接发放部分
        require(taforToken.transfer(author, authorDirectPayment), "Direct payment failed");
        
        // 质押部分转入质押池而不是存在当前合约
        require(
            taforToken.transfer(treasuryManager.stakingPool(), authorStakeAmount),
            "Stake transfer failed"
        );
        
        // 记录质押信息
        AuthorStakingInfo storage stakeInfo = authorStakes[author];
        stakeInfo.stakedAmount = stakeInfo.stakedAmount.add(authorStakeAmount);
        stakeInfo.stakingTime = block.timestamp;
        stakeInfo.storyId = storyId;
        
        emit AuthorRewardDistributed(author, storyId, authorDirectPayment, authorStakeAmount);
    }

    // 修改 NFT 持有者奖励分配
    function distributeNFTHolderRewards(uint256 storyId, uint256 nftHoldersReward) internal {
        uint256[] memory nftIds = novelNFT.getStoryNFTs(storyId);
        uint256 totalWeight = 0;
        
        // 计算总权重 - 只修改这部分，根据批次计算权重
        for(uint256 i = 0; i < nftIds.length; i++) {
            NovelNFT.NFTMetadata memory nft = novelNFT.getNFTMetadata(nftIds[i]);
            // 第一批次权重为 2，第二批次权重为 1
            uint256 weight = nft.mintBatch == 1 ? 2 : 1;
            totalWeight = totalWeight.add(weight);
        }
        
        require(totalWeight > 0, "No valid NFTs");
        
        // 按权重分配
        for(uint256 i = 0; i < nftIds.length; i++) {
            uint256 nftId = nftIds[i];
            NovelNFT.NFTMetadata memory nft = novelNFT.getNFTMetadata(nftId);
            address holder = novelNFT.ownerOf(nftId);
            
            // 根据批次计算 NFT 的奖励
            uint256 weight = nft.mintBatch == 1 ? 2 : 1;
            uint256 nftReward = nftHoldersReward.mul(weight).div(totalWeight);
            uint256 stakingPeriod = getStakingPeriodByRarity(nft.rarity);
            
            if (stakingPeriod == 0) {
                // Legendary NFT 直接发放
                require(taforToken.transfer(holder, nftReward), "Reward transfer failed");
            } else {
                // 其他稀有度需要质押到质押池
                require(
                    taforToken.transfer(treasuryManager.stakingPool(), nftReward),
                    "Stake transfer failed"
                );
                
                // 记录质押信息
                NFTStakingInfo storage stakeInfo = nftStakes[nftId];
                stakeInfo.stakedAmount = stakeInfo.stakedAmount.add(nftReward);
                if (stakeInfo.stakingTime == 0) {
                    stakeInfo.stakingTime = nft.earningsStartTime;
                }
            }
        }
    }

    // 更新总挖矿算力
    function updateTotalMiningPower(uint256 storyId) external {
        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        totalMiningPower = totalMiningPower.add(story.miningPower);
    }

    // 获取挖矿统计信息
    function getMiningStats() external view returns (
        uint256 _totalDistributed,
        uint256 _currentEpoch,
        uint256 _totalMiningPower,
        uint256 _currentRewardRate
    ) {
        return (
            totalDistributed,
            currentEpoch,
            totalMiningPower,
            getCurrentRewardRate()
        );
    }


    // 作者释放质押（包括挖矿和打赏、NFT交易的质押）
    function unlockAuthorStake(uint256 storyId) external {
        AuthorStakingInfo storage stakeInfo = authorStakes[msg.sender];
        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        
        require(
            stakeInfo.stakedAmount > 0 || 
            story.stakedEarningsToken > 0 || 
            story.stakedEarningsBNB > 0, 
            "No staked amount"
        );
        
        require(story.author == msg.sender, "Not story author");
        require(stakeInfo.storyId == storyId, "Story ID mismatch");

        if (story.isCompleted && story.wordCount >= story.targetWordCount) {
            // 作品完成且达到目标字数，全部释放给作者
            
            // 1. 释放挖矿质押
            uint256 miningStakeAmount = stakeInfo.stakedAmount;
            if (miningStakeAmount > 0) {
                stakeInfo.stakedAmount = 0;
                require(
                    TokenStakingPool(payable(treasuryManager.stakingPool())).releaseStake(msg.sender, miningStakeAmount),
                    "Mining stake release failed"
                );
            }
            
            // 2. 释放TAFOR打赏质押
            uint256 tipStakeToken = story.stakedEarningsToken;
            if (tipStakeToken > 0) {
                story.stakedEarningsToken = 0;
                require(
                    TokenStakingPool(payable(treasuryManager.stakingPool())).releaseStake(msg.sender, tipStakeToken),
                    "Token tip stake release failed"
                );
            }
            
            // 3. 释放BNB打赏质押
            uint256 tipStakeBNB = story.stakedEarningsBNB;
            if (tipStakeBNB > 0) {
                story.stakedEarningsBNB = 0;
                require(
                    BNBStakingPool(payable(treasuryManager.bnbStakingPool())).releaseStake(msg.sender, tipStakeBNB),
                    "BNB tip stake release failed"
                );
            }
            
            emit AuthorStakeUnlocked(msg.sender, storyId, miningStakeAmount, true);
            if (tipStakeToken > 0 || tipStakeBNB > 0) {
                emit TipStakeReleased(storyId, msg.sender, tipStakeToken, tipStakeBNB);
            }
            
        } else if (story.isAbandoned) {
            // 作品太监，20%给平台，80%给NFT持有者
            
            // 1. 处理挖矿质押
            uint256 miningStakeAmount = stakeInfo.stakedAmount;
            if (miningStakeAmount > 0) {
                uint256 platformShare = miningStakeAmount.mul(20).div(100);
                uint256 nftHoldersShare = miningStakeAmount.sub(platformShare);
                
                stakeInfo.stakedAmount = 0;
                
                // 平台份额
                require(
                    TokenStakingPool(payable(treasuryManager.stakingPool())).releaseStake(
                        treasuryManager.platformPool(),
                        platformShare
                    ),
                    "Platform mining stake release failed"
                );
                
                // NFT持有者份额
                distributeToNFTHolders(storyId, nftHoldersShare, true);
            }
            
            // 2. 处理TAFOR打赏质押
            uint256 tipStakeToken = story.stakedEarningsToken;
            if (tipStakeToken > 0) {
                uint256 platformShareToken = tipStakeToken.mul(20).div(100);
                uint256 nftHoldersShareToken = tipStakeToken.sub(platformShareToken);
                
                story.stakedEarningsToken = 0;
                
                // 平台份额
                require(
                    TokenStakingPool(payable(treasuryManager.stakingPool())).releaseStake(
                        treasuryManager.platformPool(),
                        platformShareToken
                    ),
                    "Platform token tip stake release failed"
                );
                
                // NFT持有者份额
                distributeToNFTHolders(storyId, nftHoldersShareToken, true);
            }
            
            // 3. 处理BNB打赏质押
            uint256 tipStakeBNB = story.stakedEarningsBNB;
            if (tipStakeBNB > 0) {
                uint256 platformShareBNB = tipStakeBNB.mul(20).div(100);
                uint256 nftHoldersShareBNB = tipStakeBNB.sub(platformShareBNB);
                
                story.stakedEarningsBNB = 0;
                
                // 平台份额
                require(
                    BNBStakingPool(payable(treasuryManager.bnbStakingPool())).releaseStake(
                        treasuryManager.platformPool(),
                        platformShareBNB
                    ),
                    "Platform BNB tip stake release failed"
                );
                
                // NFT持有者份额
                distributeToNFTHolders(storyId, nftHoldersShareBNB, false);
            }
            
            emit AuthorStakePenalized(
                msg.sender, 
                storyId, 
                miningStakeAmount.mul(20).div(100),
                miningStakeAmount.mul(80).div(100)
            );
            
            if (tipStakeToken > 0 || tipStakeBNB > 0) {
                emit TipStakePenalized(
                    storyId,
                    tipStakeToken.mul(20).div(100),
                    tipStakeBNB.mul(20).div(100),
                    tipStakeToken.mul(80).div(100),
                    tipStakeBNB.mul(80).div(100)
                );
            }
        }
    }

    // 辅助函数：分配给NFT持有者
    function distributeToNFTHolders(uint256 storyId, uint256 amount, bool isToken) internal {
        uint256[] memory nftIds = novelNFT.getStoryNFTs(storyId);
        if(nftIds.length > 0) {
            uint256 sharePerNFT = amount.div(nftIds.length); // 每个NFT持有者获得的金额,平均分配
            for(uint256 i = 0; i < nftIds.length; i++) {
                address nftOwner = novelNFT.ownerOf(nftIds[i]);
                if (isToken) {
                    require(
                        TokenStakingPool(payable(treasuryManager.stakingPool())).releaseStake(
                            nftOwner,
                            sharePerNFT
                        ),
                        "NFT holder token release failed"
                    );
                } else {
                    require(
                        BNBStakingPool(payable(treasuryManager.bnbStakingPool())).releaseStake(
                            nftOwner,
                            sharePerNFT
                        ),
                        "NFT holder BNB release failed"
                    );
                }
            }
        }
    }

    // NFT持有者解锁 NFT 质押函数
    function unlockNFTStake(uint256 nftId) external {
        require(novelNFT.ownerOf(nftId) == msg.sender, "Not NFT owner");
        NFTStakingInfo storage stakeInfo = nftStakes[nftId];
        require(stakeInfo.stakedAmount > 0, "No staked amount");
        
        // 获取 NFT 元数据
        NovelNFT.NFTMetadata memory nft = novelNFT.getNFTMetadata(nftId);
        
        // 获取该稀有度需要的质押时间
        uint256 requiredStakingPeriod = getStakingPeriodByRarity(nft.rarity);
        
        // 检查是否达到解锁时间
        require(
            block.timestamp >= nft.earningsStartTime + requiredStakingPeriod,
            "Staking period not completed"
        );

        uint256 amount = stakeInfo.stakedAmount;
        stakeInfo.stakedAmount = 0;
        
        // 直接调用质押池的释放函数
        require(
            TokenStakingPool(payable(treasuryManager.stakingPool())).releaseStake(msg.sender, amount),
            "Stake release failed"
        );
    }

} 