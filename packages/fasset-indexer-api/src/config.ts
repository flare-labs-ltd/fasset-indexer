import "dotenv/config"
import type { ORM } from "fasset-indexer-core"

export type DatabaseConfig = {
  orm: ORM
  chain: string
  addressesJson?: string
}

interface ApiConfig {
  addressesJson?: string
  port: number
  rootPath?: string
}

function defaultUndefinedNum(v: string | undefined, d: number): number {
  if (v == null) {
    return d
  }
  return Number(v)
}

export const apiConfig: ApiConfig = {
  port: defaultUndefinedNum(process.env.API_PORT, 3000),
  rootPath: process.env.API_ROOT_PATH,
  addressesJson: process.env.ADDRESSES_JSON
}
