import * as faker from 'faker'
import { Verification } from './Verification'
import { Transaction } from './Transaction'
import { EntityErrors } from '../definitions/EntityErrors'
import { Currency } from './Currency'

function fakerValidDate(): number {
	return faker.date.between('2010-01-01', '2020-01-01').getTime()
}

function fakerTransaction(): Transaction.Option {
	return {
		userId: faker.random.number(),
		accountNumber: faker.random.number({ min: 1000, max: 2000 }),
		currency: new Currency({
			amount: BigInt(faker.random.number({ min: 1, max: 10000000 })),
			code: 'SEK',
		}),
	}
}

function fakerValidTransactionPair(): Transaction.Option[] {
	const transaction = fakerTransaction()
	const opposite: Transaction.Option = {
		userId: transaction.userId,
		accountNumber: faker.random.number({ min: 3000, max: 4000 }),
		currency: transaction.currency.negate(),
	}

	return [transaction, opposite]
}

describe('Verification test #cold #entity', () => {
	let verification: Verification

	beforeEach(() => {
		const validData: Verification.Option = {
			userId: 1,
			name: 'Test',
			date: '2020-01-15',
			type: Verification.Types.TRANSACTION,
			transactions: fakerValidTransactionPair(),
		}
		verification = new Verification(validData)
	})

	// Minimum valid
	it('Minimum valid verification', () => {
		expect(verification.validate()).toStrictEqual([])
	})

	// Name
	it('Valid name', () => {
		verification.name = '123'
		expect(verification.validate()).toStrictEqual([])
	})

	it('Too short name', () => {
		verification.name = '12'
		expect(verification.validate()).toStrictEqual([{ error: EntityErrors.nameTooShort, data: verification.name }])
	})

	// Internal name
	it('Valid internal name', () => {
		verification.internalName = '123'
		expect(verification.validate()).toStrictEqual([])
	})

	it('Too short internal name', () => {
		verification.internalName = '12'
		expect(verification.validate()).toStrictEqual([
			{ error: EntityErrors.internalNameTooShort, data: verification.internalName },
		])
	})

	// Verification number
	it('Invalid verification number (less than 1)', () => {
		verification.dateCreated = fakerValidDate()
		verification.dateFiled = verification.dateCreated

		verification.number = 0
		expect(verification.validate()).toMatchObject([{ error: EntityErrors.verificationNumberInvalid }])
		verification.number = faker.random.number({ min: -99999, max: 0 })
		expect(verification.validate()).toMatchObject([{ error: EntityErrors.verificationNumberInvalid }])
	})

	it('Verification number set, but missing date filed', () => {
		verification.number = 1
		expect(verification.validate()).toStrictEqual([{ error: EntityErrors.verificationDateFiledMissing }])
	})

	// Date Filed
	it('Date filed but missing verification number', () => {
		verification.dateCreated = fakerValidDate()
		verification.dateFiled = verification.dateCreated
		expect(verification.validate()).toStrictEqual([{ error: EntityErrors.verificationNumberMissing }])
	})

	// it('Date filed but missing creation date', () => {
	// 	verification.dateFiled = faker_valid_date()
	// 	verification.number = 1
	// 	expect(verification.validate()).toStrictEqual([{error:EntityErrors.dateCreatedMissing}])
	// })

	it('Date filed before creation date', () => {
		verification.number = 1
		verification.dateFiled = faker.date.between('2010-01-01', '2014-12-31').getTime()
		verification.dateCreated = faker.date.between('2015-01-01', '2019-12-31').getTime()
		expect(verification.validate()).toMatchObject([{ error: EntityErrors.verificationDateFiledBeforeCreated }])
	})

	// Date
	it('Valid date formats', () => {
		verification.date = '2020-06-01'
		expect(verification.validate()).toStrictEqual([])
		verification.date = '2020-02-29'
		expect(verification.validate()).toStrictEqual([])
	})

	it('Invalid date formats', () => {
		verification.date = ''
		expect(verification.validate()).toStrictEqual([
			{ error: EntityErrors.verificationDateInvalidFormat, data: verification.date },
		])
		verification.date = '20'
		expect(verification.validate()).toStrictEqual([
			{ error: EntityErrors.verificationDateInvalidFormat, data: verification.date },
		])
		verification.date = '2019-13-01'
		expect(verification.validate()).toStrictEqual([
			{ error: EntityErrors.verificationDateInvalidFormat, data: verification.date },
		])
		verification.date = '2019-02-29'
		expect(verification.validate()).toStrictEqual([
			{ error: EntityErrors.verificationDateInvalidFormat, data: verification.date },
		])
	})

	// Total amount
	it('Total original amount does not exist in any transaction (different amounts)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount + 1n, code: currency.code })
		expect(verification.validate()).toStrictEqual([
			{ error: EntityErrors.verificationAmountDoesNotMatchAnyTransaction },
		])
	})

	it('Total amount does not exist in any transaction (currency code)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount, code: Currency.Codes.BBD })
		expect(verification.validate()).toStrictEqual([
			{ error: EntityErrors.verificationAmountDoesNotMatchAnyTransaction },
		])
	})

	// Transaction sum
	it('Transaction sum is not zero', () => {
		verification.transactions.push(
			new Transaction({
				userId: faker.random.number(),
				accountNumber: 2666,
				currency: new Currency({
					amount: 1n,
					code: 'SEK',
				}),
			})
		)

		expect(verification.validate()).toStrictEqual([{ error: EntityErrors.transactionSumIsNotZero, data: '1' }])
	})

	// Missing transactions
	it('Missing transactions', () => {
		verification.transactions = []
		expect(verification.validate()).toStrictEqual([{ error: EntityErrors.transactionsMissing }])
	})

	// Mismatch local code for transactions
	it('Transaction local code mismatch', () => {
		const firstTransaction = new Transaction({
			userId: faker.random.number(),
			accountNumber: 3000,
			currency: new Currency({
				amount: 10n,
				code: 'SEK',
			}),
		})

		// Should never report sum doesn't equal 0, because we can't check the sum...
		verification.transactions = [
			firstTransaction,
			new Transaction({
				userId: faker.random.number(),
				accountNumber: 6000,
				currency: new Currency({
					amount: -1n,
					code: 'USD',
					localCode: 'SEK',
					exchangeRate: 10,
				}),
			}),
			new Transaction({
				userId: faker.random.number(),
				accountNumber: 5000,
				currency: new Currency({
					amount: 50n,
					code: 'EUR',
					localCode: 'USD',
					exchangeRate: 5,
				}),
			}),
		]

		verification.totalAmount = firstTransaction.currency

		expect(verification.validate()).toMatchObject([{ error: EntityErrors.transactionsCurrencyCodeLocalMismatch }])
	})

	it('Types.fromString() -> Check so that it works', () => {
		expect.assertions(2 * TYPES.length)
		for (const typeString of TYPES) {
			const type = Verification.Types.fromString(typeString)
			expect(type).toBeDefined()
			expect(type).toEqual(typeString)
		}
	})

	const TYPES: string[] = [
		'INVOICE_IN',
		'INVOICE_IN_PAYMENT',
		'INVOICE_OUT',
		'INVOICE_OUT_PAYMENT',
		'PAYMENT_DIRECT_IN',
		'PAYMENT_DIRECT_OUT',
		'TRANSACTION',
	]
})
