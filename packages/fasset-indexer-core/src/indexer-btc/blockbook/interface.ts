interface BlockbookMetadata {
  page: number
  totalPages: number
}

export interface BlockbookTxOutput extends BlockbookMetadata {
  value: string
  n: number
  addresses: string[]
  isAddress: boolean
}

export interface BlockbookTxInput extends BlockbookTxOutput {
  txid?: string
  vout?: number
}

export interface BlockbookTx extends BlockbookMetadata {
  txid: string
  vin: BlockbookTxInput[]
  vout: BlockbookTxOutput[]
  value: string
  valueIn: string
  fees: string
  blockHash: string
  blockHeight: number
  blockTime: number
}

export interface BlockbookBlock extends BlockbookMetadata {
  height: number
  hash: string
  time: number
  txs: BlockbookTx[]
}

export interface BlockbookAddressInfo extends BlockbookMetadata {
  txids: string[]
}