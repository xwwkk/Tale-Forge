"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiEdit,
  FiTrash,
  FiPlus,
  FiEye,
  FiHeart,
  FiMessageSquare,
  FiClock,
  FiFilter,
  FiSearch,
  FiAward,
  FiUsers,
} from "react-icons/fi";
import { FaBook, FaPencilAlt, FaRegListAlt } from "react-icons/fa";
import { useAccount } from "wagmi";
import WalletRequired from "@/components/web3/WalletRequired";
import styles from "./page.module.css";
import { NftMintModal } from "@/components/nft/NftMintModal";

interface Work {
  id: string;
  title: string;
  coverImage: string;
  type: string;
  status: "draft" | "published" | "reviewing";
  wordCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  updateTime: string;
  isSerial: boolean;
  description: string;
  isNFT: boolean;
}

// API 返回的故事类型
interface Story {
  id: string;
  title: string;
  coverCid: string;
  category: string;
  status: string;
  wordCount: number;
  description?: string;
  updatedAt: string;
  isNFT: boolean;
  author?: {
    id: string;
    address: string;
    authorName: string;
    avatar: string;
  };
  _count?: {
    favorites: number;
    likes: number;
    comments: number;
  };
}

// 定义多个 IPFS 网关
const IPFS_GATEWAYS = [
  'https://blue-casual-wombat-745.mypinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  // 'https://gateway.pinata.cloud/ipfs/',
  // 'https://cloudflare-ipfs.com/ipfs/'
];

export default function WorksPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Work["status"] | "all">(
    "all"
  );
  const [isNftModalOpen, setIsNftModalOpen] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string>(""); // 用于记录当前选中的作品

  // 获取 IPFS 图片内容
  const fetchIPFSImage = async (cid: string) => {
    for (const gateway of IPFS_GATEWAYS) {
      try {
        console.log(`[IPFS] Trying gateway ${gateway} for image: ${cid}`);
        const response = await fetch(`${gateway}${cid}`);
        
        if (!response.ok) {
          console.log(`[IPFS] Gateway ${gateway} failed with status: ${response.status}`);
          continue;
        }
        
        const text = await response.text();
        if (text.startsWith('data:image')) {
          return text;
        }
        
        try {
          const data = JSON.parse(text);
          if (data.content) {
            return data.content;
          }
        } catch (e) {
          // Not JSON, use as-is
        }
        
        return text;
      } catch (error) {
        console.error(`[IPFS] Error with gateway ${gateway}:`, error);
        // Continue to next gateway
      }
    }
    console.log(`[IPFS] All gateways failed for ${cid}, using default image`);
    return null;
  };

  // 加载作品列表
  const loadWorks = async () => {
    console.log("【作品管理】开始加载作品列表...");
    try {
      setLoading(true);
      if (!address) {
        console.log("【作品管理】未找到作者地址");
        return;
      }

      console.log("【作品管理】请求API: /api/authors/${address}/stories，作者地址:", address);
      const response = await fetch(`/api/authors/${address}/stories`);
      console.log("【作品管理】API响应状态:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }
      const data = await response.json();
      console.log("【作品管理】API返回原始数据:", data);
      const fetchedStories = data.stories || [];

      // 获取所有 IPFS 图片
      const ipfsStories = fetchedStories.filter((story: Story) => story?.coverCid?.startsWith("Qm"));
      console.log(`[IPFS] 需要加载 ${ipfsStories.length} 个 IPFS 图片`);

      // 创建一个临时对象来存储加载的图片
      const loadedImages: { [key: string]: string } = {};

      // 并行加载所有图片，但不等待全部完成
      ipfsStories.forEach(async (story: Story) => {
        try {
          if (!story.coverCid) return;
          console.log(`[IPFS] 开始处理故事 ${story.id} 的封面: ${story.coverCid}`);
          const imageContent = await fetchIPFSImage(story.coverCid);
          if (imageContent) {
            console.log(`[IPFS] 成功获取故事 ${story.id} 的封面图片`);
            // 更新状态以触发重新渲染
            setWorks(currentWorks => {
              return currentWorks.map(work => {
                if (work.id === story.id) {
                  return {
                    ...work,
                    coverImage: imageContent
                  };
                }
                return work;
              });
            });
          }
        } catch (error) {
          console.error(`[IPFS] 获取故事 ${story.id} 的封面图片失败:`, error);
        }
      });

      // 将API返回的数据转换为页面需要的格式，使用默认图片
      console.log("【作品管理】开始转换数据格式...");
      const formattedWorks: Work[] = fetchedStories.map((story: Story) => ({
        id: story.id,
        title: story.title,
        coverImage: story.coverCid?.startsWith("data:image")
          ? story.coverCid
          : "/images/story-default-cover.jpg", // 默认使用默认图片，等待异步加载完成后更新
        type: story.category,
        status: "published",
        wordCount: story.wordCount || 0,
        viewCount: story._count?.favorites || 0,
        likeCount: story._count?.likes || 0,
        commentCount: story._count?.comments || 0,
        updateTime: new Date(story.updatedAt).toLocaleDateString(),
        isSerial: true,
        description: story.description || "暂无简介",
        isNFT: story.isNFT || false,
      }));
      console.log("【作品管理】数据转换完成:", formattedWorks);

      setWorks(formattedWorks);
      console.log("【作品管理】作品列表加载完成");
    } catch (error) {
      console.error("【作品管理】加载作品列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 当钱包地址改变时重新加载作品列表
  useEffect(() => {
    if (address) {
      loadWorks();
    }
  }, [address]);

  // 过滤作品
  const filteredWorks = works.filter((work) => {
    const matchesSearch = work.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || work.status === statusFilter;
    console.log("【作品管理】过滤作品:", {
      title: work.title,
      matchesSearch,
      matchesStatus,
      searchTerm,
      statusFilter,
    });
    return matchesSearch && matchesStatus;
  });

  return (
    <WalletRequired
      title="我的作品"
      description="连接钱包以查看您的作品"
      icon={<FaBook className="w-10 h-10 text-indigo-600" />}
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                作品管理
              </h1>
              <p className="text-sm text-gray-500">
                管理您的创作，追踪作品数据
              </p>
            </div>
            <Link
              href="/author/write"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <FiPlus className="w-5 h-5 mr-2" />
              创作新故事
            </Link>
          </div>

          {/* 顶部统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FaRegListAlt className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">总作品数</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {works.length}
              </h3>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FaPencilAlt className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">总字数</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {works
                  .reduce((sum, work) => sum + work.wordCount, 0)
                  .toLocaleString()}
              </h3>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiEye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">总阅读量</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {works
                  .reduce((sum, work) => sum + work.viewCount, 0)
                  .toLocaleString()}
              </h3>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <FiHeart className="w-6 h-6 text-pink-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">总获赞数</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {works
                  .reduce((sum, work) => sum + work.likeCount, 0)
                  .toLocaleString()}
              </h3>
            </div>
          </div>

          {/* 搜索和筛选工具栏 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="搜索作品..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as Work["status"] | "all")
                  }
                  className="pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all duration-200"
                >
                  <option value="all">全部状态</option>
                  <option value="draft">草稿</option>
                  <option value="reviewing">审核中</option>
                  <option value="published">已发布</option>
                </select>
              </div>
            </div>
          </div>

          {/* 作品列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiEdit className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                开始您的创作之旅
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                创建您的第一部作品，与读者分享您的故事
              </p>
              <Link
                href="/author/write"
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                创建新作品
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredWorks.map((work) => (
                <div
                  key={work.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="relative w-32 h-44 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={work.coverImage}
                          alt={work.title}
                          fill
                          className="object-cover transition-transform duration-200 hover:scale-105"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col mb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h2 className="text-xl font-bold text-gray-900 truncate hover:text-indigo-600 transition-colors duration-200">
                                {work.title}
                              </h2>
                              <p className="text-gray-600 mt-2 line-clamp-2 text-sm">
                                {work.description}
                              </p>
                              <div className="flex items-center gap-2 mt-4">
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                                    work.status === "published"
                                      ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                      : work.status === "reviewing"
                                      ? "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20"
                                      : "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
                                  }`}
                                >
                                  {work.status === "published"
                                    ? "已发布"
                                    : work.status === "reviewing"
                                    ? "审核中"
                                    : "草稿"}
                                </span>
                                {work.isSerial && (
                                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-600/20">
                                    连载
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-3 ml-4">
                              <button
                                onClick={() =>
                                  router.push(`/author/write?id=${work.id}`)
                                }
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition-all duration-200"
                                title="编辑作品"
                              >
                                <FiEdit className="w-4 h-4 mr-2" />
                                编辑
                              </button>
                              
                              <button
                                onClick={() => router.push(`/author/character?storyId=${work.id}`)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 hover:text-white bg-purple-50 hover:bg-purple-600 rounded-lg transition-all duration-200"
                                title="管理角色"
                              >
                                <FiUsers className="w-4 h-4 mr-2" />
                                角色管理
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedWorkId(work.id);
                                  setIsNftModalOpen(true);
                                }}
                                disabled={work.isNFT}
                                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  work.isNFT
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600"
                                }`}
                                title={work.isNFT ? "已铸造" : "铸造NFT"}
                              >
                                <FiAward className="w-4 h-4 mr-2" />
                                {work.isNFT ? "已铸造" : "铸造 NFT"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <FiEye className="w-4 h-4" />
                        <span>{work.viewCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <FiHeart className="w-4 h-4" />
                        <span>{work.likeCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <FiMessageSquare className="w-4 h-4" />
                        <span>{work.commentCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <NftMintModal
        isOpen={isNftModalOpen}
        onClose={() => {
          setIsNftModalOpen(false);
          loadWorks(); // 关闭弹窗时重新加载作品列表
        }}
        storyId={selectedWorkId}
        fileId={selectedWorkId}
        address={address}
        onSuccess={() => {
          // 铸造成功后的回调
          setIsNftModalOpen(false);
          loadWorks(); // 重新加载作品列表
        }}
      />
    </WalletRequired>
  );
}
