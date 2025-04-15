import React from 'react'

export default function ReadPage({ params }: { params: { storyId: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-xl font-bold">故事标题</h1>
        <div className="mt-4 prose">
          {/* 故事内容 */}
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          {/* 底部操作栏 */}
          <div className="flex justify-around">
            <button>上一章</button>
            <button>目录</button>
            <button>下一章</button>
          </div>
        </div>
      </div>
    </div>
  )
} 