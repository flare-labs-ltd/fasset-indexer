import type { InterfaceAbi } from "ethers"
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
  rpcUrl: string
  apiKey?: string
}

export interface IConfig {
  rpc: {
    url: string
    apiKey?: string
  }
  contracts: {
    addresses: { name: string, address: string, contractName: string }[],
    abis: {
      assetManager: InterfaceAbi
    }
  }
  db: OrmOptions,
  ignoreEvents?: string[]
}