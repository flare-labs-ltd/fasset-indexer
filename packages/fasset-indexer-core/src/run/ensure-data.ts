import { Context } from "../context/context"
import { AssetManagerSettings } from "../orm/entities"
import { CoreVaultManagerSettings } from "../orm/entities/state/settings"
import { FASSETS, FAssetType } from "../shared"


export async function ensureData(context: Context) {
  await ensureAssetManagerSettings(context)
  await ensureCoreVaultManagerSettings(context)
}

async function ensureAssetManagerSettings(context: Context) {
  for (const _fasset of FASSETS) {
    const fasset = FAssetType[_fasset]
    if (!context.supportsFAsset(fasset)) continue
    await context.orm.em.transactional(async em => {
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

async function ensureCoreVaultManagerSettings(context: Context) {
  const fasset = FAssetType.FXRP
  await context.orm.em.transactional(async em => {
    let coreVaultManagerSettings = await em.findOne(CoreVaultManagerSettings, { fasset })
    if (coreVaultManagerSettings == null) {
      const coreVaultManagerAddress = context.fassetTypeToCoreVaultManagerAddress(fasset)
      const coreVaultManager = context.getCoreVaultManagerContract(coreVaultManagerAddress)
      const settings = await coreVaultManager.getSettings()
      coreVaultManagerSettings = new CoreVaultManagerSettings(fasset,
        settings._escrowAmount, settings._minimalAmount,
        Number(settings._escrowEndTimeSeconds), settings._fee
      )
      em.persist(coreVaultManagerSettings)
    }
  })
}