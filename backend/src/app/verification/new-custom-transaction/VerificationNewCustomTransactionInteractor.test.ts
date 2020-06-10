import { VerificationNewCustomTransactionInteractor } from './VerificationNewCustomTransactionInteractor'
import { VerificationNewCustomTransactionRepository } from './VerificationNewCustomTransactionRepository'
import { VerificationNewCustomTransactionInput } from './VerificationNewCustomTransactionInput'
import { VerificationNewCustomTransactionOutput } from './VerificationNewCustomTransactionOutput'
import * as faker from 'faker'
import { Id } from '../../core/definitions/Id'
import { Currency } from '../../core/definitions/Currency'
import { VerificationTypes } from '../../core/entities/Verification'
import { InternalError } from '../../core/definitions/InternalError'
import { OutputErrorTypes } from '../../core/definitions/OutputError'

const localCurrency = Currency.Codes.SEK

describe('New verification from custom transactions #cold #use-case', () => {
	let interactor: VerificationNewCustomTransactionInteractor
	let repository: VerificationNewCustomTransactionRepository
	let input: VerificationNewCustomTransactionInput
	let output: Promise<VerificationNewCustomTransactionOutput>

	beforeAll(() => {
		repository = {
			getExchangeRate(date: string, fromCode: Currency.Code, toCode: Currency.Code) {
				return 10
			},
			getLocalCurrency(userId: Id): Currency.Code {
				return localCurrency
			},
		}
		interactor = new VerificationNewCustomTransactionInteractor(repository)
	})

	it('Minimum valid input', async () => {
		input = {
			verification: {
				name: 'test',
				date: '2020-01-01',
				transactions: [
					{
						accountNumber: 2020,
						amount: 100n,
						currencyCode: localCurrency.name,
					},
					{
						accountNumber: 1960,
						amount: -100n,
						currencyCode: localCurrency.name,
					},
				],
			},
			userId: 1,
		}

		output = interactor.execute(input)

		// expect(output).resolves.toBeInstanceOf(VerificationNewCustomTransactionInteractor)
		expect.assertions(1)
		await expect(output).resolves.toMatchObject({
			userId: input.userId,
			name: input.verification.name,
			date: input.verification.date,
			type: VerificationTypes.TRANSACTION,
			transactions: [
				{
					accountNumber: 2020,
					currency: {
						amount: 100n,
						code: localCurrency,
					},
				},
				{
					accountNumber: 1960,
					currency: {
						amount: -100n,
						code: localCurrency,
					},
				},
			],
		})
	})

	it('Test full input', async () => {
		input = {
			verification: {
				name: 'test',
				date: '2020-01-01',
				description: 'My description',
				files: ['1', '2', '3'],
				transactions: [
					{
						accountNumber: 2020,
						amount: 100n,
						currencyCode: 'USD',
					},
					{
						accountNumber: 1960,
						amount: -100n,
						currencyCode: 'USD',
					},
				],
			},
			userId: 1,
		}

		output = interactor.execute(input)

		expect.assertions(1)
		await expect(output).resolves.toMatchObject({
			userId: input.userId,
			name: input.verification.name,
			date: input.verification.date,
			description: input.verification.description,
			files: input.verification.files,
			type: VerificationTypes.TRANSACTION,
			transactions: [
				{
					accountNumber: 2020,
					currency: {
						amount: 100n,
						code: Currency.Codes.USD,
						localCode: localCurrency,
						exchangeRate: 10,
					},
				},
				{
					accountNumber: 1960,
					currency: {
						amount: -100n,
						code: Currency.Codes.USD,
						localCode: localCurrency,
						exchangeRate: 10,
					},
				},
			],
		})
	})

	it('Test error handling', async () => {
		input = {
			userId: 1,
			verification: {
				name: 'H',
				date: '22',
				transactions: [],
			},
		}

		output = interactor.execute(input)

		expect.assertions(1)
		await expect(output).rejects.toEqual({
			type: OutputErrorTypes.invalidInput,
			errors: ['name-too-short', 'verification-date-invalid-format', 'transactions-missing'],
		})
	})
})
