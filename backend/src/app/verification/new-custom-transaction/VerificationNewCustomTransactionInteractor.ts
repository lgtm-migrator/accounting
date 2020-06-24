import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewCustomTransactionInput, TransactionInputData } from './VerificationNewCustomTransactionInput'
import { VerificationNewCustomTransactionOutput } from './VerificationNewCustomTransactionOutput'
import { VerificationNewCustomTransactionRepository } from './VerificationNewCustomTransactionRepository'
import { Transaction } from '../../core/entities/Transaction'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { EntityErrors } from '../../core/definitions/EntityErrors'
import { OutputError } from '../../core/definitions/OutputError'

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
	 * @throws {OutputError} when the input data is invalid. See the errors for what was invalid
	 */
	async execute(input: VerificationNewCustomTransactionInput): Promise<VerificationNewCustomTransactionOutput> {
		this.input = input

		return this.repository
			.getLocalCurrency(this.input.userId)
			.then((localCurrency) => {
				return this.createTransactions(localCurrency)
			})
			.then((transactions) => {
				return this.createVerification(transactions)
			})
	}

	/**
	 * Create transactions from the input
	 * @param localCurrencyCode the currency code for the current user
	 * @return create transactions from the specified inputs
	 */
	private async createTransactions(localCurrencyCode: Currency.Code): Promise<Transaction[]> {
		const promises = this.input.verification.transactions.map(async (transaction) => {
			return this.createTransaction(transaction, localCurrencyCode)
		})
		return Promise.all(promises)
	}

	/**
	 * Create a transaction
	 * @param transactionInputData data of the transaction to create
	 * @param localCurrencyCode code of the local currency
	 * @return promise of the transaction
	 */
	private async createTransaction(
		transactionInputData: TransactionInputData,
		localCurrencyCode: Currency.Code
	): Promise<Transaction> {
		const code = Currency.Codes.fromString(transactionInputData.currencyCode)
		if (!code) {
			throw new OutputError(OutputError.Types.invalidInput, [EntityErrors.currencyCodeInvalid])
		}

		let exchangeRatePromise: Promise<number | undefined> = Promise.resolve(undefined)

		if (code !== localCurrencyCode) {
			exchangeRatePromise = this.repository.getExchangeRate(this.input.verification.date, code, localCurrencyCode)
		}

		return exchangeRatePromise.then((exchangeRate) => {
			let localCode: Currency.Code | undefined
			if (code !== localCurrencyCode) {
				localCode = localCurrencyCode
			}

			let transactionData: Transaction.Option = {
				accountNumber: transactionInputData.accountNumber,
				currency: new Currency({
					amount: transactionInputData.amount,
					code: code,
					localCode: localCode,
					exchangeRate: exchangeRate,
				}),
			}
			return Promise.resolve(new Transaction(transactionData))
		})
	}

	/**
	 * Create a verification and validate it
	 * @param transactions the transactions of the verification
	 * @return verification object
	 */
	private async createVerification(transactions: Transaction[]): Promise<Verification> {
		const verification = new Verification({
			userId: this.input.userId,
			name: this.input.verification.name,
			date: this.input.verification.date,
			type: Verification.Types.TRANSACTION,
			files: this.input.verification.files?.concat(),
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
