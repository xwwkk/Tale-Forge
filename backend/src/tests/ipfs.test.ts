import { uploadToIPFS, getFromIPFS, uploadJSONToIPFS, getJSONFromIPFS } from '../ipfs'

async function testIPFS() {
  try {
    console.log('开始测试 IPFS 功能...')

    // 测试文本内容的上传和获取
    const testContent = '这是一个测试内容 ' + Date.now()
    console.log('开始上传文本内容...')
    const cid = await uploadToIPFS(testContent)
    console.log('内容已上传，CID:', cid)
    
    // 等待 5 秒确保内容已经同步
    console.log('等待内容同步...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 获取内容
    console.log('开始获取文本内容...')
    const retrievedContent = await getFromIPFS(cid)
    console.log('已获取内容:', retrievedContent)
    
    if (retrievedContent !== testContent) {
      throw new Error('文本内容不匹配')
    }
    
    // 测试 JSON 数据的上传和获取
    const testData = {
      title: '测试标题',
      content: '测试内容',
      timestamp: Date.now()
    }
    
    console.log('开始上传 JSON 数据...')
    const jsonCid = await uploadJSONToIPFS(testData)
    console.log('JSON 已上传，CID:', jsonCid)
    
    // 等待 5 秒确保内容已经同步
    console.log('等待内容同步...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 获取 JSON
    console.log('开始获取 JSON 数据...')
    const retrievedData = await getJSONFromIPFS(jsonCid)
    console.log('已获取 JSON:', retrievedData)
    
    if (JSON.stringify(retrievedData) !== JSON.stringify(testData)) {
      throw new Error('JSON 数据不匹配')
    }
    
    console.log('所有测试通过！')
  } catch (error) {
    console.error('测试失败:', error)
    process.exit(1)
  }
}

// 运行测试
testIPFS() 