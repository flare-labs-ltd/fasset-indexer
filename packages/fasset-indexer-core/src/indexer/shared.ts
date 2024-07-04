import { EntityManager } from "@mikro-orm/knex"
import { AgentVaultInfo } from "../database/entities/state/agent"
import { AgentVault } from "../database/entities/agent"
import { UntrackedAgentVault, Var } from "../database/entities/state/var"
import type { Context } from "../context"
import type { AgentInfo } from "../../chain/typechain/AssetManager"


export async function setVar(em: EntityManager, key: string, value?: string): Promise<void> {
  const vr = await em.findOne(Var, { key })
  if (!vr) {
    const vr = new Var(key, value)
    em.persist(vr)
  } else {
    vr.value = value
  }
  await em.flush()
}

export async function getVar(em: EntityManager, key: string): Promise<Var | null> {
  return await em.findOne(Var, { key })
}

export async function isUntrackedAgentVault(em: EntityManager, address: string): Promise<boolean> {
  const untracked = await em.fork().findOne(UntrackedAgentVault, { address })
  return untracked !== null
}

export async function updateAgentVaultInfo(context: Context, em: EntityManager, agentVault: string): Promise<void> {
  const assetManager = context.getAssetManagerContract("FTestXRP")
  const agentVaultInfo: AgentInfo.InfoStructOutput = await assetManager.getAgentInfo(agentVault)
  const agentVaultInfoEntity = await agentInfoToEntity(em, agentVaultInfo, agentVault)
  await em.upsert(agentVaultInfoEntity)
}

async function agentInfoToEntity(em: EntityManager, agentInfo: AgentInfo.InfoStructOutput, vaultAddress: string): Promise<AgentVaultInfo> {
  const agentVault = await em.findOneOrFail(AgentVault, { address: { hex: vaultAddress }})
  return new AgentVaultInfo(
    agentVault,
    Number(agentInfo.status),
    agentInfo.publiclyAvailable,
    agentInfo.freeCollateralLots,
    agentInfo.totalVaultCollateralWei,
    agentInfo.freeVaultCollateralWei,
    agentInfo.vaultCollateralRatioBIPS,
    agentInfo.totalPoolCollateralNATWei,
    agentInfo.freePoolCollateralNATWei,
    agentInfo.poolCollateralRatioBIPS,
    agentInfo.totalAgentPoolTokensWei,
    agentInfo.freeAgentPoolTokensWei,
    agentInfo.mintedUBA,
    agentInfo.reservedUBA,
    agentInfo.redeemingUBA,
    agentInfo.poolRedeemingUBA,
    agentInfo.dustUBA,
    Number(agentInfo.ccbStartTimestamp),
    Number(agentInfo.liquidationStartTimestamp),
    agentInfo.maxLiquidationAmountUBA,
    agentInfo.liquidationPaymentFactorPoolBIPS,
    agentInfo.liquidationPaymentFactorPoolBIPS,
    agentInfo.underlyingBalanceUBA,
    agentInfo.requiredUnderlyingBalanceUBA,
    agentInfo.freeUnderlyingBalanceUBA
  )
}