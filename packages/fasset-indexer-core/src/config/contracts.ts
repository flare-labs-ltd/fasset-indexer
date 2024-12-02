import "dotenv/config"

const addressesJsonPath = process.env.ADDRESSES_JSON || '../../chain/coston.json'
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