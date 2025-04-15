// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./StoryManager.sol";
contract AuthorManager is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    //后面可以添加作者等级，培养白金大神等，让他们有更多粉丝
    //再增加一份链上合约，每一个注册的作者，都必须签订。主要就是作品现实收益必须有一半分配给NFT持有者。
    struct Author {
        address authorAddress;//作者地址
        string penName;//笔名
        uint32 storyCount;//故事数量
        uint256 totalWordCount;//总字数
        uint256 totalEarningsBNB;//总收益BNB
        uint256 totalEarningsToken;//总收益Token
        uint256 totalMiningRewards;//总挖矿奖励
        uint256 createdAt;//创建时间
        uint256 lastUpdate;//最后更新时间
        bool isActive;//是否激活，也就是是否注册
    }

    mapping(address => Author) public authors; //作者地址 => 作者信息
    mapping(address => uint256[]) public authorWorks; // 作者地址 => 作品ID数组的映射
    mapping(string => address) public penNameToAddress; //笔名 => 作者地址
    Counters.Counter private _authorCount; //作者数量
    address public storyManager;

    // 事件
    event AuthorRegistered(address indexed author, string penName, uint256 timestamp);
    event PenNameUpdated(address indexed author, string oldPenName, string newPenName, uint256 timestamp);
    event AuthorStatsUpdated(
        address indexed author,
        uint32 storyCount,
        uint256 wordCount,
        uint256 earningsToken,
        uint256 earningsBNB,
        uint256 timestamp
    );
    event WorkAdded(
        address indexed author,
        uint256 indexed storyId,
        uint256 timestamp
    );

    // 常量
    uint256 public constant MAX_STORIES_PER_AUTHOR = 100; // 每个作者最多100部作品
    uint256 public constant MIN_PEN_NAME_LENGTH = 1; // 最小字符长度
    uint256 public constant MAX_PEN_NAME_LENGTH = 50; // 最大字符长度

    // 修饰器
    modifier onlyRegisteredAuthor() {
        require(authors[msg.sender].isActive, "Not a registered author");
        _;
    }

    modifier validPenName(string memory penName) {
        bytes memory nameBytes = bytes(penName);
        require(nameBytes.length > 0, "Pen name cannot be empty");
        require(nameBytes.length <= MAX_PEN_NAME_LENGTH * 4, "Pen name too long"); // 考虑到中文字符最多占4个字节
        require(isValidUTF8(nameBytes), "Invalid characters in pen name");
        _;
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

    // 注册作者
    function registerAuthor(string memory penName) external validPenName(penName) nonReentrant {
        require(!authors[msg.sender].isActive, "Author already registered"); // 作者已经注册,一个钱包地址只能对应一个作者，作者可以修改笔名
        require(penNameToAddress[penName] == address(0), "Pen name already taken"); // 笔名已经被使用
        require(bytes(penName).length > 0, "Pen name cannot be empty"); // 笔名不能为空
        require(bytes(penName).length > 1, "Pen name cannot be only spaces"); // 笔名不能只有空格
        require(bytes(penName).length <= MAX_PEN_NAME_LENGTH * 4, "Pen name too long"); // 笔名长度限制
        require(isValidUTF8(bytes(penName)), "Invalid characters in pen name"); // 笔名字符验证
        // 特殊字符
                
        authors[msg.sender] = Author({
            authorAddress: msg.sender,
            penName: penName,
            storyCount: 0,
            totalWordCount: 0,
            totalEarningsBNB: 0,
            totalEarningsToken: 0,
            totalMiningRewards: 0,
            createdAt: block.timestamp,
            lastUpdate: block.timestamp,
            isActive: true
        });

        penNameToAddress[penName] = msg.sender;
        _authorCount.increment();

        // 初始化空作品集
        authorWorks[msg.sender] = new uint256[](0);

        emit AuthorRegistered(msg.sender, penName, block.timestamp);
    }

    // 更新笔名
    function updatePenName(string memory newPenName) external onlyRegisteredAuthor validPenName(newPenName) nonReentrant {
        require(penNameToAddress[newPenName] == address(0), "Pen name already taken"); // 新笔名没有被使用
        require(bytes(newPenName).length > 0, "Pen name cannot be empty"); // 新笔名不能为空
        require(bytes(newPenName).length <= MAX_PEN_NAME_LENGTH * 4, "Pen name too long"); // 新笔名长度限制
        require(isValidUTF8(bytes(newPenName)), "Invalid characters in pen name"); // 新笔名字符验证
       
        string memory oldPenName = authors[msg.sender].penName;
        delete penNameToAddress[oldPenName];
        authors[msg.sender].penName = newPenName;
        authors[msg.sender].lastUpdate = block.timestamp;
        penNameToAddress[newPenName] = msg.sender;
        emit PenNameUpdated(msg.sender, oldPenName, newPenName, block.timestamp);
    }

    // 更新作者统计信息（未用上，测试用）
    function updateAuthorStats(
        uint32 storyCountDelta,
        uint256 wordCountDelta,
        uint256 earningsTokenDelta,
        uint256 earningsBNBDelta
    ) external onlyRegisteredAuthor nonReentrant {
        Author storage author = authors[msg.sender];
        
        require(author.storyCount + storyCountDelta <= MAX_STORIES_PER_AUTHOR, "Max stories exceeded");
        
        author.storyCount += storyCountDelta;
        author.totalWordCount += wordCountDelta;

        author.totalEarningsToken += earningsTokenDelta;
        author.totalEarningsBNB += earningsBNBDelta;
        author.lastUpdate = block.timestamp;

        emit AuthorStatsUpdated(
            msg.sender,
            author.storyCount,
            author.totalWordCount,
            author.totalEarningsToken,
            author.totalEarningsBNB,
            block.timestamp
        );
    }

    // 查询作者信息
    function getAuthor(address authorAddress) external view returns (Author memory) {
        return authors[authorAddress];
    }

    // 查询笔名是否已被使用
    function isPenNameTaken(string memory penName) external view returns (bool) {
        return penNameToAddress[penName] != address(0);
    }

    // 获取作者总数
    function getAuthorCount() external view returns (uint256) {
        return _authorCount.current();
    }

    // 获取作者的所有作品 
    function getAuthorWorks(address author) external view returns (uint256[] memory) {
        return authorWorks[author];
    }

    // 新增：添加作品到作者作品集
    function addWork(address author, uint256 storyId) external {
        require(authorWorks[author].length < MAX_STORIES_PER_AUTHOR, "Max stories limit reached");
        
        authorWorks[author].push(storyId);
        authors[author].storyCount++;
        authors[author].lastUpdate = block.timestamp;
        
        emit WorkAdded(author, storyId, block.timestamp);
    }

    function setStoryManager(address _storyManager) external onlyOwner {
        require(_storyManager != address(0), "Invalid address");
        storyManager = _storyManager;
    }


 
} 