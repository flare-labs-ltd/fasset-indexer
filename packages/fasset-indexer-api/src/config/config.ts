import { ConfigLoader } from "fasset-indexer-core/config/config"


export class ApiConfigLoader extends ConfigLoader {

  get port(): number {
    return parseInt(process.env.API_PORT ?? '3000')
  }

  get rootPath(): string | undefined {
    return process.env.API_ROOT_PATH
  }

}