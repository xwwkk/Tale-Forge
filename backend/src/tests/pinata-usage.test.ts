import axios from 'axios';
import { PINATA_KEYS } from '../config/pinata';

async function checkPinataLimits() {
    console.log('开始检查 Pinata 账号限制...\n');

    for (const key of PINATA_KEYS) {
        console.log(`检查 Key: ${key.name}`);
        
        try {
            // 1. 检查认证状态
            const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
                headers: {
                    Authorization: `Bearer ${key.jwt}`
                }
            });
            console.log('认证状态:', authResponse.status === 200 ? '有效' : '无效');

            // 2. 获取账号信息
            const userResponse = await axios.get('https://api.pinata.cloud/users/me', {
                headers: {
                    Authorization: `Bearer ${key.jwt}`
                }
            });
            console.log('账号信息:', userResponse.data);

            // 3. 获取使用统计
            const statsResponse = await axios.get('https://api.pinata.cloud/data/pinList?status=pinned', {
                headers: {
                    Authorization: `Bearer ${key.jwt}`
                }
            });
            console.log('已上传文件数:', statsResponse.data.count);
            console.log('总存储大小:', statsResponse.data.rows.reduce((acc: number, curr: any) => acc + curr.size, 0), 'bytes');

            // 4. 尝试获取限制信息
            try {
                const limitsResponse = await axios.get('https://api.pinata.cloud/users/rateLimit', {
                    headers: {
                        Authorization: `Bearer ${key.jwt}`
                    }
                });
                console.log('API 限制信息:', limitsResponse.data);
            } catch (error: any) {
                if (error.response?.status === 402) {
                    console.log('API 限制信息: 需要付费计划才能查看');
                } else {
                    console.log('获取 API 限制信息失败:', error.message);
                }
            }

        } catch (error: any) {
            console.error(`检查失败:`, error.message);
            if (error.response?.data) {
                console.error('错误详情:', error.response.data);
            }
        }

        console.log('\n---\n');
    }
}

// 运行测试
checkPinataLimits().catch(console.error); 