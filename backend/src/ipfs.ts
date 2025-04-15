import pinataSDK from '@pinata/sdk'
import { createReadStream } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFileSync } from 'fs'
import axios from 'axios'
import { PINATA_KEYS, PINATA_GATEWAY } from './config/pinata'

// Key 管理
class PinataKeyManager {
  private currentKeyIndex = 0;
  private keyLastUsedTime: { [key: string]: number } = {};
  private keyBlockedUntil: { [key: string]: number } = {};

  constructor() {
    PINATA_KEYS.forEach(key => {
      this.keyLastUsedTime[key.apiKey] = 0;
      this.keyBlockedUntil[key.apiKey] = 0;
    });
  }

  getCurrentKey(): Promise<typeof PINATA_KEYS[0]> {
    const now = Date.now();
    let attempts = 0;
    
    while (attempts < PINATA_KEYS.length) {
      const key = PINATA_KEYS[this.currentKeyIndex];
      
      // 检查是否被阻塞
      if (this.keyBlockedUntil[key.apiKey] > now) {
        console.log(`[IPFS] Key ${key.name} 被阻塞到 ${new Date(this.keyBlockedUntil[key.apiKey]).toLocaleString()}`);
        this.rotateKey();
        attempts++;
        continue;
      }

      // 检查请求间隔
      const timeSinceLastUse = now - this.keyLastUsedTime[key.apiKey];
      if (timeSinceLastUse < 1000) {
        const waitTime = 1000 - timeSinceLastUse;
        console.log(`[IPFS] Key ${key.name} 需要等待 ${waitTime}ms`);
        
        // 如果等待时间很短，就等待
        if (waitTime <= 100) {
          const sleepStart = Date.now();
          while (Date.now() - sleepStart < waitTime) {
            // 主动等待
          }
          return Promise.resolve(key);
        }
        
        this.rotateKey();
        attempts++;
        continue;
      }

      return Promise.resolve(key);
    }

    // 所有 key 都不可用，找出最早可用的时间
    const earliestAvailableTime = Math.min(
      ...PINATA_KEYS.map(key => this.keyBlockedUntil[key.apiKey])
    );
    const waitTime = earliestAvailableTime - now;
    
    if (waitTime <= 0) {
      throw new Error('所有 API Key 都不可用，且无法确定等待时间');
    }

    console.log(`[IPFS] 所有 Key 都被阻塞，等待 ${Math.ceil(waitTime/1000)} 秒后重试...`);
    return new Promise(resolve => {
      setTimeout(() => {
        // 重置所有 key 的阻塞状态
        PINATA_KEYS.forEach(key => {
          if (this.keyBlockedUntil[key.apiKey] <= Date.now()) {
            this.keyBlockedUntil[key.apiKey] = 0;
          }
        });
        resolve(this.getCurrentKey());
      }, waitTime);
    });
  }

  markKeyUsed(key: typeof PINATA_KEYS[0]) {
    this.keyLastUsedTime[key.apiKey] = Date.now();
    console.log(`[IPFS] 使用 Key: ${key.name}`);
  }

  markKeyBlocked(key: typeof PINATA_KEYS[0], duration: number) {
    const blockUntil = Date.now() + duration;
    console.log(`[IPFS] Key ${key.name} 被阻塞 ${duration/1000} 秒，直到 ${new Date(blockUntil).toLocaleString()}`);
    this.keyBlockedUntil[key.apiKey] = blockUntil;
    this.rotateKey();
  }

  rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % PINATA_KEYS.length;
    console.log(`[IPFS] 切换到 Key: ${PINATA_KEYS[this.currentKeyIndex].name}`);
  }
}

// 创建 Key 管理器实例
const keyManager = new PinataKeyManager();

// 请求队列管理
class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 最小请求间隔为1秒

  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // 确保请求间隔
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
          }
          
          const result = await request();
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
      }
    }

    this.isProcessing = false;
  }
}

// 创建请求队列实例
const requestQueue = new RequestQueue();

/**
 * 上传内容到 IPFS
 * @param content 要上传的内容
 * @returns CID
 */
export async function uploadToIPFS(content: string | Buffer): Promise<string> {
  return requestQueue.enqueue(async () => {
    const key = await keyManager.getCurrentKey();
    const pinata = new pinataSDK(key.apiKey, key.apiSecret);

    try {
      // 将内容包装在对象中
      const data = {
        content: content instanceof Buffer ? content.toString('base64') : content,
        timestamp: Date.now()
      }

      const options = {
        pinataMetadata: {
          name: `TaleForge-${Date.now()}`
        }
      }

      const result = await pinata.pinJSONToIPFS(data, options)
      keyManager.markKeyUsed(key);
      return result.IpfsHash;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '3600', 10);
        keyManager.markKeyBlocked(key, retryAfter * 1000);
        // 重试上传
        return uploadToIPFS(content);
      }
      console.error('Failed to upload to IPFS:', error)
      throw error
    }
  });
}

/**
 * 从 IPFS 获取内容
 * @param cid 内容ID
 * @returns 内容
 */
export async function getFromIPFS(cid: string): Promise<string> {
  return requestQueue.enqueue(async () => {
    let retries = 0;
    const maxRetries = PINATA_KEYS.length * 2; // 每个 key 最多尝试两次
    
    while (retries < maxRetries) {
      const key = await keyManager.getCurrentKey();
      console.log(`[IPFS] 使用 Key ${key.name} 尝试获取内容: ${cid} (第 ${retries + 1} 次尝试)`);
      
      try {
        console.log(`[getFromIPFS] 请求的 contentHash: ${cid}`);
        const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
        console.log(`[getFromIPFS] 请求的 URL: ${url}`);
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${key.jwt}`,
          },
          timeout: 10000, // 10秒超时
        });

        if (response.status === 200) {
          keyManager.markKeyUsed(key);
          // 解析 JSON 响应并返回内容
          const data = response.data;
          if (typeof data === 'object' && data.content) {
            return data.content;
          }
          // 如果不是预期的格式，直接返回原始数据
          return typeof data === 'string' ? data : JSON.stringify(data);
        }

        throw new Error(`Unexpected response status: ${response.status}`);
      } catch (error: any) {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '3600', 10);
          keyManager.markKeyBlocked(key, retryAfter * 1000);
          retries++;
          continue; // 继续下一次循环，使用新的 key
        }
        
        if (error.code === 'ECONNABORTED') {
          console.log(`[IPFS] 请求超时，切换到下一个 Key`);
          keyManager.rotateKey();
          retries++;
          continue;
        }

        // 其他错误，如果还有其他 key 可用，就继续尝试
        if (retries < maxRetries - 1) {
          console.log(`[IPFS] 获取失败 (${error.message})，尝试使用下一个 Key`);
          keyManager.rotateKey();
          retries++;
          continue;
        }

        throw new Error(`无法获取内容: ${error.message}`);
      }
    }

    throw new Error(`已尝试所有可用的 Key (${maxRetries} 次)，但都无法获取内容`);
  });
}

/**
 * 获取 IPFS URL (用于公开访问)
 * @param cid 内容ID
 * @returns URL
 */
export function getIPFSUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`
}

/**
 * 上传图片到 IPFS
 * @param file 图片文件
 * @returns CID
 */
export async function uploadImageToIPFS(file: File): Promise<string> {
  return requestQueue.enqueue(async () => {
    const key = await keyManager.getCurrentKey();
    const pinata = new pinataSDK(key.apiKey, key.apiSecret);

    try {
      const buffer = await file.arrayBuffer()
      const tempPath = join(tmpdir(), `ipfs-${Date.now()}.bin`)
      writeFileSync(tempPath, Buffer.from(buffer))

      const readableStreamForFile = createReadStream(tempPath)
      const options = {
        pinataMetadata: {
          name: `TaleForge-Image-${Date.now()}`
        }
      }
      const result = await pinata.pinFileToIPFS(readableStreamForFile, options)
      keyManager.markKeyUsed(key);
      return result.IpfsHash;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '3600', 10);
        keyManager.markKeyBlocked(key, retryAfter * 1000);
        // 重试上传
        return uploadImageToIPFS(file);
      }
      console.error('Failed to upload image to IPFS:', error)
      throw error
    }
  });
}

/**
 * 上传 JSON 数据到 IPFS
 * @param data JSON 数据
 * @returns CID
 */
export async function uploadJSONToIPFS(data: any): Promise<string> {
  return requestQueue.enqueue(async () => {
    const key = await keyManager.getCurrentKey();
    const pinata = new pinataSDK(key.apiKey, key.apiSecret);

    try {
      const options = {
        pinataMetadata: {
          name: `TaleForge-JSON-${Date.now()}`
        }
      }
      // 直接传入原始数据，pinata SDK 会处理序列化
      const result = await pinata.pinJSONToIPFS(data, options)
      keyManager.markKeyUsed(key);
      return result.IpfsHash;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '3600', 10);
        keyManager.markKeyBlocked(key, retryAfter * 1000);
        // 重试上传
        return uploadJSONToIPFS(data);
      }
      console.error('Failed to upload JSON to IPFS:', error)
      throw error
    }
  });
}

/**
 * 从 IPFS 获取 JSON 数据
 * @param cid 内容ID
 * @returns JSON 数据
 */
export async function getJSONFromIPFS(cid: string): Promise<any> {
  try {
    // 直接获取数据，不经过 getFromIPFS
    const response = await axios.get(`https://${PINATA_GATEWAY}/ipfs/${cid}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get JSON from IPFS:', error);
    throw error;
  }
}