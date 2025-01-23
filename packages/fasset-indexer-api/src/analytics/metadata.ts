import { getVar, type ORM } from "fasset-indexer-core/orm"
import {
  FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY,
  backUpdateLastBlockName,
  backUpdateFirstUnhandledBlockName
} from "fasset-indexer-core/config"


export class MetadataAnalytics {
  constructor(public readonly orm: ORM) { }

  async currentBlock(): Promise<number | null> {
    const v = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY)
    return (v && v.value) ? parseInt(v.value) : null
  }

  async blocksToBackSync(): Promise<number | null> {
    const currentUpdate = await getVar(this.orm.em.fork(), 'current_update')
    if (currentUpdate === null) {
      return null
    }
    const currentUpdateName = currentUpdate.value!
    const start = await getVar(this.orm.em.fork(), backUpdateFirstUnhandledBlockName(currentUpdateName))
    if (start === null || start.value === undefined) return null
    const end = await getVar(this.orm.em.fork(), backUpdateLastBlockName(currentUpdateName))
    if (end === null || end.value === undefined) return null
    return parseInt(end.value) - parseInt(start.value) + 1
  }
}