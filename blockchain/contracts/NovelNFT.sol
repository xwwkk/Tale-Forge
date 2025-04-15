// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./StoryManager.sol";
import "./TaforToken.sol";
import "./TreasuryManager.sol";


contract NovelNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // NFT类型
    enum NFTType { Character, Scene, Pet, Item }
    
    // 稀有度
    enum Rarity {
        Common,     // 普通
        Rare,       // 稀有
        Epic,       // 史诗
        Legendary   // 传说
    }

    // NFT元数据结构
    struct NFTMetadata {
        uint256 storyId;          // 关联的故事
        string name;              // NFT 名称 (支持中文)
        string description;       // NFT 描述 (支持中文)
        string imageUri;          // NFT.Storage URI
        NFTType nftType;         // NFT 类型
        Rarity rarity;           // 稀有度
        address owner;           // 所有者
        uint256 createdAt;       // 创建时间
        bool isFirstSale;        // 是否为首次销售
        uint256 mintBatch;       // 铸造批次
        bool isListed;           // 是否在售
        uint256 listTime;        // 挂单时间
        uint256 priceBNB;        // BNB 定价
        uint256 priceToken;      // TAFOR 定价
        uint256 stakedEarnings;  // 质押的挖矿收益
        uint256 earningsStartTime; // 开始计算收益的时间
    }

    // 状态变量
    StoryManager public storyManager;
    TaforToken public taforToken;
    TreasuryManager public treasuryManager;
    Counters.Counter private _tokenIds; // 计数器，用于生成NFT ID
    // NFT元数据
    mapping(uint256 => NFTMetadata) public nftMetadata;
    // 故事id => 批次 => NFT数量(这实际是个计数器，并不是映射实际元素)
    mapping(uint256 => mapping(uint256 => uint256)) public storyNFTs; // storyId => batch => count
    
    // 常量
    uint256 public constant FIRST_BATCH_LIMIT = 10; // 第一批NFT铸造数量
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 10;  // 10% 平台分成（首次销售）
    uint256 public constant AUTHOR_STAKE_PERCENTAGE = 50; // 作者收益的50%进行质押
    uint256 public constant SECONDARY_PLATFORM_FEE = 1;   // 1% 平台手续费（二次交易）
    uint256 public constant FIRST_MINT_WORD_REQUIREMENT = 100000;  // 第一轮铸造需要10万字
    // 平台钱包地址，用于收取 NFT 交易手续费
    address public platformWallet;
    
    // 添加最低价格常量
    uint256 public constant MIN_PRICE_BNB = 0.1 ether;    // 最低 0.1 BNB
    uint256 public constant MIN_PRICE_TOKEN = 10 ether;   // 最低 10 TAFOR

    // 事件
    event NFTMinted(
        uint256 indexed tokenId,
        uint256 indexed storyId,
        address indexed owner,
        NFTType nftType,
        Rarity rarity,
        uint256 mintBatch,
        uint256 timestamp
    );
    
    event NFTListed(
        uint256 indexed tokenId,
        uint256 priceBNB,
        uint256 priceToken,
        uint256 timestamp
    );
    
    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        bool isBNBPayment,
        uint256 timestamp
    );
    
    event NFTUnlisted(
        uint256 indexed tokenId,
        uint256 timestamp
    );

    event BatchNFTMinted(
        uint256 indexed storyId,
        uint256[] tokenIds,
        address indexed owner,
        NFTType[] nftTypes,
        uint256 mintBatch,
        uint256 timestamp
    );

    event NFTFirstSold(
        uint256 indexed tokenId,
        uint256 indexed storyId,
        address indexed buyer,
        uint256 price,
        uint256 platformFee,
        uint256 authorStake,
        uint256 authorDirect,
        bool isBNBPayment
    );

    event NFTSecondaryTraded(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 platformFee,
        bool isBNBPayment,
        uint256 timestamp
    );

    // 添加稀有度概率常量
    uint256 private constant LEGENDARY_CHANCE = 5;   // 5% 传说
    uint256 private constant EPIC_CHANCE = 15;       // 15% 史诗
    uint256 private constant RARE_CHANCE = 30;       // 30% 稀有
    // Common = 50%                                  // 50% 普通

    // 构造函数
    constructor(
        address _storyManager,
        address payable _treasuryManager
    ) ERC721("TaleForge NFT", "TFNFT") {
        treasuryManager = TreasuryManager(_treasuryManager);
        storyManager = StoryManager(_storyManager);
        
    }

    // 修饰器
    modifier onlyStoryAuthor(uint256 storyId) {
        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        require(story.author == msg.sender, "Not the story author");
        _;
    }

    modifier onlyNFTOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        _;
    }

    // 铸造NFT
    function mintNFT(
        uint256 storyId,
        string memory name,
        string memory description,
        string memory imageUri,
        NFTType nftType,
        uint256 expectedBatch
    ) external onlyStoryAuthor(storyId) nonReentrant returns (uint256) {
        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        require(story.nftCount < story.maxNfts, "Max NFTs reached");
        
        uint256 actualBatch = story.firstMintCompleted ? 2 : 1;
        
        // 检查用户期望的批次是否正确
        if (actualBatch == 2 && expectedBatch == 1) {
            revert("Current batch is 2 (second batch, lower mining weight)"); // 当尝试在第二批次用第一批次铸造时才提示
        }
        require(expectedBatch == actualBatch, "Invalid batch number"); // 期望批次和实际批次不一致
        
        if (actualBatch == 1) {
            require(story.wordCount >= FIRST_MINT_WORD_REQUIREMENT, "Word count not enough for first mint");
            require(storyNFTs[storyId][actualBatch] < FIRST_BATCH_LIMIT, "Would exceed first batch limit");
            
            // 检查是否需要标记第一批次完成
            if (storyNFTs[storyId][actualBatch] + 1 == FIRST_BATCH_LIMIT) {
                storyManager.setFirstMintCompleted(storyId);
            }
        } else {
            require(story.wordCount >= story.targetWordCount.div(3), "Word count not enough for second mint");
        }
        
        // 生成随机稀有度
        Rarity rarity = generateRarityWithPity(storyId);
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        
        nftMetadata[newTokenId] = NFTMetadata({
            storyId: storyId,
            name: name,
            description: description,
            imageUri: imageUri,
            nftType: nftType,
            rarity: rarity,
            owner: msg.sender,
            createdAt: block.timestamp,
            isFirstSale: false,
            mintBatch: actualBatch,
            isListed: false,
            listTime: 0,
            priceBNB: 0,
            priceToken: 0,
            stakedEarnings: 0,
            earningsStartTime: block.timestamp
        });
        
        storyNFTs[storyId][actualBatch]++;
        
        emit NFTMinted(newTokenId, storyId, msg.sender, nftType, rarity, actualBatch, block.timestamp);
        return newTokenId;
    }

    // 批量铸造函数
    function batchMintNFT(
        uint256 storyId,
        string[] memory names,
        string[] memory descriptions,
        string[] memory imageUris,
        NFTType[] memory nftTypes,
        uint256 expectedBatch  // 期望批次
    ) external onlyStoryAuthor(storyId) nonReentrant {
        require(
            names.length == descriptions.length && 
            descriptions.length == imageUris.length && 
            imageUris.length == nftTypes.length,
            "Array lengths mismatch"
        );

        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        uint256 actualBatch = story.firstMintCompleted ? 2 : 1;
        
        // 检查用户期望的批次是否正确
        if (actualBatch == 2 && expectedBatch == 1) {
            revert("Current batch is 2 (second batch, lower mining weight)"); // 当尝试在第二批次用第一批次铸造时才提示
        }
        require(expectedBatch == actualBatch, "Invalid batch number"); // 期望批次和实际批次不一致

        if (actualBatch == 1) {
            require(story.wordCount >= FIRST_MINT_WORD_REQUIREMENT, "Word count not enough for first mint");
            require(
                storyNFTs[storyId][actualBatch] + names.length <= FIRST_BATCH_LIMIT,
                "Would exceed first batch limit"
            );
            
            // 检查是否需要标记第一批次完成
            if (storyNFTs[storyId][actualBatch] + names.length == FIRST_BATCH_LIMIT) {
                storyManager.setFirstMintCompleted(storyId);
            }
        } else {
            require(story.wordCount >= story.targetWordCount.div(3), "Word count not enough for second mint");
        }

        uint256[] memory tokenIds = new uint256[](names.length);
        
        // 批量铸造
        for(uint256 i = 0; i < names.length; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            tokenIds[i] = newTokenId;
            
            _safeMint(msg.sender, newTokenId);
            
            // 为每个 NFT 单独生成稀有度
            Rarity rarity = generateRarityWithPity(storyId);
            
            nftMetadata[newTokenId] = NFTMetadata({
                storyId: storyId,
                name: names[i],
                description: descriptions[i],
                imageUri: imageUris[i],
                nftType: nftTypes[i],
                rarity: rarity,
                owner: msg.sender,
                createdAt: block.timestamp,
                isFirstSale: false,
                mintBatch: actualBatch,
                isListed: false,
                listTime: 0,
                priceBNB: 0,
                priceToken: 0,
                stakedEarnings: 0,
                earningsStartTime: block.timestamp
            });
            
            storyNFTs[storyId][actualBatch]++;
        }
        
        emit BatchNFTMinted(
            storyId,
            tokenIds,
            msg.sender,
            nftTypes,
            actualBatch,
            block.timestamp
        );
    }

    // 上架NFT
    function listNFT(
        uint256 tokenId,
        uint256 priceBNB,
        uint256 priceToken
    ) external onlyNFTOwner(tokenId) {
        // 至少需要设置一种代币的价格
        require(priceBNB > 0 || priceToken > 0, "Must set at least one price");
        
        // 如果设置了BNB价格，检查最低限额
        if (priceBNB > 0) {
            require(priceBNB >= MIN_PRICE_BNB, "BNB price too low");
        }
        
        // 如果设置了Token价格，检查最低限额
        if (priceToken > 0) {
            require(priceToken >= MIN_PRICE_TOKEN, "Token price too low");
        }
        
        NFTMetadata storage nft = nftMetadata[tokenId];
        require(!nft.isListed, "NFT already listed");
        
        nft.isListed = true;
        nft.listTime = block.timestamp;
        nft.priceBNB = priceBNB;
        nft.priceToken = priceToken;
        
        emit NFTListed(tokenId, priceBNB, priceToken, block.timestamp);
    }

    // 合并后的购买NFT函数
    function buyNFT(uint256 tokenId, bool payWithBNB) external payable {
        NFTMetadata storage nft = nftMetadata[tokenId];
        require(nft.isListed, "NFT not listed");
        require(msg.sender != ownerOf(tokenId), "Cannot buy your own NFT");
        
        uint256 price = payWithBNB ? nft.priceBNB : nft.priceToken;
        require(price > 0, "Price not set");
        
        if(payWithBNB) {
            require(msg.value >= price, "Insufficient BNB");
        } else {
            require(
                taforToken.balanceOf(msg.sender) >= price,
                "Insufficient token balance"
            );
        }

        // 首次销售
        if (nft.isFirstSale) {
            StoryManager.StoryView memory story = storyManager.getStory(nft.storyId);
            require(!story.isAbandoned, "Story abandoned");
            require(msg.sender != story.author, "Author cannot buy own NFT");

            // 计算分成
            uint256 platformFee = price.mul(PLATFORM_FEE_PERCENTAGE).div(100);    // 10%
            uint256 authorTotal = price.sub(platformFee);                         // 90%
            uint256 authorStake = authorTotal.mul(AUTHOR_STAKE_PERCENTAGE).div(100); // 45%
            uint256 authorDirect = authorTotal.sub(authorStake);                     // 45%

            if (payWithBNB) {
                // 转账给平台
                (bool platformSuccess,) = treasuryManager.platformPool().call{value: platformFee}("");
                require(platformSuccess, "Platform fee transfer failed");
                
                // 转账给作者（直接获得部分）
                payable(story.author).transfer(authorDirect);
                
                // 转入BNB质押池（作者质押部分）
                (bool stakeSuccess,) = treasuryManager.bnbStakingPool().call{value: authorStake}("");
                require(stakeSuccess, "Author stake transfer failed");
                
            } else {
                // 转账给平台
                require(
                    taforToken.transfer(treasuryManager.platformPool(), platformFee),
                    "Platform fee transfer failed"
                );
                
                // 转账给作者（直接获得部分）
                require(
                    taforToken.transfer(story.author, authorDirect),
                    "Author direct transfer failed"
                );
                
                // 转入Token质押池（作者质押部分）
                require(
                    taforToken.transfer(treasuryManager.stakingPool(), authorStake),
                    "Author stake transfer failed"
                );
            }

            // 在首次销售结束时更新 NFT 收益
            if (payWithBNB) {
                storyManager.updateNFTRevenue(nft.storyId, msg.value / 1 ether, true);  // 转换为 ether 单位
            } else {
                storyManager.updateNFTRevenue(nft.storyId, price / 1e18, false);  // 转换为标准 token 单位
            }

            emit NFTFirstSold(
                tokenId,
                nft.storyId,
                msg.sender,
                price,
                platformFee,
                authorStake,
                authorDirect,
                payWithBNB
            );

        } else {
            // 二次交易
            address seller = ownerOf(tokenId);
            
            // 计算平台手续费
            uint256 platformFee = price.mul(SECONDARY_PLATFORM_FEE).div(100);  // 1%
            uint256 sellerAmount = price.sub(platformFee);                     // 99%
            
            if(payWithBNB) {
                // 转账给平台
                (bool platformSuccess,) = treasuryManager.platformPool().call{value: platformFee}("");
                require(platformSuccess, "Platform fee transfer failed");
                
                // 转账给卖家
                payable(seller).transfer(sellerAmount);
                
            } else {
                // 转账给平台
                require(
                    taforToken.transfer(treasuryManager.platformPool(), platformFee),
                    "Platform fee transfer failed"
                );
                
                // 转账给卖家
                require(
                    taforToken.transfer(seller, sellerAmount),
                    "Seller transfer failed"
                );
            }

            // 在二级市场交易结束时更新 NFT 收益
            if (payWithBNB) {
                storyManager.updateNFTRevenue(nft.storyId, msg.value / 1 ether, true);  // 转换为 ether 单位
            } else {
                storyManager.updateNFTRevenue(nft.storyId, price / 1e18, false);  // 转换为标准 token 单位
            }

            emit NFTSecondaryTraded(
                tokenId,
                seller,
                msg.sender,
                price,
                platformFee,
                payWithBNB,
                block.timestamp
            );
        }

        // 更新NFT状态
        nft.owner = msg.sender;
        nft.isFirstSale = false;
        nft.isListed = false;
        nft.listTime = 0;
        nft.priceBNB = 0;
        nft.priceToken = 0;
        
        // 转移NFT
        _transfer(ownerOf(tokenId), msg.sender, tokenId);
    }

    // 取消上架
    function unlistNFT(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        NFTMetadata storage nft = nftMetadata[tokenId];
        require(nft.isListed, "NFT not listed");
        
        nft.isListed = false;
        nft.priceBNB = 0;
        nft.priceToken = 0;
        
        emit NFTUnlisted(tokenId, block.timestamp);
    }

    // 获取NFT元数据
    function getNFTMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(_exists(tokenId), "NFT does not exist");
        return nftMetadata[tokenId];
    }

    // 获取故事的NFT数量
    function getStoryNFTCount(uint256 storyId, uint256 batch) external view returns (uint256) {
        return storyNFTs[storyId][batch];
    }

    // 获取故事的所有NFT ID
    function getStoryNFTs(uint256 storyId) external view returns (uint256[] memory) {
        // 获取故事的NFT数量
        uint256 nftCount = storyNFTs[storyId][1] + storyNFTs[storyId][2];
        uint256[] memory result = new uint256[](nftCount);
        uint256 index = 0;
        
        for (uint256 tokenId = 1; tokenId <= _tokenIds.current(); tokenId++) {
            if (_exists(tokenId) && nftMetadata[tokenId].storyId == storyId) {
                result[index] = tokenId;
                index++;
            }
        }
        
        return result;
    }

    // 重写必要的函数
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function convertBNBToToken(uint256 bnbAmount) public view returns (uint256) {
        // 实现BNB到Token的价格转换
    }

    function convertTokenToBNB(uint256 tokenAmount) public view returns (uint256) {
        // 实现Token到BNB的价格转换
    }

    // 生成随机稀有度 生成概率 5% 15% 30% 50%
    function generateRarity(uint256 storyId) internal view returns (Rarity) {
        // 使用区块哈希和时间戳作为随机源
        bytes32 randomHash = keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            block.timestamp,
            msg.sender,
            storyId,
            storyNFTs[storyId][1] + storyNFTs[storyId][2]  // 加入总铸造数作为因子
        ));
        uint256 randomNumber = uint256(randomHash);
        
        // 使用累积概率
        uint256 cumulativeProbability = randomNumber % 100;
        
        if(cumulativeProbability < 5) {
            return Rarity.Legendary;  // 0-4: 5%
        } else if(cumulativeProbability < 20) {
            return Rarity.Epic;       // 5-19: 15%
        } else if(cumulativeProbability < 50) {
            return Rarity.Rare;       // 20-49: 30%
        }
        return Rarity.Common;         // 50-99: 50%
    }

    mapping(uint256 => uint256) private legendaryPityCounter;  // 记录每个故事的保底计数

    function generateRarityWithPity(uint256 storyId) internal returns (Rarity) {
        // 检查保底
        if (legendaryPityCounter[storyId] >= 50) {  // 50个没出传说就保底
            legendaryPityCounter[storyId] = 0;
            return Rarity.Legendary;
        }

        Rarity rarity = generateRarity(storyId);
        if (rarity != Rarity.Legendary) {
            legendaryPityCounter[storyId]++;
        } else {
            legendaryPityCounter[storyId] = 0;
        }
        
        return rarity;
    }

    // 获取 NFT 当前价格
    function getNFTPrice(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "NFT does not exist");
        NFTMetadata memory listing = nftMetadata[tokenId];
        require(listing.isListed, "NFT not listed");
        return listing.priceBNB;
    }
} 