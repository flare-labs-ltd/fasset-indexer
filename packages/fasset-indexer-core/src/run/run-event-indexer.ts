import { Context } from "../context/context"
import { config } from "../config/config"
import { EventIndexer } from "../indexer-evm/evm-indexer"
import { ERC20Transfer } from "../database/entities/events/token"
import { raw } from "@mikro-orm/core"
import { TokenBalance } from "../database/entities/state/balance"
import { EvmAddress } from "../database/entities/address"

async function setTokenBalances(context: Context) {
  const testAcc = '0xe2465d57a8719B3f0cCBc12dD095EFa1CC55A997'
  const tokenAcc = '0x51B1ac96027e55c29Ece8a6fD99DdDdd01F22F6c'
  const testAccId = await context.orm.em.fork().findOneOrFail(EvmAddress, { hex: testAcc })
  const tokenAccId = await context.orm.em.fork().findOneOrFail(EvmAddress, { hex: tokenAcc })
  await context.orm.em.createQueryBuilder(TokenBalance).delete().execute()
  const em = context.orm.em.fork()
  const plus = await em.createQueryBuilder(ERC20Transfer, 't')
    .select(['l.address_id as token_id', 't.to_id as user_id', raw('SUM(t.value) as value')])
    .join('t.evmLog', 'l')
    .join('l.address', 'la')
    .where({ 'la.hex': { $in: context.fassetTokens }})
    //.where({ 'l.address': tokenAccId, 't.to': testAccId })
    .groupBy(['l.address', 't.to'])
    .execute()
  let i = 0
  for (const { token_id, user_id, value } of plus as any) {
    i += 1
    const minus = await em.createQueryBuilder(ERC20Transfer, 't')
      .select([raw('SUM(t.value) as value')])
      .join('t.evmLog', 'l')
      .where({ 'l.address': token_id, 't.from': user_id })
      .execute()
    const total = BigInt(value) - BigInt(minus[0]?.value || 0)
    if (Math.floor(i % 100) == 0) {
      console.log(i, plus.length)
    }
    //console.log(i++, token_id, user_id, ':', value, '+', minus[0].value, '=', total)
    const balance = new TokenBalance(token_id, user_id, total)
    await em.persistAndFlush(balance)
  }
}

async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexer(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await setTokenBalances(context)

  await indexer.run()
}

runIndexer()