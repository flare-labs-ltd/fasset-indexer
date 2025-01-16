import { raw } from "@mikro-orm/core"
import type { SelectQueryBuilder } from "@mikro-orm/knex"
import type { ORM } from "../../database/interface"
import { CollateralPoolEntered, CollateralPoolExited } from "../../database/entities/events/collateral-pool"
import { MintingExecuted } from "../../database/entities/events/minting"
import { RedemptionRequested } from "../../database/entities/events/redemption"
import { LiquidationPerformed } from "../../database/entities/events/liquidation"

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

  protected async backedFAssets(vault: string): Promise<bigint> {
    const em = this.orm.em.fork()
    const minted = await em.createQueryBuilder(MintingExecuted, 'me')
      .join('me.collateralReserved', 'cr')
      .join('cr.agentVault', 'av')
      .join('av.address', 'ava')
      .where({ 'ava.hex': vault })
      .select(raw('SUM(cr.value_uba) as minted_uba'))
      .execute() as { minted_uba: string }[]
    if (minted.length === 0) return BigInt(0)
    const redeemed = await em.createQueryBuilder(RedemptionRequested, 'rr')
      .join('rr.agentVault', 'av')
      .join('av.address', 'ava')
      .where({ 'ava.hex': vault })
      .select(raw('SUM(rr.value_uba) as redeemed_uba'))
      .execute() as { redeemed_uba: string }[]
    const liquidated = await em.createQueryBuilder(LiquidationPerformed, 'lp')
      .join('lp.agentVault', 'av')
      .join('av.address', 'ava')
      .where({ 'ava.hex': vault })
      .select(raw('SUM(lp.value_uba) as liquidated_uba'))
      .execute() as { liquidated_uba: string }[]
    return BigInt(minted[0]?.minted_uba ?? 0)
      - BigInt(redeemed[0]?.redeemed_uba ?? 0)
      - BigInt(liquidated[0]?.liquidated_uba ?? 0)
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