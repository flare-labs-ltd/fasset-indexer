import { IndexerRunner } from "fasset-indexer-core"
import { BtcConfigLoader } from "../config/config"
import { BtcContext } from "../context"
import { BtcIndexer } from "../indexer/indexer"


async function runIndexer(): Promise<void> {
  const config = new BtcConfigLoader()
  const context = await BtcContext.create(config)
  const indexer = new BtcIndexer(context)
  const runner = new IndexerRunner(indexer, 'doge')
  await runner.run(config.btcMinBlockNumber)
}

runIndexer()