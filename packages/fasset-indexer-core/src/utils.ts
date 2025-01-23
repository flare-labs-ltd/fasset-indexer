import { EntityManager } from "@mikro-orm/core"
import { Var } from "./orm/entities/state/var"
import { type AddressType, UnderlyingAddress } from "./orm/entities/address"

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function setVar(em: EntityManager, key: string, value?: string): Promise<void> {
  const vr = await em.findOne(Var, { key })
  if (!vr) {
    const vr = new Var(key, value)
    em.persist(vr)
  } else {
    vr.value = value
  }
  await em.flush()
}

export async function getVar(em: EntityManager, key: string): Promise<Var | null> {
  return await em.findOne(Var, { key })
}

export async function deleteVar(em: EntityManager, key: string): Promise<void> {
  const vr = await em.findOne(Var, { key })
  if (vr) {
    em.remove(vr)
    await em.flush()
  }
}

export async function findOrCreateUnderlyingAddress(em: EntityManager, address: string, type: AddressType): Promise<UnderlyingAddress> {
  let underlyingAddress = await em.findOne(UnderlyingAddress, { text: address })
  if (!underlyingAddress) {
    underlyingAddress = new UnderlyingAddress(address, type)
    em.persist(underlyingAddress)
  }
  return underlyingAddress
}