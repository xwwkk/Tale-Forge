import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'


// 上传头像
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // 生成唯一的文件名
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    
    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // 将文件写入服务器
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 返回文件URL
    const fileUrl = `/uploads/${filename}`
    
    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
