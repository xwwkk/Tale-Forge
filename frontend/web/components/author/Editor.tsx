import React from 'react'

export function Editor() {
  return (
    <div className="space-y-4">
      <input 
        type="text" 
        placeholder="故事标题" 
        className="w-full p-2 border rounded"
      />
      <textarea 
        placeholder="开始创作..." 
        className="w-full h-96 p-2 border rounded"
      />
      <button className="px-4 py-2 bg-blue-500 text-white rounded">
        保存
      </button>
    </div>
  )
} 