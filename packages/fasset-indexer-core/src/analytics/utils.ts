import { FAssetType } from "../shared"
import { CollateralTypeAdded } from "../database/entities/events/token"
import { FtsoPrice } from "../database/entities/state/price"
import type { EntityManager } from "@mikro-orm/core"


export function fassetDecimals(fasset: FAssetType): number {
  if (fasset == FAssetType.FXRP) {
    return 6
  } else if (fasset == FAssetType.FBTC) {
    return 8
  } else if (fasset == FAssetType.FDOGE) {
    return 8
  } else if (fasset == FAssetType.FLTC) {
    return 8
  } else if (fasset == FAssetType.FALG) {
    return 6
  } else {
    throw new Error(`Decimals not known for fasset ${FAssetType[fasset]}`)
  }
}

export async function fassetToUsdPrice(em: EntityManager, fasset: FAssetType): Promise<[mul: bigint, div: bigint]> {
  if (fasset == FAssetType.FSIMCOINX || fasset == FAssetType.FDOGE || fasset == FAssetType.FLTC || fasset == FAssetType.FALG) {
    return [ BigInt(0), BigInt(1) ]
  }
  const fassetToken = await em.findOneOrFail(CollateralTypeAdded, { fasset })
  const fassetPrice = await em.findOneOrFail(FtsoPrice, { symbol: fassetToken.assetFtsoSymbol })
  const fassetTokenDecimals = fassetDecimals(fasset)
  return [ fassetPrice.price, BigInt(10) ** BigInt(fassetPrice.decimals + fassetTokenDecimals) ]
}
