import { ConfigLoader } from "fasset-indexer-core/config"

export class DogeConfigLoader extends ConfigLoader {

  get dogeRpcUrl(): string {
    return this.required('DOGE_RPC_URL')
  }

  get dogeRpcApiKey(): string | undefined {
    return process.env.DOGE_RPC_API_KEY
  }

  get dogeRpcAuth(): string | undefined {
    return process.env.DOGE_RPC_AUTH
  }
}