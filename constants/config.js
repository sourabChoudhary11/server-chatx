import { clientURL } from "./env.js"

const corsOptions = {
    origin: clientURL,
    credentials: true
}

export {
    corsOptions
}