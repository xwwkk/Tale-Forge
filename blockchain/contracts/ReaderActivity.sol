// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./TaforToken.sol"; 
import "./MiningPool.sol";
import "./TreasuryManager.sol";
import "./StoryManager.sol";

contract ReaderActivity is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct Reader {
        uint256[] checkIns;      // 签到记录
        uint256 lastCheckIn;     // 最后签到时间
        uint32 monthlyActiveDays; // 本月活跃天数
        uint256 lotteryWeight;   // 抽奖权重
        uint32 commentCount;     // 评论数
        uint32 likeCount;        // 点赞数
        bool isActive;           // 是否活跃
    }

    // 状态变量
    TaforToken public taforToken;
    mapping(address => Reader) public readers;
    uint256 public totalReaders; // 总读者数
    uint256 public activeReaders; // 活跃读者数
    uint256 public lastLotteryTime; // 上次抽奖时间
    uint256 public accumulatedRewards; // 累积奖励（没用到）
    uint256 public lotteryPool;    // 抽奖奖金池，用于累积未分配的奖金

    // 常量
    uint256 public constant MIN_CHECK_IN_INTERVAL = 1 days; // 最小签到间隔
    uint256 public constant LOTTERY_INTERVAL = 30 days; // 抽奖间隔
    uint256 public constant MIN_ACTIVE_DAYS_FOR_LOTTERY = 7; // 抽奖所需的最小活跃天数
    uint256 public constant TOP_WINNERS_COUNT = 10;     // 特等奖数量
    uint256 public constant TOP_PRIZE_PERCENTAGE = 30;  // 特等奖占比30%
    uint256 public constant BASE_WINNER_PERCENTAGE = 5; // 基础获奖比例5%

  

    // 事件
    event ReaderCheckIn(
        address indexed reader,
        uint256 consecutiveDays,
        uint256 timestamp
    );

    event LotteryCompleted(
        uint256 winnerCount,
        uint256 totalReward,
        uint256 timestamp
    );

    event LotterySkipped(
        string reason,
        uint256 timestamp
    );

    event MinimalLotteryCompleted(
        uint32 winnerCount,
        uint256 distributedAmount,
        uint256 reservedAmount,
        uint256 timestamp
    );

    event MonthlyLotteryCompleted(
        uint32 baseWinners,
        uint8 extraWinners,
        uint256 totalReward,
        uint256 timestamp
    );

    event Like(
        address indexed reader,
        uint256 indexed storyId,
        uint256 timestamp
    );

    event Comment(
        address indexed reader,
        uint256 indexed storyId,
        uint256 timestamp
    );

    // 添加 TreasuryManager
    TreasuryManager public treasuryManager;
    StoryManager public storyManager;
    
    // 构造函数
    constructor(
        address payable _treasuryManager,
        address _taforToken,
        address _storyManager
    ) {
        treasuryManager = TreasuryManager(_treasuryManager);
        taforToken = TaforToken(_taforToken);
        storyManager = StoryManager(_storyManager);
        lastLotteryTime = block.timestamp;
    }

    // 签到
    function checkIn() external nonReentrant {
        Reader storage reader = readers[msg.sender];


        
        // 如果是新读者
        if (!reader.isActive) {
            reader.isActive = true;
            reader.checkIns = new uint256[](0);
            totalReaders++;
            activeReaders++;
        }

        require(
            block.timestamp >= reader.lastCheckIn.add(MIN_CHECK_IN_INTERVAL),
            "Already checked in today"
        );

        // 检查是否需要重置月度统计
        if (!isSameMonth(reader.lastCheckIn, block.timestamp)) {
            reader.monthlyActiveDays = 0;
        }

        // 更新签到记录
        reader.checkIns.push(block.timestamp);
        reader.lastCheckIn = block.timestamp;
        reader.monthlyActiveDays++;

        // 更新抽奖权重
        updateLotteryWeight(msg.sender);

        emit ReaderCheckIn(
            msg.sender,
            getConsecutiveDays(msg.sender),
            block.timestamp
        );
    }

    // 执行月度抽奖
    function runMonthlyLottery() external onlyOwner nonReentrant {
        // 1. 基础检查
        require(
            block.timestamp >= lastLotteryTime + LOTTERY_INTERVAL,
            "Too early for lottery"
        );
        
        // 获取新的奖励并加入奖金池
        uint256 newReward = taforToken.balanceOf(address(this));
        require(newReward > 0, "No rewards available");
        lotteryPool = lotteryPool.add(newReward);
        
        // 2. 获取合格读者
        address[] memory eligibleReaders = getEligibleReaders();

        // 3. 处理不同情况
        // 如果合格读者数量为0，则跳过抽奖
        if (eligibleReaders.length == 0) {
            // 无合格读者，奖池累积到下月
            emit LotterySkipped(
                "No eligible readers",
                block.timestamp
            );
            return;
        } 
        // 如果合格读者数量小于等于10，则进行最小抽奖
        else if (eligibleReaders.length <= 10) {
            // 少量参与者情况
            uint256 readerCount = eligibleReaders.length;
            
            // 计算分配金额
            uint256 distributableAmount = lotteryPool.mul(80).div(100);  // 分配80%
            uint256 remainingAmount = lotteryPool.sub(distributableAmount);  // 保留20%
            
            // 平均分配奖励
            uint256 rewardPerReader = distributableAmount.div(readerCount);
            
            // 分发奖励
            for (uint256 i = 0; i < readerCount; i++) {
                LotteryPool(payable(treasuryManager.lotteryPool())).distributePrize(
                    eligibleReaders[i], 
                    rewardPerReader
                );
            }
            
            // 更新奖金池
            lotteryPool = remainingAmount;
            
            emit MinimalLotteryCompleted(
                uint32(readerCount),
                distributableAmount,
                remainingAmount,
                block.timestamp
            );
        }
        else {
            // 正常抽奖流程
            uint256 totalPool = lotteryPool;
            
            // 1. 特等奖部分 (30%)
            uint256 topPrizePool = totalPool.mul(TOP_PRIZE_PERCENTAGE).div(100);
            uint256 basePrizePool = totalPool.sub(topPrizePool);
            
            // 选择前10名特等奖获奖者（根据活跃度权重）
            address[] memory topWinners = selectTopWinners(eligibleReaders, TOP_WINNERS_COUNT);
            
            // 2. 基础奖励部分 (70% 分给剩余读者中的 5%)
            uint256 remainingCount = eligibleReaders.length.sub(topWinners.length);
            uint256 baseWinnerCount = remainingCount.mul(BASE_WINNER_PERCENTAGE).div(100);
            
            // 从未获得特等奖的读者中选择基础奖励获得者
            address[] memory baseWinners = selectWinners(
                filterOutTopWinners(eligibleReaders, topWinners),
                baseWinnerCount
            );
            
            // 计算奖励金额
            uint256 topReward = topWinners.length > 0 ? 
                topPrizePool.div(topWinners.length) : 0;
            uint256 baseReward = baseWinners.length > 0 ? 
                basePrizePool.div(baseWinners.length) : 0;
            
            // 分发特等奖
            for (uint256 i = 0; i < topWinners.length; i++) {
                LotteryPool(payable(treasuryManager.lotteryPool())).distributePrize(
                    topWinners[i], 
                    topReward
                );
            }
            
            // 分发基础奖励
            for (uint256 i = 0; i < baseWinners.length; i++) {
                LotteryPool(payable(treasuryManager.lotteryPool())).distributePrize(
                    baseWinners[i], 
                    baseReward
                );
            }
            
            // 更新状态
            lastLotteryTime = block.timestamp;
            lotteryPool = 0;
            
            emit MonthlyLotteryCompleted(
                uint32(baseWinners.length),
                uint8(topWinners.length),
                totalPool,
                block.timestamp
            );
        }
    }

    // 更新抽奖权重
    function updateLotteryWeight(address reader) internal {
        Reader storage readerData = readers[reader];
        
        // 基础权重 = 月活跃天数 * 10
        uint256 baseWeight = uint256(readerData.monthlyActiveDays).mul(10);
        
        // 连续签到权重 = 连续天数 * 5
        uint256 consecutiveWeight = getConsecutiveDays(reader).mul(5);
        
        // 互动权重 = (点赞数 + 评论数 * 2) * 3
        uint256 interactionWeight = (uint256(readerData.likeCount).add(
            uint256(readerData.commentCount).mul(2)
        )).mul(3);
        
        readerData.lotteryWeight = baseWeight.add(consecutiveWeight).add(interactionWeight);
    }

    // 获取连续签到天数
    function getConsecutiveDays(address reader) public view returns (uint256) {
        Reader storage readerData = readers[reader];
        if (readerData.checkIns.length == 0) return 0;
        
        uint256 consecutiveDays = 1;
        for (uint256 i = readerData.checkIns.length - 1; i > 0; i--) {
            if (readerData.checkIns[i].sub(readerData.checkIns[i-1]) <= MIN_CHECK_IN_INTERVAL) {
                consecutiveDays++;
            } else {
                break;
            }
        }
        return consecutiveDays;
    }

    // 获取合格读者
    function getEligibleReaders() internal view returns (address[] memory) {
        // 计算一个月前的时间戳
        uint256 monthAgo = block.timestamp - 30 days;
        
        // 先统计合格读者数量
        uint256 eligibleCount = 0;
        for (uint256 i = 0; i < totalReaders; i++) {
            Reader storage reader = readers[msg.sender];
            if (
                reader.monthlyActiveDays >= MIN_ACTIVE_DAYS_FOR_LOTTERY && // 达到最小活跃天数
                reader.lastCheckIn > monthAgo && // 最近一个月内有签到
                (reader.commentCount > 0 || reader.likeCount > 0) // 有评论或点赞
            ) {
                eligibleCount++;
            }
        }
        
        // 创建合格读者数组
        address[] memory eligibleReaders = new address[](eligibleCount);
        uint256 index = 0;
        
        // 再次遍历填充数组
        for (uint256 i = 0; i < totalReaders; i++) {
            Reader storage reader = readers[msg.sender];
            if (
                reader.monthlyActiveDays >= MIN_ACTIVE_DAYS_FOR_LOTTERY &&
                reader.lastCheckIn > monthAgo &&
                (reader.commentCount > 0 || reader.likeCount > 0)
            ) {
                eligibleReaders[index] = msg.sender;
                index++;
            }
        }
        
        return eligibleReaders;
    }

    // 检查读者是否符合抽奖条件
    function isEligibleForLottery(address reader) public view returns (bool) {
        Reader storage readerData = readers[reader];
        return readerData.isActive && 
               readerData.monthlyActiveDays >= MIN_ACTIVE_DAYS_FOR_LOTTERY;
    }

    // 根据权重选择获奖者
    function selectWinners(
        address[] memory eligibleReaders,
        uint256 winnerCount
    ) internal view returns (address[] memory) {
        require(eligibleReaders.length > 0, "No eligible readers");
        
        // 计算总权重
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < eligibleReaders.length; i++) {
            totalWeight = totalWeight.add(readers[eligibleReaders[i]].lotteryWeight);
        }
        
        // 创建获奖者数组
        uint256 actualWinnerCount = winnerCount > eligibleReaders.length ? 
            eligibleReaders.length : winnerCount;
        address[] memory winners = new address[](actualWinnerCount);
        bool[] memory selected = new bool[](eligibleReaders.length);
        uint256 selectedCount = 0;
        
        // 使用区块信息作为随机种子
        bytes32 seed = keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            totalWeight,
            winnerCount
        ));
        
        // 选择获奖者
        while (selectedCount < actualWinnerCount) {
            // 生成随机权重
            uint256 randomWeight = uint256(keccak256(abi.encodePacked(seed, selectedCount))) % totalWeight;
            uint256 currentWeight = 0;
            
            // 根据权重选择获奖者
            for (uint256 i = 0; i < eligibleReaders.length; i++) {
                if (selected[i]) continue;
                
                currentWeight = currentWeight.add(readers[eligibleReaders[i]].lotteryWeight);
                if (currentWeight >= randomWeight) {
                    winners[selectedCount] = eligibleReaders[i];
                    selected[i] = true;
                    selectedCount++;
                    break;
                }
            }
            
            // 更新随机种子
            seed = keccak256(abi.encodePacked(seed, selectedCount));
        }
        
        return winners;
    }

    // 获取读者信息
    function getReaderInfo(address reader) external view returns (
        uint256 lastCheckIn,
        uint32 monthlyActiveDays,
        uint256 lotteryWeight,
        uint32 commentCount,
        uint32 likeCount,
        bool isActive
    ) {
        Reader storage readerData = readers[reader];
        return (
            readerData.lastCheckIn,
            readerData.monthlyActiveDays,
            readerData.lotteryWeight,
            readerData.commentCount,
            readerData.likeCount,
            readerData.isActive
        );
    }

    // 获取抽奖统计信息
    function getLotteryStats() external view returns (
        uint256 _totalReaders,
        uint256 _activeReaders,
        uint256 _lastLotteryTime,
        uint256 _accumulatedRewards,
        uint256 _nextLotteryTime
    ) {
        return (
            totalReaders,
            activeReaders,
            lastLotteryTime,
            accumulatedRewards,
            lastLotteryTime.add(LOTTERY_INTERVAL)
        );
    }



    // 添加选择特等奖获奖者函数（根据活跃度权重选择）
    function selectTopWinners(
        address[] memory eligibleReaders, 
        uint256 count
    ) internal view returns (address[] memory) {
        // 按权重排序
        address[] memory sortedReaders = new address[](eligibleReaders.length);
        for (uint256 i = 0; i < eligibleReaders.length; i++) {
            sortedReaders[i] = eligibleReaders[i];
        }
        
        // 冒泡排序（按权重降序）
        for (uint256 i = 0; i < sortedReaders.length; i++) {
            for (uint256 j = i + 1; j < sortedReaders.length; j++) {
                if (readers[sortedReaders[i]].lotteryWeight < readers[sortedReaders[j]].lotteryWeight) {
                    address temp = sortedReaders[i];
                    sortedReaders[i] = sortedReaders[j];
                    sortedReaders[j] = temp;
                }
            }
        }
        
        // 取前count名
        uint256 actualCount = count > sortedReaders.length ? sortedReaders.length : count;
        address[] memory winners = new address[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            winners[i] = sortedReaders[i];
        }
        
        return winners;
    }

    // 添加点赞和评论函数
    function addLike(
        address reader,
        uint256 storyId
    ) external onlyOwner {
        require(reader != address(0), "Invalid reader address");
        
        Reader storage readerData = readers[reader];
        if (!readerData.isActive) {
            readerData.isActive = true;
            totalReaders++;
            activeReaders++;
        }
        
        readerData.likeCount++;
        updateLotteryWeight(reader);
        
        emit Like(reader, storyId, block.timestamp);
    }

    function addComment(
        address reader,
        uint256 storyId
    ) external onlyOwner {
        require(reader != address(0), "Invalid reader address");
        
        Reader storage readerData = readers[reader];
        if (!readerData.isActive) {
            readerData.isActive = true;
            totalReaders++;
            activeReaders++;
        }
        
        readerData.commentCount++;
        updateLotteryWeight(reader);
        
        emit Comment(reader, storyId, block.timestamp);
    }

    // 添加过滤特等奖获奖者的函数
    function filterOutTopWinners(
        address[] memory allReaders,
        address[] memory topWinners
    ) internal pure returns (address[] memory) {
        // 创建标记数组，标记哪些读者是特等奖获奖者
        bool[] memory isTopWinner = new bool[](allReaders.length);
        uint256 remainingCount = allReaders.length;
        
        // 标记特等奖获奖者
        for (uint256 i = 0; i < allReaders.length; i++) {
            for (uint256 j = 0; j < topWinners.length; j++) {
                if (allReaders[i] == topWinners[j]) {
                    isTopWinner[i] = true;
                    remainingCount--;
                    break;
                }
            }
        }
        
        // 创建剩余读者数组
        address[] memory remainingReaders = new address[](remainingCount);
        uint256 index = 0;
        
        // 填充剩余读者数组
        for (uint256 i = 0; i < allReaders.length; i++) {
            if (!isTopWinner[i]) {
                remainingReaders[index] = allReaders[i];
                index++;
            }
        }
        
        return remainingReaders;
    }

    // 检查两个时间戳是否在同一个月
    function isSameMonth(uint256 timestamp1, uint256 timestamp2) internal pure returns (bool) {
        // 转换为日期
        uint256 year1 = timestamp1 / (365 days);
        uint256 month1 = (timestamp1 % (365 days)) / (30 days);
        
        uint256 year2 = timestamp2 / (365 days);
        uint256 month2 = (timestamp2 % (365 days)) / (30 days);
        
        return (year1 == year2 && month1 == month2);
    }

  
} 