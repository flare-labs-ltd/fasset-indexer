import { resolve } from "path"
import type { ContractInfo } from "./interface"

export function getContractInfo(chain: string, file?: string): ContractInfo[] {
  if (file !== undefined) {
    return require(resolve(file))
  }
  return require(`../../chain/${chain}.json`)
}