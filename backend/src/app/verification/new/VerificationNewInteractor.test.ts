import { VerificationNewInteractor } from './VerificationNewInteractor'
import { VerificationNewInputInterface } from './VerificationNewInput'
import { VerificationNewOutput } from './VerificationNewOutput'
import { VerificationRepositoryTest } from '../../../jest/VerificationRepositoryTest'
import { Accounts } from '../../../jest/AccountTestData'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { Account } from '../../core/entities/Account'
import { OutputError } from '../../core/definitions/OutputError'
import { EntityErrors } from '../../core/definitions/EntityErrors'

function validFromInput(input: VerificationNewInputInterface): Verification.Option {
	return {
		userId: input.userId,
		name: input.verification.name,
		date: input.verification.date,
		description: input.verification.description,
		internalName: input.verification.internalName,
		type: Verification.Types.fromString(input.verification.type),
		transactions: [],
	}
}

function testEquality(verification: VerificationNewOutput, valid: Verification.Option) {
	expect(verification.userId).toStrictEqual(valid.userId)
	expect(verification.name).toStrictEqual(valid.name)
	expect(verification.date).toStrictEqual(valid.date)
	expect(verification.internalName).toStrictEqual(valid.internalName)
	expect(verification.description).toStrictEqual(valid.description)
	expect(verification.files).toStrictEqual(valid.files)
	expect(verification.type).toEqual(valid.type)
	expect(verification.transactions.length).toStrictEqual(valid.transactions.length)

	for (const transaction of valid.transactions) {
		expect(verification.transactions).toContainEqual(expect.objectContaining(transaction))
	}
}

describe('New Verification #cold #use-case', () => {
	let interactor: VerificationNewInteractor
	let input: VerificationNewInputInterface
	let output: Promise<VerificationNewOutput>
	let valid: Verification.Option

	const LOCAL_CODE = VerificationRepositoryTest.LOCAL_CODE
	const EXCHANGE_RATE = VerificationRepositoryTest.EXCHANGE_RATE
	const MIN_ASSERTIONS = 8

	beforeAll(() => {
		interactor = new VerificationNewInteractor(new VerificationRepositoryTest())
	})

	beforeEach(() => {
		// Minimum valid input
		input = {
			userId: 1,
			verification: {
				name: 'test',
				date: '2020-03-14',
				accountFrom: Accounts.BANK_ACCOUNT.number,
				accountTo: Accounts.EXPENSE_BANK.number,
				amount: 10,
				currencyCode: LOCAL_CODE.name,
				type: Verification.Types.PAYMENT_DIRECT_OUT,
			},
		}

		valid = validFromInput(input)
		valid.transactions = [
			{
				accountNumber: Accounts.BANK_ACCOUNT.number,
				currency: new Currency({
					amount: -input.verification.amount,
					code: LOCAL_CODE,
				}),
			},
			{
				accountNumber: Accounts.EXPENSE_BANK.number,
				currency: new Currency({
					amount: input.verification.amount,
					code: LOCAL_CODE,
				}),
			},
		]
	})

	it('Minimum valid input', async () => {
		output = interactor.execute(input)

		expect.assertions(MIN_ASSERTIONS + valid.transactions.length)
		await output.then((verification) => {
			testEquality(verification, valid)
		})
	})

	it('Full valid input with abroad expense', async () => {
		input.verification.internalName = 'MY_NAME'
		input.verification.description = 'This is my description'
		input.verification.currencyCode = 'USD'

		input.verification.accountFrom = Accounts.INVOICE_IN.number
		input.verification.accountTo = Accounts.EXPENSE_ABROAD.number

		valid = validFromInput(input)
		valid.transactions = [
			{
				accountNumber: Accounts.INVOICE_IN.number,
				currency: new Currency({
					amount: -1000n,
					localAmount: -10000n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
			{
				accountNumber: Accounts.EXPENSE_ABROAD.number,
				currency: new Currency({
					amount: 1000n,
					localAmount: 10000n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
			{
				accountNumber: Accounts.VAT_ABROAD_IN.number,
				currency: new Currency({
					amount: 250n,
					localAmount: 2500n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
			{
				accountNumber: Accounts.VAT_ABROAD_OUT.number,
				currency: new Currency({
					amount: -250n,
					localAmount: -2500n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
		]

		output = interactor.execute(input)

		expect.assertions(MIN_ASSERTIONS + valid.transactions.length)
		await output.then((verification) => {
			testEquality(verification, valid)
		})
	})

	it('Invalid input', async () => {
		expect.assertions(2)

		input.verification.accountFrom = 2000
		input.verification.date = '22'
		input.verification.amount = 0

		output = interactor.execute(input)

		await expect(output).rejects.toEqual({
			type: OutputError.Types.invalidInput,
			errors: [EntityErrors.accountNumberDoesNotExist],
		})

		input.verification.accountFrom = Accounts.BANK_ACCOUNT.number
		output = interactor.execute(input)
		await expect(output).rejects.toEqual({
			type: OutputError.Types.invalidInput,
			errors: [EntityErrors.verificationDateInvalidFormat, EntityErrors.amountIsZero],
		})
	})
})
