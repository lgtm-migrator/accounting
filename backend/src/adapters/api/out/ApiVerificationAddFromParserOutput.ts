import { VerificationSaveManyOutput } from '../../../app/verification/save/VerificationSaveOutput'
import { ApiVerificationOutput } from './helpers/ApiVerificationOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'
import { ApiVerificationAddOutput } from './ApiVerificationAddOutput'

export interface ApiVerificationAddFromParserOutput {
	readonly added: ApiVerificationAddOutput[]
}

export namespace ApiVerificationAddFromParserOutput {
	export function fromInteractorOutput(
		interactorOutput: VerificationSaveManyOutput
	): Immutable<ApiVerificationAddFromParserOutput> {
		const added = interactorOutput.saved.reduce((array, saved) => {
			const added: Immutable<ApiVerificationAddOutput> = {
				verification: ApiVerificationOutput.fromVerification(saved.verification),
				successType: saved.successType,
			}
			return array
		}, new Array<ApiVerificationAddOutput>())

		return { added: added }
	}
}
