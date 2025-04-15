# 章节插图功能说明

## 功能概述

Tale Forge平台支持作者在章节中添加插图，丰富小说内容表现形式。本文档说明了章节插图的实现方式和工作流程。

## 插图保存工作流程

1. **插图上传时机**：章节插图在保存章节内容时自动处理，不需要单独操作。

2. **插图处理逻辑**：
   - 系统在保存章节时会分析内容中的所有图片标签
   - 区分临时图片（用户刚插入的blob或data URL图片）和已有图片（已经保存的图片URL）
   - 只上传需要上传的临时图片，避免重复上传已有图片

3. **插图位置记录**：
   - 每张图片会记录其在章节中的位置编号
   - 图片上传后会以`data-position`属性记录在HTML中
   - 后端数据库中通过描述字段`description`记录图片位置信息

## 技术实现

### 前端部分
- 编辑器上传图片时会创建临时blob URL
- 保存章节时分析所有`<img>`标签，提取位置信息
- 替换临时URL为实际服务器URL，并添加位置属性

### 后端部分
- 接收图片和位置信息
- 检查是否已有相同位置的图片，有则更新
- 在图片描述中记录位置信息

## 发布后的插图处理

章节发布时，系统会:
1. 将所有本地服务器上的图片上传到IPFS
2. 替换章节内容中的图片URL为IPFS永久链接
3. 在数据库中记录图片的IPFS CID信息

## 开发者指南

### 前端插图接口

```typescript
// 上传图片
POST /api/stories/:storyId/chapters/:chapterId/images
// 请求体: FormData, 包含image文件和position位置参数

// 获取章节所有插图
GET /api/stories/:storyId/chapters/:chapterId/images

// 删除图片
DELETE /api/stories/:storyId/chapters/:chapterId/images/:illustrationId
```

### 后端数据模型

```prisma
model Illustration {
  id          String   @id @default(cuid())
  chapterId   String
  fileContent String?  @db.Text  // Base64文件内容
  fileName    String?  // 文件名
  fileType    String?  // 文件类型
  fileSize    Int?     // 文件大小
  filePath    String?  // 文件路径
  description String?  // 描述，包含位置信息
  status      String   @default("DRAFT")
  imageCID    String?  // IPFS CID
  createdAt   DateTime @default(now())
  chapter     Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
}
``` 