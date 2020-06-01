import { VerificationNewCustomTransactionInteractor } from './VerificationNewCustomTransactionInteractor'
import { VerificationNewCustomTransactionRepository } from './VerificationNewCustomTransactionRepository'
import { VerificationNewCustomTransactionInput } from './VerificationNewCustomTransactionInput'
import { VerificationNewCustomTransactionOutput } from './VerificationNewCustomTransactionOutput'
import * as faker from 'faker'

describe('TODO #cold #use-case', () => {
	let interactor: VerificationNewCustomTransactionInteractor
	let repository: VerificationNewCustomTransactionRepository
	let input: VerificationNewCustomTransactionInput
	let output: VerificationNewCustomTransactionOutput

	beforeAll(() => {
		repository = {}
		interactor = new VerificationNewCustomTransactionInteractor(repository)
	})
})
