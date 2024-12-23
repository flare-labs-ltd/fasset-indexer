import "dotenv/config"

let cacheFeed: Record<string, string> = {}
let cachePrice: Record<string, [bigint, number]> = {}
let cacheRoundId: number = 0

const dalUrl = process.env.DAL_URL!
const dalApiKey = process.env.DAL_API_KEY || ""

export async function getPriceFromDal(symbol: string, roundId: number): Promise<[bigint, number]> {
  if (roundId != cacheRoundId) {
    cacheFeed = await getFeedRecord(roundId)
    cachePrice = await getPriceRecord(roundId)
  }
  return cachePrice[symbol]
}

async function getPriceRecord(roundId: number): Promise<Record<string, [bigint, number]>> {
  const url = `${dalUrl}/api/v0/ftso/anchor-feeds-with-proof?voting_round_id=${roundId}`
  const data = { feed_ids: Object.values(cacheFeed) }
  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "x-apikey":  dalApiKey
    }
  })
  const json = await resp.json()
  const pdc = json.map((x: any) => [BigInt(x.body.value), Number(x.body.decimals)])
  const keys = Object.keys(cacheFeed)
  const ret: Record<string, [bigint, number]> = {}
  for (let i = 0; i < keys.length; i++) {
    ret[keys[i]] = pdc[i]
  }
  return ret
}

async function getFeedRecord(roundId: number): Promise<Record<string, string>> {
  const url = `${dalUrl}/api/v0/ftso/anchor-feed-names?voting_round_id=${roundId}`
  const resp = await fetch(url, { headers: {
    "Content-Type": "application/json",
    "x-apikey": dalApiKey
  }})
  const json = await resp.json()
  const ret = {} as any
  for (const pair of json) {
    const symbol = pair.feed_name.split('/')[0]
    ret[symbol] = pair.feed_id
  }
  return ret
}