import type { FAsset, FAssetType } from "../shared"

export type TimeSeries = { [fasset in Partial<FAsset>]: { index: number, start: number, end: number, value: bigint }[] }

export type AggregateTimeSeries = { index: number, start: number, end: number, value: bigint }[]

export type PoolScore = { [fasset in Partial<FAsset>]: { pool: string, score: bigint }[] }

export type TokenPortfolio = { token: string, balance: bigint }[]

export type ClaimedFees = { fasset: FAssetType, claimedUBA: bigint }[]

export type FAssetDiffs = { fasset: FAsset, amountBefore: bigint, amountAfter: bigint }[]