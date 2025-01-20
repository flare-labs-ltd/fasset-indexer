import { ContractInfo, getContractInfo } from "../config/contracts"
import { FAsset, FAssetType } from "../shared"
import { EventInterface } from "./events"


export class ContractLookup extends EventInterface {
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
  public contractInfos!: ContractInfo[]

  constructor(public readonly chain: string, file?: string) {
    if (ContractLookup.singleton !== null) {
      return ContractLookup.singleton
    }
    super()
    this.contractInfos = getContractInfo(chain, file)
    // populate caches for faster lookups
    this.populateFAssetTypeToAssetManagerCache()
    this.populateFAssetTypeToFAssetTokenCache()
    this.populateIsAssetManagerCache()
    this.populateIsFAssetTokenCache()
    this.fassetTokens = Array.from(this.isFAssetToken__cache)
    ContractLookup.singleton = this
  }

  supportsFAsset(fasset: FAssetType): boolean {
    return this.fAssetToAssetManager__cache.has(fasset)
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
    for (const contract of this.contractInfos) {
      if (contract.name === name)
        return contract.address
    }
    throw new Error(`Contract address not found for ${name}`)
  }

  protected populateFAssetTypeToAssetManagerCache(): void {
    for (const info of this.contractInfos) {
      let fasset = null
      if (info.name === `AssetManager_${this.FXRP}`) {
        fasset = FAssetType.FXRP
      } else if (info.name === `AssetManager_${this.FBTC}`) {
        fasset = FAssetType.FBTC
      } else if (info.name === `AssetManager_${this.FDOGE}`) {
        fasset = FAssetType.FDOGE
      } else if (info.name === `AssetManager_${this.FSIMCOINX}`) {
        fasset = FAssetType.FSIMCOINX
      } else {
        continue
      }
      this.assetManagerToFAsset__cache.set(info.address, fasset)
      this.fAssetToAssetManager__cache.set(fasset, info.address)
    }
  }

  protected populateFAssetTypeToFAssetTokenCache(): void {
    for (const contract of this.contractInfos) {
      let fasset = null
      if (contract.name === this.FXRP) {
        fasset = FAssetType.FXRP
      } else if (contract.name === this.FBTC) {
        fasset = FAssetType.FBTC
      } else if (contract.name === this.FDOGE) {
        fasset = FAssetType.FDOGE
      } else if (contract.name === this.FSIMCOINX) {
        fasset = FAssetType.FSIMCOINX
      } else {
        continue
      }
      this.fAssetTokenToFAsset__cache.set(contract.address, fasset)
      this.fAssetToFAssetToken__cache.set(fasset, contract.address)
    }
  }

  protected populateIsAssetManagerCache(): void {
    for (const contract of this.contractInfos) {
      if (contract.name.startsWith('AssetManager_')) {
        this.isAssetManager__cache.add(contract.address)
      }
    }
  }

  protected populateIsFAssetTokenCache(): void {
    for (const contract of this.contractInfos) {
      if (contract.contractName === "FAssetProxy.sol") {
        this.isFAssetToken__cache.add(contract.address)
      }
    }
  }

  protected get FXRP(): string {
    return this.chain === 'coston' || this.chain === 'coston2' ? 'FTestXRP' : 'FXRP'
  }
  protected get FDOGE(): string {
    return this.chain === 'coston' || this.chain === 'coston2' ? 'FTestDOGE' : 'FDOGE'
  }
  protected get FBTC(): string {
    return this.chain === 'coston' || this.chain === 'coston2' ? 'FTestBTC' : 'FBTC'
  }
  protected get FSIMCOINX(): string {
    return 'FSimCoinX'
  }

}