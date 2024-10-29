import { FAssetType } from "../shared"
import { contracts } from "../config/contracts"


export class ContractLookup {
  static singleton: ContractLookup | null = null
  // caches
  private assetManagerToFAsset__cache: Map<string, FAssetType> = new Map()
  private fAssetToAssetManager__cache: Map<FAssetType, string> = new Map()
  private fAssetTokenToFAsset__cache: Map<string, FAssetType> = new Map()
  private fAssetToFAssetToken__cache: Map<FAssetType, string> = new Map()
  private isAssetManager__cache: Set<string> = new Set()
  private isFAssetToken__cache: Set<string> = new Set()
  // public
  public fassetTokens: string[] = []

  constructor() {
    if (ContractLookup.singleton !== null) {
      return ContractLookup.singleton
    }
    // populate caches for faster lookups
    this.populateFAssetTypeToAssetManagerCache()
    this.populateFAssetTypeToFAssetTokenCache()
    this.populateIsAssetManagerCache()
    this.populateIsFAssetTokenCache()
    this.fassetTokens = Array.from(this.isFAssetToken__cache)
    ContractLookup.singleton = this
  }

  isAssetManager(address: string): boolean {
    return this.isAssetManager__cache.has(address)
  }

  isFAssetToken(address: string): boolean {
    return this.isFAssetToken__cache.has(address)
  }

  assetManagerAddressToFAssetType(address: string): FAssetType {
    if (this.assetManagerToFAsset__cache.has(address)) {
      return this.assetManagerToFAsset__cache.get(address)!
    } else {
      throw new Error(`No FAsset found for address ${address}`)
    }
  }

  fAssetTypeToAssetManagerAddress(type: FAssetType): string {
    if (this.fAssetToAssetManager__cache.has(type)) {
      return this.fAssetToAssetManager__cache.get(type)!
    } else {
      throw new Error(`No AssetManager found for type ${type}`)
    }
  }

  fAssetAddressToFAssetType(address: string): FAssetType {
    if (this.fAssetTokenToFAsset__cache.has(address)) {
      return this.fAssetTokenToFAsset__cache.get(address)!
    } else {
      throw new Error(`No FAsset type found for address ${address}`)
    }
  }

  fAssetTypeToFAssetAddress(type: FAssetType): string {
    if (this.fAssetToFAssetToken__cache.has(type)) {
      return this.fAssetToFAssetToken__cache.get(type)!
    } else {
      throw new Error(`No FAsset token found for type ${type}`)
    }
  }

  getContractAddress(name: string): string {
    for (const contract of contracts.addresses) {
      if (contract.name === name)
        return contract.address
    }
    throw new Error(`Contract address not found for ${name}`)
  }

  protected populateFAssetTypeToAssetManagerCache(): void {
    for (const contract of contracts.addresses) {
      let fasset = null
      if (contract.name === 'AssetManager_FTestXRP') {
        fasset = FAssetType.FXRP
      } else if (contract.name === 'AssetManager_FTestBTC') {
        fasset = FAssetType.FBTC
      } else if (contract.name === 'AssetManager_FTestDOGE') {
        fasset = FAssetType.FDOGE
      } else if (contract.name === 'AssetManager_FSimCoinX') {
        fasset = FAssetType.FSIMCOINX
      } else {
        continue
      }
      this.assetManagerToFAsset__cache.set(contract.address, fasset)
      this.fAssetToAssetManager__cache.set(fasset, contract.address)
    }
  }

  protected populateFAssetTypeToFAssetTokenCache(): void {
    for (const contract of contracts.addresses) {
      let fasset = null
      if (contract.name === 'FTestXRP') {
        fasset = FAssetType.FXRP
      } else if (contract.name === 'FTestBTC') {
        fasset = FAssetType.FBTC
      } else if (contract.name === 'FTestDOGE') {
        fasset = FAssetType.FDOGE
      } else if (contract.name === 'FSimCoinX') {
        fasset = FAssetType.FSIMCOINX
      } else {
        continue
      }
      this.fAssetTokenToFAsset__cache.set(contract.address, fasset)
      this.fAssetToFAssetToken__cache.set(fasset, contract.address)
    }
  }

  protected populateIsAssetManagerCache(): void {
    for (const contract of contracts.addresses) {
      if (contract.name.startsWith('AssetManager_')) {
        this.isAssetManager__cache.add(contract.address)
      }
    }
  }

  protected populateIsFAssetTokenCache(): void {
    for (const contract of contracts.addresses) {
      if (contract.contractName === "FAssetProxy.sol") {
        this.isFAssetToken__cache.add(contract.address)
      }
    }
  }
}