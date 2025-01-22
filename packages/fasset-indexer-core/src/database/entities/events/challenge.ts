import { Entity, ManyToOne, Property } from '@mikro-orm/core'
import { uint256 } from '../../custom/uint'
import { FAssetEventBound } from './_bound'
import { AgentVault } from '../agent'
import { BYTES32_LENGTH } from '../../../config/constants'
import type { EvmLog } from '../evm/log'
import type { FAssetType } from '../../../shared'

@Entity()
export class IllegalPaymentConfirmed extends FAssetEventBound {

    @ManyToOne({ entity: () => AgentVault })
    agentVault: AgentVault

    @Property({ type: "text", length: BYTES32_LENGTH, unique: true })
    transactionHash: string

    constructor(
        evmLog: EvmLog, fasset: FAssetType,
        agentVault: AgentVault, transactionHash: string
    ) {
        super(evmLog, fasset)
        this.agentVault = agentVault
        this.transactionHash = transactionHash
    }
}

@Entity()
export class DuplicatePaymentConfirmed extends FAssetEventBound {

        @ManyToOne({ entity: () => AgentVault })
        agentVault: AgentVault

        @Property({ type: "text", length: BYTES32_LENGTH, unique: true })
        transactionHash1: string

        @Property({ type: "text", length: BYTES32_LENGTH, unique: true })
        transactionHash2: string

        constructor(
            evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault,
            transactionHash1: string, transactionHash2: string
        ) {
            super(evmLog, fasset)
            this.agentVault = agentVault
            this.transactionHash1 = transactionHash1
            this.transactionHash2 = transactionHash2
        }
}

@Entity()
export class UnderlyingBalanceTooLow extends FAssetEventBound {

    @ManyToOne({ entity: () => AgentVault })
    agentVault: AgentVault

    @Property({ type: new uint256() })
    balance: bigint

    @Property({ type: new uint256() })
    requiredBalance: bigint

    constructor(
        evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault,
        balance: bigint, requiredBalance: bigint
    ) {
        super(evmLog, fasset)
        this.agentVault = agentVault
        this.balance = balance
        this.requiredBalance = requiredBalance
    }
}