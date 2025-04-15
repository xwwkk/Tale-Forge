import React, { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiEdit, 
  FiBook, 
  FiBarChart2 
} from 'react-icons/fi'

const menuItems = [
  {
    href: '/author/write',
    label: '创作新故事',
    icon: FiEdit
  },
  {
    href: '/author/works',
    label: '我的作品',
    icon: FiBook
  },
  {
    href: '/author/stats',
    label: '数据统计',
    icon: FiBarChart2
  }
]

export const AuthorSidebar: FC = () => {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r h-screen p-4">
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}