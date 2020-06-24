/**
 * A custom error type that is thrown
 */
export class InternalError extends Error {
	type: InternalError.Types
	error: object
	constructor(type: InternalError.Types, errors: {} = {}, message: string = '') {
		super(message)
		this.type = type
		this.error = errors
	}

	/**
	 * Check if the exception is of this type (or at least has the correct properties)
	 * @param exception the exception to check if it's of this type
	 * @return true if it is of this type, false otherwise
	 */
	static isInstanceOf(exception: Error): boolean {
		const properties = Object.keys(exception)

		// Type
		if (!properties.includes('type')) {
			return false
		}

		// Error
		if (!properties.includes('error')) {
			return false
		}

		return true
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
		unknown = 'internal-error',
	}
}
