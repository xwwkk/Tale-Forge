import express from 'express';
import { storyService, userService, commentService } from './services';
import type { StoryStatus } from '@prisma/client'
import multer from 'multer';
import path from 'path';


const app = express();
// 增加请求体大小限制到 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 配置静态文件服务
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    // 设置CORS头
    res.set('Access-Control-Allow-Origin', '*');
    // 设置缓存控制
    res.set('Cache-Control', 'no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// 配置multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

/**
 * 用户相关路由(未完善)
 */
// POST - 创建新用户
app.post('/api/users', async (req, res) => {
  try {
    console.log('[POST /api/users] 收到创建请求:', {
      body: req.body
    })
    
    const user = await userService.getOrCreateUser(req.body.address);
    
    console.log('[POST /api/users] 创建成功:', user)
    res.json(user);
  } catch (error: any) {
    console.error('[POST /api/users] 创建失败:', error)
    res.status(500).json({ error: error?.message });
  }
});

// 用户相关路由
// GET - 获取用户信息
app.get('/api/users/:address', async (req, res) => {
  try {
    console.log('[GET /api/users/:address] 收到查询请求:', {
      address: req.params.address
    })
    
    const { address } = req.params;
    const user = await userService.getUser(address);
    
    console.log('[GET /api/users/:address] 查询成功:', user)
    res.json(user);
  } catch (error: any) {
    console.error('[GET /api/users/:address] 查询失败:', error)
    res.status(500).json({ error: error?.message });
  }
});
// PUT - 更新用户信息（主要是作者信息）
app.put('/api/users/:address', async (req, res) => {
  try {
    console.log('[PUT /api/users/:address] 收到更新请求:', {
      address: req.params.address,
      body: req.body
    })

    const { address } = req.params
    const user = await userService.updateUser(address, req.body)
    
    console.log('[PUT /api/users/:address] 更新成功:', user)
    res.json(user)
  } catch (error: any) {
    console.error('[PUT /api/users/:address] 更新失败:', error)
    res.status(500).json({ error: error?.message })
  }
})

/**
 * 作者相关路由
 */
// 作者相关路由
// POST - 注册新作者
app.post('/api/authors/register', async (req, res) => {
  try {
    console.log('[POST /api/authors/register] 收到注册请求:', {
      body: req.body
    })
    
    const author = await userService.registerAuthor(req.body);
    
    console.log('[POST /api/authors/register] 注册成功:', author)
    res.json(author);
  } catch (error: any) {
    console.error('[POST /api/authors/register] 注册失败:', error)
    res.status(500).json({ error: error?.message });
  }
});

// GET - 获取作者信息
app.get('/api/authors/:address', async (req, res) => {
  try {
    console.log('[GET /api/authors/:address] 收到查询请求:', {
      address: req.params.address
    })
    
    const { address } = req.params;
    const author = await userService.getAuthorByAddress(address);
    
    console.log('[GET /api/authors/:address] 查询成功:', author)
    res.json(author);
  } catch (error: any) {
    console.error('[GET /api/authors/:address] 查询失败:', error)
    if (error.message === 'Author not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST - 验证作者身份
app.post('/api/authors/verify', async (req, res) => {
  console.log('[POST /api/authors/verify] 收到验证请求:', {
    body: req.body
  })
  // 处理验证
})

/**
 * 作品故事创建路由
 */
// 故事创建路由
app.post('/api/stories/upload', async (req, res) => {
  try {
    console.log('[POST /api/stories/upload] 收到创建请求:', {
      body: req.body
    })
    
    const result = await storyService.uploadStory(req.body);
    
    console.log('[POST /api/stories/upload] 创建成功:', result)
    res.json(result);
  } catch (error: any) {
    console.error('[POST /api/stories/upload] 创建失败:', error)
    res.status(500).json({ error: error?.message });
  }
});

// 故事保存路由
app.post('/api/stories/save', async (req, res) => {
  try {
    console.log('[POST /api/stories/save] 收到保存请求:', {
      body: req.body
    })

    const result = await storyService.saveStory(req.body);

    console.log('[POST /api/stories/save] 保存成功:', result)
    res.json(result);
  } catch (error: any) {
    console.error('[POST /api/stories/save] 保存失败:', error)
    res.status(500).json({ error: error?.message });
  }
});

// GET - 获取作者作品列表
app.get('/api/authors/:address/stories', async (req, res) => {
  try {
    console.log('[GET /api/authors/:address/stories] 收到请求:', {
      address: req.params.address,
      query: req.query
    })
    
    const { address } = req.params
    const { skip, take, status } = req.query
    
    // 1. 首先获取作者信息
    const author = await userService.getAuthorByAddress(address)
    
    if (!author) {
      console.log('[GET /api/authors/:address/stories] 作者不存在:', address)
      return res.status(404).json({ error: '作者不存在' })
    }

    // 2. 使用 StoryService 获取作品列表
    const result = await storyService.getAuthorStories(author.id, {
      status: status as StoryStatus,
      skip: Number(skip) || 0,
      take: Number(take) || 10
    })
    
    console.log('[GET /api/authors/:address/stories] 返回结果:', {
      syncStatus: result.syncStatus,
      storiesCount: result.stories?.length || 0,
      total: result.total || 0
    })
    
    res.json(result)
  } catch (error) {
    console.error('[GET /api/authors/:address/stories] 处理请求失败:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '获取作品列表失败' 
    })
  }
})


// 获取故事列表路由
app.get('/api/stories', async (req, res) => {
  console.log('[GET /api/stories] 收到请求:', {
    query: req.query
  })
  try {
    const { category, authorId, sortBy, limit = '10', page = '1' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    
    const stories = await storyService.getStories({
      category: category as string,
      authorId: authorId as string,
      skip: isNaN(skip) ? 0 : skip,
      take: isNaN(take) ? 10 : take,
      orderBy: sortBy === 'latest' ? 'createdAt' : undefined
    });
    console.log('Sending response:', stories) // 调试用
    res.json(stories);
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ error: error?.message });
  }
});

// 获取故事详情路由
app.get('/api/stories/:id', async (req, res) => {
  try {
    console.log('[GET /api/stories/:id] 收到请求:', {
      id: req.params.id
    })
    const { id } = req.params;
    const story = await storyService.getStory(id);
    res.json(story);
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

// 验证故事路由
app.post('/api/stories/validate', async (req, res) => {
  try {
    const result = await storyService.validateStory(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});


/**
 * 章节相关路由（实际上章节相关可以不需要storyId，因为各个章节ID是唯一的）
 */

// 创建新章节（草稿）
app.post('/api/stories/:storyId/chapters', async (req, res) => {
  try {
    console.log('[POST /api/stories/:storyId/chapters] 收到请求:', {
      storyId: req.params.storyId,
      body: req.body
    });
    
    const { storyId } = req.params;
    const chapter = await storyService.addChapter(storyId, req.body);
    
    res.json(chapter);
  } catch (error: any) {
    console.error('[POST /api/stories/:storyId/chapters] 创建章节失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 获取章节列表
app.get('/api/stories/:storyId/chapters', async (req, res) => {
  try {
    console.log('[GET /api/stories/:storyId/chapters] 收到请求:', {
      storyId: req.params.storyId,
      page: req.query.page,
      limit: req.query.limit
    });
    
    const { storyId } = req.params;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');
    
    // 使用服务层方法获取章节列表
    const chapters = await storyService.getChaptersByStoryId(storyId, page, limit);
    
    res.json(chapters);
  } catch (error: any) {
    console.error('[GET /api/stories/:storyId/chapters] 获取章节列表失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 获取最近的章节
app.get('/api/stories/:storyId/chapters/recent', async (req, res) => {
  try {
    console.log('[GET /api/stories/:storyId/chapters/recent] recent收到请求:', {
      storyId: req.params.storyId,
      limit: req.query.limit
    });
    
    const { storyId } = req.params;
    const limit = parseInt(req.query.limit as string || '10');
    
    // 使用服务层方法获取最近章节
    const chapters = await storyService.getRecentChapters(storyId, limit);
    
    res.json(chapters);
  } catch (error: any) {
    console.error('[GET /api/stories/:storyId/chapters/recent] 获取最近章节失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 获取章节统计信息
app.get('/api/stories/:storyId/chapters/stats', async (req, res) => {
  console.log('[GET /api/stories/:storyId/chapters/stats] 收到请求:', {
    storyId: req.params.storyId});
  try {
    console.log('[GET /api/stories/:storyId/chapters/stats] 收到请求:', {
      storyId: req.params.storyId
    });
    
    const { storyId } = req.params;
    
    // 使用服务层方法获取章节统计信息
    const stats = await storyService.getChapterStats(storyId);
    console.log('[GET /api/stories/:storyId/chapters/stats] 返回结果:', stats)
    
    res.json(stats);
  } catch (error: any) {
    console.error('[GET /api/stories/:storyId/chapters/stats] 获取章节统计信息失败:', error);
    res.status(500).json({ error: error?.message });
  }
});


// 获取指定范围的章节
app.get('/api/stories/:storyId/chapters/range', async (req, res) => {
  try {
    console.log('[GET /api/stories/:storyId/chapters/range] 收到请求:', {
      storyId: req.params.storyId,
      start: req.query.start,
      end: req.query.end
    });
    
    const { storyId } = req.params;
    const start = parseInt(req.query.start as string || '0');
    const end = parseInt(req.query.end as string || '0');
    
    // 验证参数
    if (start <= 0 || end <= 0 || start < end) {
      return res.status(400).json({ error: '无效的章节范围' });
    }
    
    // 使用服务层方法获取指定范围的章节
    const chapters = await storyService.getChaptersByRange(storyId, start, end);
    
    res.json(chapters);
  } catch (error: any) {
    console.error('[GET /api/stories/:storyId/chapters/range] 获取章节范围失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 搜索章节
app.get('/api/stories/:storyId/chapters/search', async (req, res) => {
  try {
    console.log('[GET /api/stories/:storyId/chapters/search] 收到请求:', {
      storyId: req.params.storyId,
      keyword: req.query.keyword
    });
    
    const { storyId } = req.params;
    const keyword = req.query.keyword as string || '';
    
    // 验证参数
    if (!keyword.trim()) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }
    
    // 使用服务层方法搜索章节
    const chapters = await storyService.searchChapters(storyId, keyword);
    
    res.json(chapters);
  } catch (error: any) {
    console.error('[GET /api/stories/:storyId/chapters/search] 搜索章节失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 获取章节详情（新路由，包含 storyId）
app.get('/api/stories/:storyId/chapters/:chapterId', async (req, res) => {
  try {
    console.log('[GET /api/stories/:storyId/chapters/:chapterId] 收到请求:', {
      storyId: req.params.storyId,
      chapterId: req.params.chapterId
    });
    
    const { storyId, chapterId } = req.params;
    const chapter = await storyService.getChapter(chapterId, storyId);
    
    res.json(chapter);
  } catch (error: any) {
    console.error('[GET /api/stories/:storyId/chapters/:chapterId] 获取章节详情失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 通过章节顺序获取章节
app.get('/api/stories/:storyId/chapters/order/:order', async (req, res) => {
  try {
    const { storyId, order } = req.params;
    console.log('[GET /api/stories/:storyId/chapters/order/:order] 收到请求:', {
      storyId,
      order,
      timestamp: new Date().toISOString()
    });
    
    const chapter = await storyService.getChapterByOrder(storyId, parseInt(order));
    
    console.log('[GET /api/stories/:storyId/chapters/order/:order] 查询结果:', {
      found: !!chapter,
      chapterId: chapter?.id,
      title: chapter?.title,
      order: chapter?.order,
      totalChapters: chapter?.totalChapters,
      wordCount: chapter?.wordCount
    });
    
    if (!chapter) {
      console.log('[GET /api/stories/:storyId/chapters/order/:order] 章节不存在:', {
        storyId,
        order
      });
      return res.status(404).json({ error: '章节不存在' });
    }
    
    console.log('[GET /api/stories/:storyId/chapters/order/:order] 成功返回章节数据');
    res.json(chapter);
  } catch (error: any) {
    console.error('[GET /api/stories/:storyId/chapters/order/:order] 获取章节失败:', {
      storyId: req.params.storyId,
      order: req.params.order,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error?.message });
  }
});

// 保存章节（更新章节）（新路由，包含 storyId）
app.put('/api/stories/:storyId/chapters/:chapterId', async (req, res) => {
  try {
    console.log('[PUT /api/stories/:storyId/chapters/:chapterId] 收到请求:', {
      storyId: req.params.storyId,
      chapterId: req.params.chapterId,
      body: req.body
    });
    
    const { storyId, chapterId } = req.params;
    const chapter = await storyService.updateChapter(chapterId, req.body, storyId);
    
    res.json(chapter);
  } catch (error: any) {
    console.error('[PUT /api/stories/:storyId/chapters/:chapterId] 更新章节失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 发布章节（新路由，包含 storyId）
app.post('/api/stories/:storyId/chapters/:chapterId/publish', async (req, res) => {
  try {
    console.log('[POST /api/stories/:storyId/chapters/:chapterId/publish] 收到请求:', {
      storyId: req.params.storyId,
      chapterId: req.params.chapterId,
      body: req.body
    });
    
    const { storyId, chapterId } = req.params;
    const { authorAddress, txHash } = req.body;
    
    if (!authorAddress) {
      return res.status(400).json({ error: '缺少作者地址' });
    }
    
    // 调用发布章节方法，同时传入交易哈希
    const chapter = await storyService.publishChapter(chapterId, authorAddress, storyId, txHash);
    
    res.json(chapter);
  } catch (error: any) {
    console.error('[POST /api/stories/:storyId/chapters/:chapterId/publish] 发布章节失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 删除章节（新路由，包含 storyId）
app.delete('/api/stories/:storyId/chapters/:chapterId', async (req, res) => {
  try {
    console.log('[DELETE /api/stories/:storyId/chapters/:chapterId] 收到请求:', {
      storyId: req.params.storyId,
      chapterId: req.params.chapterId
    });
    
    const { storyId, chapterId } = req.params;
    const result = await storyService.deleteChapter(chapterId, storyId);
    
    res.json(result);
  } catch (error: any) {
    console.error('[DELETE /api/stories/:storyId/chapters/:chapterId] 删除章节失败:', error);
    res.status(500).json({ error: error?.message });
  }
});

// 上传章节插画
app.post('/api/stories/:storyId/chapters/:chapterId/images', upload.single('image'),
 async (req: express.Request, res: express.Response) => {
 
  console.log('[插画上传-后端API] 收到请求:', {
    storyId: req.params.storyId,
    chapterId: req.params.chapterId,
    position: req.body.position,
    file: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });

  try {
    const { storyId, chapterId } = req.params;
    const position = req.body.position ? parseInt(req.body.position) : undefined;
    const file = req.file;

    if (!file) {
      console.log('[插画上传-后端API] 错误: 没有上传文件');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[插画上传-后端API] 开始处理上传, 位置:', position);
    const illustration = await storyService.uploadChapterImage(storyId, chapterId, file, position);
    console.log('[插画上传-后端API] 上传成功:', illustration);
    res.json(illustration);
  } catch (error: any) {
    console.error('[插画上传-后端API] 上传失败:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 获取章节插画
app.get('/api/stories/:storyId/chapters/:chapterId/images', async (req: express.Request, res: express.Response) => {
  console.log('[插画列表-后端API] 收到请求:', {
    storyId: req.params.storyId,
    chapterId: req.params.chapterId
  });

  try {
    const { storyId, chapterId } = req.params;
    console.log('[插画列表-后端API] 开始获取列表');
    const illustrations = await storyService.getChapterIllustrations(storyId, chapterId);
    console.log('[插画列表-后端API] 获取成功，数量:', illustrations.length);
    res.json(illustrations);
  } catch (error: any) {
    console.error('[插画列表-后端API] 获取失败:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 删除章节插画
app.delete('/api/stories/:storyId/chapters/:chapterId/images/:illustrationId', async (req: express.Request, res: express.Response) => {
  console.log('[插画删除-后端API] 收到请求:', {
    storyId: req.params.storyId,
    chapterId: req.params.chapterId,
    illustrationId: req.params.illustrationId
  });

  try {
    const { storyId, chapterId, illustrationId } = req.params;
    console.log('[插画删除-后端API] 开始删除');
    await storyService.deleteIllustration(storyId, chapterId, illustrationId);
    console.log('[插画删除-后端API] 删除成功');
    res.json({ success: true });
  } catch (error: any) {
    console.error('[插画删除-后端API] 删除失败:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * 关注相关路由
 */
// GET - 获取关注列表
app.get('/api/authors/:address/follows', async (req, res) => {
  try {
    console.log('[GET /api/authors/:address/follows] 收到查询关注列表请求:', {
      address: req.params.address
    })
    
    const { address } = req.params;
    const follows = await userService.getAuthorFollows(address);
    
    console.log('[GET /api/authors/:address/follows] 查询成功:', follows)
    res.json(follows);
  } catch (error: any) {
    console.error('[GET /api/authors/:address/follows] 查询失败:', error)
    res.status(500).json({ error: error?.message });
  }
});

// POST - 创建新的关注关系
app.post('/api/authors/:address/follows', async (req, res) => {
  try {
    console.log('[POST /api/authors/:address/follows] 收到关注请求:', {
      address: req.params.address,
      followerAddress: req.body.followerAddress
    })
    
    const { address } = req.params;
    const { followerAddress } = req.body;
    const follow = await userService.followAuthor(address, followerAddress);
    
    console.log('[POST /api/authors/:address/follows] 关注成功:', follow)
    res.json(follow);
  } catch (error: any) {
    console.error('[POST /api/authors/:address/follows] 关注失败:', error)
    res.status(500).json({ error: error?.message });
  }
});

// DELETE - 删除关注关系
app.delete('/api/authors/:address/follows', async (req, res) => {
  try {
    console.log('[DELETE /api/authors/:address/follows] 收到取消关注请求:', {
      address: req.params.address,
      followerAddress: req.body.followerAddress
    })
    
    const { address } = req.params;
    const { followerAddress } = req.body;
    await userService.unfollowAuthor(address, followerAddress);
    
    console.log('[DELETE /api/authors/:address/follows] 取消关注成功')
    res.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/authors/:address/follows] 取消关注失败:', error)
    res.status(500).json({ error: error?.message });
  }
});

// 评论相关路由
app.get('/api/stories/:storyId/comments', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { skip, take } = req.query;
    const comments = await commentService.getStoryComments(storyId, {
      skip: Number(skip),
      take: Number(take),
      currentUserId: req.body.userId
    });
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

// 评论相关路由
app.post('/api/comments', async (req, res) => {
  try {
    const comment = await commentService.createComment(req.body);
    res.json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});


// 错误处理中间件
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error'
  })
})

// CORS 中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend service running on port ${port}`);
}); 