import { Parser } from './Parser'
import { EntityErrors } from '../definitions/EntityErrors'

class ParserImpl extends Parser {
	parse(text: string): Parser.VerificationInfo[] {
		return []
	}

	static testAmountConversion(amount: string): number {
		return Parser.convertToValidAmount(amount)
	}

	static testFixDate(date: string, errors: string[]): string {
		return Parser.fixDate(date, errors)
	}
}

describe('Parser #cold #entity', () => {
	// Name
	it('Name long enough', () => {
		const parser = new ParserImpl({
			userId: 1,
			name: '123',
		})

		expect(parser.validate()).toStrictEqual([])
	})

	it('Name too short', () => {
		const parser = new ParserImpl({
			userId: 1,
			name: '12',
		})

		expect(parser.validate()).toStrictEqual([EntityErrors.nameTooShort])
	})

	// Amount conversion from string
	it('Check various amount conversions', () => {
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

		for (const value of values) {
			const output = ParserImpl.testAmountConversion(value.in)
			expect(output).toStrictEqual(value.desired)
		}
	})

	// Date conversions
	it('Test date conversions', () => {
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

		const dateTemplate = '2000-{}-15'
		expect.assertions(12 * 9)
		for (const month of months) {
			const valid = dateTemplate.replace('{}', month.correct)

			for (const variation of month.variations) {
				const dateTest = dateTemplate.replace('{}', variation)
				const errors: string[] = []
				const output = ParserImpl.testFixDate(dateTest, errors)
				expect(output).toStrictEqual(valid)
				expect(errors).toStrictEqual([])
			}

			// Test invalid
			const dateTest = dateTemplate.replace('{}', month.invalid)
			const errors: string[] = []
			ParserImpl.testFixDate(dateTest, errors)
			expect(errors).toStrictEqual([EntityErrors.parserDateInputInvalid])
		}
	})
})
