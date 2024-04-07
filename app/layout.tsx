import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getServerSession } from 'next-auth'
import './globals.css'
import SessionProvider from './SessionProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EmailVerificationAlert from '@/components/EmailVerificationAlert'
import { PrismaClient } from '@prisma/client'
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"


const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  let realUser = null
  if (session) {
    const prisma = new PrismaClient()
    realUser = await prisma.user.findUnique({
      where: {
        id: session?.user?.id,
      },
    })
    prisma.$disconnect()
  }

  return (
    <html lang='en'>
      <body    className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}>
        <SessionProvider session={session}>
          <Navbar />
          <div className='dark:bg-gray-800 min-h-screen'>{children}</div>
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
