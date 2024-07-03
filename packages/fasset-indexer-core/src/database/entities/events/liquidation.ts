import { Entity, PrimaryKey, ManyToOne, Property } from '@mikro-orm/core'
import { uint256 } from '../../custom/typeUint256'
import { EventBound } from '../logs'
import { AgentVault } from '../agent'
import { EvmAddress } from '../address'
import type { EvmLog } from '../logs'


class LiquidationStartedBase extends EventBound {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: 'number' })
  timestamp: number

  constructor(evmLog: EvmLog, agentVault: AgentVault, timestamp: number) {
    super(evmLog)
    this.agentVault = agentVault
    this.timestamp = timestamp
  }
}

@Entity()
export class LiquidationStarted extends LiquidationStartedBase { }

@Entity()
export class FullLiquidationStarted extends LiquidationStartedBase { }

@Entity()
export class LiquidationPerformed extends EventBound {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @ManyToOne({ entity: () => EvmAddress })
  liquidator: EvmAddress

  @Property({ type: new uint256() })
  valueUBA: bigint

  constructor(evmLog: EvmLog, agentVault: AgentVault, liquidator: EvmAddress, valueUBA: bigint) {
    super(evmLog)
    this.agentVault = agentVault
    this.liquidator = liquidator
    this.valueUBA = valueUBA
  }
}

@Entity()
export class LiquidationEnded extends EventBound {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  constructor(evmLog: EvmLog, agentVault: AgentVault) {
    super(evmLog)
    this.agentVault = agentVault
  }
}