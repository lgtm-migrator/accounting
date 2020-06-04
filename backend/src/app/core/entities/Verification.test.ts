import * as faker from 'faker'
import { VerificationImpl, Verification, VerificationTypes } from './Verification'
import { Transaction } from './Transaction'
import { EntityErrors } from '../definitions/EntityErrors'
import { Currency } from '../definitions/Currency'

function faker_valid_date(): number {
	return faker.date.between('2010-01-01', '2020-01-01').getTime()
}

function faker_transaction(): Transaction {
	return {
		accountNumber: faker.random.number({ min: 1000, max: 2000 }),
		currency: new Currency({
			amount: BigInt(faker.random.number({ min: 1, max: 10000000 })),
			code: 'SEK',
		}),
	}
}

function faker_valid_transaction_pair(): Transaction[] {
	const transaction = faker_transaction()
	const opposite: Transaction = {
		accountNumber: faker.random.number({ min: 3000, max: 4000 }),
		currency: transaction.currency.negate(),
	}

	return [transaction, opposite]
}

describe('Verification test #cold #entity', () => {
	let verification: VerificationImpl

	beforeEach(() => {
		const validData: Verification = {
			userId: 1,
			name: 'Test',
			date: '2020-01-15',
			type: VerificationTypes.TRANSACTION,
			transactions: faker_valid_transaction_pair(),
		}
		verification = new VerificationImpl(validData)
	})

	// Minimum valid
	it('Minimum valid verification', () => {
		expect(verification.validate()).toStrictEqual([])
	})

	// User ID
	it('Invalid user id', () => {
		verification.userId = ''
		expect(verification.validate()).toStrictEqual([EntityErrors.userIdIsEmpty])
	})

	// Verification number
	it('Invalid verification number (less than 1)', () => {
		verification.dateCreated = faker_valid_date()
		verification.dateFiled = verification.dateCreated

		verification.number = 0
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationNumberInvalid])
		verification.number = faker.random.number({ min: -99999, max: 0 })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationNumberInvalid])
	})

	it('Verification number set, but missing date filed', () => {
		verification.number = 1
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateFiledMissing])
	})

	// Date Filed
	it('Date filed but missing verification number', () => {
		verification.dateCreated = faker_valid_date()
		verification.dateFiled = verification.dateCreated
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationNumberMissing])
	})

	it('Date filed but missing creation date', () => {
		verification.dateFiled = faker_valid_date()
		verification.number = 1
		expect(verification.validate()).toStrictEqual([EntityErrors.dateCreatedMissing])
	})

	it('Date filed before creation date', () => {
		verification.number = 1
		verification.dateFiled = faker.date.between('2010-01-01', '2014-12-31').getTime()
		verification.dateCreated = faker.date.between('2015-01-01', '2019-12-31').getTime()
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateFiledBeforeCreated])
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
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
		verification.date = '20'
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
		verification.date = '2019-13-01'
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
		verification.date = '2019-02-29'
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
	})

	// Total amount
	it('Total original amount does not exist in any transaction (different amounts)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount + 1n, code: currency.code })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationAmountDoesNotMatchAnyTransaction])
	})

	it('Total amount does not exist in any transaction (currency code)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount, code: Currency.Codes.BBD })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationAmountDoesNotMatchAnyTransaction])
	})

	// Transaction sum
	it('Transaction sum is not zero', () => {})
})
