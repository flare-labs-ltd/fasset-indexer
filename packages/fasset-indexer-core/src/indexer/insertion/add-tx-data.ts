import chalk from 'chalk'
import { sleep } from "../../utils"
import { AddressType } from "../../database/entities/address"
import { EvmLog } from "../../database/entities/logs"
import { findOrCreateEvmAddress } from "../shared"
import { Context } from "../../context"
import { MID_CHAIN_FETCH_SLEEP_MS } from "../../config/constants"


export async function addTransactionData(context: Context) {
  console.log(chalk.cyan('adding transaction data'))
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
      await sleep(MID_CHAIN_FETCH_SLEEP_MS / 2)
    })
  }
  console.log(chalk.cyan('finished adding transaction data'))
}