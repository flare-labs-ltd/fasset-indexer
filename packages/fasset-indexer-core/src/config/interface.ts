import type { OrmOptions } from "../database/interface"


export interface IUserDatabaseConfig {
  dbType: "sqlite" | "postgres"
  dbName: string
  dbHost?: string
  dbPort?: number
  dbUser?: string
  dbPass?: string
}

export interface IUserConfig extends IUserDatabaseConfig {
  chain: string
  rpcUrl: string
  apiKey?: string
  addressesJson?: string
  minBlockNum?: number
}

export interface IConfig {
  chain: string
  rpc: {
    url: string
    apiKey?: string
  }
  db: OrmOptions
  addressesJson?: string
  minBlockNum?: number
}