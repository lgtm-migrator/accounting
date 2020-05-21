import { Interactor } from '../core/definitions/Interactor'
import { VerifyApiKeyInput } from './VerifyApiKeyInput'
import { VerifyApiKeyOutput } from './VerifyApiKeyOutput'
import { VerifyApiKeyRepository } from './VerifyApiKeyRepository'

/**
 * TODO Write documentation for VerifyApiKeyInteractor
 * Contains the business logic of the specific use case.
 * Interacts with the underlying entities (enterprise wide
 * business rules)
 */
export class VerifyApiKeyInteractor extends Interactor<VerifyApiKeyInput, VerifyApiKeyOutput, VerifyApiKeyRepository> {
	constructor(repository: VerifyApiKeyRepository) {
		super(repository)
	}

	/**
	 * TODO Write documentation for VerifyApiKeyInteractor.execute()
	 * @param input:
	 * @return {Promise.<VerifyApiKeyOutput>}
	 * @throws
	 */
	execute(input: VerifyApiKeyInput): Promise<VerifyApiKeyOutput> {
		return new Promise<VerifyApiKeyOutput>((resolve, reject) => {
			const findUserPromise = this.repository.findUserWithApiKey(input.apiKey)

			findUserPromise
				.then((id) => {
					resolve({
						id: id,
					})
				})
				.catch((reason) => {
					reject(new Error('test'))
				})
		})
	}
}
