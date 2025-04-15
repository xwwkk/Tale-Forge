require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 读取之前部署的合约地址
    const fs = require("fs");
    const contractAddresses = JSON.parse(fs.readFileSync("contract-addresses.json"));

    // 5. 部署 NovelNFT（依赖 StoryManager 和 TreasuryManager）
    const NovelNFT = await hre.ethers.getContractFactory("NovelNFT", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying NovelNFT...");
    const novelNFT = await NovelNFT.deploy(
        contractAddresses.storyManager,
        contractAddresses.treasuryManager
    );
    await novelNFT.deployed();
    console.log("NovelNFT deployed to:", novelNFT.address);

    // 6. 部署 MiningPool（依赖 TaforToken、StoryManager 和 NovelNFT）
    const MiningPool = await hre.ethers.getContractFactory("MiningPool", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying MiningPool...");
    const miningPool = await MiningPool.deploy(
        contractAddresses.taforToken,
        contractAddresses.storyManager,
        novelNFT.address
    );
    await miningPool.deployed();
    console.log("MiningPool deployed to:", miningPool.address);

    // 更新合约地址
    contractAddresses.novelNFT = novelNFT.address;
    contractAddresses.miningPool = miningPool.address;

    fs.writeFileSync(
        "contract-addresses.json",
        JSON.stringify(contractAddresses, null, 2)
    );
    console.log("Contract addresses updated in contract-addresses.json");
    console.log("Part 3 deployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
