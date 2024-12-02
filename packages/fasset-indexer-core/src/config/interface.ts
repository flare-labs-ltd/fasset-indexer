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
  flrRpcUrl: string
  flrApiKey?: string
  minBlockNum?: number
}

export interface IConfig {
  flrRpc: {
    url: string
    apiKey?: string
  }
  db: OrmOptions
  ignoreEvents?: string[]
  minBlockNum?: number
}