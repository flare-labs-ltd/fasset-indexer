import { Context } from "../context/context"
import { config } from "../config/config"
import { EventIndexer } from "../indexer-evm/evm-indexer"
import { ERC20Transfer } from "../database/entities/events/token"
import { raw } from "@mikro-orm/core"
import { TokenBalance } from "../database/entities/state/balance"

async function setTokenBalances(context: Context) {
  /* const testAcc = '0xe2465d57a8719B3f0cCBc12dD095EFa1CC55A997'
  const tokenAcc = '0x51B1ac96027e55c29Ece8a6fD99DdDdd01F22F6c' */
  await context.orm.em.createQueryBuilder(TokenBalance).delete().execute()
  const em = context.orm.em.fork()
  const plus = await em.createQueryBuilder(ERC20Transfer, 't')
    .select(['a.id as user_id', 'la.id as token_id', 'a.hex as user', 'la.hex as token', raw('SUM(t.value) as value')])
    .join('evmLog', 'l')
    .join('t.to', 'a')
    .join('l.address', 'la')
    //.where({ 'a.hex': testAcc, 'la.hex': tokenAcc })
    .groupBy(['l.address', 't.to', 'a.id', 'la.id'])
    .execute()
  for (const { token_id, user_id, token, user, value } of plus as any) {
    //console.log('plusing token', token, 'to', user, 'value', value)
    const balance = new TokenBalance(token_id, user_id, BigInt(value))
    await em.persistAndFlush(balance)
  }
  const minus = await em.createQueryBuilder(ERC20Transfer, 't')
    .select(['a.id as user_id', 'la.id as token_id', 'a.hex as user', 'la.hex as token', raw('SUM(t.value) as value')])
    .join('evmLog', 'l')
    .join('t.from', 'a')
    .join('l.address', 'la')
    //.where({ 'a.hex': testAcc, 'la.hex': tokenAcc })
    .groupBy(['l.address', 't.from', 'a.hex', 'la.hex'])
    .execute()
  for (const { token_id, user_id, token, user, value } of minus as any) {
    //console.log('minusing token', token, 'from', user, 'value', value)
    let balance = await em.findOne(TokenBalance, { token: token_id, holder: user_id })
    if (balance === null) {
      balance = new TokenBalance(token_id, user_id, BigInt(0))
    }
    balance.amount -= BigInt(value)
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