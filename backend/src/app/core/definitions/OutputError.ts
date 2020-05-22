/**
 * A custom type of error that is solely for sending error
 * messages as an output.
 */
export class OutputError {
	type: OutputErrorTypes
	constructor(type: OutputErrorTypes) {
		this.type = type
	}
}

export enum OutputErrorTypes {
	userNotFound = 'user-not-found',
	internalError = 'internal-error',
}
