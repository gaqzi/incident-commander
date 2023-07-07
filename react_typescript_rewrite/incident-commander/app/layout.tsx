'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import Link from "next/link";

import type { MenuProps } from 'antd';
import { Menu } from 'antd';

import { useRouter, usePathname } from 'next/navigation'

const items: MenuProps['items'] = [
    {
        label: 'Home',
        key: 'home',
        path: '/',
    },
    {
        label: 'New Incident',
        key: 'new_incident',
        path: '/incident/ongoing',
    },
]

const getMenuItemByPath = (path) => {
    return items.find(i => { return i.path == path })
}
const getMenuItemByKey = (key) => {
    return items.find(i => { return i.key == key })
}
const onMenuClick: MenuProps['onClick'] = (router, pathname, e) => {
    const selectedItem = getMenuItemByKey(e.key)
    router.push(selectedItem.path)
};


const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    return (
    <html lang="en">
      <body className={inter.className}>
        <nav>
            <Menu onClick={onMenuClick.bind(this, router, pathname)} selectedKeys={[getMenuItemByPath(pathname).key]} mode="horizontal" items={items} />
        </nav>

        <main className="container mx-auto px-4">
            {children}
        </main>
      </body>
    </html>
)
}
