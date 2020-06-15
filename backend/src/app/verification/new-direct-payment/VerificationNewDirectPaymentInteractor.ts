import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewDirectPaymentInput } from './VerificationNewDirectPaymentInput'
import { VerificationNewDirectPaymentOutput } from './VerificationNewDirectPaymentOutput'
import { VerificationNewDirectPaymentRepository } from './VerificationNewDirectPaymentRepository'

/**
 * TODO Write documentation for VerificationNewDirectPaymentInteractor
 * Contains the business logic of the specific use case.
 * Interacts with the underlying entities (enterprise wide
 * business rules)
 */
export class VerificationNewDirectPaymentInteractor extends Interactor<VerificationNewDirectPaymentInput, VerificationNewDirectPaymentOutput, VerificationNewDirectPaymentRepository> {
	constructor(repository: VerificationNewDirectPaymentRepository) {
		super(repository)
	}

	/**
	 * TODO Write documentation for VerificationNewDirectPaymentInteractor.execute()
	 * @param input
	 * @return {Promise.<VerificationNewDirectPaymentOutput>}
	 * @throws
	 */
	execute(input: VerificationNewDirectPaymentInput): Promise<VerificationNewDirectPaymentOutput> {
		this.input = input

		return new Promise<VerificationNewDirectPaymentOutput>((resolve, reject) => {
			this.reject = reject
			// TODO write implementation
		})
	}
}
