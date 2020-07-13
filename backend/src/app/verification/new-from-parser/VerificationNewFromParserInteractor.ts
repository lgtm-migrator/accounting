import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewFromParserInput } from './VerificationNewFromParserInput'
import { VerificationNewFromParserOutput } from './VerificationNewFromParserOutput'
import { VerificationNewFromParserRepository } from './VerificationNewFromParserRepository'
import { Parser } from '../../core/entities/Parser'
import { OutputError } from '../../core/definitions/OutputError'
import { EntityErrors } from '../../core/definitions/EntityErrors'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { TransactionFactory } from '../TransactionFactory'
import { InternalError } from '../../core/definitions/InternalError'

/**
 * Create a verification from any supported file types
 */
export class VerificationNewFromParserInteractor extends Interactor<
	VerificationNewFromParserInput,
	VerificationNewFromParserOutput,
	VerificationNewFromParserRepository
> {
	constructor(repository: VerificationNewFromParserRepository) {
		super(repository)
	}

	/**
	 * Create a valid verification from any supported file types
	 * @param input the input
	 * @return {Promise.<VerificationNewFromParserOutput>}
	 * @throws {OutputError.Types.invalidInput} when a file can't be read
	 */
	async execute(input: VerificationNewFromParserInput): Promise<VerificationNewFromParserOutput> {
		this.input = input

		const localCurrencyCodePromise = this.repository.getLocalCurrency(input.userId)
		const getParsersPromise = this.repository.getParsers(input.userId)

		return Promise.all([localCurrencyCodePromise, getParsersPromise])
			.then(([localCurrencyCode, parsers]) => {
				// Parse one file at a time
				const promises = input.files.map(async (file) => {
					return this.parseFile(file, parsers, localCurrencyCode)
				})
				return Promise.all(promises)
			})
			.then((verifications) => {
				// Flatten
				return Promise.resolve({ verifications: verifications.flat() })
			})
			.catch((exception) => {
				if (exception instanceof InternalError) {
					throw OutputError.create(OutputError.Types.internalError)
					// TODO log error
				} else if (exception instanceof Error) {
					throw OutputError.create(OutputError.Types.internalError)
					// TODO log error
				}

				throw exception
			})
	}

	private async parseFile(file: string, parsers: Parser[], localCurrencyCode: Currency.Code): Promise<Verification[]> {
		return this.repository
			.readFile(file)
			.then((text) => {
				return this.parseText(text, parsers)
			})
			.then((verificationInfos) => {
				const promises = verificationInfos.map((verificationInfo) =>
					this.createVerificationFromInfo(verificationInfo, localCurrencyCode, file)
				)
				return Promise.all(promises)
			})
	}

	private async parseText(text: string, parsers: Parser[]): Promise<Parser.VerificationInfo[]> {
		for (const parser of parsers) {
			if (parser.isOfType(text)) {
				return Promise.resolve(parser.parse(text))
			}
		}

		throw OutputError.create(OutputError.Types.invalidInput, EntityErrors.parserNotFound)
	}

	private async createVerificationFromInfo(
		info: Parser.VerificationInfo,
		localCurrencyCode: Currency.Code,
		file: string
	): Promise<Verification> {
		// Get exchange rate
		let exchangeRatePromise: Promise<number | undefined> = Promise.resolve(undefined)

		if (info.code != localCurrencyCode) {
			exchangeRatePromise = this.repository.getExchangeRate(info.date, info.code, localCurrencyCode)
		}

		// Get accounts
		const accountFromPromise = this.repository.getAccountDetails(info.accountFrom)
		const acountToPromise = this.repository.getAccountDetails(info.accountTo)

		const promises = Promise.all([exchangeRatePromise, accountFromPromise, acountToPromise])

		return promises
			.then(([exchangeRate, accountFrom, accountTo]) => {
				// Create transactions
				const transactionInfo: TransactionFactory.Option = {
					userId: this.input.userId,
					amount: info.amount,
					code: info.code,
					localCode: localCurrencyCode,
					exchangeRate: exchangeRate,
					accountFrom: accountFrom,
					accountTo: accountTo,
				}

				return TransactionFactory.createTransactions(transactionInfo)
			})
			.then((transactions) => {
				// Create
				const option: Verification.Option = {
					userId: this.input.userId,
					name: info.name,
					internalName: info.internalName,
					type: info.type,
					date: info.date,
					transactions: transactions,
				}

				return new Verification(option)
			})
	}
}
