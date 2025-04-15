require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. 部署 TaforToken（基础代币，无依赖）
    const TaforToken = await hre.ethers.getContractFactory("TaforToken", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying TaforToken...");
    const taforToken = await TaforToken.deploy();
    await taforToken.deployed();
    console.log("TaforToken deployed to:", taforToken.address);

    // 2. 部署 AuthorManager（作者管理，无依赖）
    const AuthorManager = await hre.ethers.getContractFactory("AuthorManager", {
        gasPrice: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 1500000
    });
    console.log("Deploying AuthorManager...");
    const authorManager = await AuthorManager.deploy();
    await authorManager.deployed();
    console.log("AuthorManager deployed to:", authorManager.address);

    // 保存合约地址
    const fs = require("fs");
    const contractAddresses = {
        taforToken: taforToken.address,
        authorManager: authorManager.address
    };

    fs.writeFileSync(
        "contract-addresses.json",
        JSON.stringify(contractAddresses, null, 2)
    );
    console.log("Contract addresses saved to contract-addresses.json");
    console.log("Part 1 deployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
