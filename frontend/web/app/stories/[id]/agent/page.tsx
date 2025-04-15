'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Character {
  id: string;
  name: string;
  role: string;
}

export default function AgentChat() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const messageListRef = useRef<HTMLDivElement>(null)

  const userAvatarUrl = '/images/avatars/user.jpeg'
  const assistantAvatarUrl = '/images/avatars/assistant.webp'

  useEffect(() => {
    if (storyId) {
      fetchCharacters();
    }
  }, [storyId]);

  const fetchCharacters = async () => {
    try {
      const response = await fetch(`/api/ai/characters?storyId=${storyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }
      const data = await response.json();
      setCharacters(data);
      if (data.length > 0) {
        setSelectedCharacterId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !selectedCharacterId) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input.trim(),
          characterId: selectedCharacterId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我现在无法回答。请稍后再试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/stories/${storyId}/read`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.navBar}>
        <button onClick={handleBack} className={styles.backButton}>
          <FaArrowLeft />
          返回阅读
        </button>
      </div>
      <div className={styles.chatContainer}>
        <div className={styles.characterSelector}>
          {characters.length > 0 ? (
            <>
              <label htmlFor="character">选择角色：</label>
              <select
                id="character"
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className={styles.select}
              >
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name} - {char.role}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className={styles.noCharacters}>
              该故事还没有创建任何角色
            </div>
          )}
        </div>
        <div className={styles.messageList} ref={messageListRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              }`}
            >
              <div className={styles.avatar}>
                <Image
                  src={message.role === 'user' ? userAvatarUrl : assistantAvatarUrl}
                  alt={message.role === 'user' ? '用户头像' : '助手头像'}
                  width={32}
                  height={32}
                />
              </div>
              <div className={styles.messageContent}>
                {message.content}
                <div className={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <div className={styles.avatar}>
                <Image
                  src={assistantAvatarUrl}
                  alt="助手头像"
                  width={32}
                  height={32}
                />
              </div>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading || !selectedCharacterId}
            className={styles.input}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !selectedCharacterId}
            className={styles.sendButton}
          >
            发送
          </button>
        </form>
      </div>
    </div>
  )
}
