// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
import "./AuthorManager.sol";

contract StoryManager is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    struct Story {
        uint256 id; // 故事ID
        address author; // 作者地址
       
        string title; // 故事标题
        string description; // 故事描述 （这个应该改为cid）
        string coverCid; // 封面CID
        // string contentCid; // 内容CID  如果是用所有章节CID组合的哈希值，可以另设一个方法
        uint32 chapterCount; // 章节数量
        bool isCompleted; // 是否完成
        uint256 createdAt; // 创建时间
        uint256 updatedAt; // 更新时间
        uint32 nftCount; // NFT数量
        uint256 likeCount; // 点赞数量
        uint256 commentCount; // 评论数量
        uint256 wordCount; // 总字数
        uint256 lastWordReset; // 上次重置时间(与每周挖矿一起的，每一个故事要达到7日才能重置)

        uint8 avgRating; // 平均评分（暂时没用上，后面在考虑是否需要）
        uint32 ratingCount; // 评分次数（暂时没用上，后面在考虑是否需要）
        
        uint256 miningPower; // 挖矿算力
        uint32 maxNfts; // 最大NFT数量
        bool firstMintCompleted; // 第一次铸造是否完成
        uint256 targetWordCount; // 目标字数
        uint256 totalNftRevenueBNB; // NFT总收入BNB
        uint256 totalNftRevenueToken; // NFT总收入Token
        uint256 totalTipRevenueBNB; // 打赏总收入BNB
        uint256 totalTipRevenueToken; // 打赏总收入Token

        uint256 lastTipUpdate; // 上次打赏收入更新时间（）
        uint256 stakedEarningsBNB; // 质押收入BNB
        uint256 stakedEarningsToken; // 质押收入Token
        bool isAbandoned; // 是否太监
        mapping(uint256 => uint256) dailyLikes;      // 每日点赞数
        mapping(uint256 => uint256) dailyComments;   // 每日评论数
        mapping(uint256 => uint256) dailyTipsBNB;    // 每日BNB打赏
        mapping(uint256 => uint256) dailyTipsToken;  // 每日Token打赏
        mapping(uint256 => uint256) dailyWords;      // 每日更新字数
        uint256 burstPowerAccumulated;    // 本周累积的爆发算力
        uint256 burstDaysInWeek;          // 本周爆发天数
        uint256 lastInteractionUpdate;  // 上次因互动更新算力的时间（按天）
    }

    // 创建一个不包含 mapping 的结构体用于返回
    struct StoryView {
        uint256 id;
        address author;
        string title;
        string description;
        string coverCid;
        string contentCid;
        uint32 chapterCount;
        bool isCompleted;
        uint256 createdAt;
        uint256 updatedAt;
        uint32 nftCount;
        uint256 likeCount;
        uint256 commentCount;
        uint256 wordCount;
        uint256 lastWordReset;
        uint8 avgRating;
        uint32 ratingCount;
        uint256 miningPower;
        uint32 maxNfts;
        bool firstMintCompleted;
        uint256 targetWordCount;
        uint256 totalNftRevenueBNB;
        uint256 totalNftRevenueToken;
        uint256 totalTipRevenueBNB;
        uint256 totalTipRevenueToken;
        uint256 lastTipUpdate;
        uint256 stakedEarningsBNB;
        uint256 stakedEarningsToken;
        bool isAbandoned;
    }

    // 状态变量
    AuthorManager public authorManager; // 作者管理器
    mapping(uint256 => Story) public stories; // 故事映射
    Counters.Counter private _storyIds; // 故事ID计数器

    //可设置参数
    uint32 public storyMaxNft=100; // 最大NFT数量
    // 改为使用接口
    address public novelNFT;
    address public tippingSystem;      // 打赏系统合约地址

    // 常量
    uint256 public constant MIN_TITLE_LENGTH = 1;   // 最小标题长度
    uint256 public constant MAX_TITLE_LENGTH = 100 * 4;     // 考虑中文字符
    uint256 public constant MAX_DESCRIPTION_LENGTH = 1000 * 4; // 考虑中文字符
    uint256 public constant MIN_TARGET_WORD_COUNT = 50000; // 最小目标字数
    uint256 public constant WEEKLY_RESET_PERIOD = 7 days; // 每周重置周期
    uint256 public constant ABANDONMENT_PERIOD = 30 days; // 太监周期

    uint256 public constant BASE_POWER_FACTOR = 100; // 基础算力因子
    uint256 public constant WEEKLY_POWER_BONUS = 200; // 周更新算力加成
    uint256 public constant STREAK_POWER_BONUS = 150; // 连续更新加成
    uint256 public constant INTERACTION_POWER_FACTOR = 50; // 互动算力因子
    uint256 public constant RATING_POWER_FACTOR = 100; // 评分算力因子
    uint256 public constant WORD_COUNT_WEIGHT = 30;    // 字数权重30%
    uint256 public constant TIP_WEIGHT = 25;           // 打赏权重25%
    uint256 public constant LIKE_WEIGHT = 10;          // 点赞权重10%
    uint256 public constant COMMENT_WEIGHT = 15;       // 评论权重15%
    uint256 public constant NFT_REVENUE_WEIGHT = 20;   // NFT收益权重20%
    uint256 public constant TRENDING_THRESHOLD_LIKES = 500;      // 24小时内500个点赞
    uint256 public constant TRENDING_THRESHOLD_COMMENTS = 200;   // 24小时内200条评论
    uint256 public constant TRENDING_THRESHOLD_TIPS_BNB = 10 ; // 24小时内10 BNB打赏
    uint256 public constant TRENDING_THRESHOLD_TIPS_TOKEN = 10000000 * 10**18; // 24小时内1000w TAFOR打赏
    uint256 public constant DAY_IN_SECONDS = 1 days;
    uint256 public constant TRENDING_THRESHOLD_WORDS = 10000;      // 24小时内10000字更新

    // 添加爆发等级常量
    uint256 public constant BURST_LEVEL_1 = 1;  // 基础爆发 (1.5倍算力)
    uint256 public constant BURST_LEVEL_2 = 2;  // 中级爆发 (2倍算力)
    uint256 public constant BURST_LEVEL_3 = 3;  // 高级爆发 (3倍算力)
    uint256 public constant BURST_LEVEL_4 = 4;  // 超级爆发 (5倍算力)

    // 修改更新间隔为1天
    uint256 public constant POWER_UPDATE_INTERVAL = 1 days; // 每天更新一次

    // 添加常量定义
    uint256 public constant BNB_DECIMALS = 18;  // BNB 的小数位数
    uint256 public constant TOKEN_DECIMALS = 18; // TAFOR 的小数位数
    uint256 public constant BNB_BASE = 1 ether;  // 1 BNB = 1e18 wei
    uint256 public constant TOKEN_BASE = 1e18;   // 1 TAFOR = 1e18 units

    // 事件
    event StoryCreated(
        uint256 indexed storyId,
        address indexed author,
        string title,
        uint256 targetWords,
        uint256 timestamp
    );
    
    event ChapterUpdated(
        uint256 indexed storyId,
        uint32 chapterNumber,
        string contentCid,
        uint256 wordCount,
        uint256 timestamp
    );
    
    event StoryCompleted(
        uint256 indexed storyId,
        uint256 finalWordCount,
        uint256 timestamp
    );

    event StoryAbandoned(
        uint256 indexed storyId,
        uint256 timestamp
    );

    event FirstMintCompleted(
        uint256 indexed storyId,
        uint256 timestamp
    );

    event LikeAdded(uint256 indexed storyId, uint256 timestamp);
    event CommentAdded(uint256 indexed storyId, uint256 timestamp);

    // 构造函数
    constructor(address _authorManager) {
        authorManager = AuthorManager(_authorManager);
    }

     // 添加设置函数
    function setNovelNFT(address _novelNFT) external onlyOwner {
        require(_novelNFT != address(0), "Invalid address");
        novelNFT = _novelNFT;
    }

    // 添加设置打赏系统地址的函数
    function setTippingSystem(address _tippingSystem) external onlyOwner {
        require(_tippingSystem != address(0), "Invalid address");
        tippingSystem = _tippingSystem;
    }

    

    // 修饰器
    modifier onlyAuthor(uint256 storyId) {
        require(stories[storyId].author == msg.sender, "Not the story author");
        _;
    }

    modifier storyExists(uint256 storyId) {
        require(storyId > 0 && storyId <= _storyIds.current(), "Story does not exist");
        _;
    }

    // 添加标题和描述的验证
    modifier validTitle(string memory title) {
        bytes memory titleBytes = bytes(title);
        require(titleBytes.length > 0, "Title cannot be empty");
        require(titleBytes.length <= MAX_TITLE_LENGTH, "Title too long");
        require(isValidUTF8(titleBytes), "Invalid characters in title");
        _;
    }

    modifier validDescription(string memory description) {
        bytes memory descBytes = bytes(description);
        require(descBytes.length <= MAX_DESCRIPTION_LENGTH, "Description too long");
        require(isValidUTF8(descBytes), "Invalid characters in description");
        _;
    }

    // 创建故事
    function createStory(
        string memory title,
        string memory description,
        string memory coverCid,
        string memory contentCid,
        uint256 targetWordCount
    ) external nonReentrant returns (uint256) {
        require(bytes(title).length >= MIN_TITLE_LENGTH && bytes(title).length <= MAX_TITLE_LENGTH, "Invalid title length");
        require(bytes(description).length <= MAX_DESCRIPTION_LENGTH, "Description too long");
        require(targetWordCount >= MIN_TARGET_WORD_COUNT, "Target word count too low");
        
        AuthorManager.Author memory author = authorManager.getAuthor(msg.sender);
        require(author.isActive, "Not a registered author");
        
        _storyIds.increment();
        uint256 newStoryId = _storyIds.current();
        
        // 分步骤初始化结构体
        Story storage story = stories[newStoryId];
        story.id = newStoryId;
        story.author = msg.sender;
        story.title = title;
        story.description = description;
        story.coverCid = coverCid;
        story.contentCid = contentCid;
        story.chapterCount = 0;   //更新时就会从第1章开始。
        story.isCompleted = false;
        story.createdAt = block.timestamp;
        story.updatedAt = block.timestamp;
        story.nftCount = 0;
        story.likeCount = 0;
        story.commentCount = 0;
        story.wordCount = 0;
        story.lastWordReset = block.timestamp;
        story.avgRating = 0;
        story.ratingCount = 0;
        story.maxNfts = storyMaxNft;
        story.firstMintCompleted = false;
        story.targetWordCount = targetWordCount;
        story.totalNftRevenueBNB = 0;
        story.totalNftRevenueToken = 0;
        story.totalTipRevenueBNB = 0;
        story.totalTipRevenueToken = 0;
        story.lastTipUpdate = block.timestamp;
        story.stakedEarningsBNB = 0;
        story.stakedEarningsToken = 0;
        story.isAbandoned = false;
        
        authorManager.addWork(msg.sender, newStoryId);
        
        emit StoryCreated(newStoryId, msg.sender, title, targetWordCount, block.timestamp);
        
        return newStoryId;
    }


    // 更新章节（这个需要我们平台调用，防止作弊,不存在作弊可能，web项目都是在后端）
    //这里少了一个插图参数Cid参数，而且是数组，可以多张(不管是内容cid还是插图cid都放到后端数据库就行，
    // 不用放到区块链上,因为会消耗极大的存储空间)。
    function updateChapter(
        uint256 storyId,
        uint32 chapterNumber,
        uint256 newWords   //新增文字数。
        // string memory contentCid,  //这个不需要，或者用一个数据保存，实际上不需要最好
    ) external storyExists(storyId) onlyAuthor(storyId) nonReentrant {
        Story storage story = stories[storyId];
        require(!story.isCompleted, "Story is completed");
        require(!story.isAbandoned, "Story is abandoned");
        require(chapterNumber == story.chapterCount+1, "Invalid chapter number");

        require(newWords > 0, "New words must be greater than 0");
        
        // 更新章节信息
        story.chapterCount = chapterNumber;
        // story.contentCid = contentCid;   
        story.updatedAt = block.timestamp;
        
        // 更新字数
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        story.dailyWords[today] = story.dailyWords[today].add(newWords);
        story.wordCount = story.wordCount.add(newWords);
        
        // 更新挖矿算力
        updateMiningPower(storyId);
        
        emit ChapterUpdated(storyId, chapterNumber, newWords, block.timestamp);
    }

    // 完成故事
    function completeStory(uint256 storyId) external storyExists(storyId) onlyAuthor(storyId) nonReentrant {
        Story storage story = stories[storyId];
        require(!story.isCompleted, "Story already completed");
        require(!story.isAbandoned, "Story is abandoned");
        require(story.wordCount >= story.targetWordCount, "Target word count not met");
        
        story.isCompleted = true;
        story.updatedAt = block.timestamp;
        
        emit StoryCompleted(storyId, story.wordCount, block.timestamp);
    }

      // 设置第一轮铸造完成状态（这个感觉没什么用了）
    function setFirstMintCompleted(uint256 storyId) external storyExists(storyId) {
        require(msg.sender == address(novelNFT), "Only NovelNFT can call");
        Story storage story = stories[storyId];
        require(!story.firstMintCompleted, "First mint already completed");
        
        story.firstMintCompleted = true;
        
        emit FirstMintCompleted(
            storyId,
            block.timestamp
        );
    }


    

    // 检查是否太监
    function checkAbandonment(uint256 storyId) external storyExists(storyId) {
        Story storage story = stories[storyId];
        require(!story.isCompleted, "Story is completed"); // 只检查是否完成
        require(!story.isAbandoned, "Story already abandoned"); // 只检查是否已标记为太监
        
        // 如果故事未完成且超过30天未更新，则标记为太监
        if (block.timestamp > story.updatedAt + ABANDONMENT_PERIOD) {
            story.isAbandoned = true;
            emit StoryAbandoned(storyId, block.timestamp);
        }
    }

    // 获取故事信息
    function getStory(uint256 storyId) external view returns (StoryView memory) {
        require(storyId > 0 && storyId <= _storyIds.current(), "Story does not exist");
        Story storage story = stories[storyId];

        //这个太麻烦可以后面改改，不需要获得这么多数据。
        return StoryView({
            id: story.id,
            author: story.author,
            title: story.title,
            description: story.description,
            coverCid: story.coverCid,
            contentCid: story.contentCid,
            chapterCount: story.chapterCount,
            isCompleted: story.isCompleted,
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
            nftCount: story.nftCount,
            likeCount: story.likeCount,
            commentCount: story.commentCount,
            wordCount: story.wordCount,
            lastWordReset: story.lastWordReset,
            avgRating: story.avgRating,
            ratingCount: story.ratingCount,
            miningPower: story.miningPower,
            maxNfts: story.maxNfts,
            firstMintCompleted: story.firstMintCompleted,
            targetWordCount: story.targetWordCount,
            totalNftRevenueBNB: story.totalNftRevenueBNB,
            totalNftRevenueToken: story.totalNftRevenueToken,
            totalTipRevenueBNB: story.totalTipRevenueBNB,
            totalTipRevenueToken: story.totalTipRevenueToken,
            lastTipUpdate: story.lastTipUpdate,
            stakedEarningsBNB: story.stakedEarningsBNB,
            stakedEarningsToken: story.stakedEarningsToken,
            isAbandoned: story.isAbandoned
        });
    }

    // 获取作者的所有故事（这个完全不需要，放到作者哪里即可，没必要放到这里）
    function getAuthorStories(address author) public view returns (uint256[] memory) {
        return authorManager.getAuthorWorks(author);
    }

    // 获取故事总数
    function getStoryCount() external view returns (uint256) {
        return _storyIds.current();
    }

    // 获取所有活跃故事
    function getActiveStories() external view returns (uint256[] memory) {
        uint256 totalStories = _storyIds.current();
        uint256[] memory activeStories = new uint256[](totalStories);
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= totalStories; i++) {
            Story storage story = stories[i];
            if (!story.isCompleted && !story.isAbandoned) {
                activeStories[activeCount] = i;
                activeCount++;
            }
        }
        
        // 调整数组大小以匹配实际的活跃故事数量
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeStories[i];
        }
        
        return result;
    }

    // 更新点赞函数，添加事件
    function addLike(uint256 storyId) external storyExists(storyId) {
        Story storage story = stories[storyId];
        require(!story.isCompleted && !story.isAbandoned, "Story not active");
        
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        story.dailyLikes[today] = story.dailyLikes[today].add(1);
        story.likeCount = story.likeCount.add(1);
        
        // 检查是否需要更新算力（每天只更新一次）
        if (today > story.lastInteractionUpdate / DAY_IN_SECONDS) {
            updateMiningPower(storyId);
            story.lastInteractionUpdate = block.timestamp;
        }
        
        emit LikeAdded(storyId, block.timestamp);
    }

    // 更新评论函数，添加事件
    function addComment(uint256 storyId) external storyExists(storyId) {
        Story storage story = stories[storyId];
        require(!story.isCompleted && !story.isAbandoned, "Story not active");
        
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        story.dailyComments[today] = story.dailyComments[today].add(1);
        story.commentCount = story.commentCount.add(1);
        
        // 检查是否需要更新算力
        if (block.timestamp >= story.lastInteractionUpdate + POWER_UPDATE_INTERVAL) {
            updateMiningPower(storyId);
            story.lastInteractionUpdate = block.timestamp;
        }
        
        emit CommentAdded(storyId, block.timestamp);
    }

    // TODO: 添加收藏函数（未实现，这个也可以添加到权重相关）
    // function addFavorite(uint256 storyId) external storyExists(storyId) {
    //     Story storage story = stories[storyId];
    //     require(!story.isCompleted && !story.isAbandoned, "Story not active");
        
    //     story.favoriteCount++;
    //     emit FavoriteAdded(storyId, block.timestamp);
    // }

    // 添加打赏统计更新函数
    function updateTipStats(
        uint256 storyId, 
        uint256 tipAmountBNB, 
        uint256 tipAmountToken,
        uint256 stakeBNB,
        uint256 stakeToken
    ) external {
        require(msg.sender == tippingSystem, "Only TippingSystem can call");
        Story storage story = stories[storyId];
        require(!story.isCompleted && !story.isAbandoned, "Story not active");
        
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        
        // 更新每日打赏统计（记录总打赏金额）
        story.dailyTipsBNB[today] = story.dailyTipsBNB[today].add(tipAmountBNB);
        story.dailyTipsToken[today] = story.dailyTipsToken[today].add(tipAmountToken);
        
        // 更新总打赏统计（记录总打赏金额）
        story.totalTipRevenueBNB = story.totalTipRevenueBNB.add(tipAmountBNB);
        story.totalTipRevenueToken = story.totalTipRevenueToken.add(tipAmountToken);
        
        // 更新质押统计（只记录作者质押部分）
        story.stakedEarningsBNB = story.stakedEarningsBNB.add(stakeBNB);
        story.stakedEarningsToken = story.stakedEarningsToken.add(stakeToken);
        
        story.lastTipUpdate = block.timestamp;

        // 检查是否需要更新算力
        if (block.timestamp >= story.lastInteractionUpdate + POWER_UPDATE_INTERVAL) {
            updateMiningPower(storyId);
            story.lastInteractionUpdate = block.timestamp;
        }
    }

      // 获取故事每日字数
    function getDailyWords(uint256 storyId, uint256 day) public view returns (uint256) {
        return stories[storyId].dailyWords[day];
    }

    // 获取每日数据的辅助函数
    function getDailyStats(uint256 storyId, uint256 day) public view returns (
        uint256 likes,
        uint256 comments,
        uint256 tipsBNB,
        uint256 tipsToken,
        uint256 words
    ) {
        Story storage story = stories[storyId];
        return (
            story.dailyLikes[day],
            story.dailyComments[day],
            story.dailyTipsBNB[day],
            story.dailyTipsToken[day],
            story.dailyWords[day]
        );
    }

    // 获取指定时间范围的统计数据
    function getStatsInRange(
        uint256 storyId, 
        uint256 startDay, 
        uint256 endDay
    ) external view returns (
        uint256 totalLikes,
        uint256 totalComments,
        uint256 totalTipsBNB,
        uint256 totalTipsToken
    ) {
        Story storage story = stories[storyId];
        
        for (uint256 day = startDay; day <= endDay; day++) {
            totalLikes += story.dailyLikes[day];
            totalComments += story.dailyComments[day];
            totalTipsBNB += story.dailyTipsBNB[day];
            totalTipsToken += story.dailyTipsToken[day];
        }
        
        return (totalLikes, totalComments, totalTipsBNB, totalTipsToken);
    }

    // 清理过期数据（只保留最近7天的数据）
    function cleanupOldData(uint256 storyId) external {
        Story storage story = stories[storyId];
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        
        // 删除7天以前的数据
        uint256 oldDay = today - 7; // 只保留最近7天
        delete story.dailyLikes[oldDay];
        delete story.dailyComments[oldDay];
        delete story.dailyTipsBNB[oldDay];
        delete story.dailyTipsToken[oldDay];
        delete story.dailyWords[oldDay];   // 清理字数数据
    }

    // 添加获取周字数的辅助函数
    function getWeeklyWords(uint256 storyId) internal view returns (uint256) {
        Story storage story = stories[storyId];
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        uint256 weekStart = today - 7;
        
        uint256 weeklyWords = 0;
        for (uint256 day = weekStart; day <= today; day++) {
            weeklyWords += story.dailyWords[day];
        }
        
        return weeklyWords;
    }


    // 更新故事挖矿算力 TODO（最终要好好计算一下这些权重比例是否与实际合理。同时还要考虑作弊行为，
    //比如刷一些无用字数行为。要么降低权重，要么增加作弊检测，
    //比如平台可以检测到刷字数行为，然后降低权重。AI就可以检测是不是刷字）
    function updateMiningPower(uint256 storyId) public {
        Story storage story = stories[storyId];
        require(!story.isCompleted && !story.isAbandoned, "Story not active");
        
        // 检查是否需要重置周数据
        if (block.timestamp >= story.lastWordReset + WEEKLY_RESET_PERIOD) {
            story.burstPowerAccumulated = 0;  // 重置累积爆发算力
            story.burstDaysInWeek = 0;        // 重置爆发天数
            story.lastWordReset = block.timestamp;
            
            // 调用 cleanupOldData 来清理过期数据
            this.cleanupOldData(storyId);
        }

        // 1. 基础算力计算
        // 1.1 周更字数算力
        uint256 weeklyWords = getWeeklyWords(storyId);
        uint256 weeklyUpdatePower = 0;
        if (weeklyWords >= 5000) { // 每周至少5000字才计入算力
            weeklyUpdatePower = weeklyWords.mul(WORD_COUNT_WEIGHT).div(1000);
        }
        console.log("weeklyWords:", weeklyWords);
        console.log("weeklyUpdatePower:", weeklyUpdatePower);
        
        // 1.2 本周互动算力
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        uint256 weekStart = today - 7;
        
        uint256 weeklyLikes = 0;
        uint256 weeklyComments = 0;
        uint256 weeklyTipsBNB = 0;
        uint256 weeklyTipsToken = 0;
        
        // 统计一周内的互动数据
        for (uint256 day = weekStart; day <= today; day++) {
            weeklyLikes += story.dailyLikes[day];
            weeklyComments += story.dailyComments[day];
            weeklyTipsBNB += story.dailyTipsBNB[day];
            weeklyTipsToken += story.dailyTipsToken[day];
        }
        
        uint256 weeklyInteractionPower = weeklyLikes.mul(LIKE_WEIGHT).div(100) +
                                        weeklyComments.mul(COMMENT_WEIGHT).div(50) +
                                        ((weeklyTipsBNB.div(BNB_BASE) + // 将 wei 转换为 BNB
                                          weeklyTipsToken.div(TOKEN_BASE)) // 将 token units 转换为 TAFOR
                                 .mul(TIP_WEIGHT).div(100));

        // 2. NFT收益算力计算（保持总量计算）
        uint256 nftPower;
        if (story.totalNftRevenueBNB.div(BNB_BASE) == 0) { // 转换为 BNB 单位
            nftPower = 0;                      
        } else if (story.totalNftRevenueBNB.div(BNB_BASE) <= 100) {
            nftPower = 50;                     
        } else if (story.totalNftRevenueBNB.div(BNB_BASE) <= 500) {
            nftPower = 200;                    
        } else if (story.totalNftRevenueBNB.div(BNB_BASE) <= 1000) {
            nftPower = 400;                    
        } else if (story.totalNftRevenueBNB.div(BNB_BASE) <= 3000) {
            nftPower = 800;                    
        } else {
            nftPower = 1600;                   // 顶级算力
        }
        console.log("totalNftRevenueBNB:", story.totalNftRevenueBNB);
        console.log("nftPower:", nftPower);

        // Token 支付的权重计算
        uint256 tokenWeight = story.totalNftRevenueToken.div(TOKEN_BASE).div(100000);
        
        // 3. 计算总基础算力
        // 周更新和互动占80%，NFT收益占20%
        uint256 totalBasePower = (weeklyUpdatePower.add(weeklyInteractionPower)).mul(60).div(100) +
                                (nftPower.add(tokenWeight)).mul(NFT_REVENUE_WEIGHT).div(100);
        console.log("totalBasePower:", totalBasePower);

        // 4. 等级倍率计算
        uint256 levelMultiplier;
        if (totalBasePower <= 1000) {
            levelMultiplier = 1000;            // 1.0x 铜牌
        } else if (totalBasePower <= 3000) {
            levelMultiplier = 1500;            // 1.5x 白银
        } else if (totalBasePower <= 6000) {
            levelMultiplier = 2500;            // 2.5x 黄金
        } else if (totalBasePower <= 10000) {
            levelMultiplier = 4000;            // 4.0x 白金
        } else if (totalBasePower <= 15000) {
            levelMultiplier = 8000;            // 8.0x 钻石
        } else {
            levelMultiplier = 16000;           // 16.0x 传说
        }
        console.log("levelMultiplier:", levelMultiplier);

        // 5. 爆发期处理
        uint256 burstLevel = isStoryTrending(storyId);
        if (burstLevel > 0) {
            uint256 burstMultiplier;
            if (burstLevel == BURST_LEVEL_1) {
                burstMultiplier = 150; // 1.5倍
            } else if (burstLevel == BURST_LEVEL_2) {
                burstMultiplier = 200; // 2倍
            } else if (burstLevel == BURST_LEVEL_3) {
                burstMultiplier = 300; // 3倍
            } else {
                burstMultiplier = 500; // 5倍
            }
            console.log("burstMultiplier:", burstMultiplier);
            uint256 todayBurstPower = totalBasePower.mul(burstMultiplier).div(100);
            story.burstPowerAccumulated = story.burstPowerAccumulated.add(todayBurstPower);
            story.burstDaysInWeek = story.burstDaysInWeek.add(1);
        }
        
        // 6. 计算平均爆发加成
        uint256 averageBurstBonus = 0;
        if (story.burstDaysInWeek > 0) {
            // 计算本周平均爆发算力
            averageBurstBonus = story.burstPowerAccumulated.div(7);  // 将累积爆发算力平均到整周
        }
        console.log("averageBurstBonus:", averageBurstBonus);
        
        // 7. 最终算力计算
        uint256 adjustedPower = totalBasePower.mul(levelMultiplier).div(1000);
        story.miningPower = adjustedPower.add(averageBurstBonus);
        console.log("adjustedPower:", adjustedPower);
        console.log("Final miningPower:", story.miningPower);
    }

    // 判断故事是否处于爆发期
    function isStoryTrending(uint256 storyId) public view returns (uint256) {
        Story storage story = stories[storyId];
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        
        // 获取24小时内的数据
        uint256 recentWords = story.dailyWords[today].add(story.dailyWords[today.sub(1)]);
        uint256 recentLikes = story.dailyLikes[today].add(story.dailyLikes[today.sub(1)]);
        uint256 recentComments = story.dailyComments[today].add(story.dailyComments[today.sub(1)]);
        uint256 recentTipsBNB = story.dailyTipsBNB[today].add(story.dailyTipsBNB[today.sub(1)]);
        uint256 recentTipsToken = story.dailyTipsToken[today].add(story.dailyTipsToken[today.sub(1)]);

        // console.log("recentWords:", recentWords);
        // console.log("recentLikes:", recentLikes);
        // console.log("recentComments:", recentComments);
        // console.log("recentTipsBNB:", recentTipsBNB);
        // console.log("recentTipsToken:", recentTipsToken);
        
        // 计算达成的条件数量
        uint256 conditions = 0;
        if (recentWords >= TRENDING_THRESHOLD_WORDS) conditions++;
        if (recentLikes >= TRENDING_THRESHOLD_LIKES) conditions++;
        if (recentComments >= TRENDING_THRESHOLD_COMMENTS) conditions++;
        if (recentTipsBNB >= TRENDING_THRESHOLD_TIPS_BNB || 
            recentTipsToken >= TRENDING_THRESHOLD_TIPS_TOKEN) conditions++;

        // 根据条件组合判断爆发等级
        if (conditions == 0) {
            return 0; // 未爆发
        } else if (recentWords >= TRENDING_THRESHOLD_WORDS) {
            if (conditions == 1) {
                return BURST_LEVEL_1; // 仅达到字数要求：1.5倍算力
            } else if (conditions == 2) {
                return BURST_LEVEL_2; // 字数+1个其他条件：2倍算力
            } else if (conditions == 3) {
                return BURST_LEVEL_3; // 字数+2个其他条件：3倍算力
            } else {
                return BURST_LEVEL_4; // 全部条件：5倍算力
            }
        } else if (conditions >= 2) {
            return BURST_LEVEL_1; // 无字数更新但达到2个其他条件：1.5倍算力
        }

        return 0; // 其他情况不触发爆发
    }


    // 添加 UTF-8 验证函数
    function isValidUTF8(bytes memory str) internal pure returns (bool) {
        uint256 i = 0;
        while (i < str.length) {
            if ((uint8(str[i]) & 0x80) == 0) {
                // ASCII 字符
                i += 1;
            } else if ((uint8(str[i]) & 0xE0) == 0xC0) {
                // 2字节 UTF-8
                require(i + 1 < str.length, "Incomplete UTF-8");
                require((uint8(str[i+1]) & 0xC0) == 0x80, "Invalid UTF-8");
                i += 2;
            } else if ((uint8(str[i]) & 0xF0) == 0xE0) {
                // 3字节 UTF-8 (常见中文)
                require(i + 2 < str.length, "Incomplete UTF-8");
                require((uint8(str[i+1]) & 0xC0) == 0x80, "Invalid UTF-8");
                require((uint8(str[i+2]) & 0xC0) == 0x80, "Invalid UTF-8");
                i += 3;
            } else if ((uint8(str[i]) & 0xF8) == 0xF0) {
                // 4字节 UTF-8
                require(i + 3 < str.length, "Incomplete UTF-8");
                require((uint8(str[i+1]) & 0xC0) == 0x80, "Invalid UTF-8");
                require((uint8(str[i+2]) & 0xC0) == 0x80, "Invalid UTF-8");
                require((uint8(str[i+3]) & 0xC0) == 0x80, "Invalid UTF-8");
                i += 4;
            } else {
                return false;
            }
        }
        return true;
    }

    // 添加 NFT 收益更新函数
    function updateNFTRevenue(uint256 storyId, uint256 amount, bool isBNB) external {
        Story storage story = stories[storyId];
        if (isBNB) {
            story.totalNftRevenueBNB += amount;  // 
        } else {
            story.totalNftRevenueToken += amount;  // 
        }
    }

} 