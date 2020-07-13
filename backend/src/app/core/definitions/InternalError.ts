/**
 * A custom error type that is thrown
 */
export class InternalError {
	type: InternalError.Types
	error?: any
	constructor(type: InternalError.Types, error?: any) {
		this.type = type
		this.error = error
	}
}

export namespace InternalError {
	/**
	 * The different errors the application can send
	 */
	export enum Types {
		userNotFound = 'user-not-found',
		comparableError = 'cannot-compare-the-objects',
		accountNumberNotFound = 'account-number-not-found',
		invalidEntityState = 'invalid-entity-state',
		serviceNotReachable = 'service-not-reachable',
		tooFewElements = 'too-few-elements',
		exchangeRateNotSet = 'exchange-rate-not-set',
		notImplemented = 'not-implemented',
		readingFile = 'reading-file',
		fileNotFound = 'file-not-found',
		unknown = 'internal-error',
	}
}
