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
    },
    {
        label: 'New Incident',
        key: 'new_incident',
    },
]
const pathsToKeys: any = {
    '/': 'home',
    '/incident/ongoing' : 'new_incident',
}

const getMenuItemByPath = (path: string) => {
    const key: string = pathsToKeys[path] as string
    return items.find((i: any) => { return i.key == key })
}
const getMenuItemByKey = (key: string) => {
    return items.find((i: any) => { return i.key == key })
}
const onMenuClick: any = (router: any, pathname: string, e: any) => {
    const selectedItem = getMenuItemByKey(e.key)
    if (!selectedItem) {
        return
    } else {
        const entry = Object.entries(pathsToKeys).find(([_, key]) => { return key == selectedItem.key })
        if (!entry) {
            return
        }
        else {
            router.push(entry[0])
        }
    }
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
            <Menu onClick={onMenuClick.bind(null, router, pathname)} selectedKeys={[getMenuItemByPath(pathname)?.key as string]} mode="horizontal" items={items} />
        </nav>

        <main className="container mx-auto px-4">
            {children}
        </main>
      </body>
    </html>
)
}
