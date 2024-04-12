import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import { PrismaClient, User } from '@prisma/client'
import nodemailer from 'nodemailer'
import { randomUUID } from 'crypto'
import ccxt, { Exchange, Ticker } from 'ccxt'
import axios from 'axios'

export async function getById(
  objId: string,
  res: NextApiResponse,
  model: any,
  filterOptions: {} = {}
) {
  try {
    const obj = await model.findUnique({
      where: { id: objId, ...filterOptions },
    })
    if (obj) {
      res.status(200).json(obj)
    } else {
      res.status(404).json({ error: 'Not found' })
    }
  } catch (error) {
    console.error('Error fetching :', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAll(
  req: NextApiRequest,
  res: NextApiResponse,
  model: any,
  filterOptions: {} = {}
) {
  try {
    const allObj = await model.findMany({ where: filterOptions })
    res.status(200).json(allObj)
  } catch (error) {
    console.error('Error fetching :', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function create(
  req: NextApiRequest,
  res: NextApiResponse,
  model: any
) {
  try {
    const newObj = await model.create({ data: req.body })
    res.status(201).json(newObj)
  } catch (error) {
    console.error('Error creating :', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function update(
  req: NextApiRequest,
  res: NextApiResponse,
  model: any,
  filterOptions: {} = {}
) {
  const objId = req.query.id as string
  if (!objId) {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  try {
    const updatedObj = await model.update({
      where: { id: objId, ...filterOptions },
      data: req.body,
    })
    res.status(200).json(updatedObj)
  } catch (error) {
    console.error('Error updating :', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function remove(
  req: NextApiRequest,
  res: NextApiResponse,
  model: any,
  filterOptions: {} = {}
) {
  const objId = req.query.id as string
  if (!objId) {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  try {
    await model.delete({ where: { id: objId, ...filterOptions } })
    res.status(200).json({ message: 'deleted successfully' })
  } catch (error) {
    console.error('Error deleting :', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function hashString(password: string): Promise<string> {
  try {
    const saltRounds: number = 10 // Recommended number of rounds
    const salt: string = await bcrypt.genSalt(saltRounds)
    const hash: string = await bcrypt.hash(password, salt)
    return hash
  } catch (error) {
    console.error('Error hashing password:', error)
    throw error
  }
}

export async function compareHash(
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainTextPassword, hashedPassword)
  } catch (error) {
    console.error('Error comparing passwords:', error)
    throw error
  }
}

export enum VerificationTokenIdentifier {
  EMAIL_VERIFICATION = 'email_verification',
  FORGOT_PASSWORD = 'forgot_password',
}

export async function sendVerificationEmail(user: User) {
  const prisma = new PrismaClient()

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: VerificationTokenIdentifier.EMAIL_VERIFICATION,
      token: `${randomUUID()}${randomUUID()}`.replace(/-/g, ''),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // apres 24 heures
      user: { connect: { id: user.id } }, // Connect the user relation
    },
  })

  prisma.$disconnect()

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GOOGLE_MAIL_USER,
      pass: process.env.GOOGLE_MAIL_PASS,
    },
  })

  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken.token}`

  const mailOptions = {
    from: process.env.GOOGLE_MAIL_USER, // Sender address
    to: user.email as string, // List of recipients
    subject: 'FortiVault: Verify your email', // Subject line
    text: `Please verify your email by clicking the following link: ${verificationUrl}`, // Plain text body
    html: `<p>Please verify your email by clicking the link below:</p><a href="${verificationUrl}" target="_blank">Verify Email</a>`, // HTML body
  }

  // Send email
  return transporter.sendMail(mailOptions)
}

export async function sendResetPasswordEmail(user: User) {
  const prisma = new PrismaClient()

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: VerificationTokenIdentifier.FORGOT_PASSWORD,
      token: `${randomUUID()}${randomUUID()}`.replace(/-/g, ''),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // apres 24 heures
      user: { connect: { id: user.id } }, // Connect the user relation
    },
  })

  prisma.$disconnect()

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GOOGLE_MAIL_USER,
      pass: process.env.GOOGLE_MAIL_PASS,
    },
  })

  const resetPasswordLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${verificationToken.token}&email=${user.email}`

  const mailOptions = {
    from: process.env.GOOGLE_MAIL_USER, // Sender address
    to: user.email as string, // List of recipients
    subject: 'FortiVault: Password reset', // Subject line
    text: `We received a password reset request for your account. To reset your password, just click the link below: ${resetPasswordLink}`, // Plain text body
    html: `<p>We received a password reset request for your account. To reset your password, just click the link below:</p><a href="${resetPasswordLink}" target="_blank">Reset Password</a>`, // HTML body
  }

  // Send email
  return transporter.sendMail(mailOptions)
}

export async function checkToken(
  user: User,
  token: string,
  identifier: VerificationTokenIdentifier
) {
  try {
    const prisma = new PrismaClient()
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token: token,
        userId: user.id,
        identifier: identifier,
        expires: {
          gte: new Date(),
        },
      },
    })

    await prisma.$disconnect()
    if (verificationToken == null) {
      return false
    } else {
      return true
    }
  } catch (error) {
    return false
  }
}

export interface CryptoDataServer extends Ticker {
  exchangeId?: string
}

function convertValrToCctxTicker(data: any): CryptoDataServer {
  const {
    currencyPair,
    askPrice,
    bidPrice,
    lastTradedPrice,
    previousClosePrice,
    baseVolume,
    quoteVolume,
    highPrice,
    lowPrice,
    created,
    changeFromPrevious,
  } = data

  const cryptoData: CryptoDataServer = {
    symbol: `${currencyPair.substr(0, 3)}/${currencyPair.substr(3)}`,
    info: data,
    timestamp: new Date(created).getTime(),
    datetime: created,
    high: parseFloat(highPrice),
    low: parseFloat(lowPrice),
    bid: parseFloat(bidPrice),
    bidVolume: 0, // Placeholder, as we don't have actual bidVolume data
    ask: parseFloat(askPrice),
    askVolume: 0, // Placeholder, as we don't have actual askVolume data
    vwap: 0, // Placeholder, as we don't have actual vwap data
    open: parseFloat(previousClosePrice),
    close: parseFloat(lastTradedPrice),
    last: parseFloat(lastTradedPrice),
    previousClose: parseFloat(previousClosePrice),
    change: parseFloat(lastTradedPrice) - parseFloat(previousClosePrice),
    percentage: parseFloat(changeFromPrevious),
    average: (parseFloat(lastTradedPrice) + parseFloat(previousClosePrice)) / 2,
    quoteVolume: parseFloat(quoteVolume),
    baseVolume: parseFloat(baseVolume),
    exchangeId: 'valr',
  }

  return cryptoData
}
// Type for the function to fetch data from exchanges
const ccxtCryptoData: (
  exchangeId: string,
  pairs: string[]
) => Promise<CryptoDataServer[]> = async (
  exchangeId: string,
  pairs: string[]
) => {
  try {
    const exchangeClass: any = ccxt[exchangeId as keyof typeof ccxt]

    if (exchangeClass) {
      let exchangeInstance: Exchange = new exchangeClass()

      // Create an array of promises using map
      const tickerPromises = pairs.map((pair) =>
        exchangeInstance.fetchTicker(pair).catch((error) => {
          console.error(
            `Error fetching ticker for pair ${pair} on ${exchangeId}:`,
            error
          )
          return null
        })
      )

      // Await all promises
      const tickerResults = await Promise.all(tickerPromises)

      // Filter out null values (errors) and map over remaining tickers to add exchangeId
      const tickersWithExchangeId = tickerResults
        .filter((ticker) => ticker !== null)
        .map((ticker) => ({
          ...ticker,
          exchangeId: exchangeId,
        }))

      return tickersWithExchangeId as CryptoDataServer[]
    }
    return []
  } catch (error) {
    console.error(`Error fetching tickers from ${exchangeId}:`, error)
    return []
  }
}

// Assuming CryptoDataServer is an already defined interface
function convertBitoasisToCctxTicker(data: any): CryptoDataServer {
  const {
    pair,
    bid,
    ask,
    open_price,
    last_price,
    daily_low,
    daily_high,
    daily_change,
    daily_percentage_change,
  } = data.ticker

  const cryptoData: CryptoDataServer = {
    symbol: pair.replace('-', '/'),
    info: data,
    timestamp: new Date().getTime(), // Assuming current timestamp since 'created' is not provided
    datetime: new Date().toISOString(), // Assuming current datetime in ISO format
    high: parseFloat(daily_high),
    low: parseFloat(daily_low),
    bid: parseFloat(bid),
    bidVolume: 0, // Placeholder, as we don't have actual bidVolume data
    ask: parseFloat(ask),
    askVolume: 0, // Placeholder, as we don't have actual askVolume data
    vwap: 0, // Placeholder, as we don't have actual vwap data
    open: parseFloat(open_price),
    close: parseFloat(last_price),
    last: parseFloat(last_price),
    previousClose: parseFloat(open_price), // Assuming open as previous close
    change: parseFloat(daily_change),
    percentage: parseFloat(daily_percentage_change),
    average: (parseFloat(last_price) + parseFloat(open_price)) / 2,
    quoteVolume: 0, // Placeholder, as we don't have quoteVolume data
    baseVolume: 0, // Placeholder, as we don't have baseVolume data
    exchangeId: 'bitoasis', // Placeholder, as exchange ID is not provided
  }

  return cryptoData
}

function convertCryptoComToCcxtTicker(data: any): CryptoDataServer {
  // Assuming `data` is the response object received with the structure you provided.
  const tickerData = data.result.data[0] // assuming we're taking the first ticker data

  const cryptoData: CryptoDataServer = {
    symbol: tickerData.i.replace('-PERP', '').replace('USD', '/USDT'), // Replace depending on actual pair format
    info: tickerData,
    timestamp: tickerData.t,
    datetime: new Date(tickerData.t).toISOString(),
    high: parseFloat(tickerData.h),
    low: parseFloat(tickerData.l),
    bid: parseFloat(tickerData.b),
    bidVolume: undefined, // Not provided in data
    ask: parseFloat(tickerData.k),
    askVolume: undefined, // Not provided in data
    vwap: undefined, // Not provided in data (vv might be the total value, but that's not clear)
    open: undefined, // Not provided in data
    close: parseFloat(tickerData.a),
    last: parseFloat(tickerData.a),
    previousClose: undefined, // Not provided in data, and can't deduce
    change: undefined, // Not provided directly, 'c' seems like a change percentage
    percentage: parseFloat(tickerData.c) * 100,
    average: (parseFloat(tickerData.h) + parseFloat(tickerData.l)) / 2,
    quoteVolume: parseFloat(tickerData.vv), // Assuming 'vv' to be the quote volume
    baseVolume: parseFloat(tickerData.v), // Assuming 'v' to be the base volume
    exchangeId: 'crypto.com', // Replace with the actual exchange ID
  }

  return cryptoData
}

const otherCryptoData: (
  exchangeId: string,
  pairs: string[]
) => Promise<CryptoDataServer[]> = async (
  exchangeId: string,
  pairs: string[]
) => {
  let getRequestUrl: (p: string) => string
  let convertRespToCctxTicker: (data: any) => CryptoDataServer

  switch (exchangeId) {
    case 'valr':
      getRequestUrl = (p: string) =>
        `https://api.valr.com/v1/public/${p.replace('/', '')}/marketsummary`
      convertRespToCctxTicker = convertValrToCctxTicker
      break
    case 'bitoasis':
      getRequestUrl = (p: string) =>
        `https://api.bitoasis.net/v1/exchange/ticker/${p.replace('/', '-')}`
      convertRespToCctxTicker = convertBitoasisToCctxTicker
      break
    case 'crypto.com':
      getRequestUrl = (p: string) =>
        `https://api.crypto.com/exchange/v1/public/get-tickers?instrument_name=${p.replace('/USDT', '')}USD-PERP`
      convertRespToCctxTicker = convertCryptoComToCcxtTicker
      break
    default:
      return []
  }

  // Create an array of promises
  const promises = pairs.map((pair) =>
    axios
      .get(getRequestUrl(pair))
      .then((response) => convertRespToCctxTicker(response.data))
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          console.error('Axios error:', error.message)
        } else {
          console.error('Unexpected error:', error)
        }
        return null // Skip this pair in case of error
      })
  )

  // Wait for all the promises to settle
  const results = await Promise.all(promises)

  // Filter out `null` results due to errors
  const cryptoDatas = results.filter((result) => result !== null)

  return cryptoDatas as CryptoDataServer[]
}

const fetchExchangeData: (
  exchangeId: string,
  pairs: string[]
) => Promise<CryptoDataServer[]> = async (exchangeId, pairs) => {
  const ccxtExchanges = ['kraken', 'binance', 'bybit', 'okx']
  const otherExchanges = ['valr', 'bitoasis', 'crypto.com']
  let cryptoDatas: CryptoDataServer[] = []
  //switch on exchanges

  if (ccxtExchanges.includes(exchangeId)) {
    cryptoDatas = await ccxtCryptoData(exchangeId, pairs)
    return cryptoDatas
  }

  if (otherExchanges.includes(exchangeId)) {
    cryptoDatas = await otherCryptoData(exchangeId, pairs)
    return cryptoDatas
  }

  return []
}

// Hook to fetch the crypto data
export const getCryptoData = async (
  exchanges: string[],
  cryptoPairs: string[]
): Promise<CryptoDataServer[]> => {
  const fetchCryptoDataPromises = exchanges.map((exchange) =>
    fetchExchangeData(exchange, cryptoPairs).catch((error) => {
      console.error(`Error fetching data for exchange ${exchange}:`, error)
      return [] // Return an empty array if an error occurs
    })
  )

  // Wait for all promises to settle
  const exchangeDataArrays: CryptoDataServer[][] = await Promise.all(
    fetchCryptoDataPromises
  )

  // Flatten the array of arrays into a single array of CryptoDataServer
  const cryptoData: CryptoDataServer[] = exchangeDataArrays.flat()

  return cryptoData
}
