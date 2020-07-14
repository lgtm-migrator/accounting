export let config: Config
if (process.env.NODE_ENV === 'development') {
	config = require('./config.development').config
} else if (process.env.NODE_ENV === 'production') {
	config = require('./config.production').config
} else if (process.env.NODE_ENV === 'test') {
	config = require('./config.testing').config
} else {
	throw new Error('Could not load config file')
}

export interface Config {
	mongoDb: {
		url: string
	}
}
