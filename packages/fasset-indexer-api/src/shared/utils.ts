export function unixnow(): number {
    return Math.floor(Date.now() / 1000)
}