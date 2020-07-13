import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewInput } from './VerificationNewInput'
import { VerificationNewOutput } from './VerificationNewOutput'
import { VerificationNewRepository } from './VerificationNewRepository'
import { Transaction } from '../../core/entities/Transaction'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'
import { EntityErrors } from '../../core/definitions/EntityErrors'
import { TransactionFactory } from '../TransactionFactory'

/**
 * Creates a valid verification from a new direct payment
 */
export class VerificationNewInteractor extends Interactor<
	VerificationNewInput,
	VerificationNewOutput,
	VerificationNewRepository
> {
	localCurrencyCode?: Currency.Code

	constructor(repository: VerificationNewRepository) {
		super(repository)
	}

	/**
	 * Create a valid verification from the specified input
	 * @param input
	 * @return {Promise.<VerificationNewOutput>}
	 * @throws {OutputError} when the input data is invalid. See the errors property for what was invalid
	 */
	async execute(input: VerificationNewInput): Promise<VerificationNewOutput> {
		this.input = input

		const code = Currency.Codes.fromString(this.input.verification.currencyCode)
		if (!code) {
			throw OutputError.create(
				OutputError.Types.invalidInput,
				EntityErrors.currencyCodeInvalid,
				input.verification.currencyCode
			)
		}

		const localCurrencyPromise = this.repository.getLocalCurrency(this.input.userId)
		const accountFromPromise = this.repository.getAccountDetails(this.input.verification.accountFrom)
		const accountToPromise = this.repository.getAccountDetails(this.input.verification.accountTo)
		const promises = Promise.all([localCurrencyPromise, accountFromPromise, accountToPromise])

		return promises
			.then(async ([localCurrencyCode, accountFrom, accountTo]) => {
				let exchangeRatePromise: Promise<number | undefined> = Promise.resolve(undefined)
				if (code != localCurrencyCode) {
					exchangeRatePromise = this.repository.getExchangeRate(this.input.verification.date, code, localCurrencyCode)
				}

				const exchangeRate = await exchangeRatePromise
				return TransactionFactory.createTransactions({
					userId: this.input.userId,
					amount: this.input.verification.amount,
					code: code,
					localCode: localCurrencyCode,
					exchangeRate: exchangeRate,
					accountFrom: accountFrom,
					accountTo: accountTo,
				})
			})
			.then(async (transactions) => {
				return this.createVerification(transactions)
			})
			.catch((reason) => {
				if (reason instanceof InternalError) {
					if (reason.type === InternalError.Types.accountNumberNotFound) {
						const type = OutputError.Types.invalidInput
						throw OutputError.create(type, EntityErrors.accountNumberDoesNotExist, String(reason.error))
						// TODO log error
					}
				}

				throw reason
			})
	}

	/**
	 * Create a verification and validate it
	 * @param transactions the transactions of the verification
	 * @return verification object
	 */
	private async createVerification(transactions: Transaction[]): Promise<Verification> {
		let type = Verification.Types.fromString(this.input.verification.type)

		const verification = new Verification({
			userId: this.input.userId,
			name: this.input.verification.name,
			internalName: this.input.verification.internalName,
			date: this.input.verification.date,
			type: type,
			description: this.input.verification.description,
			transactions: transactions,
		})

		const errors = verification.validate()
		if (errors.length > 0) {
			throw new OutputError(OutputError.Types.invalidInput, errors)
		}

		return Promise.resolve(verification)
	}
}
