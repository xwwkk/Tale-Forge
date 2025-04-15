require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 读取之前部署的合约地址
    const fs = require("fs");
    const contractAddresses = JSON.parse(fs.readFileSync("contract-addresses.json"));

    // 7. 部署 ReaderActivity（依赖 TaforToken）
    const ReaderActivity = await hre.ethers.getContractFactory("ReaderActivity", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying ReaderActivity...");
    const readerActivity = await ReaderActivity.deploy(contractAddresses.taforToken);
    await readerActivity.deployed();
    console.log("ReaderActivity deployed to:", readerActivity.address);

    // 8. 部署 TippingSystem（依赖 TaforToken、StoryManager、TreasuryManager 和 NovelNFT）
    const TippingSystem = await hre.ethers.getContractFactory("TippingSystem", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying TippingSystem...");
    const tippingSystem = await TippingSystem.deploy(
        contractAddresses.taforToken,
        contractAddresses.storyManager,
        contractAddresses.treasuryManager,
        contractAddresses.novelNFT
    );
    await tippingSystem.deployed();
    console.log("TippingSystem deployed to:", tippingSystem.address);

    // 更新合约地址
    contractAddresses.readerActivity = readerActivity.address;
    contractAddresses.tippingSystem = tippingSystem.address;
    contractAddresses.platformWallet = deployer.address;

    fs.writeFileSync(
        "contract-addresses.json",
        JSON.stringify(contractAddresses, null, 2)
    );
    console.log("Contract addresses updated in contract-addresses.json");
    console.log("Part 4 deployment completed successfully!");
    console.log("\nAll contracts have been deployed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
