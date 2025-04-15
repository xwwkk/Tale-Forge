'use client'

import { useState } from 'react'
import { FaChartBar } from 'react-icons/fa'
import WalletRequired from '@/components/web3/WalletRequired'

export default function AuthorStats() {
  return (
    <WalletRequired
      title="创作数据"
      description="连接钱包以查看您的创作数据"
      icon={<FaChartBar className="w-10 h-10 text-indigo-600" />}
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">创作数据</h1>
          
          {/* 数据统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-600 mb-2">总作品数</h3>
              <p className="text-3xl font-bold text-indigo-600">12</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-600 mb-2">总字数</h3>
              <p className="text-3xl font-bold text-indigo-600">123,456</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-600 mb-2">总收入</h3>
              <p className="text-3xl font-bold text-indigo-600">3.5 BNB</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-600 mb-2">总粉丝数</h3>
              <p className="text-3xl font-bold text-indigo-600">1,234</p>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">阅读趋势</h3>
              <div className="h-80">
                {/* TODO: 添加阅读趋势图表 */}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">收入趋势</h3>
              <div className="h-80">
                {/* TODO: 添加收入趋势图表 */}
              </div>
            </div>
          </div>

          {/* 详细数据表格 */}
          <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">作品详细数据</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">阅读量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收藏数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评论数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收入</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* TODO: 添加实际数据 */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">示例作品 1</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,234</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">56</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">23</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.5 BNB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </WalletRequired>
  )
}
