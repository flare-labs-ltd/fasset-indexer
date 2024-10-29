import { Context } from "../context/context"
import { config } from "../config/config"
import { EventIndexerParallelPopulation } from "../indexer-evm/migrations/indexer-parallel-population"
import { ERC20Transfer } from "../database/entities/events/token"
import { raw } from "@mikro-orm/core"
import { TokenBalance } from "../database/entities/state/balance"


async function setTokenBalances(context: Context) {
  await context.orm.em.transactional(async em => {
    const plus = await em.createQueryBuilder(ERC20Transfer, 't')
      .select(['l.address', 't.to', raw('SUM(t.value) as balance')])
      .join('evmLog', 'l')
      .groupBy(['l.address', 't.to'])
      .execute()
    for (const p of plus) {
      // @ts-ignore
      const balance = new TokenBalance(p.address_id, p.to, p.balance)
      em.persist(balance)
    }
    const minus = await em.createQueryBuilder(ERC20Transfer, 't')
      .select(['l.address', 't.from', raw('SUM(t.value) as balance')])
      .join('evmLog', 'l')
      .groupBy(['l.address', 't.from'])
      .execute()
    for (const m of minus) {
      // @ts-ignore
      let balance = await em.findOne(TokenBalance, { token: m.address_id, holder: m.from })
      if (!balance) {
        // @ts-ignore
        balance = new TokenBalance(m.address_id, m.from, -m.balance)
      }
      em.persist(balance)
    }
  })
}

async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexerParallelPopulation(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await setTokenBalances(context)
  //await indexer.run()
}

runIndexer()