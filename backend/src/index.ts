// Start the backend

import { ApiAppAdapter } from './adapters/api/ApiAppAdapter'
import { ExpressApi } from './framework/api/ExpressApi'

const apiAdapter = new ApiAppAdapter()
const expressApi = new ExpressApi(apiAdapter)
