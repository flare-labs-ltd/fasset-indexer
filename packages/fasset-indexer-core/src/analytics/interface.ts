import type { FAssetType } from "../database/entities/events/_bound"

export type TimeSeries = { [fasset in FAssetType]: { start: number, end: number, value: bigint }[] }