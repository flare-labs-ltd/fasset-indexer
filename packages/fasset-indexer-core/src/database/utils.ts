import { MikroORM } from "@mikro-orm/core"
import { ORM_OPTIONS } from "./mikro-orm.config"
import type { ORM, OrmOptions, SchemaUpdate } from "./interface"


export async function createOrm(options: OrmOptions, update: SchemaUpdate): Promise<ORM> {
  const initOptions = { ...ORM_OPTIONS, ...options }
  const orm = await MikroORM.init(initOptions)
  await updateSchema(orm, update)
  if (!await orm.isConnected())
    throw new Error("Failed to connect to database")
  return orm
}

export async function updateSchema(orm: ORM, update: SchemaUpdate = "full"): Promise<void> {
  if (update === "none") return;
  const generator = orm.getSchemaGenerator();
  if (update && update == "recreate") {
    await generator.dropSchema();
    await generator.updateSchema();
  } else {
    await generator.updateSchema({ safe: update === "safe" });
  }
}