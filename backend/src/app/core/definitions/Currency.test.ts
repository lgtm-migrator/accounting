import * as faker from 'faker'
import { Currency } from './Currency'
import { InternalError, InternalErrorTypes } from './InternalError'
import { EntityErrors } from './EntityErrors'

const TEST_TIMES = 1000

describe('Currency tester #cold #entity', () => {
	let data: Currency.Option

	it('Minimum valid currency', () => {
		data = {
			amount: 0n,
			code: 'SEK',
		}
		const valid = {
			amount: 0n,
			code: Currency.Codes.SEK,
		}
		expect(new Currency(data)).toEqual(valid)
	})

	// Currency code
	it('Invalid currency code', () => {
		expect.assertions(2)

		data = {
			amount: 0n,
			code: 'INVALID',
		}

		try {
			new Currency(data)
		} catch (e) {
			const errorObject = { errors: [EntityErrors.currencyCodeInvalid] }
			expect(e).toBeInstanceOf(InternalError)
			expect(e).toHaveProperty('error', errorObject)
		}
	})

	// Local currency code
	it('Invalid local currency code', () => {
		expect.assertions(2)

		data = {
			amount: 0n,
			code: 'SEK',
			localCode: 'INVALID',
			exchangeRate: 12,
		}

		try {
			new Currency(data)
		} catch (error) {
			const errorObject = { errors: [EntityErrors.currencyCodeLocalInvalid] }
			expect(error).toBeInstanceOf(InternalError)
			expect(error).toHaveProperty('error', errorObject)
		}
	})

	it('Missing local currency code', () => {
		expect.assertions(2)

		data = {
			amount: 0n,
			code: 'SEK',
			exchangeRate: 12,
		}
		try {
			new Currency(data)
		} catch (error) {
			const errorObject = { errors: [EntityErrors.currencyCodeLocalNotSet] }
			expect(error).toBeInstanceOf(InternalError)
			expect(error).toHaveProperty('error', errorObject)
		}
	})

	it('Currency codes are the same', () => {
		expect.assertions(2)

		data = {
			amount: 0n,
			code: 'SEK',
			localCode: 'SEK',
			exchangeRate: 12,
		}
		try {
			new Currency(data)
		} catch (error) {
			const errorObject = { errors: [EntityErrors.currencyCodesAreSame] }
			expect(error).toBeInstanceOf(InternalError)
			expect(error).toHaveProperty('error', errorObject)
		}
	})

	// Exchange rate
	it('Exchange rate below 0', () => {
		expect.assertions(2 * TEST_TIMES)

		const errorObject = { errors: [EntityErrors.exchangeRateNegativeOrZero] }
		for (let i = 0; i < TEST_TIMES; ++i) {
			data = {
				amount: 0n,
				code: 'SEK',
				localCode: 'USD',
				exchangeRate: faker.random.number({ min: -1000, max: 0, precision: 6 }),
			}
			try {
				new Currency(data)
			} catch (error) {
				expect(error).toBeInstanceOf(InternalError)
				expect(error).toHaveProperty('error', errorObject)
			}
		}
	})

	it('Exchange rate is 0', () => {
		expect.assertions(2)

		data = {
			amount: 0n,
			code: 'SEK',
			localCode: 'USD',
			exchangeRate: 0,
		}
		try {
			new Currency(data)
		} catch (error) {
			const errorObject = { errors: [EntityErrors.exchangeRateNegativeOrZero] }
			expect(error).toBeInstanceOf(InternalError)
			expect(error).toHaveProperty('error', errorObject)
		}
	})

	it('Exchange rate is missing', () => {
		expect.assertions(2)

		data = {
			amount: 0n,
			code: 'SEK',
			localCode: 'USD',
		}
		try {
			new Currency(data)
		} catch (error) {
			const errorObject = { errors: [EntityErrors.exchangeRateNotSet] }
			expect(error).toBeInstanceOf(InternalError)
			expect(error).toHaveProperty('error', errorObject)
		}
	})

	// isZero()
	it('isZero() -> Checking if amount is equal to 0', () => {
		data = {
			amount: 0n,
			code: 'SEK',
		}
		let currency = new Currency(data)
		expect(currency.isZero()).toBe(true)

		data = {
			amount: -1n,
			code: 'SEK',
		}
		currency = new Currency(data)
		expect(currency.isZero()).toBe(false)

		data = {
			amount: 1n,
			code: 'SEK',
		}
		currency = new Currency(data)
		expect(currency.isZero()).toBe(false)
	})

	// getLocalAmount()
	it('getLocalAmount() -> No local code, returning this directly', () => {
		data = {
			amount: 0n,
			code: 'SEK',
		}
		const currency = new Currency(data)
		expect(currency.getLocalCurrency()).toEqual(currency)
	})

	it('getLocalAmount() -> Simple test of conversion from 100 USD -> 1000 SEK', () => {
		data = {
			amount: 100n,
			code: 'USD',
			localCode: 'SEK',
			exchangeRate: 10,
		}
		let valid = {
			amount: 1000n,
			code: Currency.Codes.SEK,
		}
		expect(new Currency(data).getLocalCurrency()).toEqual(valid)
	})

	it('getLocalAmount() -> Test precision system conversion (with exchange rate of 1)', () => {
		// From SEK to JPY
		data = {
			amount: 1000n,
			code: 'SEK',
			localCode: 'JPY',
			exchangeRate: 1,
		}
		let valid = {
			amount: 10n,
			code: Currency.Codes.JPY,
		}
		expect(new Currency(data).getLocalCurrency()).toEqual(valid)

		// Back from JPY to SEK
		data = {
			amount: 10n,
			code: 'JPY',
			localCode: 'SEK',
			exchangeRate: 1,
		}
		valid = {
			amount: 1000n,
			code: Currency.Codes.SEK,
		}
		expect(new Currency(data).getLocalCurrency()).toEqual(valid)
	})

	it('getLocalAmount() -> Test various exchange rates to same precision', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			const exchangeRate = faker.random.number({ min: 0.00001, max: 1000, precision: 0.00000001 })
			const from = faker.random.number({ min: 1, max: 100000 })
			const to = Math.round(from * (exchangeRate + Number.EPSILON))

			data = {
				amount: BigInt(from),
				code: 'SEK',
				localCode: 'USD',
				exchangeRate: exchangeRate,
			}

			let valid = {
				amount: BigInt(to),
				code: Currency.Codes.USD,
			}

			expect(new Currency(data).getLocalCurrency()).toEqual(valid)
		}

		// TODO specific edge cases that might be wrong
	})

	// fromString()
	it('fromString() -> function valid', () => {
		for (const codeString of CODES) {
			const code = Currency.Codes.fromString(codeString)
			expect(code).toBeDefined()
			expect(code!.name).toStrictEqual(codeString)
		}
	})
})

const CODES: string[] = [
	'AED',
	'AFN',
	'ALL',
	'AMD',
	'ANG',
	'AOA',
	'ARS',
	'AUD',
	'AWG',
	'AZN',
	'BAM',
	'BBD',
	'BDT',
	'BGN',
	'BHD',
	'BIF',
	'BMD',
	'BND',
	'BOB',
	'BOV',
	'BRL',
	'BSD',
	'BTN',
	'BWP',
	'BYN',
	'BZD',
	'CAD',
	'CDF',
	'CHE',
	'CHF',
	'CHW',
	'CLF',
	'CLP',
	'CNY',
	'COP',
	'COU',
	'CRC',
	'CUC',
	'CUP',
	'CVE',
	'CZK',
	'DJF',
	'DKK',
	'DOP',
	'DZD',
	'EGP',
	'ERN',
	'ETB',
	'EUR',
	'FJD',
	'FKP',
	'GBP',
	'GEL',
	'GHS',
	'GIP',
	'GMD',
	'GNF',
	'GTQ',
	'GYD',
	'HKD',
	'HNL',
	'HRK',
	'HTG',
	'HUF',
	'IDR',
	'ILS',
	'INR',
	'IQD',
	'IRR',
	'ISK',
	'JMD',
	'JOD',
	'JPY',
	'KES',
	'KGS',
	'KHR',
	'KMF',
	'KPW',
	'KRW',
	'KWD',
	'KYD',
	'KZT',
	'LAK',
	'LBP',
	'LKR',
	'LRD',
	'LSL',
	'LYD',
	'MAD',
	'MDL',
	'MGA',
	'MKD',
	'MMK',
	'MNT',
	'MOP',
	'MRU',
	'MUR',
	'MVR',
	'MWK',
	'MXN',
	'MXV',
	'MYR',
	'MZN',
	'NAD',
	'NGN',
	'NIO',
	'NOK',
	'NPR',
	'NZD',
	'OMR',
	'PAB',
	'PEN',
	'PGK',
	'PHP',
	'PKR',
	'PLN',
	'PYG',
	'QAR',
	'RON',
	'RSD',
	'RUB',
	'RWF',
	'SAR',
	'SBD',
	'SCR',
	'SDG',
	'SEK',
	'SGD',
	'SHP',
	'SLL',
	'SOS',
	'SRD',
	'SSP',
	'STN',
	'SVC',
	'SYP',
	'SZL',
	'THB',
	'TJS',
	'TMT',
	'TND',
	'TOP',
	'TRY',
	'TTD',
	'TWD',
	'TZS',
	'UAH',
	'UGX',
	'USD',
	'USN',
	'UYI',
	'UYU',
	'UYW',
	'UZS',
	'VES',
	'VND',
	'VUV',
	'WST',
	'XAF',
	'XCD',
	'XOF',
	'XPF',
	'YER',
	'ZAR',
	'ZMW',
	'ZWL',
]
