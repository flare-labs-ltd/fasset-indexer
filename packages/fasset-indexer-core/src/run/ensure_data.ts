import { Context } from "../context/context"
import { AssetManagerSettings } from "../orm/entities"
import { FASSETS, FAssetType } from "../shared"


export async function ensureData(context: Context) {
  await ensureAssetManagerSettings(context)
}

async function ensureAssetManagerSettings(context: Context) {
  for (const _fasset of FASSETS) {
    const fasset = FAssetType[_fasset]
    if (!context.supportsFAsset(fasset)) continue
    await context.orm.em.transactional(async (em) => {
      let assetManagerSettings = await em.findOne(AssetManagerSettings, { fasset })
      if (assetManagerSettings == null) {
        const assetManagerAddress = context.fAssetTypeToAssetManagerAddress(fasset)
        const assetManager = context.getAssetManagerContract(assetManagerAddress)
        const settings = await assetManager.getSettings()
        assetManagerSettings = new AssetManagerSettings(fasset, settings.lotSizeAMG)
        em.persist(assetManagerSettings)
      }
    })
  }
}