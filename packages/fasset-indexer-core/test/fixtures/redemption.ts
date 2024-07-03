/* import { randomNativeAddress, randomUnderlyingAddress, randomHash } from "./utils"
import { AGENT_FIXTURE } from "./agent"
import { RedemptionRequestedEvent } from "../../chain/typechain/AMEvents"


export class RedemptionFixtureFactory {

  requestRedemption(): RedemptionRequestedEvent.OutputObject {
    return {
      agentVault: "0x",
      redeemer: randomNativeAddress(),
      requestId: 1,
      paymentAddress: randomUnderlyingAddress(),
      valueUBA: BigInt(1e18),
      feeUBA: BigInt(1e16),
      firstUnderlyingBlock: 118419,
      lastUnderlyingBlock: 1313440,
      lastUnderlyingTimestamp: 2312411,
      paymentReference: randomHash(),
      executor: randomNativeAddress(),
      executorFeeNatWei: BigInt(1e16)
    }
  }
}

const REDEMPTION_REQUESTED_1 = {
  agentVault: AGENT_FIXTURE[0].agents[0].vaults[0].address,
  redeemer: randomNativeAddress(),
  requestId: 1,
  paymentAddress: randomUnderlyingAddress(),
  valueUBA: BigInt(1e18),
  feeUBA: BigInt(1e16),
  firstUnderlyingBlock: 118419,
  lastUnderlyingBlock: 1313440,
  lastUnderlyingTimestamp: 2312411,
  paymentReference: randomHash(),
  executor: randomNativeAddress(),
  executorFeeNatWei: BigInt(1e16)
}

const REDEMPTION_REQUESTED_2 = {
  ...REDEMPTION_REQUESTED_1,
  requestId: 2,
  agentVault: AGENT_FIXTURE[0].agents[0].vaults[1].address,
  paymentReference: randomHash()
}

const REDEMPTION_REQUESTED_3 = {
  ...REDEMPTION_REQUESTED_1,
  requestId: 3,
  agentVault: AGENT_FIXTURE[0].agents[0].vaults[2].address,
  paymentReference: randomHash()
}

const REDEMPTION_REQUESTED_4 = {
  ...REDEMPTION_REQUESTED_1,
  requestId: 4,
  paymentReference: randomHash()
}

const REDEMPTION_REQUESTED_5 = {
  ...REDEMPTION_REQUESTED_1,
  requestId: 5,
  paymentReference: randomHash()
}

const REDEMPTION_PERFORMED = {
  agentVault: REDEMPTION_REQUESTED_1.agentVault,
  redeemer: REDEMPTION_REQUESTED_1.redeemer,
  requestId: REDEMPTION_REQUESTED_1.requestId,
  transactionHash: randomHash(),
  redemptionAmountUBA: REDEMPTION_REQUESTED_1.valueUBA,
  spentUnderlyingUBA: REDEMPTION_REQUESTED_1.valueUBA - BigInt(1e3)
}

const REDEMPTION_DEFAULT = {
  agentVault: REDEMPTION_REQUESTED_2.agentVault,
  redeemer: REDEMPTION_REQUESTED_2.redeemer,
  requestId: REDEMPTION_REQUESTED_2.requestId,
  redemptionAmountUBA: REDEMPTION_REQUESTED_2.valueUBA,
  redeemedVaultCollateralWei: BigInt(1e18),
  redeemedPoolCollateralWei: BigInt(1e16)
}

const REDEMPTION_REJECTED = {
  agentVault: REDEMPTION_REQUESTED_3.agentVault,
  redeemer: REDEMPTION_REQUESTED_3.redeemer,
  requestId: REDEMPTION_REQUESTED_3.requestId,
  redemptionAmountUBA: REDEMPTION_REQUESTED_3.valueUBA
}

const REDEMPTION_PAYMENT_BLOCKED = {
  agentVault: REDEMPTION_REQUESTED_4.agentVault,
  redeemer: REDEMPTION_REQUESTED_4.redeemer,
  requestId: REDEMPTION_REQUESTED_4.requestId,
  transactionHash: randomHash(),
  redemptionAmountUBA: REDEMPTION_REQUESTED_4.valueUBA,
  spentUnderlyingUBA: REDEMPTION_REQUESTED_4.valueUBA - BigInt(1e3)
}

const REDEMPTION_PAYMENT_FAILED = {
  agentVault: REDEMPTION_REQUESTED_5.agentVault,
  redeemer: REDEMPTION_REQUESTED_5.redeemer,
  requestId: REDEMPTION_REQUESTED_5.requestId,
  transactionHash: randomHash(),
  spentUnderlyingUBA: REDEMPTION_REQUESTED_5.valueUBA - BigInt(1e3),
  failureReason: "Here I go bein malicious again"
}

export const REDEMPTION_FIXTURE = {
  REDEMPTION_REQUESTED: [
    REDEMPTION_REQUESTED_1,
    REDEMPTION_REQUESTED_2,
    REDEMPTION_REQUESTED_3,
    REDEMPTION_REQUESTED_4,
    REDEMPTION_REQUESTED_5
  ],
  REDEMPTION_PERFORMED: [
    REDEMPTION_PERFORMED
  ],
  REDEMPTION_DEFAULT: [
    REDEMPTION_DEFAULT
  ],
  REDEMPTION_REJECTED: [
    REDEMPTION_REJECTED
  ],
  REDEMPTION_PAYMENT_BLOCKED: [
    REDEMPTION_PAYMENT_BLOCKED
  ],
  REDEMPTION_PAYMENT_FAILED: [
    REDEMPTION_PAYMENT_FAILED
  ]
}

export type RedemptionRequestedFixture = typeof REDEMPTION_REQUESTED_1
export type RedemptionPerformedFixture = typeof REDEMPTION_PERFORMED
export type RedemptionDefaultFixture = typeof REDEMPTION_DEFAULT
export type RedemptionRejectedFixture = typeof REDEMPTION_REJECTED
export type RedemptionPaymentBlockedFixture = typeof REDEMPTION_PAYMENT_BLOCKED
export type RedemptionPaymentFailedFixture = typeof REDEMPTION_PAYMENT_FAILED */