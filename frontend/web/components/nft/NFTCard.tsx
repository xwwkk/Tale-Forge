import Image from 'next/image'
import Link from 'next/link'
import styles from './NFTCard.module.css'

interface NFTCardProps {
  id?: number
  title?: string
  creator?: string
  price?: number
  available?: boolean
  tags?: string[]
  likes?: number
  views?: number
}

export function NFTCard({ 
  id = Math.floor(Math.random() * 1000),
  title = "NFT作品",
  creator = "创作者",
  price = +(Math.random() * 5).toFixed(2),
  available = true,
  tags = ['艺术', '限量'],
  likes = Math.floor(Math.random() * 1000),
  views = Math.floor(Math.random() * 5000)
}: NFTCardProps) {
  return (
    <Link href={`/web3/nft/${id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={`https://picsum.photos/800/600?random=${id}`}
          alt={title}
          fill
          className={styles.image}
        />
        <div className={styles.status}>
          <span className={`${styles.statusBadge} ${available ? styles.available : styles.sold}`}>
            {available ? '可购买' : '已售出'}
          </span>
        </div>
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.creator}>创作者：{creator}</p>
        
        <div className={styles.tags}>
          {tags.map(tag => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.stats}>
          <div className={styles.price}>{price} BNB</div>
          <div className={styles.meta}>
            <span>👍 {likes}</span>
            <span>👀 {views}</span>
          </div>
        </div>
      </div>
    </Link>
  )
} 