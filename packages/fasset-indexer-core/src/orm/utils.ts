import type { ORM, SchemaUpdate } from "./interface"

export async function updateSchema(orm: ORM, update: SchemaUpdate = "full"): Promise<void> {
  if (update === "none") return;
  const generator = orm.getSchemaGenerator();
  if (update === "recreate") {
    await generator.dropSchema();
    await generator.updateSchema();
  } else {
    await generator.updateSchema({ safe: update === "safe", wrap: false });
  }
}