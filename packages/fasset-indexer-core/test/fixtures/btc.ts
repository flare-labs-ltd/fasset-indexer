import { BlockbookBlock, BlockbookTx } from "../../src/indexer-btc/blockbook/interface"
import { Blockbook } from "../../src/indexer-btc/blockbook/blockbook"
import type { Context } from "../../src/context/context"

export class BtcFixture {
    private blockbook: Blockbook

    constructor(context: Context) {
        this.blockbook = new Blockbook(context.config.btcRpc!.url)
    }

    async generateTx(): Promise<BlockbookTx> {
        return this.blockbook.tx('14e108da9267b045c86edaf02fa02ea89e6b72a86e4cbb3ed41ac3322c84e2dc')
    }

    async generateBlock(): Promise<BlockbookBlock> {
        return this.blockbook.block(2871458)
    }
}