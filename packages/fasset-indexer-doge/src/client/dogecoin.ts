import type { IDogeBlock, IDogeTx } from "./interface"

export class DogeClient {
  constructor(
    public readonly rpcUrl: string,
    public readonly apiKey?: string,
    public readonly authorization?: string
  ) { }

  async dogeBlockHeight(): Promise<number> {
    const res = await this.call('getblockcount', [])
    return res.result
  }

  async dogeBlock(id: number | string): Promise<IDogeBlock> {
    if (typeof id === 'number') {
      return this.dogeBlockFromHeight(id)
    } else {
      return this.dogeBlockFromHash(id)
    }
  }

  async dogeTransaction(tx: string): Promise<IDogeTx> {
    const res = await this.call('getrawtransaction', [tx, true])
    return res.result
  }

  async dogeBlockHash(height: number): Promise<string> {
    const res = await this.call('getblockhash', [height])
    return res.result
  }

  protected async dogeBlockFromHash(hash: string): Promise<IDogeBlock> {
    const res = await this.call('getblock', [hash])
    return res.result
  }

  protected async dogeBlockFromHeight(height: number): Promise<IDogeBlock> {
    const hash = await this.dogeBlockHash(height)
    return this.dogeBlockFromHash(hash)
  }

  protected async call(method: string, params: any[]): Promise<any> {
    const res = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authorization ?? '',
        'x-apikey': this.apiKey ?? ''
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: "getblock.io"
      })
    })
    return await res.json()
  }
}