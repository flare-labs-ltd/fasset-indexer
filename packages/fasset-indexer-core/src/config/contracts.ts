import "dotenv/config"
import { resolve } from "path"

const chain = process.env.CHAIN || 'coston'
let addressesJson = require(`../../chain/${chain}.json`)

if (process.env.ADDRESSES_JSON !== undefined) {
  console.warn('Using ADDRESSES_JSON environment variable to load contracts')
  addressesJson = require(resolve(process.env.ADDRESSES_JSON))
}

export const contracts: {
  addresses: {
    name: string
    contractName: string
    address: string
  }[]
} = {
  addresses: addressesJson
}