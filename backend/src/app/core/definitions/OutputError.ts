/**
 * A custom type of error that is solely for sending error
 * messages as an output.
 */
export class OutputError {
	type: OutputErrorTypes
	errors: string[]
	constructor(type: OutputErrorTypes, errors: string[] = []) {
		this.type = type
		this.errors = errors
	}
}

export enum OutputErrorTypes {
	userNotFound = 'user-not-found',
	invalidInput = 'invalid-input',
	internalError = 'internal-error',
}
