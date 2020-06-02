import { InternalError, InternalErrorTypes } from './InternalError'
import { EntityErrors } from './EntityErrors'

/**
 * Holds the currency amount, code, and also an optional exchange rate with a local code.
 * If no local code is initialized it
 */
export class Currency {
	readonly amount: bigint
	readonly code!: Currency.Code
	readonly localCode?: Currency.Code
	readonly exchangeRate?: number

	/**
	 * @param options currency data
	 * @throws {InternalError} if the input data (options) isn't valid
	 */
	constructor(options: Currency.Option) {
		this.amount = options.amount

		const errors: EntityErrors[] = []

		let foundCode = Currency.Codes.fromString(options.code)
		if (foundCode) {
			this.code = foundCode
		} else {
			errors.push(EntityErrors.currencyCodeInvalid)
		}

		if (typeof options.exchangeRate !== 'undefined') {
			this.exchangeRate = options.exchangeRate
		}

		if (typeof options.localCode !== 'undefined') {
			foundCode = Currency.Codes.fromString(options.localCode)
			if (foundCode) {
				this.localCode = foundCode
			} else {
				errors.push(EntityErrors.currencyCodeLocalInvalid)
			}
		}

		this.validate(errors)

		if (errors.length > 0) {
			throw new InternalError(InternalErrorTypes.invalidEntityState, { errors: errors })
		}
	}

	private validate(errors: EntityErrors[]) {
		// Exchange rate
		if (typeof this.exchangeRate !== 'undefined') {
			// Requires local code
			if (typeof this.localCode === 'undefined') {
				// Only add error message if there isn't one for invalid local code
				if (!errors.includes(EntityErrors.currencyCodeLocalInvalid)) {
					errors.push(EntityErrors.currencyCodeLocalNotSet)
				}
			}

			// Not 0 or below
			if (this.exchangeRate <= 0) {
				errors.push(EntityErrors.exchangeRateNegativeOrZero)
			}
		}

		// Local
		if (typeof this.localCode !== 'undefined') {
			// Requires exchange rate
			if (typeof this.exchangeRate === 'undefined') {
				errors.push(EntityErrors.exchangeRateNotSet)
			}

			// Can't be same code as this.code
			if (this.code == this.localCode) {
				errors.push(EntityErrors.currencyCodesAreSame)
			}
		}
	}

	isZero(): boolean {
		return this.amount == 0n
	}

	/**
	 * Calculate the local amount, i.e., amount * exchangeRate
	 * @return amount * exchangeRate, or just amount if no exchangeRate has been set
	 */
	getLocalCurrency(): Currency {
		if (typeof this.localCode === 'undefined') {
			return this
		}

		let localAmount = this.amount

		// Check precision difference
		const precisionDiff = BigInt(this.localCode.precision - this.code.precision)

		// If we have larger precision afterwards, multiply now
		if (precisionDiff > 0) {
			localAmount *= 10n ** precisionDiff
		}

		// Calculate the precision of the exchange rate
		const exchangeRatePrecision = Currency.calculatePrecision(this.exchangeRate!)

		// Make exchange rate as a bigint
		const exchangeRate = BigInt(Math.round(10 ** Number(exchangeRatePrecision) * this.exchangeRate!))

		localAmount *= exchangeRate

		// Calculate how much we should divide the local amount with
		let precisionDivide: bigint = exchangeRatePrecision
		if (precisionDiff < 0) {
			precisionDivide += -precisionDiff
		}

		// Divide the local amount (but keep one precision)
		if (precisionDivide >= 2) {
			localAmount /= 10n ** (precisionDivide - 1n)
		}
		// Check the rest (so we can round up if necessary)
		if (precisionDivide >= 1) {
			const rest = localAmount % 10n
			localAmount /= 10n

			if (rest >= 5n) {
				localAmount += 1n
			}
		}

		const option: Currency.Option = {
			amount: localAmount,
			code: this.localCode.name,
		}
		return new Currency(option)
	}

	/**
	 * Get the precision of a number
	 * @param num number to get how many numbers after the precision there is
	 * @return how many numbers are after the precision.
	 * @example precision(10.235) -> 3
	 */
	private static calculatePrecision(num: number): bigint {
		if (!isFinite(num)) return 0n
		let e = 1,
			p = 0
		while (Math.round(num * e) / e !== num) {
			e *= 10
			p++
		}
		return BigInt(p)
	}
}

export namespace Currency {
	export interface Code {
		readonly name: string
		readonly precision: number
	}

	export interface Option {
		readonly amount: bigint
		readonly code: string
		readonly localCode?: string
		readonly exchangeRate?: number
	}

	export class Codes {
		static AED: Code = { name: 'AED', precision: 2 }
		static AFN: Code = { name: 'AFN', precision: 2 }
		static ALL: Code = { name: 'ALL', precision: 2 }
		static AMD: Code = { name: 'AMD', precision: 2 }
		static ANG: Code = { name: 'ANG', precision: 2 }
		static AOA: Code = { name: 'AOA', precision: 2 }
		static ARS: Code = { name: 'ARS', precision: 2 }
		static AUD: Code = { name: 'AUD', precision: 2 }
		static AWG: Code = { name: 'AWG', precision: 2 }
		static AZN: Code = { name: 'AZN', precision: 2 }
		static BAM: Code = { name: 'BAM', precision: 2 }
		static BBD: Code = { name: 'BBD', precision: 2 }
		static BDT: Code = { name: 'BDT', precision: 2 }
		static BGN: Code = { name: 'BGN', precision: 2 }
		static BHD: Code = { name: 'BHD', precision: 3 }
		static BIF: Code = { name: 'BIF', precision: 0 }
		static BMD: Code = { name: 'BMD', precision: 2 }
		static BND: Code = { name: 'BND', precision: 2 }
		static BOB: Code = { name: 'BOB', precision: 2 }
		static BOV: Code = { name: 'BOV', precision: 2 }
		static BRL: Code = { name: 'BRL', precision: 2 }
		static BSD: Code = { name: 'BSD', precision: 2 }
		static BTN: Code = { name: 'BTN', precision: 2 }
		static BWP: Code = { name: 'BWP', precision: 2 }
		static BYN: Code = { name: 'BYN', precision: 2 }
		static BZD: Code = { name: 'BZD', precision: 2 }
		static CAD: Code = { name: 'CAD', precision: 2 }
		static CDF: Code = { name: 'CDF', precision: 2 }
		static CHE: Code = { name: 'CHE', precision: 2 }
		static CHF: Code = { name: 'CHF', precision: 2 }
		static CHW: Code = { name: 'CHW', precision: 2 }
		static CLF: Code = { name: 'CLF', precision: 4 }
		static CLP: Code = { name: 'CLP', precision: 0 }
		static CNY: Code = { name: 'CNY', precision: 2 }
		static COP: Code = { name: 'COP', precision: 2 }
		static COU: Code = { name: 'COU', precision: 2 }
		static CRC: Code = { name: 'CRC', precision: 2 }
		static CUC: Code = { name: 'CUC', precision: 2 }
		static CUP: Code = { name: 'CUP', precision: 2 }
		static CVE: Code = { name: 'CVE', precision: 2 }
		static CZK: Code = { name: 'CZK', precision: 2 }
		static DJF: Code = { name: 'DJF', precision: 0 }
		static DKK: Code = { name: 'DKK', precision: 2 }
		static DOP: Code = { name: 'DOP', precision: 2 }
		static DZD: Code = { name: 'DZD', precision: 2 }
		static EGP: Code = { name: 'EGP', precision: 2 }
		static ERN: Code = { name: 'ERN', precision: 2 }
		static ETB: Code = { name: 'ETB', precision: 2 }
		static EUR: Code = { name: 'EUR', precision: 2 }
		static FJD: Code = { name: 'FJD', precision: 2 }
		static FKP: Code = { name: 'FKP', precision: 2 }
		static GBP: Code = { name: 'GBP', precision: 2 }
		static GEL: Code = { name: 'GEL', precision: 2 }
		static GHS: Code = { name: 'GHS', precision: 2 }
		static GIP: Code = { name: 'GIP', precision: 2 }
		static GMD: Code = { name: 'GMD', precision: 2 }
		static GNF: Code = { name: 'GNF', precision: 0 }
		static GTQ: Code = { name: 'GTQ', precision: 2 }
		static GYD: Code = { name: 'GYD', precision: 2 }
		static HKD: Code = { name: 'HKD', precision: 2 }
		static HNL: Code = { name: 'HNL', precision: 2 }
		static HRK: Code = { name: 'HRK', precision: 2 }
		static HTG: Code = { name: 'HTG', precision: 2 }
		static HUF: Code = { name: 'HUF', precision: 2 }
		static IDR: Code = { name: 'IDR', precision: 2 }
		static ILS: Code = { name: 'ILS', precision: 2 }
		static INR: Code = { name: 'INR', precision: 2 }
		static IQD: Code = { name: 'IQD', precision: 3 }
		static IRR: Code = { name: 'IRR', precision: 2 }
		static ISK: Code = { name: 'ISK', precision: 0 }
		static JMD: Code = { name: 'JMD', precision: 2 }
		static JOD: Code = { name: 'JOD', precision: 3 }
		static JPY: Code = { name: 'JPY', precision: 0 }
		static KES: Code = { name: 'KES', precision: 2 }
		static KGS: Code = { name: 'KGS', precision: 2 }
		static KHR: Code = { name: 'KHR', precision: 2 }
		static KMF: Code = { name: 'KMF', precision: 0 }
		static KPW: Code = { name: 'KPW', precision: 2 }
		static KRW: Code = { name: 'KRW', precision: 0 }
		static KWD: Code = { name: 'KWD', precision: 3 }
		static KYD: Code = { name: 'KYD', precision: 2 }
		static KZT: Code = { name: 'KZT', precision: 2 }
		static LAK: Code = { name: 'LAK', precision: 2 }
		static LBP: Code = { name: 'LBP', precision: 2 }
		static LKR: Code = { name: 'LKR', precision: 2 }
		static LRD: Code = { name: 'LRD', precision: 2 }
		static LSL: Code = { name: 'LSL', precision: 2 }
		static LYD: Code = { name: 'LYD', precision: 3 }
		static MAD: Code = { name: 'MAD', precision: 2 }
		static MDL: Code = { name: 'MDL', precision: 2 }
		static MGA: Code = { name: 'MGA', precision: 2 }
		static MKD: Code = { name: 'MKD', precision: 2 }
		static MMK: Code = { name: 'MMK', precision: 2 }
		static MNT: Code = { name: 'MNT', precision: 2 }
		static MOP: Code = { name: 'MOP', precision: 2 }
		static MRU: Code = { name: 'MRU', precision: 2 }
		static MUR: Code = { name: 'MUR', precision: 2 }
		static MVR: Code = { name: 'MVR', precision: 2 }
		static MWK: Code = { name: 'MWK', precision: 2 }
		static MXN: Code = { name: 'MXN', precision: 2 }
		static MXV: Code = { name: 'MXV', precision: 2 }
		static MYR: Code = { name: 'MYR', precision: 2 }
		static MZN: Code = { name: 'MZN', precision: 2 }
		static NAD: Code = { name: 'NAD', precision: 2 }
		static NGN: Code = { name: 'NGN', precision: 2 }
		static NIO: Code = { name: 'NIO', precision: 2 }
		static NOK: Code = { name: 'NOK', precision: 2 }
		static NPR: Code = { name: 'NPR', precision: 2 }
		static NZD: Code = { name: 'NZD', precision: 2 }
		static OMR: Code = { name: 'OMR', precision: 3 }
		static PAB: Code = { name: 'PAB', precision: 2 }
		static PEN: Code = { name: 'PEN', precision: 2 }
		static PGK: Code = { name: 'PGK', precision: 2 }
		static PHP: Code = { name: 'PHP', precision: 2 }
		static PKR: Code = { name: 'PKR', precision: 2 }
		static PLN: Code = { name: 'PLN', precision: 2 }
		static PYG: Code = { name: 'PYG', precision: 0 }
		static QAR: Code = { name: 'QAR', precision: 2 }
		static RON: Code = { name: 'RON', precision: 2 }
		static RSD: Code = { name: 'RSD', precision: 2 }
		static RUB: Code = { name: 'RUB', precision: 2 }
		static RWF: Code = { name: 'RWF', precision: 0 }
		static SAR: Code = { name: 'SAR', precision: 2 }
		static SBD: Code = { name: 'SBD', precision: 2 }
		static SCR: Code = { name: 'SCR', precision: 2 }
		static SDG: Code = { name: 'SDG', precision: 2 }
		static SEK: Code = { name: 'SEK', precision: 2 }
		static SGD: Code = { name: 'SGD', precision: 2 }
		static SHP: Code = { name: 'SHP', precision: 2 }
		static SLL: Code = { name: 'SLL', precision: 2 }
		static SOS: Code = { name: 'SOS', precision: 2 }
		static SRD: Code = { name: 'SRD', precision: 2 }
		static SSP: Code = { name: 'SSP', precision: 2 }
		static STN: Code = { name: 'STN', precision: 2 }
		static SVC: Code = { name: 'SVC', precision: 2 }
		static SYP: Code = { name: 'SYP', precision: 2 }
		static SZL: Code = { name: 'SZL', precision: 2 }
		static THB: Code = { name: 'THB', precision: 2 }
		static TJS: Code = { name: 'TJS', precision: 2 }
		static TMT: Code = { name: 'TMT', precision: 2 }
		static TND: Code = { name: 'TND', precision: 3 }
		static TOP: Code = { name: 'TOP', precision: 2 }
		static TRY: Code = { name: 'TRY', precision: 2 }
		static TTD: Code = { name: 'TTD', precision: 2 }
		static TWD: Code = { name: 'TWD', precision: 2 }
		static TZS: Code = { name: 'TZS', precision: 2 }
		static UAH: Code = { name: 'UAH', precision: 2 }
		static UGX: Code = { name: 'UGX', precision: 0 }
		static USD: Code = { name: 'USD', precision: 2 }
		static USN: Code = { name: 'USN', precision: 2 }
		static UYI: Code = { name: 'UYI', precision: 0 }
		static UYU: Code = { name: 'UYU', precision: 2 }
		static UYW: Code = { name: 'UYW', precision: 4 }
		static UZS: Code = { name: 'UZS', precision: 2 }
		static VES: Code = { name: 'VES', precision: 2 }
		static VND: Code = { name: 'VND', precision: 0 }
		static VUV: Code = { name: 'VUV', precision: 0 }
		static WST: Code = { name: 'WST', precision: 2 }
		static XAF: Code = { name: 'XAF', precision: 0 }
		static XCD: Code = { name: 'XCD', precision: 2 }
		static XOF: Code = { name: 'XOF', precision: 0 }
		static XPF: Code = { name: 'XPF', precision: 0 }
		static YER: Code = { name: 'YER', precision: 2 }
		static ZAR: Code = { name: 'ZAR', precision: 2 }
		static ZMW: Code = { name: 'ZMW', precision: 2 }
		static ZWL: Code = { name: 'ZWL', precision: 2 }
	}

	export namespace Codes {
		/**
		 * Convert a string currency code into an {Code} object
		 * @param code currency code to convert to a Code if it exists
		 * @return the Correct {Code} object if found or undefined if not found
		 */
		export function fromString(code: string): Code | undefined {
			const values = Object.values(Codes)
			for (const value of values) {
				if (value.hasOwnProperty('name')) {
					const codeObject = value as Code
					if (codeObject.name == code.toUpperCase()) {
						return codeObject
					}
				}
			}
			return undefined
		}

		export function isValid(code: string): boolean {
			if (Object.keys(Codes).includes(code)) {
				return true
			}
			return false
		}
	}
}
