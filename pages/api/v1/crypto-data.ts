import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { CryptoDataServer, getCryptoData } from '@/utils/utilsServer'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (req.method === 'GET') {
   const pairs  = req.query['pairs[]'] as Array<string>;
   const exchanges = req.query['exchanges[]'] as Array<string>;
    
    const cryptoData : CryptoDataServer[] = await getCryptoData(exchanges , pairs)
    
    res.status(200).json( cryptoData )
  }  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
