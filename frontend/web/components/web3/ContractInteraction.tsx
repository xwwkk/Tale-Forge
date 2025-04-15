'use client'

import { useState } from 'react'
import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { Button } from '../../ui'

// 这里替换为你的合约ABI和地址
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS'
const CONTRACT_ABI = [
  // 示例ABI，请替换为你的合约ABI
  {
    "inputs": [],
    "name": "getValue",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "newValue", "type": "uint256"}],
    "name": "setValue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export function ContractInteraction() {
  const [newValue, setNewValue] = useState('')

  // 读取合约数据
  const { data: currentValue, isError: readError, isLoading: readLoading } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getValue',
  })

  // 准备写入合约
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'setValue',
    args: [newValue ? BigInt(newValue) : BigInt(0)],
  })

  // 执行写入操作
  const { write, isLoading: writeLoading, isSuccess, isError: writeError } = useContractWrite(config)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-xl font-bold">合约交互示例</h2>
        
        <div className="mt-4">
          <h3 className="font-semibold">当前值:</h3>
          {readLoading ? (
            <p>加载中...</p>
          ) : readError ? (
            <p className="text-red-500">读取错误</p>
          ) : (
            <p>{currentValue?.toString()}</p>
          )}
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">设置新值:</h3>
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="mt-2 p-2 border rounded"
            placeholder="输入新的值"
          />
          <Button
            className="mt-2 ml-2"
            disabled={!write || writeLoading}
            onClick={() => write?.()}
          >
            {writeLoading ? '处理中...' : '提交'}
          </Button>
        </div>

        {isSuccess && (
          <div className="mt-2 text-green-500">
            交易成功！
          </div>
        )}
        
        {writeError && (
          <div className="mt-2 text-red-500">
            交易失败
          </div>
        )}
      </div>
    </div>
  )
}
