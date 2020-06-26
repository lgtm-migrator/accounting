import { Immutable } from './Immutable'

/**
 * A custom type of error that is solely for sending error
 * messages as an output.
 */
export class OutputError {
	readonly type: OutputError.Types
	readonly errors: Immutable<string[]>
	constructor(type: OutputError.Types, errors: string[] = []) {
		this.type = type
		// Remove duplicates
		this.errors = [...new Set(errors)]
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
