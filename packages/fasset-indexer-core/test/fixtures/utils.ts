import { ADDRESS_LENGTH, BYTES32_LENGTH } from "../../src/config/constants"


const XRP_ALPHABET = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'

export function randomUnderlyingAddress() {
  return randomBase58(30)
}

export function randomNativeAddress() {
  return randomHex(ADDRESS_LENGTH-2)
}

export function randomHash() {
  return randomHex(BYTES32_LENGTH-2)
}

export function randomString(n: number) {
  return randomBase58(n)
}

export function randomHex(length: number) {
  return '0x' + Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export function randomBase58(length: number) {
  return Array.from({ length }, () => XRP_ALPHABET[Math.floor(Math.random() * XRP_ALPHABET.length)]).join('')
}

export function randomNumber(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min))
}

export function randomChoice<T>(arr: T[]): T {
  return arr[randomNumber(0, arr.length)]
}