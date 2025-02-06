import { DogeIndexer } from "fasset-indexer-doge"
import { BtcContext } from "../context"


export class BtcIndexer extends DogeIndexer {
  constructor(context: BtcContext) {
    super(context)
  }
}