'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'  

export default function Home() {
  const { data: session } = useSession()

  const router = useRouter()

  return (
    <div className='flex items-center h-screen'>
      <div className='mx-auto max-w-2xl py-28 sm:py-30 lg:py-40'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold tracking-tight sm:text-6xl dark:text-white'>
            Welcome to Crypto Spotter
          </h1>
          <p className='mt-6 text-lg leading-8 text-black dark:text-white'>
            Track the latest prices and trends in the crypto market with ease. 
            <span
              hidden={!session?.user?.email}
              className='ml-2 bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300'
            >
              {session?.user?.email}
            </span>
          </p>
          <div className='mt-10 flex items-center justify-center gap-x-6'>
            <button
              onClick={() => {
                session?.user ? router.push('/crypto-dashboard') : router.push('/auth/signin')
              }}
              className='rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
            >
              View Market
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
