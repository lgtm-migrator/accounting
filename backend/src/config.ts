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

export function mongoDbUrl(config: Config): string {
	let { host, username, password, database, port } = config.mongoDb

	let credentials = ''
	if (username && password) {
		credentials = `${username}:${password}@`
	}

	let portString = ''
	if (port) {
		portString = `:${port}`
	}

	return `mongodb://${credentials}${host}${portString}/${database}`
}

export interface Config {
	mongoDb: {
		host: string
		username?: string
		password?: string
		database: string
		port?: number

		/**
		 * Generate the URL from the info
		 */
		url(): string
	}

	apiKeys: {
		fixerIo: string
	}

	fileSystem: {
		/**
		 * Project directory, the folder that has the backend and frontend dirs.
		 */
		projectDir: string
		/**
		 * Output for all files
		 */
		writeDir: string
	}
}
