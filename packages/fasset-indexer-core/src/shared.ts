import { EVENTS } from "./config/constants"

export enum FAssetType { FXRP, FBTC, FDOGE, FLTC, FALG, FSIMCOINX }
export type FAsset = keyof typeof FAssetType

export const FASSETS = Object.keys(FAssetType).filter(([key]) => isNaN(Number(key))) as FAsset[]

export type FAssetIface = keyof typeof EVENTS
