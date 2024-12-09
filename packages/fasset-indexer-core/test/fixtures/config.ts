import { resolve } from "path"
import { expandUserConfig } from "../../src/config/utils"


export const CONFIG = expandUserConfig({
    chain: 'coston',
    dbType: 'sqlite',
    dbName: resolve("fasset-open-beta-monitor.test.db"),
    rpcUrl: '',
})