import { Interactor } from '../../core/definitions/Interactor'
import { VerificationSaveInput } from './VerificationSaveInput'
import { VerificationSaveOutput } from './VerificationSaveOutput'
import { VerificationSaveRepository } from './VerificationSaveRepository'
import { Verification } from '../../core/entities/Verification'

/**
 * Tries to save the verification. If the verification already exists but has new files it will
 * add and save those files to the existing verification
 */
export class VerificationSaveInteractor extends Interactor<
	VerificationSaveInput,
	VerificationSaveOutput,
	VerificationSaveRepository
> {
	constructor(repository: VerificationSaveRepository) {
		super(repository)
	}

	private wasNewFilesAdded(existingVerification: Verification | undefined, verification: Verification): boolean {
		// There was new files
		if (this.input.files) {
			// There were no existing files prior
			if (!existingVerification || !existingVerification.files) {
				return true
			}
			// There was files prior, did we add any new files?
			if (verification.files && verification.files.length != this.input.files.length) {
				return true
			}
		}
		return false
	}

	/**
	 * Tries to save the verification
	 * @param input
	 * @return {Promise.<VerificationSaveOutput>}
	 */
	async execute(input: VerificationSaveInput): Promise<VerificationSaveOutput> {
		this.input = input
		let successType = VerificationSaveOutput.SuccessTypes.INVALID
		let existingVerification: Verification | undefined

		return this.repository
			.exists(input.verification)
			.then((foundVerification) => {
				let verification = input.verification
				if (foundVerification) {
					successType = VerificationSaveOutput.SuccessTypes.DUPLICATE
					verification = foundVerification
					existingVerification = foundVerification
				}

				// Files to save
				if (input.files) {
					return this.repository.saveFiles(input.files, verification)
				} else {
					return Promise.resolve(verification)
				}
			})
			.then((verification) => {
				// New verification
				if (successType != VerificationSaveOutput.SuccessTypes.DUPLICATE && !input.verification.id) {
					successType = VerificationSaveOutput.SuccessTypes.ADDED_NEW
				}
				// Added new files to duplicate (check so that we actually added new files)
				else if (this.wasNewFilesAdded(existingVerification, verification)) {
					successType = VerificationSaveOutput.SuccessTypes.DUPLICATE_ADDED_FILES
				}
				// Duplicate -> No need to save duplicate, return directly with the existing Id
				else {
					return Promise.resolve(verification.id!)
				}

				return this.repository.saveVerification(verification)
			})
			.then((id) => {
				const output: VerificationSaveOutput = {
					id: id,
					successType: successType,
				}

				return Promise.resolve(output)
			})
	}
}
