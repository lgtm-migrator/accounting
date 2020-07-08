import { Interactor } from '../../core/definitions/Interactor'
import { VerifyApiKeyInput } from './VerifyApiKeyInput'
import { VerifyApiKeyOutput } from './VerifyApiKeyOutput'
import { VerifyApiKeyRepository } from './VerifyApiKeyRepository'
import { InternalError } from '../../core/definitions/InternalError'
import { OutputError } from '../../core/definitions/OutputError'

/**
 * Verifies if there is a user with the API key and returns that user's id
 */
export class VerifyApiKeyInteractor extends Interactor<VerifyApiKeyInput, VerifyApiKeyOutput, VerifyApiKeyRepository> {
	constructor(repository: VerifyApiKeyRepository) {
		super(repository)
	}

	/**
	 * Verifies if there is a user with the specified API key
	 * @param input an object containing the API key
	 * @return An object containing the user id if successful
	 * @throws {OutputErrorTypes.userNotFound} if no user was found with the specified APi key
	 * @throws {OutputErrorTypes.internalError} if an internal error occurred
	 */
	async execute(input: VerifyApiKeyInput): Promise<VerifyApiKeyOutput> {
		const findUserPromise = this.repository.findUserWithApiKey(input.apiKey)

		return findUserPromise
			.then((id) => {
				return { id: id }
			})
			.catch((reason) => {
				if (reason instanceof InternalError) {
					if (reason.type == InternalError.Types.userNotFound) {
						throw OutputError.create(OutputError.Types.userNotFound)
					}
				}
				throw OutputError.create(OutputError.Types.internalError)
			})
	}
}
