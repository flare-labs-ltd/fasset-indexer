import { EntityManager } from "@mikro-orm/knex"
import { AddressType, EvmAddress } from "../database/entities/address"
import { EvmTransaction } from "../database/entities/evm/transaction"
import { EvmBlock } from "../database/entities/evm/block"
import { AgentVault } from "../database/entities/agent"
import { AgentVaultInfo } from "../database/entities/state/agent"
import { UntrackedAgentVault, Var } from "../database/entities/state/var"
import type { Context } from "../context/context"
import type { AgentInfo } from "../../chain/typechain/IAssetManager"


export async function findOrCreateEvmAddress(em: EntityManager, address: string, type: AddressType): Promise<EvmAddress> {
  let evmAddress = await em.findOne(EvmAddress, { hex: address})
  if (!evmAddress) {
    evmAddress = new EvmAddress(address, type)
    em.persist(evmAddress)
  }
  return evmAddress
}

export async function findOrCreateEvmBlock(em: EntityManager, index: number, timestamp: number): Promise<EvmBlock> {
  let block = await em.findOne(EvmBlock, { index })
  if (!block) {
    block = new EvmBlock(index, timestamp)
    // do not persist - do not store unnecessary blocks of non-processed events
    // is ok - no two blocks will be processed during one event processing
  }
  return block
}

export async function findOrCreateEvmTransaction(
  em: EntityManager, hash: string, block: EvmBlock, index: number,
  source: EvmAddress, target?: EvmAddress
): Promise<EvmTransaction> {
  let transaction = await em.findOne(EvmTransaction, { hash: hash })
  if (!transaction) {
    transaction = new EvmTransaction(hash, block, index, source, target)
    // do not persist - do not store unnecessary transactions of non-processed events
    // is ok - no two transactions will be processed during one event processing
  }
  return transaction
}

export async function isUntrackedAgentVault(em: EntityManager, address: string): Promise<boolean> {
  const untracked = await em.fork().findOne(UntrackedAgentVault, { address })
  return untracked !== null
}

export async function updateAgentVaultInfo(context: Context, em: EntityManager, assetManager: string, agentVault: string): Promise<void> {
  const contract = context.getAssetManagerContract(assetManager)
  const agentVaultInfo: AgentInfo.InfoStructOutput = await contract.getAgentInfo(agentVault)
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