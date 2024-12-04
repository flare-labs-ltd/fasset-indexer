import "dotenv/config"

interface ApiConfig {
  port: number
  rootPath?: string
}

function defaultUndefinedNum(v: string | undefined, d: number): number {
  if (v == null) {
    return d
  }
  return Number(v)
}

export const apiConfig: ApiConfig = {
  port: defaultUndefinedNum(process.env.API_PORT, 3000),
  rootPath: process.env.API_ROOT_PATH
}