import { Immutable } from '../../core/definitions/Immutable'
import { Output } from '../../core/definitions/Output'
import { Id } from '../../core/definitions/Id'

export namespace VerificationSaveOutput {
	export enum SuccessTypes {
		ADDED_NEW = 'added-new',
		DUPLICATE = 'duplicate',
		DUPLICATE_ADDED_FILES = 'duplicate-added-files',
		INVALID = 'invalid',
	}
}

export interface VerificationSaveOutput extends Output {
	readonly id: Id
	readonly successType: VerificationSaveOutput.SuccessTypes
}
