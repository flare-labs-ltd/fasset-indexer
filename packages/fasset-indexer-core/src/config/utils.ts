import "dotenv/config"
import { resolve } from "path"
import { defineConfig } from "@mikro-orm/core"
import { SqliteDriver } from '@mikro-orm/sqlite'
import { PostgreSqlDriver } from "@mikro-orm/postgresql"
import { abi as ASSET_MANAGER_ABI } from '../../chain/artifacts/AssetManager.json'
import { abi as ASSET_MANAGER_EVENTS_ABI } from '../../chain/artifacts/AMEvents.json'
import CONTRACTS from '../../chain/coston.json'
import type { OrmOptions } from '../database/interface'
import type { IUserConfig, IUserDatabaseConfig, IConfig } from "./interface"


const IGNORE_EVENTS = ['CurrentUnderlyingBlockUpdated']

type ValidationOptions = {
  required?: boolean
  isOneOf?: string[]
}

export function validateEnvVar(name: string, options: ValidationOptions): void {
  if (options.required) {
    if (!process.env[name]) {
      throw new Error(`environment variable ${name} is required`)
    }
  }
  if (options.isOneOf) {
    if (!options.isOneOf.includes(process.env[name]!)) {
      throw new Error(`environment variable ${name} must be one of ${options.isOneOf.join(", ")}`)
    }
  }
}

export function validateEnv(): void {
  validateEnvVar('RPC_URL', { required: true })
  validateEnvVar('DB_TYPE', { isOneOf: ['sqlite', 'postgres'] })
  validateEnvVar('DB_NAME', { required: true })
}

export function getUserDatabaseConfig(): IUserDatabaseConfig {
  let dbName = process.env.DB_NAME!
  if (process.env.DB_TYPE === "sqlite") {
    dbName = resolve(dbName)
  }
  return {
    dbType: process.env.DB_TYPE as 'sqlite' | 'postgres',
    dbName: dbName,
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT === undefined ? undefined : parseInt(process.env.DB_PORT),
    dbUser: process.env.DB_USER,
    dbPass: process.env.DB_PASSWORD
  }
}

export function getUserConfig(): IUserConfig {
  validateEnv()
  return {
    ...getUserDatabaseConfig(),
    rpcUrl: process.env.RPC_URL!,
    apiKey: process.env.RPC_API_KEY
  }
}

export function getOrmConfig(config: IUserDatabaseConfig): OrmOptions {
  return defineConfig({
    driver: ((config.dbType === "sqlite") ? SqliteDriver : PostgreSqlDriver) as any,
    dbName: config.dbName,
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPass
  })
}

export function expandUserConfig(config: IUserConfig): IConfig {
  return {
    rpc: {
      url: config.rpcUrl,
      apiKey: config.apiKey,
    },
    contracts: {
      addresses: CONTRACTS,
      abis: {
        events: ASSET_MANAGER_EVENTS_ABI,
        assetManager: ASSET_MANAGER_ABI,
      }
    },
    db: getOrmConfig(config),
    ignoreEvents: IGNORE_EVENTS
  }
}