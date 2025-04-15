import { PrismaClient } from '@prisma/client';

async function verifyDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('开始验证数据库...\n');

    // 检查用户表
    const userCount = await prisma.user.count();
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        address: true,
        authorName: true,
        createdAt: true
      }
    });
    console.log('用户表统计:');
    console.log(`- 总用户数: ${userCount}`);
    console.log('- 样本用户:', sampleUser);
    console.log();

    // 检查故事表
    const storyCount = await prisma.story.count();
    const sampleStory = await prisma.story.findFirst({
      select: {
        id: true,
        title: true,
        authorId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    console.log('故事表统计:');
    console.log(`- 总故事数: ${storyCount}`);
    console.log('- 样本故事:', sampleStory);
    console.log();

    // 检查章节表
    const chapterCount = await prisma.chapter.count();
    const sampleChapter = await prisma.chapter.findFirst({
      select: {
        id: true,
        title: true,
        storyId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    console.log('章节表统计:');
    console.log(`- 总章节数: ${chapterCount}`);
    console.log('- 样本章节:', sampleChapter);
    console.log();

    // 检查评论表
    const commentCount = await prisma.comment.count();
    const sampleComment = await prisma.comment.findFirst({
      select: {
        id: true,
        content: true,
        userId: true,
        storyId: true,
        createdAt: true
      }
    });
    console.log('评论表统计:');
    console.log(`- 总评论数: ${commentCount}`);
    console.log('- 样本评论:', sampleComment);
    console.log();

    // 检查收藏表
    const favoriteCount = await prisma.favorite.count();
    const sampleFavorite = await prisma.favorite.findFirst({
      select: {
        id: true,
        userId: true,
        storyId: true,
        createdAt: true
      }
    });
    console.log('收藏表统计:');
    console.log(`- 总收藏数: ${favoriteCount}`);
    console.log('- 样本收藏:', sampleFavorite);
    console.log();

    // 检查点赞表
    const likeCount = await prisma.like.count();
    const sampleLike = await prisma.like.findFirst({
      select: {
        id: true,
        userId: true,
        storyId: true,
        createdAt: true
      }
    });
    console.log('点赞表统计:');
    console.log(`- 总点赞数: ${likeCount}`);
    console.log('- 样本点赞:', sampleLike);
    console.log();

    console.log('数据库验证完成！');
  } catch (error) {
    console.error('验证过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase(); 