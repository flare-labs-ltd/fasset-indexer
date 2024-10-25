import type { FAsset } from "../shared"

export type TimeSeries = { [fasset in Partial<FAsset>]: { index: number, start: number, end: number, value: bigint }[] }

export type AggregateTimeSeries = { index: number, start: number, end: number, value: bigint }[]

export type PoolScore = { [fasset in Partial<FAsset>]: { pool: string, score: bigint }[] }