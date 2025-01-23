export interface IDogeVin {
  txid: string
  vout: number
  scriptSig: {
    asm: string
    hex: string
  }
  sequence: number
}

export interface IDogeVout {
  value: number
  n: number
  scriptPubKey: {
    asm: string
    hex: string
    reqSigs: number
    type: string
    addresses: string[]
  }
}

export interface IDogeTx {
  hex: string
  txid: string
  hash: string
  size: number
  vsize: number
  version: number
  locktime: number
  blockhash: string
  time: number
  blocktime: number
  confirmations: number
  vin: IDogeVin[]
  vout: IDogeVout[]
}

export interface IDogeBlock {
  hash: string
  tx: string[]
  size: number
  height: number
  version: number
  confirmations: number
  time: number
}