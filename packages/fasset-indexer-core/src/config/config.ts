import { expandUserConfig, getUserConfig } from "./load"

export const config = expandUserConfig(getUserConfig())