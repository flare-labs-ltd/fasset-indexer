import { SqliteDriver } from "@mikro-orm/sqlite"
import { config as _config } from "../../src/config/config"

_config.db.name = "fasset-open-beta-monitor.test.db"
_config.db.driver = SqliteDriver
export const CONFIG = _config