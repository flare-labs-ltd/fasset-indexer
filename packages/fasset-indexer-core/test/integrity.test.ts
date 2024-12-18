import { describe, it } from "mocha"
import { expect } from "chai"
import { EventInterface } from "../src/context/events"
import { EVENTS } from "../src/config/constants"


describe("FAsset evm events", () => {
  let eventIface: EventInterface

  before(async () => {
    eventIface = new EventInterface()
  })

  it("should verify all asset manager event names are included in the interface", async () => {
    for (const eventname of Object.values(EVENTS.ASSET_MANAGER)) {
      expect(eventIface.interfaces.assetManagerInterface.hasEvent(eventname)).to.be.true
    }
  })

  it("should verify all collateral pool event names are included in the interface", async () => {
    for (const eventname of Object.values(EVENTS.COLLATERAL_POOL)) {
      expect(eventIface.interfaces.collateralPoolInterface.hasEvent(eventname)).to.be.true
    }
  })

  it("should verify all erc20 event names are included in the interface", async () => {
    for (const eventname of Object.values(EVENTS.ERC20)) {
      expect(eventIface.interfaces.erc20Interface.hasEvent(eventname)).to.be.true
    }
  })

})