import { EVENTS } from "../config"

const eventnames = Object.values(EVENTS).map(x => Object.values(x)).flat()