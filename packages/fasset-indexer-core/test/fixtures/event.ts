import { ORM } from "../../src"
import { EvmAddress, UnderlyingAddress } from "../../src/database/entities/address"
import { CollateralTypeAdded } from "../../src/database/entities/events/token"
import { AgentManager, AgentOwner, AgentVault } from "../../src/database/entities/agent"
import { CollateralReserved } from "../../src/database/entities/events/minting"
import { RedemptionRequested } from "../../src/database/entities/events/redemption"
import { FAssetType } from "../../src/database/entities/events/_bound"
import { randomChoice, randomHash, randomNativeAddress, randomNumber, randomString, randomUnderlyingAddress } from "./utils"
import { ASSET_MANAGERS, AGENT_SETTINGS, WNAT_TOKEN } from "./constants"
import type {
  AgentVaultCreatedEvent,
  CollateralTypeAddedEvent,
  AgentSettingChangedEvent,
  CollateralReservedEvent,
  AgentDestroyedEvent,
  SelfCloseEvent,
  MintingExecutedEvent,
  MintingPaymentDefaultEvent,
  CollateralReservationDeletedEvent,
  RedemptionRequestedEvent,
  RedemptionPerformedEvent,
  RedemptionDefaultEvent,
  RedemptionPaymentBlockedEvent,
  RedemptionPaymentFailedEvent,
  RedemptionRejectedEvent,
  RedemptionRequestIncompleteEvent,
  RedeemedInCollateralEvent,
  LiquidationStartedEvent,
  LiquidationPerformedEvent,
  FullLiquidationStartedEvent,
  LiquidationEndedEvent,
  AvailableAgentExitedEvent,
  AgentAvailableEvent,
  CurrentUnderlyingBlockUpdatedEvent,
  AgentPingEvent,
  AgentPingResponseEvent
} from "../../chain/typechain/IAssetManager"
import type { EnteredEvent, ExitedEvent } from "../../chain/typechain/ICollateralPool"
import type { TransferEvent } from "../../chain/typechain/ERC20"
import type { Event, EventArgs } from "../../src/indexer-evm/eventlib/event-scraper"


export class EventFixture {

  constructor(public readonly orm: ORM) {}

  async storeInitialAgents(fasset: FAssetType = FAssetType.FXRP): Promise<void> {
    await this.orm.em.fork().transactional(async (em) => {
      const managerAddress = new EvmAddress(randomNativeAddress(), 1)
      em.persist(managerAddress)
      const agentManager = new AgentManager(managerAddress, randomString(5), randomString(10), 'http://localhost:3000/awesome/pic.png')
      em.persist(agentManager)
      const ownerAddress = new EvmAddress(randomNativeAddress(), 1)
      const agentOwner = new AgentOwner(ownerAddress, agentManager)
      em.persist(agentOwner)
      const vaultAddress = new EvmAddress(randomNativeAddress(), 1)
      const underlyingVaultAddress = new UnderlyingAddress(randomUnderlyingAddress(), 1)
      const collateralPoolAddress = new EvmAddress(randomNativeAddress(), 1)
      const collateralPoolTokenAddress = new EvmAddress(randomNativeAddress(), 1)
      const agentVault = new AgentVault(
        fasset,
        vaultAddress, underlyingVaultAddress, collateralPoolAddress,
        collateralPoolTokenAddress, agentOwner, false
      )
      em.persist(agentVault)
    })
  }

  async generateEvent(name: string, source?: string): Promise<Event> {
    return {
      name: name,
      args: await this.argumentsFromEventName(name),
      blockNumber: randomNumber(1, 1e6),
      transactionIndex: randomNumber(1, 1e6),
      logIndex: randomNumber(1, 1e6),
      source: source ?? randomChoice(ASSET_MANAGERS),
      blockTimestamp: Date.now(),
      transactionHash: randomHash(),
      transactionSource: randomNativeAddress(),
      transactionTarget: randomNativeAddress()
    }
  }

  protected async generateCollateralTypeAdded(): Promise<CollateralTypeAddedEvent.OutputTuple> {
    return [
      BigInt(1),
      randomNativeAddress(),
      BigInt(randomNumber(5, 18)),
      true,
      randomChoice(['BTC', 'XRP', 'DOGE']),
      randomChoice(['USDC', 'USDT', 'ETH']),
      BigInt(randomNumber(14_000, 25_000)),
      BigInt(randomNumber(13_000, 14_000)),
      BigInt(randomNumber(25_000, 30_000))
    ]
  }

  protected async generateAgentVaultCreated(): Promise<AgentVaultCreatedEvent.OutputTuple> {
    const struct = {
      collateralPool: randomNativeAddress(),
      collateralPoolToken: randomNativeAddress(),
      underlyingAddress: randomUnderlyingAddress(),
      vaultCollateralToken: await this.getRandomCollateralType(),
      poolWNatToken: WNAT_TOKEN,
      feeBIPS: BigInt(randomNumber(10, 9999)),
      poolFeeShareBIPS: BigInt(randomNumber(10, 9999)),
      mintingVaultCollateralRatioBIPS: BigInt(randomNumber(15_000, 20_000)),
      mintingPoolCollateralRatioBIPS: BigInt(randomNumber(14_000, 19_000)),
      buyFAssetByAgentFactorBIPS: BigInt(randomNumber(9000, 11000)),
      poolExitCollateralRatioBIPS: BigInt(randomNumber(14_000, 25_000)),
      poolTopupCollateralRatioBIPS: BigInt(randomNumber(10_000, 13_000)),
      poolTopupTokenPriceFactorBIPS: BigInt(randomNumber(10_000, 13_000))
    }
    return {
      0: await this.getRandomAgentManager(),
      1: randomNativeAddress(),
      creationData: [
        struct.collateralPool,
        struct.collateralPoolToken,
        struct.underlyingAddress,
        struct.vaultCollateralToken,
        struct.poolWNatToken,
        struct.feeBIPS,
        struct.poolFeeShareBIPS,
        struct.mintingVaultCollateralRatioBIPS,
        struct.mintingPoolCollateralRatioBIPS,
        struct.buyFAssetByAgentFactorBIPS,
        struct.poolExitCollateralRatioBIPS,
        struct.poolTopupCollateralRatioBIPS,
        struct.poolTopupTokenPriceFactorBIPS
      ]
    } as any
  }

  protected async generateAgentSettingsChanged(): Promise<AgentSettingChangedEvent.OutputTuple> {
    return [
      await this.getRandomAgentVault(),
      randomChoice(AGENT_SETTINGS),
      BigInt(randomNumber(10, 9999))
    ]
  }

  protected async generateAgentDestroyed(): Promise<AgentDestroyedEvent.OutputTuple> {
    return [ await this.getRandomAgentVault() ]
  }

  protected async generateSelfClose(): Promise<SelfCloseEvent.OutputTuple> {
    return [
      await this.getRandomAgentVault(),
      BigInt(randomNumber(1000, 1e12)),
    ]
  }

  protected async generateCollateralReserved(): Promise<CollateralReservedEvent.OutputTuple> {
    return [
      await this.getRandomAgentVault(),
      randomNativeAddress(),
      BigInt(randomNumber(1, 1e9)),
      BigInt(randomNumber(1e6, 1e9)),
      BigInt(randomNumber(1e2, 1e4)),
      BigInt(randomNumber(1, 1e6)),
      BigInt(randomNumber(1, 1e6)),
      BigInt(Date.now()),
      randomUnderlyingAddress(),
      randomHash(),
      randomNativeAddress(),
      BigInt(1e17)
    ]
  }

  protected async generateMintingExecuted(): Promise<MintingExecutedEvent.OutputTuple> {
    const collateralReserved = await this.getRandomCollateralReserved()
    return [
      collateralReserved.agentVault.address.hex,
      BigInt(collateralReserved.collateralReservationId),
      BigInt(collateralReserved.valueUBA),
      BigInt(collateralReserved.feeUBA),
      BigInt(randomNumber(1, 1e6))
    ]
  }

  protected async generateMintingPaymentDefault(): Promise<MintingPaymentDefaultEvent.OutputTuple> {
    const collateralReserved = await this.getRandomCollateralReserved()
    return [
      collateralReserved.agentVault.address.hex,
      collateralReserved.minter.hex,
      BigInt(collateralReserved.collateralReservationId),
      collateralReserved.valueUBA
    ]
  }

  protected async generateCollateralReservationDeleted(): Promise<CollateralReservationDeletedEvent.OutputTuple> {
    const collateralReserved = await this.getRandomCollateralReserved()
    return [
      collateralReserved.agentVault.address.hex,
      collateralReserved.minter.hex,
      BigInt(collateralReserved.collateralReservationId),
      collateralReserved.valueUBA
    ]
  }

  protected async generateRedemptionRequested(): Promise<RedemptionRequestedEvent.OutputTuple> {
    return [
      await this.getRandomAgentVault(),
      randomNativeAddress(),
      BigInt(randomNumber(1, 1e9)),
      randomUnderlyingAddress(),
      BigInt(randomNumber(1, 1e8)),
      BigInt(randomNumber(1, 1e4)),
      BigInt(randomNumber(1, 1e6)),
      BigInt(randomNumber(1, 1e6)),
      BigInt(Date.now()),
      randomHash(),
      randomNativeAddress(),
      BigInt(randomNumber(1, 1e6))
    ]
  }

  protected async generateRedemptionPerformed(): Promise<RedemptionPerformedEvent.OutputTuple> {
    const redemptionRequested = await this.getRandomRedemptionRequest()
    return [
      redemptionRequested.agentVault.address.hex,
      redemptionRequested.redeemer.hex,
      BigInt(redemptionRequested.requestId),
      randomHash(),
      redemptionRequested.valueUBA,
      redemptionRequested.feeUBA
    ]
  }

  protected async generateRedemptionDefault(): Promise<RedemptionDefaultEvent.OutputTuple> {
    const redemptionRequested = await this.getRandomRedemptionRequest()
    return [
      redemptionRequested.agentVault.address.hex,
      redemptionRequested.redeemer.hex,
      BigInt(redemptionRequested.requestId),
      redemptionRequested.valueUBA,
      BigInt(randomNumber(1, 1e6)),
      BigInt(randomNumber(1, 1e6))
    ]
  }

  protected async generateRedemptionPaymentBlocked(): Promise<RedemptionPaymentBlockedEvent.OutputTuple> {
    const redemptionRequested = await this.getRandomRedemptionRequest()
    return [
      redemptionRequested.agentVault.address.hex,
      redemptionRequested.redeemer.hex,
      BigInt(redemptionRequested.requestId),
      randomHash(),
      redemptionRequested.valueUBA,
      BigInt(randomNumber(1, 1e6))
    ]
  }

  protected async generateRedemptionPaymentFailed(): Promise<RedemptionPaymentFailedEvent.OutputTuple> {
    const redemptionRequested = await this.getRandomRedemptionRequest()
    return [
      redemptionRequested.agentVault.address.hex,
      redemptionRequested.redeemer.hex,
      BigInt(redemptionRequested.requestId),
      randomHash(),
      redemptionRequested.valueUBA,
      'idk'
    ]
  }

  protected async generateRedemptionRejected(): Promise<RedemptionRejectedEvent.OutputTuple> {
    const redemptionRequested = await this.getRandomRedemptionRequest()
    return [
      redemptionRequested.agentVault.address.hex,
      redemptionRequested.redeemer.hex,
      BigInt(redemptionRequested.requestId),
      redemptionRequested.valueUBA
    ]
  }

  protected async generateRedeemedInCollateral(): Promise<RedeemedInCollateralEvent.OutputTuple> {
    const agentVault = await this.getRandomAgentVault()
    return [
      agentVault,
      randomNativeAddress(),
      BigInt(randomNumber(1e6, 1e12)),
      BigInt(randomNumber(1e6, 1e18))
    ]
  }

  protected async generateRedemptionRequestIncomplete(): Promise<RedemptionRequestIncompleteEvent.OutputTuple> {
    return [ randomNativeAddress(), BigInt(randomNumber(1, 1e9)) ]
  }

  protected async generateLiquidationStarted(): Promise<LiquidationStartedEvent.OutputTuple> {
    return [ await this.getRandomAgentVault(), BigInt(Date.now()) ]
  }

  protected async generateLiquidationPerformed(): Promise<LiquidationPerformedEvent.OutputTuple> {
    return [
      await this.getRandomAgentVault(),
      randomNativeAddress(),
      BigInt(randomNumber(1, 1e9))
    ]
  }

  protected async generateFullLiquidationStarted(): Promise<FullLiquidationStartedEvent.OutputTuple> {
    return [ await this.getRandomAgentVault(), BigInt(Date.now()) ]
  }

  protected async generateLiquidationEnded(): Promise<LiquidationEndedEvent.OutputTuple> {
    return [ await this.getRandomAgentVault() ]
  }

  protected async generateAvailableAgentExited(): Promise<AvailableAgentExitedEvent.OutputTuple> {
    return [ await this.getRandomAgentVault() ]
  }

  protected async generateAgentEnteredAvailable(): Promise<AgentAvailableEvent.OutputTuple> {
    return [
      await this.getRandomAgentVault(),
      BigInt(randomNumber(1, 1e6)),
      BigInt(randomNumber(11_000, 15_000)),
      BigInt(randomNumber(11_000, 20_000)),
      BigInt(randomNumber(1, 1e3))
    ]
  }

  protected async generateCollateralPoolEnter(): Promise<EnteredEvent.OutputTuple> {
    return [
      randomNativeAddress(),
      BigInt(randomNumber(1e6, 1e12)),
      BigInt(randomNumber(1e6, 1e12)),
      BigInt(0),
      BigInt(0),
      BigInt(randomNumber(1e6, 1e12))
    ]
  }

  protected async generateCollateralPoolExit(): Promise<ExitedEvent.OutputTuple> {
    return [
      randomNativeAddress(),
      BigInt(randomNumber(1e6, 1e12)),
      BigInt(randomNumber(1e6, 1e12)),
      BigInt(0),
      BigInt(0),
      BigInt(randomNumber(1e6, 1e12))
    ]
  }

  protected async generateErc20Transfer(): Promise<TransferEvent.OutputTuple> {
    return [
      randomNativeAddress(),
      randomNativeAddress(),
      BigInt(randomNumber(1, 1e6))
    ]
  }

  protected async generateAgentPing(): Promise<AgentPingEvent.OutputTuple> {
    const agentVault = await this.getRandomAgentVault()
    return [
      agentVault,
      randomNativeAddress(),
      BigInt(randomNumber(1, 1e6))
    ]
  }

  protected async generateAgentPingResponse(): Promise<AgentPingResponseEvent.OutputTuple> {
    const agentVault = await this.getRandomAgentVault()
    return [
      agentVault,
      '',
      BigInt(randomNumber(1, 1e6)),
      randomString(100)
    ]
  }

  protected async generateCurrentUnderlyingBlockUpdated(): Promise<CurrentUnderlyingBlockUpdatedEvent.OutputTuple> {
    return [
      BigInt(randomNumber(1, 1e8)),
      BigInt(randomNumber(1, 1e8)),
      BigInt(randomNumber(1, 1e8))
    ]
  }

  /////////////////////////////////////////////////////////////////////////////
  // utils

  private async getRandomCollateralType(): Promise<string> {
    const vaultCollateralToken = await this.orm.em.fork().findOne(CollateralTypeAdded, { collateralClass: 1 }, { populate: ['address'] })
    if (vaultCollateralToken === null) throw new Error('CollateralType not found')
    return vaultCollateralToken.address.hex
  }

  private async getRandomAgentManager(): Promise<string> {
    const agentManager = await this.orm.em.fork().findAll(AgentManager, { populate: ['address'] })
    if (agentManager === null) throw new Error('AgentManager not found')
    return randomChoice(agentManager).address.hex
  }

  private async getRandomAgentVault(): Promise<string> {
    const agentVault = await this.orm.em.fork().findAll(AgentVault, { populate: ['address'] })
    if (agentVault === null || agentVault.length === 0) throw new Error('AgentVault not found')
    return randomChoice(agentVault).address.hex
  }

  private async getRandomCollateralReserved(): Promise<CollateralReserved> {
    const collateralReserved = await this.orm.em.fork().findAll(CollateralReserved, { populate: ['agentVault', 'minter'] })
    if (collateralReserved === null || collateralReserved.length === 0) throw new Error('CollateralReserved not found')
    return randomChoice(collateralReserved)
  }

  private async getRandomRedemptionRequest(): Promise<RedemptionRequested> {
    const redemptionRequest = await this.orm.em.fork().findAll(RedemptionRequested, { populate: ['agentVault', 'redeemer'] })
    if (redemptionRequest === null || redemptionRequest.length === 0) throw new Error('RedemptionRequested not found')
    return randomChoice(redemptionRequest)
  }

  private async argumentsFromEventName(name: string): Promise<EventArgs> {
    return (this[`generate${name}` as keyof EventFixture] as any)()
  }
}