import { resolve } from "path"
import { expandUserConfig } from "../../src/config/load"


export const CONFIG = expandUserConfig({
    chain: 'coston',
    dbType: 'sqlite',
    dbName: resolve("fasset-open-beta-monitor.test.db"),
    rpcUrl: '',
})