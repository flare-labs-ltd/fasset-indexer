import { resolve } from "path"
import { ConfigLoader } from "../../src/config/config"


export class TestConfigLoader extends ConfigLoader {

  override get chain() {
    return 'coston'
  }

  protected override get dbType(): string {
    return 'sqlite'
  }

  protected override get dbName() {
    return resolve("fasset-open-beta-monitor.test.db")
  }
}