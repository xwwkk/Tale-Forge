import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 故事首先上传到后端处理处理IPFS上传
export async function POST(req: NextRequest) {
  try {
    const {
      title,
      description,
      content,
      coverImage,
      authorAddress,
      type
    } = await req.json()

    // 验证必填字段
    if (!title || !description || !content || !authorAddress) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    console.log('准备上传内容到IPFS并且检测内容是否违规...')
    // 调用内容准备API，上传到IPFS
    const prepareResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        content,
        coverImage,
        type,
        authorAddress
      })
    })

    if (!prepareResponse.ok) {
      const error = await prepareResponse.json()
      return NextResponse.json({ 
        error: error.message || '内容上传失败',
        details: error
      }, { status: prepareResponse.status })
    }

    const prepareData = await prepareResponse.json()
    console.log('内容上传成功，获取CID:', prepareData)

    return NextResponse.json({ 
      success: true,
      contentCid: prepareData.contentCid,
      coverCid: prepareData.coverCid
    })

  } catch (error: any) {
    console.error('IPFS上传失败:', error)
    return NextResponse.json({ 
      error: '服务器错误，请稍后重试',
      details: error.message 
    }, { status: 500 })
  }
}

