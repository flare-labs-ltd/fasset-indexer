import { Context } from "../../context"
import { AddressType } from "../../database/entities/address"
import { EvmLog } from "../../database/entities/logs"
import { findOrCreateEvmAddress } from "../shared"


export async function addTransactionData(context: Context) {
  const evmLogs = await context.orm.em.fork().find(EvmLog, { transactionSource: null })
  for (const evmLog of evmLogs) {
    await context.orm.em.fork().transactional(async (em) => {
      const transaction = await context.provider.getTransaction(evmLog.transaction)
      if (transaction === null) {
        throw new Error(`Failed to fetch transaction ${evmLog.transaction}`)
      }
      evmLog.transactionSource = await findOrCreateEvmAddress(em, transaction.from, AddressType.USER)
      if (transaction.to !== null) {
        evmLog.transactionTarget = await findOrCreateEvmAddress(em, transaction.to, AddressType.USER)
      }
      em.persist(evmLog)
    })
  }
  console.log('finished adding transaction data')
}