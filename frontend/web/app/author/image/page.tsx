"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaBook } from "react-icons/fa";
import { useAccount } from "wagmi";
import WalletRequired from "@/components/web3/WalletRequired";
import { NftMintModal } from "@/components/nft/NftMintModal";

import "./App.css"; // 样式文件

// 类型定义
interface ImageItem {
  id: string;
  dataURL: string;
  minted: boolean;
  timestamp: number;
  metadataURI?: string;
  txHash?: string;
  fileId?: string;
}

export default function WorksPage() {
  const { address } = useAccount();
  const [mintingStatus, setMintingStatus] = useState<
    "idle" | "minting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isNftModalOpen, setIsNftModalOpen] = useState(false);
  const [fileId, setFileId] = useState<string>("");

  // 抽取加载图片的逻辑为独立函数
  const loadImages = async () => {
    if (address) {
      try {
        const response = await fetch(
          `http://localhost:3001/select/nft/images`,
          {
            method: "POST",
            body: JSON.stringify({ address: address }),
          }
        );

        if (!response.ok) {
          throw new Error(`获取失败: ${response.status}`);
        }

        const data = await response.json();
        console.log("【图片查询】API 返回原始数据:", data, data.success);

        if (data.success) {
          const formattedImages = await Promise.all(
            data.imageList.map(async (img: any) => {
              const response = await fetch(
                `https://gateway.pinata.cloud/ipfs/${img.fileId}`
              );
              const jsonData = await response.json();

              return {
                id: img.id,
                dataURL: `data:image/jpeg;base64,${jsonData.content}`,
                minted: img.minted,
                timestamp:
                  jsonData.timestamp || new Date(img.createdAt).getTime(),
                fileId: img.fileId,
              };
            })
          );

          console.log("【图片查询】API返回数据:", formattedImages);
          setImages(formattedImages);
        }
      } catch (error) {
        console.error("获取图片列表失败:", error);
        const saved = localStorage.getItem("nft-images");
        if (saved) setImages(JSON.parse(saved));
      }
    }
  };

  useEffect(() => {
    loadImages();
  }, [address]);

  // TODO 调用后端上传图片接口
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setErrorMessage("请选择有效的图片文件");
      return;
    }

    if (!address) {
      console.log("【作品管理】未找到作者地址");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("address", address);

    try {
      console.log("上传 NFT 图片: /upload/nft/images:", file.name);
      const response = await fetch(`http://localhost:3001/upload/nft/images`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      console.log("上传 NFT 图片API响应状态:", response.status);
      const result = await response.json();

      console.log("上传结果:", result);

      // 从响应中获取 fileId
      const { fileId } = result;
      console.log("获取到的 fileId:", fileId);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImage = {
            id: Date.now().toString(),
            dataURL: event.target.result as string,
            minted: false,
            timestamp: Date.now(),
            fileId: fileId, // 保存 fileId
          };
          setImages((prev) => [newImage, ...prev]);
          setErrorMessage("");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("上传失败:", error);
      setErrorMessage(error instanceof Error ? error.message : "上传失败");
    }
  };

  // TODO 调用后端铸造 NFT 接口，修改状态。
  const handleMint = async (imageId: string) => {
    const targetImage = images.find((img) => img.id === imageId);
    if (!targetImage || targetImage.minted) return;

    try {
      setMintingStatus("minting");
      setErrorMessage("");

      // 更新状态
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                minted: true,
              }
            : img
        )
      );

      setMintingStatus("success");
    } catch (err) {
      console.error("铸造失败:", err);
      setMintingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "未知错误");
    }
  };

  return (
    <WalletRequired
      title="铸造NFT"
      description="连接钱包以铸造NFT"
      icon={<FaBook className="w-10 h-10 text-indigo-600" />}
    >
      <div className="container">
        {/* 上传区域 */}
        <div className="upload-section">
          <label className="upload-button">
            + 上传新图片
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              hidden
            />
          </label>
        </div>

        {/* 历史记录 */}
        <div className="history-section">
          <h2>历史图片 ({images.length})</h2>
          <div className="image-grid">
            {images.map((img) => (
              <div key={img.id} className="image-card">
                <div className="relative w-full aspect-square">
                  <Image
                    src={img.dataURL}
                    alt={`上传于 ${new Date(img.timestamp).toLocaleString()}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="image-meta">
                  <time>{new Date(img.timestamp).toLocaleDateString()}</time>
                  <button
                    onClick={() => {
                      setIsNftModalOpen(true);
                      setFileId(img.fileId || "");
                    }}
                    disabled={img.minted || mintingStatus === "minting"}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      img.minted
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600"
                    }`}
                    title={img.minted ? "已铸造" : "铸造NFT"}
                  >
                    {img.minted ? "已铸造" : "铸造 NFT"}
                  </button>
                  {img.txHash && (
                    <a
                      href={`https://etherscan.io/tx/${img.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      查看交易
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>

      <NftMintModal
        isOpen={isNftModalOpen}
        onClose={() => {
          setIsNftModalOpen(false);
        }}
        fileId={fileId}
        address={address}
        onSuccess={() => {
          // 铸造成功后的回调
          setIsNftModalOpen(false);
          loadImages(); // 重新加载图片列表
        }}
      />
    </WalletRequired>
  );
}
