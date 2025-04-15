import OpenAI from "openai";
import 'dotenv/config';
import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PrismaClient } from '@prisma/client';
import * as tencentcloud from "tencentcloud-sdk-nodejs-hunyuan";


const prisma = new PrismaClient();

// 文本内容审核使用 DeepSeek
const deepseekClient = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY || '<DeepSeek API Key>'
});
// 图片内容审核使用 qwenOmni
const qwenOmniClient = new OpenAI({
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_OMNI_API_KEY || '<Qwen Omni API Key>'
});


// 图片生成使用 Stability
//const STABILItY_API_KEY = process.env.STABILITY_API_KEY || '<Stability API Key>'

// 图片生成使用腾讯混元
const hunyuanClientConfig = {
    credential: {
        secretId: process.env.HUNYUAN_SECRET_ID || '<Hunyuan Secret ID>',
        secretKey: process.env.HUNYUAN_SECRET_KEY || '<Hunyuan Secret Key>',
    },
    region: "ap-guangzhou",
    profile: {
        httpProfile: {
            endpoint: "hunyuan.tencentcloudapi.com",
        },
    },
};

const hunyuanClient = new tencentcloud.hunyuan.v20230901.Client(hunyuanClientConfig);

// 语音生成使用 ElevenLabs
const elevenLabsClient = new OpenAI({
    baseURL: process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io',
    apiKey: process.env.ELEVENLABS_API_KEY || '<ElevenLabs API Key>'
});

export class AIService {
    /**
     * 审查内容
     * @param content 要审查的内容
     * @returns 是否通过审核
     */
    public async reviewContent(content: string, base64Images?: string[]): Promise<boolean> {
        try {
            console.log('【AI 内容审核】开始审核内容:', content);
            const completionContent = await deepseekClient.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的内容审核助手。请检查内容是否包含过度的暴力、色情、仇恨言论等违规内容。如果内容安全返回true，否则返回false。"
                    },
                    {
                        role: "user",
                        content: `请审查一下以下的内容：
                                ${content}
                                如果内容安全返回true，否则返回false。
                                `
                        //模型过于敏感，可以通过添加案例来提高审核的准确性；或则更换模型
                    }
                ],
                model: "deepseek-chat",
                temperature: 0.3
            });

            if (base64Images && base64Images.length > 0) {
                // 处理所有图片
                const imagePromises = base64Images.map(async base64Image => {
                    const stream = await qwenOmniClient.chat.completions.create({
                        model: "qwen-omni-turbo",
                        messages: [
                            {
                                "role": "system",
                                "content": [{ "type": "text", "text": "你是一个专业的图片审核助手。请检查内容是否包含过度的色情等违规内容。如果内容安全返回true，否则返回false。" }]
                            },
                            {
                                "role": "user",
                                "content": [{
                                    "type": "image_url",
                                    "image_url": { "url": `data:image/png;base64,${base64Image}` },
                                },
                                { "type": "text", "text": "判断图片中是否有违规内容，如果未违规返回true，否则返回false。" }]
                            }],
                        stream: true,
                        stream_options: {
                            include_usage: true
                        },
                        modalities: ["text"],
                    });

                    let result = '';
                    for await (const chunk of stream) {
                        if (chunk.choices[0]?.delta?.content) {
                            result += chunk.choices[0].delta.content;
                        }
                    }
                    return result;
                });

                // 等待所有图片审核完成
                const imageResults = await Promise.all(imagePromises);
                console.log('【AI 图片审核】审核结果:', imageResults);

                // 检查是否有任何图片审核未通过
                const hasInvalidImage = imageResults.some(result => result.toLowerCase() !== 'true');

                if (hasInvalidImage) {
                    return false;
                }
            }

            const response = completionContent.choices[0].message.content || 'false';
            console.log('【AI 内容审核】审核结果:', response);
            return response.toLowerCase() === 'true';
        } catch (error) {
            console.error('内容审查失败:', error);
            throw new Error('内容审查服务暂时不可用');
        }
    }

    /**
     * 生成图片
     * @param prompt 图片描述
     * @param resolution 图片分辨率
     * @param style 图片风格（可选）
     * @param referenceImage 参考图片（可选）
     * @returns 图片URL
     */
    public async generateImage(
        prompt: string,
        resolution: string,
        style?: string,
        referenceImage?: string
    ): Promise<{ success: boolean; imageUrl: string }> {
        try {

            // 如果有参考图片，使用新的图片生成方式
            if (referenceImage) {
                try {
                    const response = await fetch("https://api.laozhang.ai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${process.env.LAOZHANG_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "gemini-2.0-flash-exp-image-generation",
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        {
                                            type: "text",
                                            text: prompt
                                        },
                                        {
                                            type: "image_url",
                                            image_url: {
                                                url: `data:image/png;base64,${referenceImage}`
                                            }
                                        }
                                    ]
                                }
                            ],
                            modalities: ["text", "image"],
                        })
                    });

                    const result = await response.json();

                    if (result.choices && result.choices[0].message.content) {
                        const match = result.choices[0].message.content.match(/\((https?:\/\/[^\)]+)\)/);
                        if (match && match[1]) {
                            return { success: true, imageUrl: match[1] };
                        }
                    }
                } catch (error) {
                    console.error('使用参考图片生成失败，切换到默认方式:', error);
                }
            }

            let enhancedPrompt = prompt;

            console.log('【AI 生成图片】升级提示词');
            const completion = await deepseekClient.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `你是一个提示词专家，请根据用户的输入，生成一个中文的提示词，要求：
                            1. 将用户的输入重新排序进行优化，以这样的形式：风格描述 + 关键人物主体 + 人物具体的五官/表情/行为/动作/姿态等 + 人物的服饰 + 人物所在场景/背景 + 整体环境氛围 + 镜头取景方式；
                            2. 提示词要能够准确描述图片的内容；
                            3. 不要加入引号；
                            直接返回新的提示词`
                    },
                    {
                        role: "user",
                        content: `请修改以下提示词：
                                ${prompt}
                                `
                    }
                ],
                model: "deepseek-chat",
                temperature: 0.3
            });

            enhancedPrompt = completion.choices[0].message.content || prompt;
            console.log('【AI 生成图片】新的提示词:', enhancedPrompt);

            // 如果没有参考图片或使用参考图片失败，使用原有的腾讯混元方式
            const imageParams = {
                "Prompt": enhancedPrompt,
                "Resolution": resolution,
                "LogoAdd": 0,
                ...(style && style.trim() && { "Style": style })
            };

            const jobStatus = await hunyuanClient.SubmitHunyuanImageJob(imageParams);
            console.log('Job submitted:', jobStatus);

            const jobParams = {
                "JobId": jobStatus.JobId || ''
            }
            let jobResult = await hunyuanClient.QueryHunyuanImageJob(jobParams)
            console.log('Job result:', jobResult);
            while (jobResult.JobStatusCode !== '5') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                jobResult = await hunyuanClient.QueryHunyuanImageJob(jobParams)
                console.log('Job result:', jobResult);
            }
            if (jobResult.JobStatusCode === '5') {
                const imageUrl = Array.isArray(jobResult.ResultImage)
                    ? jobResult.ResultImage[0]
                    : jobResult.ResultImage || '';
                return { success: true, imageUrl };
            } else {
                return { success: false, imageUrl: '' };
            }
        } catch (error) {
            console.error('生成图片失败:', error);
            throw new Error('图片生成服务暂时不可用');
        }
    }

    /**
     * 生成语音
     * @param text 要转换的文本
     * @param voice 声音类型
     * @returns 音频URL
     */
    public async generateVoice(text: string, voice: string = 'default'): Promise<string> {
        try {
            // TODO: 实现AI生声功能
            throw new Error('AI生声功能尚未实现');
        } catch (error) {
            console.error('生成语音失败:', error);
            throw new Error('语音生成服务暂时不可用');
        }
    }

    /**
     * 聊天功能
     * @param input 用户输入
     * @param characterId 角色ID（可选）
     * @returns 聊天结果
     */
    public async chat(input: string, characterId?: string): Promise<string> {
        try {
            const chatModel = new ChatOpenAI({
                modelName: "deepseek-chat",
                temperature: 0.7,
                openAIApiKey: process.env.DEEPSEEK_API_KEY,
                configuration: {
                    baseURL: 'https://api.deepseek.com'
                }
            });

            let systemPrompt = "你是一个AI角色";

            if (characterId) {
                const character = await this.getCharacter(characterId);
                console.log('【AI 聊天】角色信息:', character);
                if (character) {
                    systemPrompt = `你是一个名为${character.name}的角色，身份是${character.role}。
                    背景：${character.background}
                    性格：${character.personality}
                    目标：${character.goals.join('、')}
                    关系：${character.relationships.join('、')}
                    请以这个角色的身份和用户对话。`;
                }
            }

            const promptTemplate = ChatPromptTemplate.fromMessages([
                ["system", systemPrompt],
                ["human", "{input}"]
            ]);

            const chain = promptTemplate.pipe(chatModel);

            const response = await chain.invoke({
                input: input
            });

            return String(response.content) || "抱歉，我现在无法回答。请稍后再试。";
        } catch (error) {
            console.error('聊天失败:', error);
            throw new Error('聊天服务暂时不可用');
        }
    }

    /**
     * 创建新角色
     * @param params 角色信息
     */
    public async createCharacter(params: {
        storyId: string;
        name: string;
        role: string;
        background?: string;
        personality?: string;
        goals?: string[];
        relationships?: string[];
    }) {
        try {
            return await prisma.character.create({
                data: {
                    storyId: params.storyId,
                    name: params.name,
                    role: params.role,
                    background: params.background || '',
                    personality: params.personality || '',
                    goals: params.goals || [],
                    relationships: params.relationships || []
                }
            });
        } catch (error) {
            console.error('创建角色失败:', error);
            throw new Error('创建角色失败');
        }
    }

    /**
     * 更新角色信息
     * @param id 角色ID
     * @param params 更新的角色信息
     */
    public async updateCharacter(id: string, params: {
        name?: string;
        role?: string;
        background?: string;
        personality?: string;
        goals?: string[];
        relationships?: string[];
    }) {
        try {
            return await prisma.character.update({
                where: { id },
                data: params
            });
        } catch (error) {
            console.error('更新角色失败:', error);
            throw new Error('更新角色失败');
        }
    }

    /**
     * 删除角色
     * @param id 角色ID
     */
    public async deleteCharacter(id: string) {
        try {
            await prisma.character.delete({
                where: { id }
            });
        } catch (error) {
            console.error('删除角色失败:', error);
            throw new Error('删除角色失败');
        }
    }

    /**
     * 获取故事的所有角色
     * @param storyId 故事ID
     */
    public async getCharacters(storyId: string) {
        try {
            return await prisma.character.findMany({
                where: {
                    storyId
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });
        } catch (error) {
            console.error('获取角色列表失败:', error);
            throw new Error('获取角色列表失败');
        }
    }

    /**
     * 获取单个角色
     * @param id 角色ID
     */
    public async getCharacter(id: string) {
        try {
            return await prisma.character.findUnique({
                where: {
                    id
                }
            });
        } catch (error) {
            console.error('获取角色失败:', error);
            throw new Error('获取角色失败');
        }
    }
}