import { FAssetType } from "../../shared"
import { CollateralTypeAdded } from "../../database/entities/events/token"
import { FtsoPrice } from "../../database/entities/state/price"
import { PRICE_FACTOR } from "../../config/constants"
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
  if (fasset == FAssetType.FSIMCOINX || fasset == FAssetType.FLTC || fasset == FAssetType.FALG) {
    return [ BigInt(0), BigInt(1) ]
  }
  const fassetToken = await em.findOneOrFail(CollateralTypeAdded, { fasset })
  const fassetPrice = await em.findOneOrFail(FtsoPrice, { symbol: fassetToken.assetFtsoSymbol })
  const fassetTokenDecimals = fassetDecimals(fasset)
  return [ fassetPrice.price, BigInt(10) ** BigInt(fassetPrice.decimals + fassetTokenDecimals) ]
}

export async function tokenToUsdPrice(em: EntityManager, address: string): Promise<[mul: bigint, div: bigint]> {
  const token = await em.findOneOrFail(CollateralTypeAdded, { address: { hex: address }})
  const price = await em.findOneOrFail(FtsoPrice, { symbol: token.tokenFtsoSymbol })
  return [ price.price, BigInt(10) ** BigInt(price.decimals + token.decimals) ]
}

export async function fassetToUsd(em: EntityManager, fasset: FAssetType, amount: bigint): Promise<bigint> {
  const [mul, div] = await fassetToUsdPrice(em, fasset)
  return PRICE_FACTOR * amount * mul / div
}

export async function tokenToUsd(em: EntityManager, address: string, amount: bigint): Promise<bigint> {
  const [mul, div] = await tokenToUsdPrice(em, address)
  return PRICE_FACTOR * amount * mul / div
}