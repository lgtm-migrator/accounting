import * as faker from 'faker'
import { Transaction, ACCOUNT_NUMBER_MIN, ACCOUNT_NUMBER_MAX } from './Transaction'
import { Currency } from './Currency'
import { EntityErrors } from '../definitions/EntityErrors'

const TEST_TIMES = 1000
const CURRENCY_CODES = Object.values(Currency.Codes)

function faker_valid_account_number(): number {
	return faker.random.number({ min: ACCOUNT_NUMBER_MIN, max: ACCOUNT_NUMBER_MAX })
}

function faker_valid_amount(): bigint {
	let number: bigint
	do {
		number = BigInt(faker.random.number({ min: -1000000, max: 10000000 }))
	} while (number == 0n)
	return number
}

function faker_valid_currency_amount(): Currency {
	return new Currency({ amount: faker_valid_amount(), code: faker_valid_currency_code() })
}

function faker_valid_currency_code(): string {
	let currencyCode
	do {
		const index = faker.random.number({ min: 0, max: CURRENCY_CODES.length - 1 })
		currencyCode = CURRENCY_CODES[index]
	} while (!currencyCode.hasOwnProperty('precision'))
	return currencyCode.name
}

describe('Validate a transaction #cold #entity', () => {
	let transaction: Transaction

	beforeEach(() => {
		const data: Transaction.Option = {
			accountNumber: faker_valid_account_number(),
			currency: faker_valid_currency_amount(),
		}
		transaction = new Transaction(data)
	})

	// Account number
	it('Minimal valid transaction', () => {
		expect(transaction.validate()).toStrictEqual([])
	})

	it('Account number fails if negative', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.accountNumber = faker.random.number({ min: Number.MIN_SAFE_INTEGER, max: ACCOUNT_NUMBER_MIN - 1 })
			expect(transaction.validate()).toStrictEqual([EntityErrors.accountNumberOutOfRange])
		}
	})

	it('Account number fails if too large', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.accountNumber = faker.random.number({ min: ACCOUNT_NUMBER_MAX + 1, max: Number.MAX_SAFE_INTEGER })
			expect(transaction.validate()).toStrictEqual([EntityErrors.accountNumberOutOfRange])
		}
	})

	it('Account number is invalid format (floating point)', () => {
		transaction.accountNumber = 1500.8
		expect(transaction.validate()).toStrictEqual([EntityErrors.accountNumberInvalidFormat])
	})

	// Currency
	it('Valid amount for the currency', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.currency = faker_valid_currency_amount()
			if (!transaction.currency.isZero()) {
				expect(transaction.validate()).toStrictEqual([])
			}
		}
	})

	it('Currency amount is 0', () => {
		transaction.currency = new Currency({ amount: 0n, code: faker_valid_currency_code() })
		expect(transaction.validate()).toStrictEqual([EntityErrors.amountIsZero])
	})
})
