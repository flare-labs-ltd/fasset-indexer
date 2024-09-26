import type { BlockbookAddressInfo, BlockbookBlock, BlockbookTx } from "./interface"

export class Blockbook {
  headers: any

  constructor(private readonly url: string, private readonly key?: string) {
    this.headers = (key !== undefined) ? {
      'x-api-key': key
    } : {}
  }

  async blockHeight(): Promise<number> {
    const response = await fetch(`${this.url}/api/v2`)
    const data = await response.json()
    return data.blockbook.bestHeight
  }

  async addressTxs(address: string): Promise<BlockbookTx[]> {
    const addressInfo = await this.addressInfo(address)
    const txs = []
    for (const txid of addressInfo.txids ?? []) {
      const tx = await this.tx(txid)
      txs.push(tx)
    }
    return txs
  }

  async addressInfo(address: string): Promise<BlockbookAddressInfo> {
    const addressInfo = await this._addressInfo(address, 1)
    addressInfo.txids = addressInfo.txids ?? []
    while (addressInfo.page < addressInfo.totalPages) {
      const _addressInfo = await this._addressInfo(address, addressInfo.page + 1)
      if (_addressInfo.txids === undefined) continue
      addressInfo.txids.push(..._addressInfo.txids)
      addressInfo.page = _addressInfo.page
    }
    return addressInfo
  }

  async block(height: number): Promise<BlockbookBlock> {
    const block = await this._txsFromBlock(height, 1)
    while (block.page < block.totalPages) {
      const _block = await this._txsFromBlock(height, block.page + 1)
      block.txs.push(..._block.txs)
      block.page = _block.page
    }
    return block
  }

  async tx(txid: string): Promise<BlockbookTx> {
    // assume one page is enough
    const response = await fetch(`${this.url}/api/v2/tx/${txid}`, this.headers)
    console.log(txid)
    return response.json()
  }

  protected async _txsFromBlock(height: number, page: number): Promise<BlockbookBlock> {
    const response = await fetch(`${this.url}/api/v2/block/${height}?page=${page}`, this.headers)
    return response.json()
  }

  protected async _addressInfo(address: string, page: number): Promise<BlockbookAddressInfo> {
    const response = await fetch(`${this.url}/api/v2/address/${address}?page=${page}`, this.headers)
    return response.json()
  }

}

/* const url = 'https://blockbook-bitcoin-testnet.flare.network'
const blockbook = new Blocbook(url)

async function main() {
    const block = await blockbook.txsFromAddress('tb1qxv9zdfssu4zsmq3zslwg0npyujfyhy7v0yw5ts')
    console.log(block)
}

main() */