import prisma from "../prisma";
import type { Nft } from "@prisma/client";

export class NftService {
  /**
   * 创建 NFT
   */
  async createNft(data: {
    address: string; // 钱包地址
    fileId: string; // 文件ID
    storyId?: string | null; // 故事ID 改为可选且可为 null
    name: string; // 名称
    description: string; // 描述
    nftType: string; // 类型
    rarity: string; // 稀有度
    priceBNB: string; // BNB 价格
    priceToken: string; // TAFOR 定价
  }): Promise<Nft> {
    // 构建数据对象
    const nftData: any = {
      fileId: data.fileId,
      name: data.name,
      description: data.description,
      nftType: data.nftType,
      address: data.address,
      rarity: data.rarity,
      priceBNB: data.priceBNB,
      priceToken: data.priceToken,
      storyId: data.storyId || null, // 如果 storyId 不存在则设为 null
    };

    return prisma.nft.create({
      data: nftData,
    });
  }

  /**
   * 根据 fileId 列表查询 NFT
   */
  async getNftsByFileIds(fileIds: string[]): Promise<Nft[]> {
    return prisma.nft.findMany({
      where: {
        fileId: {
          in: fileIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * 根据 storyId 列表查询 NFT
   */
  async getNftsByStoryIds(storyIds: string[]): Promise<Nft[]> {
    return prisma.nft.findMany({
      where: {
        storyId: {
          in: storyIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

// 导出单例实例
export const nftService = new NftService();
