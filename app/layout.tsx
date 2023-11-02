'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import Link from "next/link";
import Head from "next/head";
import Script from "next/script"

import type { MenuProps } from 'antd';
import { Menu } from 'antd';

import { useRouter, usePathname } from 'next/navigation'

const items: MenuProps['items'] = [
    {
        label: 'Home',
        key: 'home',
    },
    {
        label: 'Manage Incident',
        key: 'manage_incident',
    },
]
const pathsToKeys: any = {
    '/': 'home',
    '/incident/ongoing' : 'manage_incident',
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
    const gtag = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;

    return (
    <html lang="en">
            <head>
                <link rel="stylesheet" href="/quill.bubble.css" />
            </head>
      { process.env.NEXT_PUBLIC_GA_ID && 
        <>
            <Script async src={gtag} />
            <Script id="google_analytics_init"
                dangerouslySetInnerHTML={{
                    __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                        page_path: window.location.pathname
                    });
                    `,
                }}
            />
        </>
      }
      <body className={inter.className}>
        <nav>
            <Menu onClick={onMenuClick.bind(null, router, pathname)} selectedKeys={[getMenuItemByPath(pathname)?.key as string]} mode="horizontal" items={items} />
        </nav>

        <main className="container mt-4 mx-auto">
            {children}
        </main>
      </body>
    </html>
)
}
