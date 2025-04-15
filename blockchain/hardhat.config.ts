import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import fs from 'fs';
import path from 'path';

// 定义复制 ABI 的任务
task("copy-abis", "Copies ABI files to shared folder")
  .setAction(async () => {
    const artifactPath = './artifacts/contracts';
    const sharedAbisPath = '../shared/src/contracts/abis';
    
    if (!fs.existsSync(sharedAbisPath)) {
      fs.mkdirSync(sharedAbisPath, { recursive: true });
    }

    if (fs.existsSync(artifactPath)) {
      // 只复制主合约文件
      const mainContracts = ['AuthorManager.json', 'StoryManager.json', 'TaforToken.json', 'TreasuryManager.json'];
      mainContracts.forEach(file => {
        const sourcePath = path.join(artifactPath, file);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(
            sourcePath,
            path.join(sharedAbisPath, file)
          );
          console.log(`Copied ${file} to shared folder`);
        }
      });
    }
  });

// 在编译后自动运行复制任务
task("compile").setAction(async (_, { run }, runSuper) => {
  await runSuper();
  await run("copy-abis");
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;