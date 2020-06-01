import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewCustomTransactionInput } from './VerificationNewCustomTransactionInput'
import { VerificationNewCustomTransactionOutput } from './VerificationNewCustomTransactionOutput'
import { VerificationNewCustomTransactionRepository } from './VerificationNewCustomTransactionRepository'

/**
 * TODO Write documentation for VerificationNewCustomTransactionInteractor
 * Contains the business logic of the specific use case.
 * Interacts with the underlying entities (enterprise wide
 * business rules)
 */
export class VerificationNewCustomTransactionInteractor extends Interactor<VerificationNewCustomTransactionInput, VerificationNewCustomTransactionOutput, VerificationNewCustomTransactionRepository> {
	constructor(repository: VerificationNewCustomTransactionRepository) {
		super(repository)
	}

	/**
	 * TODO Write documentation for VerificationNewCustomTransactionInteractor.execute()
	 * @param input:
	 * @return {Promise.<VerificationNewCustomTransactionOutput>}
	 * @throws
	 */
	execute(input: VerificationNewCustomTransactionInput): Promise<VerificationNewCustomTransactionOutput> {
		return new Promise<VerificationNewCustomTransactionOutput>((resolve, reject) => {
			// TODO write implementation
		})
	}
}
