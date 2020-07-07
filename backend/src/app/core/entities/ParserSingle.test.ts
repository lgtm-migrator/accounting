import { ParserSingle } from './ParserSingle'
import { Verification } from './Verification'
import { readFileSync } from 'fs'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { EntityErrors } from '../definitions/EntityErrors'
import { Parser } from './Parser'

const GOOGLE_INVOICE_FILE = 'src/jest/test-files/google-invoice.txt'

function getStringFromFile(filepath: string): string {
	return readFileSync(filepath, 'utf8')
}

function fakerValidParser(): ParserSingle {
	return new ParserSingle({
		name: 'Test parser',
		identifier: /test/,
		userId: 1,
		verification: {
			name: 'Name',
			internalName: 'INTERNAL_NAME',
			type: Verification.Types.INVOICE_IN,
			accountFrom: 2499,
			accountTo: 4330,
		},
		matcher: {
			date: {
				find: /\d{4}-\d{2}-\d{2}/,
			},
			currencyCode: {
				find: /(?<=code: )\w{3}/,
			},
			total: {
				find: /(?<=total: )\d{1,4}/,
			},
		},
	})
}

describe('ParserSingle #cold #entity', () => {
	const GOOGLE_INVOICE_PARSER_DATA: ParserSingle.Option = {
		name: 'Google parser',
		identifier: /1111-2222-3333/,
		userId: 1,
		verification: {
			name: 'Google account',
			internalName: 'G-SUITE',
			type: Verification.Types.INVOICE_IN,
			accountFrom: 2499,
			accountTo: 4661,
		},
		matcher: {
			date: {
				find: /[JFMASOND][aepuco][nbrylgptvc]\ \d{2},\ 20\d{2}/,
				replace: /(\w{3}) (\d{2}), (\d{4})/,
				replacement: '$3-$1-$2',
			},
			currencyCode: {
				find: /(?<=Total in )\w{3}/,
			},
			total: {
				find: /(?<=Total in \w{3} \s*.)\d{1,5}\.\d{2}/,
			},
		},
	}

	it('Full test, get all values.', () => {
		const data = GOOGLE_INVOICE_PARSER_DATA
		const parser = new ParserSingle(data)

		const text = getStringFromFile(GOOGLE_INVOICE_FILE)
		expect(parser.isOfType(text)).toStrictEqual(true)

		const valid: Parser.VerificationInfo = {
			date: '2019-01-31',
			code: Currency.Codes.EUR,
			amount: 6.66,
			name: data.verification.name,
			internalName: data.verification.internalName,
			type: data.verification.type,
			accountFrom: data.verification.accountFrom,
			accountTo: data.verification.accountTo,
		}

		expect(parser.parse(text)).toStrictEqual([valid])
	})

	it('Test does not match', () => {
		expect.assertions(9)

		const data = GOOGLE_INVOICE_PARSER_DATA
		const parser = new ParserSingle(data)

		const text = 'Some random invalid text'
		expect(parser.isOfType(text)).toStrictEqual(false)

		try {
			parser.parse(text)
		} catch (error) {
			expect(error).toBeInstanceOf(OutputError)
			expect(error.type).toStrictEqual(OutputError.Types.invalidInput)

			const errors: string[] = [
				EntityErrors.parserPatternNotFound,
				EntityErrors.parserDateInputInvalid,
				String(data.matcher.date.find),
				String(data.matcher.currencyCode.find),
				String(data.matcher.total.find),
			]
			expect(error.errors.length).toStrictEqual(errors.length)
			for (const errorString of errors) {
				expect(error.errors).toContainEqual(expect.stringContaining(errorString))
			}
		}
	})

	// Invalid
	it('Test invalid parser', () => {
		const data: ParserSingle.Option = {
			identifier: /test/,
			name: 'Parser name',
			userId: 1,
			verification: {
				name: '',
				internalName: '',
				type: Verification.Types.INVALID,
				accountFrom: 100,
				accountTo: 2100,
			},
			matcher: {
				date: {},
				currencyCode: {},
				total: {},
			},
		}

		const parser = new ParserSingle(data)
		const errors = [
			EntityErrors.nameTooShort,
			EntityErrors.internalNameTooShort,
			EntityErrors.verificationTypeInvalid,
			EntityErrors.accountNumberOutOfRange,
			EntityErrors.parserMatcherInvalid + '-date',
			EntityErrors.parserMatcherInvalid + '-total',
			EntityErrors.parserMatcherInvalid + '-code',
		]
		expect.assertions(errors.length * 2)
		for (const error of errors) {
			expect(parser.validate()).toContainEqual(expect.stringContaining(error))
		}

		data.verification.accountFrom = 2000
		data.verification.accountTo = 100
		for (const error of errors) {
			expect(parser.validate()).toContainEqual(expect.stringContaining(error))
		}
	})

	// Date conversions
	it('Test date conversions', () => {
		const parser = fakerValidParser()
		parser.matcher.date.find = /2000-\w*-15/
		const text = 'code: SEK, total: 45, date: 2000-{}-15'

		const months = [
			{
				correct: '01',
				variations: ['Jan', 'jan', 'january', 'January'],
				invalid: 'janur',
			},
			{
				correct: '02',
				variations: ['Feb', 'feb', 'february', 'February'],
				invalid: 'febrry',
			},
			{
				correct: '03',
				variations: ['Mar', 'mar', 'march', 'March'],
				invalid: 'Marc',
			},
			{
				correct: '04',
				variations: ['Apr', 'apr', 'april', 'April'],
				invalid: 'Apryl',
			},
			{
				correct: '05',
				variations: ['May', 'may', 'may', 'May'],
				invalid: 'Ma',
			},
			{
				correct: '06',
				variations: ['Jun', 'jun', 'june', 'June'],
				invalid: 'Juni',
			},
			{
				correct: '07',
				variations: ['Jul', 'jul', 'july', 'July'],
				invalid: 'Juli',
			},
			{
				correct: '08',
				variations: ['Aug', 'aug', 'august', 'August'],
				invalid: 'Augu',
			},
			{
				correct: '09',
				variations: ['Sep', 'sep', 'september', 'September'],
				invalid: 'septemer',
			},
			{
				correct: '10',
				variations: ['Oct', 'oct', 'october', 'October'],
				invalid: 'octobber',
			},
			{
				correct: '11',
				variations: ['Nov', 'nov', 'november', 'November'],
				invalid: 'novembeer',
			},
			{
				correct: '12',
				variations: ['Dec', 'dec', 'december', 'December'],
				invalid: 'decemember',
			},
		]

		expect.assertions(12 * 5)
		for (const month of months) {
			const valid: Parser.VerificationInfo = {
				date: '2000-' + month.correct + '-15',
				code: Currency.Codes.SEK,
				amount: 45,
				...parser.verification,
			}

			for (const variation of month.variations) {
				const textSearch = text.replace('{}', variation)
				const output = parser.parse(textSearch)
				expect(output).toStrictEqual([valid])
			}

			// Test invalid
			try {
				parser.parse(text.replace('{}', month.invalid))
			} catch (error) {
				const validError = {
					type: OutputError.Types.invalidInput,
					errors: [EntityErrors.parserDateInputInvalid],
				}

				expect(error).toEqual(validError)
			}
		}
	})

	// Replace functionality
	it('Replace directly functionality', () => {
		const parser = fakerValidParser()
		const text = 'code: SEK, total: 45, date: 2020-01-15'
		parser.matcher.total.find = undefined
		parser.matcher.total.replacement = '1337'

		const valid: Parser.VerificationInfo = {
			date: '2020-01-15',
			code: Currency.Codes.SEK,
			amount: 1337,
			...parser.verification,
		}

		expect(parser.parse(text)).toStrictEqual([valid])
	})

	it('Replace functionality when using find', () => {
		const parser = fakerValidParser()
		const text = 'code: SEK, total: 45, date: 01/31/2020'
		parser.matcher.date.find = /\d{2}\/\d{2}\/\d{4}/
		parser.matcher.date.replace = /(\d{2}).(\d{2}).(\d{4})/
		parser.matcher.date.replacement = '$3-$1-$2'

		const valid: Parser.VerificationInfo = {
			date: '2020-01-31',
			code: Currency.Codes.SEK,
			amount: 45,
			...parser.verification,
		}

		expect(parser.parse(text)).toStrictEqual([valid])
	})

	// Matcher missing
	it('Matcher missing replacement', () => {
		const parser = fakerValidParser()
		const text = 'code: SEK, total: 45, date: 01/31/2020'
		parser.matcher.date.find = /\d{2}\/\d{2}\/\d{4}/
		parser.matcher.date.replace = /(\d{2}).(\d{2}).(\d{4})/

		expect(parser.validate()).toStrictEqual([EntityErrors.parserMatcherReplacementMissing + '-date'])
	})

	it('Matcher missing replace', () => {
		const parser = fakerValidParser()
		const text = 'code: SEK, total: 45, date: 01/31/2020'
		parser.matcher.date.find = /\d{2}\/\d{2}\/\d{4}/
		parser.matcher.date.replacement = '$3-$1-$2'

		expect(parser.validate()).toStrictEqual([EntityErrors.parserMatcherReplaceMissing + '-date'])
	})

	it('Matcher missing find', () => {
		const parser = fakerValidParser()
		const text = 'code: SEK, total: 45, date: 01/31/2020'
		parser.matcher.date.find = undefined
		parser.matcher.date.replace = /(\d{2}).(\d{2}).(\d{4})/
		parser.matcher.date.replacement = '$3-$1-$2'

		expect(parser.validate()).toStrictEqual([EntityErrors.parserMatcherFindMissing + '-date'])
	})

	// Total/Amount conversion
	it('Check various total/amount conversions', () => {
		const values = [
			{
				in: '2.578,20',
				desired: 2578.2,
			},
			{
				in: '2 354,20',
				desired: 2354.2,
			},
			{
				in: '234',
				desired: 234,
			},
			{
				in: '234,256.20',
				desired: 234256.2,
			},
			{
				in: '234,205',
				desired: 234205,
			},
			{
				in: '246 548',
				desired: 246548,
			},
			{
				in: "244'056",
				desired: 244056,
			},
			{
				in: "26'155.25",
				desired: 26155.25,
			},
			{
				in: '12,20',
				desired: 12.2,
			},
			{
				in: '13.33',
				desired: 13.33,
			},
		]

		const parser = fakerValidParser()
		const text = 'code: SEK; total: {}; date: 2020-01-31'
		parser.matcher.total.find = /(?<=total: ).*?(?=;)/

		for (const value of values) {
			const inputText = text.replace('{}', value.in)
			const output = parser.parse(inputText)
			const valid = {
				amount: value.desired,
			}

			expect(output).toMatchObject([valid])
		}
	})
})
