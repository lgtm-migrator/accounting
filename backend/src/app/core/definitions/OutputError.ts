/**
 * A custom type of error that is solely for sending error
 * messages as an output.
 */
export class OutputError {
	type: OutputError.Types
	errors: string[]
	constructor(type: OutputError.Types, errors: string[] = []) {
		this.type = type
		this.errors = errors
	}
}

export namespace OutputError {
	export enum Types {
		invalidAccount = 'invalid-account',
		userNotFound = 'user-not-found',
		invalidInput = 'invalid-input',
		internalError = 'internal-error',
		notImplemented = 'not-implemented',
	}
}
