'use client'

import * as CryptoJS from 'crypto-js'
import React, { useEffect, useState } from 'react'
import ccxt, { Exchange, Ticker } from 'ccxt'

export function encryptAES(inputString: string, passphrase: string): string {
  // Encrypt with AES using the passphrase
  const encrypted = CryptoJS.AES.encrypt(inputString, passphrase).toString()
  return encrypted
}

export function decryptAES(
  encryptedString: string,
  passphrase: string
): string {
  // Decrypt the encrypted string using the passphrase
  const decrypted = CryptoJS.AES.decrypt(encryptedString, passphrase).toString(
    CryptoJS.enc.Utf8
  )
  return decrypted
}

export enum DialogStatus {
  Off = -1,
  Create = 0,
  Update = 1,
  Delete = 2,
}

export interface CryptoDataClient extends Ticker {
  exchangeId: string
}

// Type for the function to fetch data from exchanges
type FetchExchangeData = (
  exchangeId: string,
  pairs: string[]
) => Promise<CryptoDataClient[]>

// Hook to fetch the crypto data
export const useCryptoData = (
  cryptoPairs: string[],
  exchanges: string[]
): CryptoDataClient[] => {
  const [cryptoData, setCryptoData] = useState<CryptoDataClient[]>([])

  useEffect(() => {
    const fetchExchangeData: FetchExchangeData = async (exchangeId, pairs) => {
      try {
        const exchangeClass: any = ccxt[exchangeId as keyof typeof ccxt]

        if (exchangeClass) {
          const exchangeInstance: Exchange = new exchangeClass()
          console.log(exchangeInstance.has)

          const tickers: { [symbol: string]: Ticker } =
            await exchangeInstance.fetchTickers(pairs)

          return Object.values(tickers).map((ticker: Ticker) => ({
            ...ticker,
            exchangeId: exchangeId,
          }))
        }
        return []
      } catch (error) {
        console.error(`Error fetching tickers from ${exchangeId}:`, error)
        return []
      }
    }

    const fetchCryptoData = async () => {
      let _data: CryptoDataClient[] = []

      for (let i = 0; i < exchanges.length; i++) {
        const exchangeData: CryptoDataClient[] = await fetchExchangeData(
          exchanges[i],
          cryptoPairs
        )
        _data = [..._data, ...exchangeData]
      }

      setCryptoData(_data)
    }

    // Call the async function to fetch the data
    fetchCryptoData()
  }, [])

  return cryptoData
}
