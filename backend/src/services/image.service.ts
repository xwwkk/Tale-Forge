import prisma from "../prisma";
import type { Image } from "@prisma/client";

export class ImageService {
  /**
   * 创建图片
   */
  async createImage(data: {
    address: string;
    fileId: string;
    fileName: string;
  }): Promise<Image> {
    return await prisma.image.create({
      data: {
        address: data.address,
        fileId: data.fileId,
        fileName: data.fileName,
      },
    });
  }

  /**
   * 获取图片
   */
  async getImage(address: string): Promise<Image[]> {
    return await prisma.image.findMany({
      where: {
        address: {
          equals: address
        }
      },
      orderBy: {
        createdAt: "desc"
      },
    });
  }
}

// 导出单例实例
export const imageService = new ImageService();
