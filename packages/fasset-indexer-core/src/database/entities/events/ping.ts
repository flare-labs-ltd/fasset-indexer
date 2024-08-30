import { Entity, Property, ManyToOne } from '@mikro-orm/core'
import { uint256 } from '../../custom/typeUint256'
import { AgentVault } from '../agent'
import { EvmAddress } from '../address'
import { FAssetEventBound, type FAssetType } from './_bound'
import type { EvmLog } from '../evm/log'


@Entity()
export class AgentPing extends FAssetEventBound {

  @ManyToOne(() => AgentVault)
  agentVault: AgentVault

  @ManyToOne(() => EvmAddress)
  sender: EvmAddress

  @Property({ type: new uint256() })
  query: bigint

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    agentVault: AgentVault,
    sender: EvmAddress,
    query: bigint
  ) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.sender = sender
    this.query = query
  }
}

@Entity()
export class AgentPingResponse extends FAssetEventBound {

    @ManyToOne(() => AgentVault)
    agentVault: AgentVault

    @Property({ type: new uint256() })
    query: bigint

    @Property({ type: 'text' })
    response: string

    constructor(
        evmLog: EvmLog,
        fasset: FAssetType,
        agentVault: AgentVault,
        query: bigint,
        response: string
    ) {
        super(evmLog, fasset)
        this.agentVault = agentVault
        this.query = query
        this.response = response
    }

}