import React, { useState } from 'react';

interface NftMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storyId?: string;
  fileId: string;
  address?: string;
}

type NftType = 'Character' | 'Scene' | 'Pet' | 'Item';
type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

const nftTypeOptions: { value: NftType; label: string }[] = [
  { value: 'Character', label: '角色' },
  { value: 'Scene', label: '场景' },
  { value: 'Pet', label: '宠物' },
  { value: 'Item', label: '物品' }
];

const rarityOptions: { value: Rarity; label: string }[] = [
  { value: 'Common', label: '普通' },
  { value: 'Rare', label: '稀有' },
  { value: 'Epic', label: '史诗' },
  { value: 'Legendary', label: '传说' }
];

export const NftMintModal: React.FC<NftMintModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  storyId,
  fileId,
  address 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<NftType>('Character');
  const [rarity, setRarity] = useState<Rarity>('Common');
  const [priceBNB, setPriceBNB] = useState('');
  const [priceToken, setPriceToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('Character');
    setRarity('Common');
    setPriceBNB('');
    setPriceToken('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleMint = async () => {
    if (!fileId || !address) {
      setError('缺少必要参数');
      return;
    }

    if (!name || !description || !priceBNB || !priceToken) {
      setError('请填写名称、描述、价格');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/mint/nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          fileId,
          storyId,
          name,
          description,
          nftType: type,
          rarity,
          priceBNB,
          priceToken,
        }),
      });

      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        throw new Error('铸造失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '铸造失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[480px]">
        <h2 className="text-xl font-bold mb-4">铸造 NFT</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 w-24">NFT 名称</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-md border border-blue-200 shadow-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 px-3 py-2" 
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 w-24">描述</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 rounded-md border border-blue-200 shadow-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 px-3 py-2" 
              rows={3} 
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 w-24">NFT 类型</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as NftType)}
              className="flex-1 rounded-md border border-blue-200 shadow-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 px-3 py-2"
            >
              {nftTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 w-24">稀有度</label>
            <select 
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity)}
              className="flex-1 rounded-md border border-blue-200 shadow-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 px-3 py-2"
            >
              {rarityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 w-24">BNB 价格</label>
            <input 
              type="text"
              value={priceBNB}
              onChange={(e) => handleNumberInput(e.target.value, setPriceBNB)}
              className="flex-1 rounded-md border border-blue-200 shadow-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 px-3 py-2" 
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 w-24">TAFOR 价格</label>
            <input 
              type="text"
              value={priceToken}
              onChange={(e) => handleNumberInput(e.target.value, setPriceToken)}
              className="flex-1 rounded-md border border-blue-200 shadow-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 px-3 py-2" 
            />
          </div>
        </div>
        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isLoading}
          >
            取消
          </button>
          <button 
            onClick={handleMint}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '铸造中...' : '确认铸造'}
          </button>
        </div>
      </div>
    </div>
  );
};