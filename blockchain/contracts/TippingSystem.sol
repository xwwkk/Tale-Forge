// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./TaforToken.sol";
import "./StoryManager.sol";
import "./TreasuryManager.sol";
import "./NovelNFT.sol";

//打赏和抽奖无关，打赏的人不在乎抽奖
contract TippingSystem is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // 状态变量
    TreasuryManager public treasuryManager;
    TaforToken public taforToken;
    StoryManager public storyManager;
    NovelNFT public novelNFT;
    
    // 常量
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 10;  // 10% 平台抽成
    uint256 public constant AUTHOR_SHARE_PERCENTAGE = 45; // 45% 作者分成
    uint256 public constant NFT_HOLDER_PERCENTAGE = 45;   // 45% NFT持有者分成
    uint256 public constant AUTHOR_STAKE_PERCENTAGE = 50; // 作者收益的50%进行质押
    uint256 public constant BNB_BASE = 1 ether;
    uint256 public constant TOKEN_BASE = 1e18;

    // 事件
    event StoryTipped(
        uint256 indexed storyId,
        address indexed tipper,
        address indexed author,
        uint256 amount,
        bool useToken,
        uint256 stakedAmount,
        uint256 timestamp
    );

    event StakeReleased(
        uint256 indexed storyId,
        address indexed author,
        uint256 amount,
        bool useToken,
        uint256 timestamp
    );

    event StoryAbandoned(
        uint256 indexed storyId,
        uint256 stakedAmount,
        uint256 platformShare,
        uint256 timestamp
    );

    // 构造函数
    constructor(
        address payable _treasuryManager,
        address _taforToken,
        address _storyManager,
        address _novelNFT
    ) {
        treasuryManager = TreasuryManager(_treasuryManager);
        taforToken = TaforToken(_taforToken);
        storyManager = StoryManager(_storyManager);
        novelNFT = NovelNFT(_novelNFT);
    }

    // 使用BNB打赏
    function tipWithBNB(uint256 storyId) external payable nonReentrant {
        require(msg.value > 0, "Tip amount must be greater than 0");
        
        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        require(!story.isAbandoned, "Story is abandoned");
        
        // 计算分成
        uint256 platformFee = msg.value.mul(PLATFORM_FEE_PERCENTAGE).div(100);    // 10%
        uint256 authorShare = msg.value.mul(AUTHOR_SHARE_PERCENTAGE).div(100);    // 45%
        uint256 nftHolderShare = msg.value.mul(NFT_HOLDER_PERCENTAGE).div(100);   // 45%
        
        // 计算作者质押部分
        uint256 authorStake = authorShare.mul(AUTHOR_STAKE_PERCENTAGE).div(100);  // 作者收益的50%
        uint256 authorDirect = authorShare.sub(authorStake);                      // 作者直接获得的50%
        
        // 转账给平台收入池
        (bool platformSuccess,) = treasuryManager.platformPool().call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        // 转账给作者（直接获得部分）
        payable(story.author).transfer(authorDirect);
        
        // 转入BNB质押池（作者质押部分）
        (bool stakeSuccess,) = treasuryManager.bnbStakingPool().call{value: authorStake}("");
        require(stakeSuccess, "Author stake transfer failed");
        
        // 分配给NFT持有者
        uint256[] memory nftIds = novelNFT.getStoryNFTs(storyId);
        if(nftIds.length > 0) {
            uint256 sharePerNFT = nftHolderShare.div(nftIds.length);
            for(uint256 i = 0; i < nftIds.length; i++) {
                address nftOwner = novelNFT.ownerOf(nftIds[i]);
                payable(nftOwner).transfer(sharePerNFT);
            }
        } else {
            // 如果没有NFT，这部分给作者
            payable(story.author).transfer(nftHolderShare);
        }
        
        // 处理完所有转账后，更新统计信息
        storyManager.updateTipStats(
            storyId,
            msg.value.div(BNB_BASE),  // 将 wei 转换为 BNB 单位
            0,          // 总打赏金额（Token）
            authorStake.div(BNB_BASE), // 将 wei 转换为 BNB 单位
            0           // 作者质押部分（Token）
        );
        
        emit StoryTipped(
            storyId,
            msg.sender,
            story.author,
            msg.value.div(BNB_BASE),  // 转换为 BNB 单位
            false,
            authorStake.div(BNB_BASE),  // 转换为 BNB 单位
            block.timestamp
        );
    }

    // 使用TAFOR打赏
    function tipWithToken(uint256 storyId, uint256 amount) external nonReentrant {
        require(amount > 0, "Tip amount must be greater than 0");
        
        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        require(!story.isAbandoned, "Story is abandoned");
        
        // 计算分成
        uint256 platformFee = amount.mul(PLATFORM_FEE_PERCENTAGE).div(100);     // 10%
        uint256 authorShare = amount.mul(AUTHOR_SHARE_PERCENTAGE).div(100);     // 45%
        uint256 nftHolderShare = amount.mul(NFT_HOLDER_PERCENTAGE).div(100);    // 45%
        
        // 计算作者质押部分
        uint256 authorStake = authorShare.mul(AUTHOR_STAKE_PERCENTAGE).div(100);  // 作者收益的50%
        uint256 authorDirect = authorShare.sub(authorStake);                      // 作者直接获得的50%
        
        // 转账代币
        require(
            taforToken.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        // 转账给平台收入池
        require(
            taforToken.transfer(treasuryManager.platformPool(), platformFee),
            "Platform fee transfer failed"
        );
        
        // 转账给作者（直接获得部分）
        require(
            taforToken.transfer(story.author, authorDirect),
            "Author direct share transfer failed"
        );
        
        // 转入Token质押池（作者质押部分）
        require(
            taforToken.transfer(treasuryManager.stakingPool(), authorStake),
            "Author stake transfer failed"
        );
        
        // 分配给NFT持有者
        uint256[] memory nftIds = novelNFT.getStoryNFTs(storyId);
        if(nftIds.length > 0) {
            uint256 sharePerNFT = nftHolderShare.div(nftIds.length);
            for(uint256 i = 0; i < nftIds.length; i++) {
                address nftOwner = novelNFT.ownerOf(nftIds[i]);
                require(
                    taforToken.transfer(nftOwner, sharePerNFT),
                    "NFT holder share transfer failed"
                );
            }
        } else {
            // 如果没有NFT，这部分给作者
            require(
                taforToken.transfer(story.author, nftHolderShare),
                "Additional author share transfer failed"
            );
        }
        
        // 处理完所有转账后，更新统计信息
        storyManager.updateTipStats(
            storyId,
            0,          // 总打赏金额（BNB）
            amount.div(TOKEN_BASE),     // 将 token units 转换为 TAFOR 单位
            0,          // 作者质押部分（BNB）
            authorStake.div(TOKEN_BASE) // 将 token units 转换为 TAFOR 单位
        );
        
        emit StoryTipped(
            storyId,
            msg.sender,
            story.author,
            amount.div(TOKEN_BASE),  // 转换为 TAFOR 单位
            true,
            authorStake.div(TOKEN_BASE),  // 转换为 TAFOR 单位
            block.timestamp
        );
    }


    // 获取故事打赏统计
    function getTippingStats(uint256 storyId) external view returns (
        uint256 totalTipsBNB,
        uint256 totalTipsToken,
        uint256 stakedBNB,
        uint256 stakedToken,
        uint256 lastTipTime
    ) {
        StoryManager.StoryView memory story = storyManager.getStory(storyId);
        return (
            story.totalTipRevenueBNB,
            story.totalTipRevenueToken,
            story.stakedEarningsBNB,
            story.stakedEarningsToken,
            story.lastTipUpdate
        );
    }
} 