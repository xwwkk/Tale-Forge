'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './styles.module.css'

const BANNER_ITEMS = [
  {
    id: 1,
    title: "创作你的奇幻世界",
    description: "在这里，每个人都是故事的缔造者。用你的想象力创造独特的世界，让读者沉浸其中。",
    image: "https://picsum.photos/1200/400?random=1",
    link: "/create",
    buttonText: "开始创作"
  },
  {
    id: 2,
    title: "探索无限可能",
    description: "数千个精彩故事等待你的发现。穿越奇幻世界，感受不同人生。",
    image: "https://picsum.photos/1200/400?random=2",
    link: "/explore",
    buttonText: "立即探索"
  },
  {
    id: 3,
    title: "让创作更有价值",
    description: "通过NFT技术，让你的创作获得更多收益。让每个优秀的故事都能得到应有的回报。",
    image: "https://picsum.photos/1200/400?random=3",
    link: "/nft-market",
    buttonText: "了解更多"
  }
]

export default function Banner() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState(BANNER_ITEMS.length - 1)

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviousIndex(activeIndex)
      setActiveIndex((prev) => (prev + 1) % BANNER_ITEMS.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [activeIndex])

  const handleDotClick = (index: number) => {
    setPreviousIndex(activeIndex)
    setActiveIndex(index)
  }

  return (
    <div className={styles.banner}>
      <div className={styles.bannerInner}>
        {BANNER_ITEMS.map((item, index) => (
          <div
            key={item.id}
            className={`${styles.bannerSlide} ${
              index === activeIndex ? styles.active : ''
            } ${index === previousIndex ? styles.prev : ''}`}
          >
            <div className={styles.bannerImage}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                priority={index === 0}
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.bannerContent}>
              <h1 className={styles.bannerTitle}>{item.title}</h1>
              <p className={styles.bannerDescription}>{item.description}</p>
              <Link href={item.link} className={styles.bannerButton}>
                {item.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.bannerNav}>
        {BANNER_ITEMS.map((_, index) => (
          <div
            key={index}
            className={`${styles.bannerDot} ${
              index === activeIndex ? styles.active : ''
            }`}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </div>
  )
}