import { FAssetType } from "../database/entities/events/_bound"
import { CollateralTypeAdded } from "../database/entities/events/token"
import { FtsoPrice } from "../database/entities/state/price"
import type { EntityManager } from "@mikro-orm/core"


export function fassetDecimals(fasset: FAssetType): number {
  if (fasset == FAssetType.FXRP) {
    return 6
  } else if (fasset == FAssetType.FBTC) {
    return 8
  } else {
    throw new Error(`Unknown fasset type: ${fasset}`)
  }
}

export async function fassetToUsd(em: EntityManager, amountUBA: bigint, fasset: FAssetType): Promise<[bigint, bigint]> {
  const fassetToken = await em.findOneOrFail(CollateralTypeAdded, { fasset: fasset })
  const fassetPrice = await em.findOneOrFail(FtsoPrice, { symbol: fassetToken.assetFtsoSymbol })
  const fassetTokenDecimals = fassetDecimals(fasset)
  return [
    amountUBA * fassetPrice.price,
    BigInt(10) ** BigInt(fassetPrice.decimals + fassetTokenDecimals)
  ]
}
