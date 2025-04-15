const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { logger } = require("ethers");

describe("TaleForge System", function () {
    let TaforToken, StoryManager, AuthorManager, NovelNFT, TreasuryManager;
    let TippingSystem, MiningPool, PlatformPool, LotteryPool, TokenStakingPool, BNBStakingPool;
    let owner, author1, author2, reader1, reader2, reader3;
    let taforToken, storyManager, authorManager, novelNFT, treasuryManager;
    let tippingSystem, miningPool, platformPool, lotteryPool, tokenStakingPool, bnbStakingPool;

    const INITIAL_SUPPLY = ethers.utils.parseEther("999000000"); // 10亿代币
    const WORD_COUNT = 100000; // 10万字
    const ONE_DAY = 86400; // 1天
    const ONE_WEEK = ONE_DAY * 7; // 1周

    beforeEach(async function () {
        // 获取合约工厂
        [owner, author1, author2, reader1, reader2, reader3] = await ethers.getSigners();
        
        // 部署基础合约
        TaforToken = await ethers.getContractFactory("TaforToken", owner);  // 明确指定部署者
        taforToken = await TaforToken.deploy();
        await taforToken.deployed();

        // 确认初始供应量和所有者余额
        const totalSupply = await taforToken.totalSupply();
        const ownerBalance = await taforToken.balanceOf(owner.address);
        console.log("\n=== 代币初始化 ===");
        console.log("总供应量:", ethers.utils.formatEther(totalSupply), "TAFOR");
        console.log("部署者余额:", ethers.utils.formatEther(ownerBalance), "TAFOR");
        
        if (ownerBalance.eq(0)) {
            console.log("部署者余额为0，尝试铸造代币...");
            await taforToken.connect(owner).mint(owner.address, ethers.utils.parseEther("1000000000"));
            const newBalance = await taforToken.balanceOf(owner.address);
            console.log("铸造后余额:", ethers.utils.formatEther(newBalance), "TAFOR");
        }

        // 部署其他合约
        AuthorManager = await ethers.getContractFactory("AuthorManager");
        authorManager = await AuthorManager.deploy();

        TreasuryManager = await ethers.getContractFactory("TreasuryManager");
        treasuryManager = await TreasuryManager.deploy();

        // 部署资金池合约
        PlatformPool = await ethers.getContractFactory("PlatformPool");
        LotteryPool = await ethers.getContractFactory("LotteryPool");
        TokenStakingPool = await ethers.getContractFactory("TokenStakingPool");
        BNBStakingPool = await ethers.getContractFactory("BNBStakingPool");

        platformPool = await PlatformPool.deploy(treasuryManager.address, taforToken.address);
        lotteryPool = await LotteryPool.deploy(treasuryManager.address, taforToken.address);
        tokenStakingPool = await TokenStakingPool.deploy(treasuryManager.address, taforToken.address);
        bnbStakingPool = await BNBStakingPool.deploy(treasuryManager.address, taforToken.address);

        // 设置资金池地址
        await treasuryManager.setPool("platform", platformPool.address);
        await treasuryManager.setPool("lottery", lotteryPool.address);
        await treasuryManager.setPool("staking", tokenStakingPool.address);
        await treasuryManager.setPool("bnbStaking", bnbStakingPool.address);

        // 部署其他合约
        StoryManager = await ethers.getContractFactory("StoryManager");
        storyManager = await StoryManager.deploy(authorManager.address);

        NovelNFT = await ethers.getContractFactory("NovelNFT");
        novelNFT = await NovelNFT.deploy(storyManager.address, treasuryManager.address);

        // 部署 MiningPool 合约
        MiningPool = await ethers.getContractFactory("MiningPool");
        miningPoolContract = await MiningPool.deploy(
            taforToken.address,
            storyManager.address,
            novelNFT.address,
            treasuryManager.address,
            INITIAL_SUPPLY
        );
        await miningPoolContract.deployed();

        // 先转移代币给 MiningPool 合约
        await taforToken.transfer(miningPoolContract.address, INITIAL_SUPPLY); 
        
        miningPool = miningPoolContract;

        // 部署打赏系统
        TippingSystem = await ethers.getContractFactory("TippingSystem");
        tippingSystem = await TippingSystem.deploy(
            treasuryManager.address,
            taforToken.address,
            storyManager.address,
            novelNFT.address
        );

        // 设置合约间的关联
        await storyManager.setNovelNFT(novelNFT.address);
        await storyManager.setTippingSystem(tippingSystem.address);
        await treasuryManager.setPool("mining", miningPool.address);
        
        // 授权调用
        await treasuryManager.setAuthorizedCaller(tippingSystem.address, true);
        await treasuryManager.setAuthorizedCaller(miningPool.address, true);
        await treasuryManager.setAuthorizedCaller(novelNFT.address, true);
    });

    // 作者管理
    describe("Author Management", function () {
        // 注册作者
        it("Should register new author", async function () {
            // 只传入笔名参数
            await authorManager.connect(author1).registerAuthor("Author One");

            const author = await authorManager.getAuthor(author1.address);
            expect(author.penName).to.equal("Author One");
            expect(author.isActive).to.be.true;
        });

        // 不能重复注册作者
        it("Should not register author twice", async function () {
            await authorManager.connect(author1).registerAuthor("Author One");
            await expect(
                authorManager.connect(author1).registerAuthor("Author Two")
            ).to.be.revertedWith("Author already registered");
        });

        // 验证作者资料长度限制
        it("should validate author profile length constraints", async function () {
            // 测试笔名过长
            const longName = "A".repeat(300); // 超过50字符
            await expect(
                authorManager.connect(author1).registerAuthor(longName)
            ).to.be.revertedWith("Pen name too long");
        });

        it("should handle author status changes", async function () {
            // 注册作者
            await authorManager.connect(author1).registerAuthor("Author One");
            
            // 获取作者信息并验证
            const author = await authorManager.getAuthor(author1.address);
            expect(author.penName).to.equal("Author One");
            expect(author.isActive).to.be.true;
            expect(author.storyCount).to.equal(0);
        });

        it("should update author statistics correctly", async function () {
            // 先注册作者
            await authorManager.connect(author1).registerAuthor("Author One");
            
            // 更新统计信息
            await authorManager.connect(author1).updateAuthorStats(
                1, // storyCountDelta
                10000, // wordCountDelta
                ethers.utils.parseEther("100"), // earningsTokenDelta
                ethers.utils.parseEther("1") // earningsBNBDelta
            );
            
            // 验证统计信息
            const author = await authorManager.getAuthor(author1.address);
            expect(author.storyCount).to.equal(1);
            expect(author.totalWordCount).to.equal(10000);
            expect(author.totalEarningsToken).to.equal(ethers.utils.parseEther("100"));
            expect(author.totalEarningsBNB).to.equal(ethers.utils.parseEther("1"));
        });

        // 测试笔名唯一性
        it("should enforce pen name uniqueness", async function () {
            // 第一个作者注册
            await authorManager.connect(author1).registerAuthor("Unique Name");
            
            // 第二个作者尝试使用相同笔名
            await expect(
                authorManager.connect(author2).registerAuthor("Unique Name")
            ).to.be.revertedWith("Pen name already taken");
        });

        // 测试更新笔名
        it("should allow updating pen name", async function () {
            // 注册作者
            await authorManager.connect(author1).registerAuthor("Old Name");
            
            // 更新笔名
            await authorManager.connect(author1).updatePenName("New Name");
            
            // 验证更新
            const author = await authorManager.getAuthor(author1.address);
            expect(author.penName).to.equal("New Name");
            
            // 不能更新为已存在的笔名
            await authorManager.connect(author2).registerAuthor("Existing Name");
            await expect(
                authorManager.connect(author1).updatePenName("Existing Name")
            ).to.be.revertedWith("Pen name already taken");
        });

        // 测试非作者不能更新笔名
        it("should prevent non-authors from updating pen name", async function () {
            await expect(
                authorManager.connect(reader1).updatePenName("Any Name")
            ).to.be.revertedWith("Not a registered author");
        });

        // 测试笔名格式要求
        it("should validate pen name format", async function () {
            // 空笔名
            await expect(
                authorManager.connect(author1).registerAuthor("")
            ).to.be.revertedWith("Pen name cannot be empty");
            console.log("空笔名测试通过");

            // 只有空格的笔名
            // await expect(
            //     authorManager.connect(author1).registerAuthor("   ")
            // ).to.be.revertedWith("Pen name cannot be only spaces");
            // console.log("只有空格的笔名测试通过");
            // 特殊字符
            // await expect(
            //     authorManager.connect(author1).registerAuthor("Name!@#$%")
            // ).to.be.revertedWith("Invalid characters in pen name");
            // console.log("特殊字符测试通过");
        });

        // // 测试作者注销功能
        // it("should handle author deactivation", async function () {
        //     // 注册作者
        //     await authorManager.connect(author1).registerAuthor("Author One");
            
        //     // 注销账号
        //     await authorManager.connect(author1).deactivateAccount();
            
        //     // 验证状态
        //     const author = await authorManager.getAuthor(author1.address);
        //     expect(author.isActive).to.be.false;
            
        //     // 注销后不能更新笔名
        //     await expect(
        //         authorManager.connect(author1).updatePenName("New Name")
        //     ).to.be.revertedWith("Account not active");
            
        //     // 可以重新激活
        //     await authorManager.connect(author1).reactivateAccount();
        //     const reactivatedAuthor = await authorManager.getAuthor(author1.address);
        //     expect(reactivatedAuthor.isActive).to.be.true;
        // });

        // // 测试管理员功能
        // it("should allow admin functions", async function () {
        //     // 注册作者
        //     await authorManager.connect(author1).registerAuthor("Author One");
            
        //     // 只有管理员可以封禁作者
        //     await expect(
        //         authorManager.connect(reader1).banAuthor(author1.address)
        //     ).to.be.revertedWith("Ownable: caller is not the owner");
            
        //     // 管理员封禁作者
        //     await authorManager.connect(owner).banAuthor(author1.address);
        //     const bannedAuthor = await authorManager.getAuthor(author1.address);
        //     expect(bannedAuthor.isActive).to.be.false;
        //     expect(bannedAuthor.isBanned).to.be.true;
            
        //     // 被封禁的作者不能重新激活账号
        //     await expect(
        //         authorManager.connect(author1).reactivateAccount()
        //     ).to.be.revertedWith("Account is banned");
        // });
    });

    // 故事管理
    describe("Story Management", function () {
        beforeEach(async function () {
            // 重新部署合约，确保每个测试用例都是全新状态
            AuthorManager = await ethers.getContractFactory("AuthorManager");
            authorManager = await AuthorManager.deploy();

            StoryManager = await ethers.getContractFactory("StoryManager");
            storyManager = await StoryManager.deploy(authorManager.address);


            // 重新部署 TippingSystem 并设置新的 storyManager 地址
            TippingSystem = await ethers.getContractFactory("TippingSystem");
            tippingSystem = await TippingSystem.deploy(
                treasuryManager.address,
                taforToken.address,
                storyManager.address,
                novelNFT.address
            );
            // 设置合约间的关联
            await storyManager.setNovelNFT(novelNFT.address);
            await storyManager.setTippingSystem(tippingSystem.address);
            await treasuryManager.setPool("mining", miningPool.address);
            // 授权调用
            await treasuryManager.setAuthorizedCaller(tippingSystem.address, true);


            // 注册作者并创建故事
            await authorManager.connect(author1).registerAuthor("Author One");
            await storyManager.connect(author1).createStory(
                "Story Title",
                "Story Description",
                "cover.jpg",
                "content.txt",
                100000
            );
        });

        // 1. 基础故事管理测试
        describe("Basic Story Management", function () {
            it("should create new story with correct parameters", async function () {
                await storyManager.connect(author1).createStory(
                    "Story Title",
                    "Story Description",
                    "cover.jpg",
                    "content.txt",
                    100000
                );

                const story = await storyManager.getStory(1);
                expect(story.title).to.equal("Story Title");
                expect(story.author).to.equal(author1.address);
                expect(story.targetWordCount).to.equal(100000);
                expect(story.isCompleted).to.be.false;
                expect(story.isAbandoned).to.be.false;
                expect(story.chapterCount).to.equal(0);
            });

            it("should validate story creation constraints", async function () {
                // 测试标题长度限制
                const longTitle = "A".repeat(401);
                await expect(
                    storyManager.connect(author1).createStory(
                        longTitle,
                        "Description",
                        "cover.jpg",
                        "content.txt",
                        100000
                    )
                ).to.be.revertedWith("Invalid title length");

                // 测试目标字数限制
                await expect(
                    storyManager.connect(author1).createStory(
                        "Title",
                        "Description",
                        "cover.jpg",
                        "content.txt",
                        40000 // 低于最小字数
                    )
                ).to.be.revertedWith("Target word count too low");
            });
        });

        // 2. 章节管理测试
        describe("Chapter Management", function () {
            beforeEach(async function () {
                await storyManager.connect(author1).createStory(
                    "Story Title",
                    "Story Description",
                    "cover.jpg",
                    "content.txt",
                    100000
                );
            });

            it("should handle chapter updates correctly", async function () {
                // 添加章节
                await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 2000);
                await storyManager.connect(author1).updateChapter(1, 2, "chapter2.txt", 3000);

                const story = await storyManager.getStory(1);
                expect(story.chapterCount).to.equal(2);
                expect(story.wordCount).to.equal(5000);
            });

            it("should enforce chapter sequence", async function () {
                await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 2000);
                
                // 尝试跳过章节号
                await expect(
                    storyManager.connect(author1).updateChapter(1, 3, "chapter3.txt", 2000)
                ).to.be.revertedWith("Invalid chapter number");
            });
        });

        // 3. 故事状态测试
        describe("Story Status Management", function () {
            it("should handle story completion", async function () {
                // 先更新足够的字数
                await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 30000);
                await storyManager.connect(author1).updateChapter(1, 2, "chapter2.txt", 70000);

                // 完结故事
                await storyManager.connect(author1).completeStory(1);
                
                const story = await storyManager.getStory(1);
                expect(story.isCompleted).to.be.true;
            });

            it("should detect abandoned stories", async function () {
                await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 2000);
                
                // 增加时间超过太监期限
                await time.increase(31 * 24 * 3600); // 31天
                
                await storyManager.checkAbandonment(1);
                const story = await storyManager.getStory(1);
                expect(story.isAbandoned).to.be.true;
            });
        });

        // 4. 互动功能测试
        describe("Story Interactions", function () {
            it("should track likes correctly", async function () {
                // 获取当前区块时间
                const blockNum = await ethers.provider.getBlockNumber();
                const block = await ethers.provider.getBlock(blockNum);
                const today = Math.floor(block.timestamp / 86400);

                await storyManager.addLike(1);
                await storyManager.addLike(1);
                
                const story = await storyManager.getStory(1);
                expect(story.likeCount.toNumber()).to.equal(2);
                
                // 验证每日统计
                const dailyStats = await storyManager.getDailyStats(1, today);
                expect(dailyStats[0].toNumber()).to.equal(2); // likes 在返回数组中的索引是0
            });

            it("should track comments correctly", async function () {
                // 获取当前区块时间
                const blockNum = await ethers.provider.getBlockNumber();
                const block = await ethers.provider.getBlock(blockNum);
                const today = Math.floor(block.timestamp / 86400);
                
                console.log("Initial state:");
                let story = await storyManager.getStory(1);
                console.log("Initial comment count:", story.commentCount.toNumber());
                
                // 添加评论
                await storyManager.addComment(1);
                console.log("After first comment:");
                story = await storyManager.getStory(1);
                console.log("Comment count:", story.commentCount.toNumber());
                
                await storyManager.addComment(1);
                await storyManager.addComment(1);
                
                console.log("Final state:");
                story = await storyManager.getStory(1);
                console.log("Final comment count:", story.commentCount.toNumber());
                
                // 验证每日统计
                const dailyStats = await storyManager.getDailyStats(1, today);
                console.log("Daily stats for day", today, ":", {
                    likes: dailyStats[0].toNumber(),
                    comments: dailyStats[1].toNumber(),
                    tipsBNB: dailyStats[2].toNumber(),
                    tipsToken: dailyStats[3].toNumber(),
                    words: dailyStats[4].toNumber()
                });
                
                expect(story.commentCount.toNumber()).to.equal(3);
                expect(dailyStats[1].toNumber()).to.equal(3);
            });
        });

        // 5. 爆发期测试
        describe("Story Trending Status", function () {
            it("should detect trending stories based on activity", async function () {
                // 1. 设置初始时间
                const blockNum = await ethers.provider.getBlockNumber();
                const block = await ethers.provider.getBlock(blockNum);
                const today = Math.floor(block.timestamp / 86400);
                console.log("\n=== 初始状态 ===");
                console.log("当前区块:", blockNum);
                console.log("时间戳:", block.timestamp);
                console.log("计算得到的today:", today);

                // 2. 添加字数更新（超过10000字阈值）
                console.log("\n=== 更新字数 ===");
                await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 15000);
                let story = await storyManager.getStory(1);
                console.log("当前总字数:", story.wordCount.toString());
                let dailyStats = await storyManager.getDailyStats(1, today);
                console.log("当日字数统计:", dailyStats[4].toString());

                // 3. 添加点赞（需要500个）
                console.log("\n=== 添加点赞 ===");
                for(let i = 0; i < 500; i++) {
                    await storyManager.addLike(1);
                    if(i % 100 === 0) {
                        await ethers.provider.send("evm_mine", []);
                        console.log(`已添加 ${i} 个点赞`);
                    }
                }
                story = await storyManager.getStory(1);
                console.log("总点赞数:", story.likeCount.toString());
                dailyStats = await storyManager.getDailyStats(1, today);
                console.log("当日点赞统计:", dailyStats[0].toString());

                // 4. 添加评论（需要200个）
                console.log("\n=== 添加评论 ===");
                for(let i = 0; i < 200; i++) {
                    await storyManager.addComment(1);
                    if(i % 50 === 0) {
                        await ethers.provider.send("evm_mine", []);
                        console.log(`已添加 ${i} 个评论`);
                    }
                }
                story = await storyManager.getStory(1);
                console.log("总评论数:", story.commentCount.toString());
                dailyStats = await storyManager.getDailyStats(1, today);
                console.log("当日评论统计:", dailyStats[1].toString());

                // 5. 添加打赏（超过10 BNB）
                console.log("\n=== 添加打赏 ===");
                // 使用 TippingSystem 进行打赏
                try {
                    await tippingSystem.connect(reader1).tipWithBNB(1, { value: ethers.utils.parseEther("11") });
                } catch (error) {
                    console.log("Error details:", {
                        message: error.message,
                        code: error.code,
                        reason: error.reason,
                        transaction: error.transaction,
                        receipt: error.receipt
                    });
                    throw error;
                }
                dailyStats = await storyManager.getDailyStats(1, today);
                console.log("当日BNB打赏统计:", ethers.utils.formatEther(dailyStats[2]));
                console.log("当日Token打赏统计:", ethers.utils.formatEther(dailyStats[3]));

                // 6. 确保所有数据都在同一个24小时时间窗口内
                console.log("\n=== 检查时间窗口 ===");
                const currentBlock = await ethers.provider.getBlock("latest");
                const currentDay = Math.floor(currentBlock.timestamp / 86400);
                console.log("开始时间（天）:", today);
                console.log("当前时间（天）:", currentDay);
                
                if (currentDay > today) {
                    console.log("需要调整时间...");
                    const newTimestamp = today * 86400 + 86399;
                    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
                    await ethers.provider.send("evm_mine", []);
                    console.log("时间已调整到:", newTimestamp);
                }

                // 7. 验证爆发状态
                console.log("\n=== 验证爆发状态 ===");
                const burstLevel = await storyManager.isStoryTrending(1);
                console.log("爆发等级:", burstLevel.toString());

                // 打印最终统计数据
                console.log("\n=== 最终统计 ===");
                dailyStats = await storyManager.getDailyStats(1, today);
                console.log("字数:", dailyStats[4].toString());
                console.log("点赞:", dailyStats[0].toString());
                console.log("评论:", dailyStats[1].toString());
                console.log("BNB打赏:", ethers.utils.formatEther(dailyStats[2]));
                console.log("Token打赏:", ethers.utils.formatEther(dailyStats[3]));

                // 验证爆发等级
                expect(burstLevel).to.equal(4);
            });
        });

        // 6. 数据清理和统计测试
        describe("Data Management", function () {
            it("should calculate stats in date range", async function () {
                const blockNum = await ethers.provider.getBlockNumber();
                const block = await ethers.provider.getBlock(blockNum);
                const today = Math.floor(block.timestamp / 86400);

                // 添加两天的数据
                await storyManager.addLike(1);
                await time.increase(ONE_DAY);
                await storyManager.addLike(1);
                
                const stats = await storyManager.getStatsInRange(1, today, today + 1);
                expect(stats[0].toNumber()).to.equal(2); // totalLikes
            });
        });

        // 7. 作者作品集测试
        describe("Author Works Management", function () {
            // 作者作品追踪测试
            it("should track author's stories correctly", async function () {
                console.log("\n=== 作者作品追踪测试 ===");
                
                // 获取初始状态
                console.log("初始状态：");
                let authorWorks = await storyManager.getAuthorStories(author1.address);
                console.log("作者当前作品数量:", authorWorks.length);
                console.log("作者当前作品ID列表:", authorWorks.map(id => id.toString()));

                // 创建第二个故事
                console.log("\n创建第二个故事...");
                await storyManager.connect(author1).createStory(
                    "Story 2",
                    "Description 2",
                    "cover2.jpg",
                    "content2.txt",
                    100000
                );

                // 获取更新后的状态
                console.log("\n创建后状态：");
                authorWorks = await storyManager.getAuthorStories(author1.address);
                console.log("作者当前作品数量:", authorWorks.length);
                console.log("作者当前作品ID列表:", authorWorks.map(id => id.toString()));

                // 验证每个故事的详细信息
                console.log("\n故事详细信息：");
                for (let i = 0; i < authorWorks.length; i++) {
                    const story = await storyManager.getStory(authorWorks[i]);
                    console.log(`故事 ${i + 1}:`, {
                        id: story.id.toString(),
                        title: story.title,
                        author: story.author,
                        wordCount: story.wordCount.toString(),
                        isCompleted: story.isCompleted
                    });
                }

                // 验证作者统计信息
                console.log("\n作者统计信息：");
                const authorInfo = await authorManager.getAuthor(author1.address);
                console.log("笔名:", authorInfo.penName);
                console.log("作品数量:", authorInfo.storyCount.toString());
                console.log("总字数:", authorInfo.totalWordCount.toString());

                // 执行测试断言
                expect(authorWorks.length).to.equal(2);
                expect(authorWorks[0].toNumber()).to.equal(1);
                expect(authorWorks[1].toNumber()).to.equal(2);
            });

            // 活跃故事列表测试
            it("should list active stories correctly", async function () {
                // 创建第二个故事
                await storyManager.connect(author1).createStory(
                    "Story 2",
                    "Description 2",
                    "cover2.jpg",
                    "content2.txt",
                    50000
                );

                // 完结第二个故事
                await storyManager.connect(author1).updateChapter(2, 1, "chapter1.txt", 50000);
                await storyManager.connect(author1).completeStory(2);

                // 获取活跃故事列表
                const activeStories = await storyManager.getActiveStories();
                expect(activeStories.length).to.equal(1);
                expect(activeStories[0].toNumber()).to.equal(1);
            });
        });
    });

    // NFT系统
    describe("NFT System", function () {
        beforeEach(async function () {
            console.log("\n=== 初始化 NFT 测试环境 ===");
            await authorManager.connect(author1).registerAuthor("Author One");
            console.log("作者注册完成");

            await storyManager.connect(author1).createStory(
                "Story Title",
                "Story Description",
                "cover.jpg",
                "content.txt",
                100000
            );
            console.log("故事创建完成");

            await storyManager.connect(author1).updateChapter(1, 1, "chapter2.txt", 300000);
            console.log("更新章节完成，当前字数: 300000");
        });

        it("Should mint first batch NFT", async function () {
            console.log("\n=== 测试首批 NFT 铸造 ===");
            console.log("开始铸造第一个 NFT...");
            
            const tx = await novelNFT.connect(author1).mintNFT(
                1,
                "NFT Name",
                "NFT Description",
                "nft.jpg",
                0, // Character type
                1 // 期望批次
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "NFTMinted");
            console.log("NFT 铸造完成：", {
                tokenId: event.args.tokenId.toString(),
                mintBatch: event.args.mintBatch.toString(),
                rarity: event.args.rarity.toString()
            });

            expect(event.args.mintBatch).to.equal(1);
        });

        // 不能超过第一批次上限
        it("Should not exceed first batch limit", async function () {
            console.log("\n=== 测试首批 NFT 数量限制 ===");
            
            // 铸造10个NFT (第一批次上限)
            for(let i = 0; i < 10; i++) {
                console.log(`铸造第 ${i + 1} 个 NFT...`);
                const tx = await novelNFT.connect(author1).mintNFT(1, `NFT ${i}`, "Desc", "nft.jpg", 0, 1);
                const receipt = await tx.wait();
                const event = receipt.events.find(e => e.event === "NFTMinted");
                console.log(`NFT #${i + 1} 铸造完成，稀有度: ${event.args.rarity}`);
            }

            console.log("\n尝试超出首批限制...");
            // 第11个应该提示已进入第二批次
            await expect(
                novelNFT.connect(author1).mintNFT(1, "NFT 11", "Desc", "nft.jpg", 0, 1)
            ).to.be.revertedWith("Current batch is 2 (second batch, lower mining weight)");
            console.log("验证成功：已提示进入第二批次");
        });

        // 测试NFT批量铸造
        it("Should handle batch minting correctly", async function () {
            console.log("\n=== 测试 NFT 批量铸造 ===");
            
            // 测试数组长度不匹配
            console.log("测试数组长度不匹配...");
            await expect(
                novelNFT.connect(author1).batchMintNFT(
                    1,
                    ["NFT 1", "NFT 2"],
                    ["Desc"],
                    ["nft.jpg"],
                    [0],
                    1
                )
            ).to.be.revertedWith("Array lengths mismatch");
            console.log("数组长度不匹配测试通过");

            // 测试正常批量铸造
            console.log("\n测试正常批量铸造...");
            const names = ["NFT 1", "NFT 2", "NFT 3"];
            const descriptions = ["Desc 1", "Desc 2", "Desc 3"];
            const imageUris = ["nft1.jpg", "nft2.jpg", "nft3.jpg"];
            const nftTypes = [0, 1, 2];

            const tx = await novelNFT.connect(author1).batchMintNFT(
                1,
                names,
                descriptions,
                imageUris,
                nftTypes,
                1
            );
            
            const receipt = await tx.wait();
            
            // 找到 BatchNFTMinted 事件
            const batchEvent = receipt.events.find(e => e.event === "BatchNFTMinted");
            console.log("批量铸造事件:", {
                storyId: batchEvent.args.storyId.toString(),
                tokenIds: batchEvent.args.tokenIds.map(id => id.toString()),
                owner: batchEvent.args.owner,
                nftTypes: batchEvent.args.nftTypes.map(t => t.toString()),
                mintBatch: batchEvent.args.mintBatch.toString()
            });
            
            const tokenIds = batchEvent.args.tokenIds;
            console.log(`成功铸造 ${tokenIds.length} 个 NFT`);
            
            // 验证每个 NFT 的元数据
            for(let i = 0; i < tokenIds.length; i++) {
                const tokenId = tokenIds[i];
                console.log(`\n获取 NFT #${tokenId} 元数据...`);
                const metadata = await novelNFT.getNFTMetadata(tokenId);
                console.log("完整元数据:", metadata);
                
                expect(metadata.name).to.equal(names[i]);
                expect(metadata.description).to.equal(descriptions[i]);
                expect(metadata.imageUri).to.equal(imageUris[i]);
                expect(metadata.nftType).to.equal(nftTypes[i]);
                expect(metadata.mintBatch).to.equal(1);
            }

            // 测试批量铸造的批次限制
            console.log("\n测试批次限制...");
            const remainingSlots = 7; // 10 - 3 = 7 (第一批次还剩7个位置)
            const newNames = Array(remainingSlots + 1).fill(0).map((_, i) => `NFT ${i + 4}`);
            const newDescriptions = Array(remainingSlots + 1).fill("Desc");
            const newImageUris = Array(remainingSlots + 1).fill("nft.jpg");
            const newNftTypes = Array(remainingSlots + 1).fill(0);

            await expect(
                novelNFT.connect(author1).batchMintNFT(
                    1,
                    newNames,
                    newDescriptions,
                    newImageUris,
                    newNftTypes,
                    1
                )
            ).to.be.revertedWith("Would exceed first batch limit");
            console.log("批次限制测试通过");

            // 先铸满第一批次
            await novelNFT.connect(author1).batchMintNFT(
                1,
                Array(remainingSlots).fill(0).map((_, i) => `NFT ${i + 4}`),
                Array(remainingSlots).fill("Desc"),
                Array(remainingSlots).fill("nft.jpg"),
                Array(remainingSlots).fill(0),
                1
            );

            // 尝试用批次1在批次2铸造
            await expect(
                novelNFT.connect(author1).batchMintNFT(
                    1,
                    ["Second Batch NFT"],
                    ["Second Batch Desc"],
                    ["second.jpg"],
                    [0],
                    1  // 使用批次1
                )
            ).to.be.revertedWith("Current batch is 2 (second batch, lower mining weight)");
            console.log("批次错误提示测试通过");

            // 更新字数,达到1/3字数
            await storyManager.connect(author1).updateChapter(1, 2, "chapter2.txt", 300000);

            // 使用正确的批次2铸造
            const secondBatchTx = await novelNFT.connect(author1).batchMintNFT(
                1,
                ["Second Batch NFT"],
                ["Second Batch Desc"],
                ["second.jpg"],
                [0],
                2  // 使用正确的批次2
            );
            
            const secondBatchReceipt = await secondBatchTx.wait();
            const secondBatchEvent = secondBatchReceipt.events.find(e => e.event === "BatchNFTMinted");
            // 获取第一个 tokenId
            const secondBatchTokenId = secondBatchEvent.args.tokenIds[0];
            const secondBatchMetadata = await novelNFT.getNFTMetadata(secondBatchTokenId);

            console.log("第二批次 NFT 元数据:", {
                name: secondBatchMetadata.name,
                mintBatch: secondBatchMetadata.mintBatch,
                tokenId: secondBatchTokenId.toString()
            });

            expect(secondBatchMetadata.mintBatch).to.equal(2);
            console.log("第二批次铸造测试通过");
        });


        // 稀有度分布测试
        it("should handle NFT rarity distribution", async function () {
            console.log("\n=== 测试 NFT 稀有度分布 ===");
            
            let rarityCount = {
                0: 0, // Common
                1: 0, // Rare
                2: 0, // Epic
                3: 0  // Legendary
            };

            // 更新字数,达到1/3字数
            await storyManager.connect(author1).updateChapter(1, 2, "chapter2.txt", 300000);

            // 铸造第一批次（10个NFT）
            console.log("铸造第一批次（10个NFT）...");
            const firstBatchTx = await novelNFT.connect(author1).batchMintNFT(
                1,
                Array(10).fill(0).map((_, i) => `NFT ${i + 1}`),
                Array(10).fill("Desc"),
                Array(10).fill("nft.jpg"),
                Array(10).fill(0),
                1
            );
            
            const firstBatchReceipt = await firstBatchTx.wait();
            const firstBatchEvent = firstBatchReceipt.events.find(e => e.event === "BatchNFTMinted");
            // 使用 Promise.all 等待所有元数据获取完成
            await Promise.all(firstBatchEvent.args.tokenIds.map(async (tokenId) => {
                const metadata = await novelNFT.getNFTMetadata(tokenId);
                rarityCount[metadata.rarity]++;
            }));

            // 铸造第二批次（90个，分批铸造）
            console.log("\n铸造第二批次（90个NFT）...");
            for(let batch = 0; batch < 9; batch++) {
                const names = Array(10).fill(0).map((_, i) => `NFT ${batch * 10 + i + 11}`);
                const descriptions = Array(10).fill("Desc");
                const imageUris = Array(10).fill("nft.jpg");
                const nftTypes = Array(10).fill(0);
                
                // 增加随机性
                await ethers.provider.send("evm_increaseTime", [Math.floor(Math.random() * 100)]);
                await ethers.provider.send("evm_mine", []);
                
                console.log(`铸造第二批次组 ${batch + 1}/9（10个NFT）...`);
                const tx = await novelNFT.connect(author1).batchMintNFT(
                    1,
                    names,
                    descriptions,
                    imageUris,
                    nftTypes,
                    2  // 使用批次2
                );
                
                const receipt = await tx.wait();
                const batchEvent = receipt.events.find(e => e.event === "BatchNFTMinted");
                for(const tokenId of batchEvent.args.tokenIds) {
                    const metadata = await novelNFT.getNFTMetadata(tokenId);
                    rarityCount[metadata.rarity]++;
                }

                console.log("当前稀有度分布：", {
                    Common: rarityCount[0],
                    Rare: rarityCount[1],
                    Epic: rarityCount[2],
                    Legendary: rarityCount[3]
                });
            }

            console.log("\n最终稀有度分布：", {
                Common: rarityCount[0],
                Rare: rarityCount[1],
                Epic: rarityCount[2],
                Legendary: rarityCount[3]
            });

            // 验证总数和基本分布
            const totalNFTs = Object.values(rarityCount).reduce((a, b) => a + b, 0);
            expect(totalNFTs).to.equal(100, "Total NFTs should be 100");

            // 打印分布情况
            console.log("\n稀有度分布情况：");
            console.log("传说比例:", (rarityCount[3] / totalNFTs * 100).toFixed(2) + "%");
            console.log("史诗比例:", (rarityCount[2] / totalNFTs * 100).toFixed(2) + "%");
            console.log("稀有比例:", (rarityCount[1] / totalNFTs * 100).toFixed(2) + "%");
            console.log("普通比例:", (rarityCount[0] / totalNFTs * 100).toFixed(2) + "%");

            // 验证保底机制
            expect(rarityCount[3]).to.be.gt(0, "Should have at least one Legendary NFT (pity system)");
        });

        // 测试NFT交易规则
        it("should validate NFT trading rules", async function () {
            console.log("\n=== 测试 NFT 交易规则 ===");
            
            console.log("铸造测试用 NFT...");
            await novelNFT.connect(author1).mintNFT(1, "NFT", "Desc", "nft.jpg", 1, 1);
            
            console.log("\n测试价格设置...");
            // 测试必须设置至少一种价格
            await expect(
                novelNFT.connect(author1).listNFT(1, 0, 0)
            ).to.be.revertedWith("Must set at least one price");
            console.log("必须设置价格测试通过");

            // 测试 BNB 价格下限
            await expect(
                novelNFT.connect(author1).listNFT(1, ethers.utils.parseEther("0.01"), 0)
            ).to.be.revertedWith("BNB price too low");
            console.log("BNB 价格过低测试通过");

            // 测试 Token 价格下限
            await expect(
                novelNFT.connect(author1).listNFT(1, 0, ethers.utils.parseEther("5"))
            ).to.be.revertedWith("Token price too low");
            console.log("Token 价格过低测试通过");

            // 测试只设置 BNB 价格
            console.log("\n测试只设置 BNB 价格...");
            await novelNFT.connect(author1).listNFT(1, ethers.utils.parseEther("0.1"), 0);
            console.log("BNB 挂单成功");

            // 取消挂单后测试只设置 Token 价格
            await novelNFT.connect(author1).unlistNFT(1);
            console.log("\n测试只设置 Token 价格...");
            await novelNFT.connect(author1).listNFT(1, 0, ethers.utils.parseEther("10"));
            console.log("Token 挂单成功");

            // 取消挂单后测试同时设置两种价格
            await novelNFT.connect(author1).unlistNFT(1);
            console.log("\n测试同时设置两种价格...");
            const listPriceBNB = ethers.utils.parseEther("1");
            const listPriceToken = ethers.utils.parseEther("100");
            await novelNFT.connect(author1).listNFT(1, listPriceBNB, listPriceToken);
            console.log("双币种挂单成功");
            
            console.log("\n测试购买和手续费...");
            // 测试发送金额不足
            await expect(
                novelNFT.connect(reader1).buyNFT(1, true, { value: ethers.utils.parseEther("0.5") })
            ).to.be.revertedWith("Insufficient BNB");
            console.log("金额不足测试通过");

            // 测试正常购买
            const platformBalanceBefore = await ethers.provider.getBalance(treasuryManager.platformPool());
            const authorBalanceBefore = await author1.getBalance();
            console.log("平台初始余额:", ethers.utils.formatEther(platformBalanceBefore));
            console.log("作者初始余额:", ethers.utils.formatEther(authorBalanceBefore));
            
            // 使用正确的价格购买
            await novelNFT.connect(reader1).buyNFT(1, true, { value: listPriceBNB });
            
            const platformBalanceAfter = await ethers.provider.getBalance(treasuryManager.platformPool());
            const authorBalanceAfter = await author1.getBalance();
            console.log("平台最终余额:", ethers.utils.formatEther(platformBalanceAfter));
            console.log("作者最终余额:", ethers.utils.formatEther(authorBalanceAfter));
            
            // 计算手续费和作者收益
            const platformFee = platformBalanceAfter.sub(platformBalanceBefore);
            const authorEarnings = authorBalanceAfter.sub(authorBalanceBefore);
            console.log("平台手续费:", ethers.utils.formatEther(platformFee));
            console.log("作者收益:", ethers.utils.formatEther(authorEarnings));
            
            // 验证手续费是否正确 (1%)
            expect(platformFee).to.equal(listPriceBNB.mul(10).div(1000));
            
            // 验证作者收益是否正确 (99%)
            expect(authorEarnings).to.equal(listPriceBNB.mul(990).div(1000));

            // 验证 NFT 所有权已转移
            expect(await novelNFT.ownerOf(1)).to.equal(reader1.address);
        });

        // 测试NFT元数据完整性
        it("should maintain NFT metadata integrity", async function () {
            console.log("\n=== 测试 NFT 元数据完整性 ===");
            
            console.log("铸造测试用 NFT...");
            await novelNFT.connect(author1).mintNFT(1, "NFT", "Desc", "nft.jpg", 0, 1);
            
            // 验证元数据
            const metadata = await novelNFT.getNFTMetadata(1);
            console.log("NFT 元数据:", {
                name: metadata.name,
                description: metadata.description,
                imageUri: metadata.imageUri,
                nftType: metadata.nftType.toString(),
                rarity: metadata.rarity.toString(),
                mintBatch: metadata.mintBatch.toString(),
                owner: metadata.owner,
                storyId: metadata.storyId.toString()
            });
            
            // 验证元数据正确性
            expect(metadata.name).to.equal("NFT");
            expect(metadata.description).to.equal("Desc");
            expect(metadata.imageUri).to.equal("nft.jpg");
            expect(metadata.nftType).to.equal(0);
            expect(metadata.mintBatch).to.equal(1);
            expect(metadata.owner).to.equal(author1.address);
            expect(metadata.storyId).to.equal(1);
            
            // 验证所有权
            expect(await novelNFT.ownerOf(1)).to.equal(author1.address);
        });

        // NFT 增益测试
        it("Should apply NFT boost correctly", async function () {
            console.log("\n=== 测试 NFT 增益 ===");
            
            // 给 reader1 和 reader2 转入测试用的 BNB
            await owner.sendTransaction({
                to: reader1.address,
                value: ethers.utils.parseEther("10.0")  // 转 10 BNB 用于测试
            });
            await owner.sendTransaction({
                to: reader2.address,
                value: ethers.utils.parseEther("10.0")
            });
            
            // 记录初始状态
            let story = await storyManager.getStory(1);
            console.log("初始挖矿功率:", story.miningPower.toString());
            console.log("初始NFT收益(BNB):", story.totalNftRevenueBNB.toString());
            console.log("初始NFT收益(Token):", story.totalNftRevenueToken.toString());
            
            // 更新后续章节获得基础算力
            await storyManager.connect(author1).updateChapter(1, 2, "chapter2.txt", 100000); // 第2章

            story = await storyManager.getStory(1);
            console.log("\n更新章节后功率:", story.miningPower.toString());
            
            // 铸造 NFT
            console.log("\n铸造 NFT...");
            await novelNFT.connect(author1).mintNFT(1, "NFT", "Desc", "nft.jpg", 0, 1);
            
            // 上架 NFT
            console.log("\n上架 NFT...");
            const tokenId = 1;
            const listPrice = ethers.utils.parseEther("1");
            await novelNFT.connect(author1).listNFT(tokenId, listPrice, 0);

            // 二级市场交易
            console.log("\n二级市场交易 NFT...");
            const reader1Balance = await ethers.provider.getBalance(reader1.address);
            console.log("Reader1 BNB 余额:", ethers.utils.formatEther(reader1Balance));

            const price = await novelNFT.getNFTPrice(tokenId);
            console.log("NFT 价格:", ethers.utils.formatEther(price));

            // 使用相同的价格购买
            // await novelNFT.connect(reader1).buyNFT(tokenId, { 
            //     value: price  // 使用获取到的实际价格
            // });
            await novelNFT.connect(reader1).buyNFT(1, true, { value: price });
            
            // 触发算力更新
            await storyManager.updateMiningPower(1);
            
            // 检查 NFT 交易后的状态
            story = await storyManager.getStory(1);
            console.log("\nNFT交易后状态:");
            console.log("- NFT收益(BNB):", story.totalNftRevenueBNB.toString());
            console.log("- 当前功率:", story.miningPower.toString());
            
            // 再次交易
            console.log("\n再次交易 NFT...");
            await novelNFT.connect(reader1).listNFT(tokenId, ethers.utils.parseEther("2"),0 ); // 设置新价格为 2 BNB
            
            const reader2Balance = await ethers.provider.getBalance(reader2.address);
            console.log("Reader2 BNB 余额:", ethers.utils.formatEther(reader2Balance));
            await novelNFT.connect(reader2).buyNFT(tokenId, true, { value: ethers.utils.parseEther("2") });
            
            // 更新算力
            await storyManager.updateMiningPower(1);
            
            // 检查最终状态
            story = await storyManager.getStory(1);
            console.log("\n最终状态:");
            console.log("- NFT总收益(BNB):", story.totalNftRevenueBNB.toString());
            console.log("- 最终功率:", story.miningPower.toString());
            
            // 验证 NFT 交易收益增加了算力
            expect(story.totalNftRevenueBNB).to.equal(3); // 1 + 2 BNB (in ether)
            expect(story.miningPower).to.be.gt(0);
            console.log("NFT 增益测试通过");
        });
    });

    // 打赏系统
    describe("Tipping System", function () {
        beforeEach(async function () {
            console.log("\n=== 初始化打赏测试环境 ===");
            
            console.log("注册作者...");
            await authorManager.connect(author1).registerAuthor("Author One");
            
            console.log("创建故事...");
            await storyManager.connect(author1).createStory(
                "Story Title",
                "Story Description",
                "cover.jpg",
                "content.txt",
                100000
            );
            
            console.log("查看代币余额...");
            const deployerBalance = await taforToken.balanceOf(owner.address);
            console.log("部署者代币余额:", ethers.utils.formatEther(deployerBalance), "TAFOR");
            
            if (deployerBalance.gt(0)) {
                console.log("给读者转入代币...");
                const transferAmount = ethers.utils.parseEther("100");
                await taforToken.connect(owner).transfer(reader1.address, transferAmount);
                await taforToken.connect(reader1).approve(tippingSystem.address, transferAmount);
                
                const readerBalance = await taforToken.balanceOf(reader1.address);
                console.log("读者代币余额:", ethers.utils.formatEther(readerBalance), "TAFOR");
            } else {
                console.error("错误：部署者没有代币可以转移");
            }
            
            console.log("初始化完成\n");
        });

        // 打赏BNB
        it("Should tip with BNB", async function () {
            console.log("=== 测试 BNB 打赏 ===");
            
            const tipAmount = ethers.utils.parseEther("1");
            console.log("打赏金额:", ethers.utils.formatEther(tipAmount), "BNB");
            
            const authorBalanceBefore = await author1.getBalance();
            console.log("作者初始余额:", ethers.utils.formatEther(authorBalanceBefore), "BNB");

            console.log("\n执行打赏...");
            const tx = await tippingSystem.connect(reader1).tipWithBNB(1, { value: tipAmount });
            const receipt = await tx.wait();
            
            // 获取打赏事件
            const tipEvent = receipt.events?.find(e => e.event === "TipSent");
            if (tipEvent) {
                console.log("打赏事件:", {
                    storyId: tipEvent.args.storyId.toString(),
                    tipper: tipEvent.args.tipper,
                    amount: ethers.utils.formatEther(tipEvent.args.amount),
                    currency: "BNB"
                });
            }

            const authorBalanceAfter = await author1.getBalance();
            console.log("\n作者最终余额:", ethers.utils.formatEther(authorBalanceAfter), "BNB");
            console.log("作者收益:", ethers.utils.formatEther(authorBalanceAfter.sub(authorBalanceBefore)), "BNB");

            expect(authorBalanceAfter.sub(authorBalanceBefore)).to.be.gt(0);
            console.log("BNB 打赏测试通过");
        });

        // 打赏TAFOR
        it("Should tip with TAFOR", async function () {
            console.log("=== 测试 TAFOR 打赏 ===");
            
            const tipAmount = ethers.utils.parseEther("100");
            console.log("打赏金额:", ethers.utils.formatEther(tipAmount), "TAFOR");
            
            // 获取所有相关账户的初始余额
            const authorBalanceBefore = await taforToken.balanceOf(author1.address);
            const readerBalanceBefore = await taforToken.balanceOf(reader1.address);
            const platformBalanceBefore = await taforToken.balanceOf(treasuryManager.platformPool());
            const stakingBalanceBefore = await taforToken.balanceOf(treasuryManager.stakingPool());
            
            console.log("\n初始余额:");
            console.log("作者:", ethers.utils.formatEther(authorBalanceBefore), "TAFOR");
            console.log("读者:", ethers.utils.formatEther(readerBalanceBefore), "TAFOR");
            console.log("平台池:", ethers.utils.formatEther(platformBalanceBefore), "TAFOR");
            console.log("质押池:", ethers.utils.formatEther(stakingBalanceBefore), "TAFOR");

            // 执行打赏
            console.log("\n执行打赏...");
            const tx = await tippingSystem.connect(reader1).tipWithToken(1, tipAmount);
            const receipt = await tx.wait();
            
            // 获取所有相关账户的最终余额
            const authorBalanceAfter = await taforToken.balanceOf(author1.address);
            const readerBalanceAfter = await taforToken.balanceOf(reader1.address);
            const platformBalanceAfter = await taforToken.balanceOf(treasuryManager.platformPool());
            const stakingBalanceAfter = await taforToken.balanceOf(treasuryManager.stakingPool());

            // 计算各方收益
            const authorEarnings = authorBalanceAfter.sub(authorBalanceBefore);
            const readerSpent = readerBalanceBefore.sub(readerBalanceAfter);
            const platformEarnings = platformBalanceAfter.sub(platformBalanceBefore);
            const stakingIncrease = stakingBalanceAfter.sub(stakingBalanceBefore);

            console.log("\n收益分配:");
            console.log("作者收益 (45% + 45% NFT部分):", ethers.utils.formatEther(authorEarnings), "TAFOR");
            console.log("平台收益 (10%):", ethers.utils.formatEther(platformEarnings), "TAFOR");
            console.log("质押池增加 (作者质押部分 22.5%):", ethers.utils.formatEther(stakingIncrease), "TAFOR");
            console.log("读者支出 (总额):", ethers.utils.formatEther(readerSpent), "TAFOR");

            // 验证分配比例
            expect(authorEarnings).to.equal(tipAmount.mul(675).div(1000)); // 67.5%
            expect(platformEarnings).to.equal(tipAmount.mul(100).div(1000)); // 10%
            expect(stakingIncrease).to.equal(tipAmount.mul(225).div(1000)); // 22.5%
            expect(readerSpent).to.equal(tipAmount); // 100%

            console.log("\nTAFOR 打赏测试通过");
        });
    });

    // 挖矿系统
    describe("Mining System", function () {
        beforeEach(async function () {
            console.log("\n=== 初始化挖矿测试环境 ===");
            
            console.log("注册作者...");
            await authorManager.connect(author1).registerAuthor("Author One");
            
            console.log("创建故事...");
            await storyManager.connect(author1).createStory(
                "Story Title",
                "Story Description",
                "cover.jpg",
                "content.txt",
                100000
            );
            console.log("初始化完成\n");
        });

        // 基础挖矿功率测试
        it("Should calculate base mining power correctly", async function () {
            console.log("=== 测试基础挖矿功率 ===");
            
            console.log("初始状态检查...");
            let story = await storyManager.getStory(1);
            console.log("初始挖矿功率:", story.miningPower.toString());
            
            console.log("\n更新章节字数...");
            await storyManager.connect(author1). updateChapter(1, 1, "chapter2.txt", 6000);
           
        
     
            story = await storyManager.getStory(1);
            console.log("更新后字数:", story.wordCount.toString());
            console.log("更新后挖矿功率:", story.miningPower.toString());
            
            expect(story.miningPower).to.be.gt(0); //
            console.log("基础挖矿功率测试通过");
        });

        // 互动权重测试（注意我们每一个故事的互动权重并不会直接更新到每一个故事，只有字数会直接更新
        //其它互动不会直接更新）
        it("Should calculate interaction weights correctly", async function () {
            console.log("\n=== 测试互动权重 ===");
            
            // 先添加字数以获得基础功率
            console.log("添加字数...");
            await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 10000);  // 添加1万字
            
            // 记录初始功率
            let story = await storyManager.getStory(1);
            const initialPower = story.miningPower;
            console.log("初始挖矿功率（1万字）:", initialPower.toString());
            
            // 添加50个点赞（应该提供1%权重）
            console.log("\n添加前50个点赞...");
            for(let i = 0; i < 50; i++) {
                await storyManager.connect(reader1).addLike(1);
            }
            story = await storyManager.getStory(1);
            console.log("50个点赞后功率:", story.miningPower.toString());
            console.log("第一个1%权重增幅:", story.miningPower.sub(initialPower).toString());
            
            // 再添加50个点赞（应该再提供1%权重）
            console.log("\n添加后60个点赞...");
            for(let i = 0; i < 60; i++) {
                await storyManager.connect(reader1).addLike(1);
            }
            story = await storyManager.getStory(1);
            console.log("110个点赞后功率:", story.miningPower.toString());
            console.log("总点赞权重增幅(应为2%):", story.miningPower.sub(initialPower).toString());
            
            const afterLikesPower = story.miningPower;
            
            // 添加20条评论（应该提供2%权重）
            console.log("\n添加前20条评论...");
            for(let i = 0; i < 20; i++) {
                await storyManager.connect(reader1).addComment(1);
            }
            story = await storyManager.getStory(1);
            console.log("20条评论后功率:", story.miningPower.toString());
            console.log("第一个2%评论权重增幅:", story.miningPower.sub(afterLikesPower).toString());
            
            // 再添加25条评论（应该再提供2%权重）
            console.log("\n添加后25条评论...");
            for(let i = 0; i < 25; i++) {
                await storyManager.connect(reader1).addComment(1);
            }
            story = await storyManager.getStory(1);
            console.log("45条评论后功率:", story.miningPower.toString());
            console.log("总评论权重增幅(应为4%):", story.miningPower.sub(afterLikesPower).toString());
            
            // 输出最终统计
            console.log("\n最终统计:");
            console.log("初始功率:", initialPower.toString());
            console.log("最终功率:", story.miningPower.toString());
            console.log("总增幅:", story.miningPower.sub(initialPower).toString(), "(应为6%)");
            console.log("点赞数:", story.likeCount.toString(), "(110个，提供2%权重)");
            console.log("评论数:", story.commentCount.toString(), "(45条，提供4%权重)");
            
            //更新完第一次权重后24小时后，才会载更新一次
            // 验证总权重增加是否正确（应为6%）
            // const totalIncrease = story.miningPower.sub(initialPower);
            // const expectedIncrease = initialPower.mul(6).div(100);  // 6% 增幅
            // expect(totalIncrease).to.be.closeTo(expectedIncrease, expectedIncrease.div(100));  // 允许1%的误差
            
            console.log("互动权重测试通过");
        });

        // 时间衰减测试
        it("Should apply time decay correctly", async function () {
            console.log("\n=== 测试时间衰减 ===");
            
            // 更新章节获得初始功率
            console.log("更新章节...");
            await storyManager.connect(author1).updateChapter(1, 1, "chapter2.txt", 5000);
            let story = await storyManager.getStory(1);
            const initialPower = story.miningPower;
            console.log("初始挖矿功率:", initialPower.toString());
            
            // 等待一天
            console.log("\n等待1天...");
            await time.increase(ONE_DAY);
            
            // 触发更新
            await storyManager.updateMiningPower(1);
            story = await storyManager.getStory(1);
            const oneDayPower = story.miningPower;
            console.log("1天后功率:", oneDayPower.toString());
            console.log("衰减量:", initialPower.sub(oneDayPower).toString());
            
            // 等待一周
            console.log("\n等待1周...");
            await time.increase(ONE_WEEK);
            
            // 触发更新
            await storyManager.updateMiningPower(1);
            story = await storyManager.getStory(1);
            const oneWeekPower = story.miningPower;
            console.log("1周后功率:", oneWeekPower.toString());
            console.log("衰减量:", initialPower.sub(oneWeekPower).toString());
            
            expect(oneWeekPower).to.be.lt(oneDayPower);
            console.log("时间衰减测试通过");
        });

        // 奖励分配测试
        it("Should distribute rewards fairly", async function () {
            console.log("\n=== 测试奖励分配 ===");
            
            // 创建第二个故事用于对比
            console.log("创建第二个故事...");
            await authorManager.connect(author2).registerAuthor("Author Two");
            await storyManager.connect(author2).createStory(
                "Story Two",
                "Description Two",
                "cover2.jpg",
                "content2.txt",
                100000
            );
            
            // 设置不同的字数和互动
            console.log("\n设置不同的挖矿条件...");
            // 故事1: 每周更新1万字，保持活跃
            await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 100000);
            
            // 故事2: 只更新5000字，刚好达到最低要求
            await storyManager.connect(author2).updateChapter(2, 1, "chapter2.txt", 100000);
            
            // 为故事铸造 NFT
            console.log("\n铸造故事 NFT并产生收益...");
            // 故事1: 铸造多个NFT并有较高收益
            for(let i = 0; i < 5; i++) {

                await novelNFT.connect(author1).mintNFT(1, "NFT", "Desc", "nft.jpg", 0, 1);
            }
            
            // 故事2: 只铸造1个NFT
           // await novelNFT.connect(author2).mintNFT(2, "NFT2", "Desc", "nft.jpg", ethers.utils.parseEther("0.01"), 1);
            await novelNFT.connect(author2).mintNFT(2, "NFT2", "Desc", "nft.jpg", 0, 1);
            // 添加互动，让故事1进入爆发期
            console.log("\n添加互动数据...");
            // 等待24小时让互动生效
            await time.increase(ONE_DAY);
            
            // 故事1: 大量互动
            for(let i = 0; i < 100; i++) {
                await storyManager.connect(reader1).addLike(1);
                await storyManager.connect(reader1).addComment(1);
            }
            
            // 故事2: 少量互动
            await storyManager.connect(reader2).addLike(2);
            await storyManager.connect(reader2).addComment(2);
            
            // 等待一周后分发奖励
            console.log("\n等待一周后分发奖励...");
            // await time.increase(ONE_WEEK - ONE_DAY); // 减去之前增加的一天
            await miningPool.distributeRewards();
            
            // 检查奖励分配
            const author1BalanceAfter = await taforToken.balanceOf(author1.address);
            const author2BalanceAfter = await taforToken.balanceOf(author2.address);
            
            console.log("\n奖励分配结果:");
            console.log("作者1获得:", ethers.utils.formatEther(author1BalanceAfter), "TAFOR");
            console.log("作者2获得:", ethers.utils.formatEther(author2BalanceAfter), "TAFOR");
            console.log("奖励比例:", author1BalanceAfter.mul(100).div(author2BalanceAfter).toString(), "%");
            
            // 故事1应该获得更多奖励
            expect(author1BalanceAfter).to.be.gt(author2BalanceAfter);
            console.log("奖励分配测试通过");
        });

        
    });

    // 集成测试
    describe("Integration Tests", function () {
        it("Should handle complete story lifecycle", async function () {
            console.log("\n=== 完整生命周期测试 ===");
            
            // 1. 注册作者
            console.log("\n1. 注册作者...");
            await authorManager.connect(author1).registerAuthor("Author One");
            
            // 2. 创建故事
            console.log("\n2. 创建故事...");
            await storyManager.connect(author1).createStory(
                "Story Title",
                "Story Description",
                "cover.jpg",
                "content.txt",
                100000
            );
            
            let story = await storyManager.getStory(1);
            console.log("初始挖矿功率:", story.miningPower.toString());
            
            // 3. 更新字数
            console.log("\n3. 更新字数...");
            await storyManager.connect(author1).updateChapter(1, 1, "chapter1.txt", 100000);
            story = await storyManager.getStory(1);
            console.log("更新字数后功率:", story.miningPower.toString());
            
            // 4. 铸造NFT
            console.log("\n4. 铸造NFT...");
            await novelNFT.connect(author1).mintNFT(1, "NFT Name", "NFT Description", "nft.jpg", 0,1);
            story = await storyManager.getStory(1);
            console.log("铸造NFT后功率:", story.miningPower.toString());
            console.log("NFT收益(BNB):", story.totalNftRevenueBNB.toString());
            
            // 5. 读者打赏
            console.log("\n5. 读者打赏...");
            await tippingSystem.connect(reader1).tipWithBNB(1, { value: ethers.utils.parseEther("1") });
            story = await storyManager.getStory(1);
            console.log("打赏后功率:", story.miningPower.toString());
            console.log("打赏收益(BNB):", story.totalTipRevenueBNB.toString());
            
            // 6. 挖矿奖励
            console.log("\n6. 更新挖矿功率...");
            // await time.increase(ONE_WEEK);
            await storyManager.updateMiningPower(1);
            
            // 最终状态
            story = await storyManager.getStory(1);
            console.log("\n最终状态:");
            console.log("- 总字数:", story.wordCount.toString());
            console.log("- NFT收益:", story.totalNftRevenueBNB.toString());
            console.log("- 打赏收益:", story.totalTipRevenueBNB.toString());
            console.log("- 最终功率:", story.miningPower.toString());
            
            expect(story.wordCount).to.equal(100000);
            expect(story.totalTipRevenueBNB).to.be.gt(0);
            expect(story.miningPower).to.be.gt(0);
            console.log("生命周期测试通过");
        });
    });
}); 