import { ApiVerificationOutput } from './helpers/ApiVerificationOutput'
import { VerificationSaveOutput } from '../../../app/verification/save/VerificationSaveOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'
import { OutputError } from '../../../app/core/definitions/OutputError'

export interface ApiVerificationAddOutput {
	readonly verification: ApiVerificationOutput
	readonly successType: VerificationSaveOutput.SuccessTypes
}

export namespace ApiVerificationAddOutput {
	export function fromInteractorOutput(interactorOutput: VerificationSaveOutput): Immutable<ApiVerificationAddOutput> {
		return {
			verification: ApiVerificationOutput.fromVerification(interactorOutput.verification),
			successType: interactorOutput.successType,
		}
	}
}
