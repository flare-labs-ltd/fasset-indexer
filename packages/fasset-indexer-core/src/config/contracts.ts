import "dotenv/config"
import { resolve } from "path"

const chain = process.env.CHAIN || 'coston'
const defaultPath = `./packages/fasset-indexer-core/chain/${chain}.json`
const addressesJsonPath = resolve(process.env.ADDRESSES_JSON || defaultPath)
const addressesJson = require(addressesJsonPath)

export const contracts: {
  addresses: {
    name: string
    contractName: string
    address: string
  }[]
} = {
  addresses: addressesJson
}