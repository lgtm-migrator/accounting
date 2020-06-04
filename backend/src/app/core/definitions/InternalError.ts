/**
 * A custom error type that is thrown
 */
export class InternalError extends Error {
	type: InternalErrorTypes
	error: object
	constructor(type: InternalErrorTypes, error: object = {}, message: string = '') {
		super(message)
		this.type = type
		this.error = error
	}
}

/**
 * The different errors the application can send
 */
export enum InternalErrorTypes {
	userNotFound = 'user-not-found',
	comparableError = 'cannot-compare-the-objects',
	invalidEntityState = 'invalid-entity-state',
	unknown = 'internal-error',
}
