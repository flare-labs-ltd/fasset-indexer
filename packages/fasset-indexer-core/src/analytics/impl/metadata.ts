import { getVar } from "../../utils"
import {
  FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY,
  FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE_DB_KEY,
  END_EVENT_BLOCK_FOR_CURRENT_UPDATE_DB_KEY
} from "../../config/constants"
import type { ORM } from "../../database/interface"


export class MetadataAnalytics {
  orm: ORM

  constructor(orm: ORM) {
    this.orm = orm
  }

  async currentBlock(): Promise<number | null> {
    const v = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY)
    return (v && v.value) ? parseInt(v.value) : null
  }

  async blocksToBackSync(): Promise<number | null> {
    const start = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE_DB_KEY)
    if (start === null || start.value === undefined) return null
    const end = await getVar(this.orm.em.fork(), END_EVENT_BLOCK_FOR_CURRENT_UPDATE_DB_KEY)
    if (end === null || end.value === undefined) return null
    return parseInt(end.value) - parseInt(start.value) + 1
  }
}