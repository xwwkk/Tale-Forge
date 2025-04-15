require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 读取之前部署的合约地址
    const fs = require("fs");
    const contractAddresses = JSON.parse(fs.readFileSync("contract-addresses.json"));
    
    // 3. 部署 StoryManager（依赖 AuthorManager）
    const StoryManager = await hre.ethers.getContractFactory("StoryManager", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying StoryManager...");
    const storyManager = await StoryManager.deploy(contractAddresses.authorManager);
    await storyManager.deployed();
    console.log("StoryManager deployed to:", storyManager.address);

    // 4. 部署 TreasuryManager（依赖 TaforToken 和 StoryManager）
    const TreasuryManager = await hre.ethers.getContractFactory("TreasuryManager", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying TreasuryManager...");
    const treasuryManager = await TreasuryManager.deploy();
    await treasuryManager.deployed();
    console.log("TreasuryManager deployed to:", treasuryManager.address);

    // 更新合约地址
    contractAddresses.storyManager = storyManager.address;
    contractAddresses.treasuryManager = treasuryManager.address;

    fs.writeFileSync(
        "contract-addresses.json",
        JSON.stringify(contractAddresses, null, 2)
    );
    console.log("Contract addresses updated in contract-addresses.json");
    console.log("Part 2 deployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
