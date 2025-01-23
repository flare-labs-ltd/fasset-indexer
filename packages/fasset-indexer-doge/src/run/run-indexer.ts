import { DogeConfigLoader } from "../config/config"
import { DogeContext } from "../context"
import { DogeIndexer } from "../indexer/indexer"
import { IndexerRunner } from "fasset-indexer-core"
import { DOGE_START_INDEX_BLOCK } from "../config/constants"


function basicAuthHeader(user: string, pass: string): string {
  return Buffer.from(`${user}:${pass}`).toString()
}

async function runIndexer(start?: number): Promise<void> {
  const config = new DogeConfigLoader()
  const context = await DogeContext.create(config)
  const indexer = new DogeIndexer(context)
  const runner = new IndexerRunner(indexer, 'doge-indexer')
  await runner.run(start)
}

runIndexer(DOGE_START_INDEX_BLOCK)