'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { FaMagic, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';

interface Character {
  id: string;
  name: string;
  role: string;
  background: string;
  personality: string;
  goals: string[];
  relationships: string[];
  avatar?: string;
}

interface Story {
  id: string;
  title: string;
}

export default function CharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get('storyId');
  const characterId = searchParams.get('id');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [character, setCharacter] = useState<Character>({
    id: '',
    name: '',
    role: '',
    background: '',
    personality: '',
    goals: [''],
    relationships: ['']
  });
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (storyId) {
      fetchStory();
      fetchCharacters();
    }
    if (characterId) {
      fetchCharacter();
    }
  }, [storyId, characterId]);

  const fetchStory = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}`);
      if (!response.ok) throw new Error('获取故事信息失败');
      const data = await response.json();
      setStory(data);
    } catch (err) {
      console.error('获取故事信息失败:', err);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch(`/api/ai/characters?storyId=${storyId}`);
      if (!response.ok) throw new Error('获取角色列表失败');
      const data = await response.json();
      setCharacters(data);
    } catch (err) {
      console.error('获取角色列表失败:', err);
    }
  };

  const fetchCharacter = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/characters/${characterId}`);
      if (!response.ok) throw new Error('获取角色失败');
      const data = await response.json();
      setCharacter(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取角色失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个角色吗？')) return;
    
    try {
      const response = await fetch(`/api/ai/characters/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('删除角色失败');
      
      fetchCharacters();
    } catch (err) {
      console.error('删除角色失败:', err);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/author/character?id=${id}&storyId=${storyId}`);
  };

  const handleCreate = () => {
    if (!storyId) {
      setError('未找到故事ID');
      return;
    }
    setCharacter({
      id: '',
      name: '',
      role: '',
      background: '',
      personality: '',
      goals: [''],
      relationships: ['']
    });
    setError(null);
    router.push(`/author/character?storyId=${storyId}&create=true`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyId) {
      setError('未找到故事ID');
      return;
    }

    try {
      setLoading(true);
      const url = characterId 
        ? `/api/ai/characters/${characterId}`
        : '/api/ai/characters';
      
      const method = characterId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...character,
          storyId
        }),
      });

      if (!response.ok) throw new Error('保存角色失败');
      
      const data = await response.json();
      router.push(`/author/character?storyId=${storyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存角色失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!storyId) {
      setError('未找到故事ID');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      //todo 调用AI生成角色
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI生成角色失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleArrayChange = (
    field: 'goals' | 'relationships',
    index: number,
    value: string
  ) => {
    const newArray = [...character[field]];
    newArray[index] = value;
    setCharacter(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'goals' | 'relationships') => {
    setCharacter(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (
    field: 'goals' | 'relationships',
    index: number
  ) => {
    setCharacter(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>加载角色信息...</div>
          <div className={styles.loadingSubtext}>请稍候</div>
        </div>
      </div>
    );
  }
  if (!storyId) return <div className={styles.container}>未找到故事ID</div>;

  if (characterId) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>编辑角色</h1>
        
        {story && (
          <div className={styles.storyTitle}>
            所属故事：{story.title}
          </div>
        )}
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className={styles.aiGenerateButton}
            >
              <FaMagic />
              {isGenerating ? 'AI生成中...' : 'AI一键生成'}
            </button>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">角色名称</label>
            <input
              type="text"
              id="name"
              value={character.name}
              onChange={e => setCharacter(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role">角色身份</label>
            <input
              type="text"
              id="role"
              value={character.role}
              onChange={e => setCharacter(prev => ({ ...prev, role: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="background">背景故事</label>
            <textarea
              id="background"
              value={character.background}
              onChange={e => setCharacter(prev => ({ ...prev, background: e.target.value }))}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="personality">性格特征</label>
            <textarea
              id="personality"
              value={character.personality}
              onChange={e => setCharacter(prev => ({ ...prev, personality: e.target.value }))}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label>目标</label>
            {character.goals.map((goal, index) => (
              <div key={index} className={styles.arrayItem}>
                <input
                  type="text"
                  value={goal}
                  onChange={e => handleArrayChange('goals', index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('goals', index)}
                  className={styles.removeButton}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('goals')}
              className={styles.addButton}
            >
              添加目标
            </button>
          </div>

          <div className={styles.formGroup}>
            <label>关系网络</label>
            {character.relationships.map((relationship, index) => (
              <div key={index} className={styles.arrayItem}>
                <input
                  type="text"
                  value={relationship}
                  onChange={e => handleArrayChange('relationships', index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('relationships', index)}
                  className={styles.removeButton}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('relationships')}
              className={styles.addButton}
            >
              添加关系
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => router.push(`/author/character?storyId=${storyId}`)}
              className={styles.cancelButton}
            >
              取消
            </button>
            <button type="submit" className={styles.submitButton}>
              保存
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (searchParams.get('create') === 'true') {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>创建新角色</h1>
        
        {story && (
          <div className={styles.storyTitle}>
            所属故事：{story.title}
          </div>
        )}
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className={styles.aiGenerateButton}
            >
              <FaMagic />
              {isGenerating ? 'AI生成中...' : 'AI一键生成'}
            </button>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">角色名称</label>
            <input
              type="text"
              id="name"
              value={character.name}
              onChange={e => setCharacter(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role">角色身份</label>
            <input
              type="text"
              id="role"
              value={character.role}
              onChange={e => setCharacter(prev => ({ ...prev, role: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="background">背景故事</label>
            <textarea
              id="background"
              value={character.background}
              onChange={e => setCharacter(prev => ({ ...prev, background: e.target.value }))}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="personality">性格特征</label>
            <textarea
              id="personality"
              value={character.personality}
              onChange={e => setCharacter(prev => ({ ...prev, personality: e.target.value }))}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label>目标</label>
            {character.goals.map((goal, index) => (
              <div key={index} className={styles.arrayItem}>
                <input
                  type="text"
                  value={goal}
                  onChange={e => handleArrayChange('goals', index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('goals', index)}
                  className={styles.removeButton}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('goals')}
              className={styles.addButton}
            >
              添加目标
            </button>
          </div>

          <div className={styles.formGroup}>
            <label>关系网络</label>
            {character.relationships.map((relationship, index) => (
              <div key={index} className={styles.arrayItem}>
                <input
                  type="text"
                  value={relationship}
                  onChange={e => handleArrayChange('relationships', index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('relationships', index)}
                  className={styles.removeButton}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('relationships')}
              className={styles.addButton}
            >
              添加关系
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => router.push(`/author/character?storyId=${storyId}`)}
              className={styles.cancelButton}
            >
              取消
            </button>
            <button type="submit" className={styles.submitButton}>
              保存
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>角色管理</h1>
      </div>

      {story && (
        <div className={styles.storyTitle}>
          所属故事：{story.title}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.characterList}>
        {characters.map(char => (
          <div key={char.id} className={styles.characterCard}>
            <div className={styles.characterInfo}>
              <div className={styles.characterName}>
                <Image
                  src="/images/avatars/assistant.webp"
                  alt={char.name}
                  width={40}
                  height={40}
                  className={styles.characterIcon}
                />
                {char.name}
              </div>
              <div className={styles.characterRole}>{char.role}</div>
              <div className={styles.characterBackground}>{char.background}</div>
            </div>
            <div className={styles.characterActions}>
              <button
                onClick={() => handleEdit(char.id)}
                className={styles.editButton}
              >
                <FaEdit />
                编辑
              </button>
              <button
                onClick={() => handleDelete(char.id)}
                className={styles.deleteButton}
              >
                <FaTrash />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={handleCreate}
          className={styles.createButton}
        >
          <FaPlus />
          创建新角色
        </button>
      </div>
    </div>
  );
}
