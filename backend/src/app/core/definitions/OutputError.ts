import { Immutable } from './Immutable'

/**
 * A custom type of error that is solely for sending error
 * messages as an output.
 */
export class OutputError {
	readonly type: OutputError.Types
	readonly errors: Immutable<OutputError.Info[]>
	constructor(type: OutputError.Types, errors: OutputError.Info[]) {
		this.type = type
		// Remove duplicates
		this.errors = errors.reduce((array, item) => {
			const exists = !!array.find((object) => object.error === item.error && object.data === item.data)
			if (!exists) {
				array.push(item)
			}
			return array
		}, new Array<OutputError.Info>())
	}

	static create(type: OutputError.Types, error?: string, data?: string): OutputError {
		if (error) {
			return new OutputError(type, [{ error: error, data: data }])
		} else {
			return new OutputError(type, [])
		}
	}
}

export namespace OutputError {
	export interface Info {
		error: string
		data?: string
	}

	export enum Types {
		invalidAccount = 'invalid-account',
		userNotFound = 'user-not-found',
		invalidInput = 'invalid-input',
		internalError = 'internal-error',
		notImplemented = 'not-implemented',
	}
}
