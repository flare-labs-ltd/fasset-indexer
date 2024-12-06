import type { Timespan } from "../interface"

const CALC_PRECISION = BigInt(1)

export function weightedAverage(timespan: Timespan<bigint>, T: number, d: number, N?: number): bigint {
  const fun = (t: bigint) => weight(Number(t), T, d)
  const weights = timespan.map(({ timestamp }) => BigInt(timestamp))
  const values = timespan.map(({ value }) => value)
  let wa = _weightedAverage(values, weights, fun)
  if (N !== undefined) {
    wa *= BigInt(timespan.length) / BigInt(N)
  }
  return wa
}

function _weightedAverage(values: bigint[], weights: bigint[], weightFun: (w: bigint) => bigint): bigint {
  if (values.length !== weights.length) {
    throw new Error("Values and weights must have the same length")
  }
  let mul = BigInt(0), div = BigInt(0)
  for (let i = 0; i < values.length; i++) {
    const weight = weightFun(weights[i])
    mul += weight * values[i]
    div += weight
  }
  return div > BigInt(0) ? CALC_PRECISION * mul / div : BigInt(0)
}

/**
 * This is a chosen weight function implementation.
 * It should give more weight to recent values.
 * @param t timestamp/weight
 * @param T latest time
 * @param d delta
 * @returns weight
 */
function weight(t: number, T: number, d: number): bigint {
  const w = BigInt(t - (T - d))
  return w * w
}