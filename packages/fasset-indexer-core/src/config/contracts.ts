import { resolve } from "path"

export type ContractInfo = {
  name: string
  contractName: string
  address: string
}

export function getContractInfo(chain: string, file?: string): ContractInfo[] {
  if (file !== undefined) {
    return require(resolve(file))
  }
  return require(`../../chain/${chain}.json`)
}