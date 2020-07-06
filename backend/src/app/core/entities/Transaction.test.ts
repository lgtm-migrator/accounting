import * as faker from 'faker'
import { Transaction } from './Transaction'
import { Currency } from './Currency'
import { EntityErrors } from '../definitions/EntityErrors'
import { Consts } from '../definitions/Consts'

const TEST_TIMES = 1000
const CURRENCY_CODES = Object.values(Currency.Codes)

function fakerValidAccountNumber(): number {
	return faker.random.number({ min: Consts.ACCOUNT_NUMBER_START, max: Consts.ACCOUNT_NUMBER_END })
}

function fakerValidAmount(): bigint {
	let number: bigint
	do {
		number = BigInt(faker.random.number({ min: -1000000, max: 10000000 }))
	} while (number == 0n)
	return number
}

function fakerValidCurrencyAmount(): Currency {
	return new Currency({ amount: fakerValidAmount(), code: fakerValidCurrencyCode() })
}

function fakerValidCurrencyCode(): string {
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
			userId: 1,
			accountNumber: fakerValidAccountNumber(),
			currency: fakerValidCurrencyAmount(),
		}
		transaction = new Transaction(data)
	})

	// Account number
	it('Minimal valid transaction', () => {
		expect(transaction.validate()).toStrictEqual([])
	})

	it('Account number fails if negative', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.accountNumber = faker.random.number({
				min: Number.MIN_SAFE_INTEGER,
				max: Consts.ACCOUNT_NUMBER_START - 1,
			})
			expect(transaction.validate()).toStrictEqual([EntityErrors.accountNumberOutOfRange])
		}
	})

	it('Account number fails if too large', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.accountNumber = faker.random.number({
				min: Consts.ACCOUNT_NUMBER_END + 1,
				max: Number.MAX_SAFE_INTEGER,
			})
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
			transaction.currency = fakerValidCurrencyAmount()
			if (!transaction.currency.isZero()) {
				expect(transaction.validate()).toStrictEqual([])
			}
		}
	})

	it('Currency amount is 0', () => {
		transaction.currency = new Currency({ amount: 0n, code: fakerValidCurrencyCode() })
		expect(transaction.validate()).toStrictEqual([EntityErrors.amountIsZero])
	})
})
