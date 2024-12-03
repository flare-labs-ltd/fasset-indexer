
import { getVar, setVar } from "../utils"
import { Context } from "../context/context"
import { BLOCK_EXPLORERS, MIN_EVM_BLOCK_NUMBER_DB_KEY } from "../config/constants"
import type { JsonRpcApiProvider } from "ethers"


export async function ensureDatabaseIntegrity(context: Context): Promise<void> {
  const dbchain = await getVar(context.orm.em.fork(), 'chain')
  if (dbchain == null) {
    await markNewDatabase(context)
  } else if (dbchain.value !== context.config.chain) {
    throw new Error(`Database chain ${dbchain.value} does not match config chain ${context.config.chain}`)
  } else {
    const minblock = await getVar(context.orm.em.fork(), MIN_EVM_BLOCK_NUMBER_DB_KEY)
    if (minblock == null) {
      throw new Error(`Database missing minimum block number ${MIN_EVM_BLOCK_NUMBER_DB_KEY}`)
    }
  }
}

async function markNewDatabase(context: Context): Promise<void> {
  const envchain = context.config.chain
  let minblock = context.config.minBlockNum ?? null
  if (minblock == null) {
    const amc = context.getContractAddress('AssetManagerController')
    minblock = await getContractCreationBlock(context.provider, amc, envchain)
  }
  if (minblock == null) {
    throw new Error(`Could not find creation block for AssetManagerController in .env or on block explorer ${envchain}`)
  }
  await context.orm.em.transactional(async em => {
    await setVar(em, 'chain', envchain)
    await setVar(em, MIN_EVM_BLOCK_NUMBER_DB_KEY, minblock.toString())
  })
}

async function getContractCreationBlock(provider: JsonRpcApiProvider, address: string, chain: string): Promise<number | null> {
  const blockExplorer = BLOCK_EXPLORERS[chain as keyof typeof BLOCK_EXPLORERS]
  if (blockExplorer == null) return null
  const resp = await fetch(`${blockExplorer}/api/v2/addresses/${address}`)
  const json = await resp.json()
  const hash = json.creation_tx_hash
  const creation = await provider.getTransaction(hash)
  return creation?.blockNumber ?? null
}