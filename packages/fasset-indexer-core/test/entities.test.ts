import { describe, beforeEach, afterEach, it } from "mocha"
import { expect } from "chai"
import { resolve } from "path"
import { unlink } from "fs"
import { EventFixture } from "./fixtures/event"
import { Context } from "../src/context"
import { CONFIG } from "./fixtures/config"
import { EventStorer } from "../src/indexer/eventlib/event-storer"
import { CollateralReserved } from "../src/database/entities/events/minting"


describe("ORM: Agent", () => {
  let context: Context
  let fixture: EventFixture
  let storer: EventStorer

  beforeEach(async () => {
    context = await Context.create(CONFIG)
    fixture = new EventFixture(context.orm)
    storer = new EventStorer(context)
  })

  afterEach(async () => {
    await context.orm.close()
    unlink(resolve(CONFIG.db.name!), () => {})
  })

  it("should do the minting steps", async () => {
    await fixture.storeInitialAgents()
    const collateralReservedEvent = await fixture.generateEvent('CollateralReserved')
    await context.orm.em.fork().transactional(async em => {
      await storer.processEvent(em, collateralReservedEvent)
    })
    const em = context.orm.em.fork()
    const collateralReserved = await em.findOneOrFail(CollateralReserved,
      { evmLog: { index: collateralReservedEvent.logIndex, block: { index: collateralReservedEvent.blockNumber }}})
    expect(collateralReserved).to.exist
    expect(collateralReserved.collateralReservationId).to.equal(Number(collateralReservedEvent.args[2]))
  })

  it("should not store an event that is not processed", async () => {
  })

})