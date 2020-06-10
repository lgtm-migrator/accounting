import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewCustomTransactionInput } from './VerificationNewCustomTransactionInput'
import { VerificationNewCustomTransactionOutput } from './VerificationNewCustomTransactionOutput'
import { VerificationNewCustomTransactionRepository } from './VerificationNewCustomTransactionRepository'
import { Transaction } from '../../core/entities/Transaction'
import { Currency } from '../../core/definitions/Currency'
import { VerificationImpl, VerificationTypes } from '../../core/entities/Verification'
import { InternalError, InternalErrorTypes } from '../../core/definitions/InternalError'
import { EntityErrors } from '../../core/definitions/EntityErrors'
import { OutputError, OutputErrorTypes } from '../../core/definitions/OutputError'

/**
 * Creates a valid verification with transactions from an input
 */
export class VerificationNewCustomTransactionInteractor extends Interactor<
	VerificationNewCustomTransactionInput,
	VerificationNewCustomTransactionOutput,
	VerificationNewCustomTransactionRepository
> {
	constructor(repository: VerificationNewCustomTransactionRepository) {
		super(repository)
	}

	/**
	 * Create a valid verification for the specified input
	 * @param input
	 * @return {Promise.<VerificationNewCustomTransactionOutput>}
	 * @throws {InternalError} when the input data is invalid. See the errors for what was invalid
	 */
	execute(input: VerificationNewCustomTransactionInput): Promise<VerificationNewCustomTransactionOutput> {
		this.input = input

		return new Promise<VerificationNewCustomTransactionOutput>((resolve, reject) => {
			let errors: EntityErrors[] = []
			// Create transactions
			let transactions = this.createTransactions()

			// Create verification
			let verification = this.createVerification(transactions)

			// Verify verification
			errors.push(...verification.validate())
			if (errors.length > 0) {
				throw new OutputError(OutputErrorTypes.invalidInput, errors)
			}

			// Resolve with a valid verification
			resolve(verification)
		})
	}

	/**
	 * Create transactions from the input
	 * @return create transactions from the specified inputs
	 */
	private createTransactions(): Transaction[] {
		let transactions: Transaction[] = []
		let localCurrencyCode = this.repository.getLocalCurrency(this.input.userId)
		let currencyOptions: Currency.Option

		for (let inputTransaction of this.input.verification.transactions) {
			// Calculate exchange rate
			let exchangeRate
			if (inputTransaction.currencyCode !== localCurrencyCode.name) {
				let code = Currency.Codes.fromString(inputTransaction.currencyCode)
				if (code) {
					exchangeRate = this.repository.getExchangeRate(this.input.verification.date, code, localCurrencyCode)
				}

				currencyOptions = {
					amount: inputTransaction.amount,
					code: inputTransaction.currencyCode,
					localCode: localCurrencyCode,
					exchangeRate: exchangeRate,
				}
			}
			// Local currency
			else {
				currencyOptions = {
					amount: inputTransaction.amount,
					code: localCurrencyCode,
				}
			}

			let currency = new Currency(currencyOptions)

			// Create transaction
			let transaction: Transaction = {
				accountNumber: inputTransaction.accountNumber,
				currency: currency,
			}
			transactions.push(transaction)
		}

		return transactions
	}

	/**
	 * Create a verification
	 * @param transactions the transactions of the verification
	 * @return verification object
	 */
	private createVerification(transactions: Transaction[]): VerificationImpl {
		let verification = new VerificationImpl({
			userId: this.input.userId,
			name: this.input.verification.name,
			date: this.input.verification.date,
			type: VerificationTypes.TRANSACTION,
			files: this.input.verification.files?.concat(),
			description: this.input.verification.description,
			transactions: transactions,
		})
		return verification
	}
}
