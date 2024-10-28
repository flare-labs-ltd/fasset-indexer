import { abi as ASSET_MANAGER_ABI } from '../../chain/artifacts/IAssetManager.json'
import CONTRACTS from '../../chain/coston.json'

export const contracts = {
  addresses: CONTRACTS,
  abis: { assetManager: ASSET_MANAGER_ABI }
}