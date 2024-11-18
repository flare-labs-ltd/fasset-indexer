import { getVar } from "../utils"
import {
  FIRST_UNHANDLED_EVENT_BLOCK,
  FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE,
  END_EVENT_BLOCK_FOR_CURRENT_UPDATE,
  FIRST_UNHANDLED_BTC_BLOCK
} from "../config/constants"
import type { ORM } from "../database/interface"


export class MetadataAnalytics {
  orm: ORM

  constructor(orm: ORM) {
    this.orm = orm
  }

  async currentBlock(): Promise<number | null> {
    const v = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK)
    return (v && v.value) ? parseInt(v.value) : null
  }

  async currentBtcBlock(): Promise<number | null> {
    const v = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_BTC_BLOCK)
    return (v && v.value) ? parseInt(v.value) : null
  }

  async blocksToBackSync(): Promise<number | null> {
    const start = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE)
    if (start === null || start.value === undefined) return null
    const end = await getVar(this.orm.em.fork(), END_EVENT_BLOCK_FOR_CURRENT_UPDATE)
    if (end === null || end.value === undefined) return null
    return parseInt(end.value) - parseInt(start.value) + 1
  }
}