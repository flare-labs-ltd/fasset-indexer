import { Type } from '@mikro-orm/core'


export class uint256 extends Type<bigint, string> {

  convertToDatabaseValue(value: bigint): string {
    return value.toString()
  }

  convertToJSValue(value: string): bigint {
    return BigInt(value)
  }

  getColumnType() {
    return `NUMERIC(78)`
  }
}

export class uint64 extends uint256 {

  override getColumnType() {
    return `NUMERIC(21)`
  }
}