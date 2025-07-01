import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BlogCMS - RBAC Demo",
  description: "A comprehensive Role-Based Access Control blog management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          className="!mt-16"
          toastClassName="!bg-white !text-slate-800 !shadow-xl !border !border-slate-200 !rounded-xl !text-sm !font-medium"
          progressClassName="!bg-gradient-to-r !from-blue-500 !to-purple-500"
          closeButton={false}
        />
      </body>
    </html>
  )
}
