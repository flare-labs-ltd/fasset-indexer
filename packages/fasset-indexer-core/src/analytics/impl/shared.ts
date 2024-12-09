import { raw } from "@mikro-orm/core"
import { CollateralPoolEntered, CollateralPoolExited } from "../../database/entities/events/collateral-pool"
import type { SelectQueryBuilder } from "@mikro-orm/knex"
import type { ORM } from "../../database/interface"

export abstract class SharedAnalytics {
  constructor(public readonly orm: ORM) {}

  protected async poolCollateralAt(pool?: string, user?: string, timestamp?: number): Promise<bigint> {
    const entered = await this.poolCollateralEnteredAt(pool, user, timestamp)
    if (entered === BigInt(0)) return BigInt(0)
    const exited = await this.poolCollateralExitedAt(pool, user, timestamp)
    return entered - exited
  }

  protected async poolCollateralEnteredAt(pool?: string, user?: string, timestamp?: number): Promise<bigint> {
    const enteredCollateral = await this.filterEnterOrExitQueryBy(
      this.orm.em.fork().createQueryBuilder(CollateralPoolEntered, 'cpe')
        .select([raw('sum(cpe.amount_nat_wei) as collateral')]),
      'cpe', pool, user, timestamp
    ).execute() as { collateral: bigint }[]
    return BigInt(enteredCollateral[0]?.collateral || 0)
  }

  protected async poolCollateralExitedAt(pool?: string, user?: string, timestamp?: number): Promise<bigint> {
    const exitedCollateral = await this.filterEnterOrExitQueryBy(
      this.orm.em.fork().createQueryBuilder(CollateralPoolExited, 'cpe')
        .select([raw('sum(cpe.received_nat_wei) as collateral')]),
      'cpe', pool, user, timestamp
    ).execute() as { collateral: bigint }[]
    return BigInt(exitedCollateral[0]?.collateral || 0)
  }

  protected filterEnterOrExitQueryBy<T extends object>(
    qb: SelectQueryBuilder<T>, alias: string,
    pool?: string, user?: string, timestamp?: number
  ): SelectQueryBuilder<T> {
    if (timestamp !== undefined || pool !== undefined) {
      qb = qb.join(`${alias}.evmLog`, 'el')
      if (timestamp !== undefined) {
        qb = qb
          .join('el.block', 'block')
          .where({ 'block.timestamp': { $lte: timestamp }})
      }
      if (pool !== undefined) {
        qb = qb
          .join('el.address', 'ela')
          .andWhere({ 'ela.hex': pool })
      }
    }
    if (user !== undefined) {
      qb = qb
        .join(`${alias}.tokenHolder`, 'th')
        .andWhere({ 'th.hex': user })
    }
    return qb
  }
}