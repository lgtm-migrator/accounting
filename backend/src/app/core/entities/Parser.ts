import { Entity } from './Entity'
import { Currency } from './Currency'
import { Verification } from './Verification'
import { EntityErrors } from '../definitions/EntityErrors'
import { Consts } from '../definitions/Consts'
import '../definitions/String'

export abstract class Parser extends Entity implements Parser.Option {
	name: string
	type: Parser.Types
	identifier: RegExp

	constructor(data: Parser.Option, type: Parser.Types) {
		super(data)

		this.name = data.name
		this.identifier = data.identifier
		this.type = type
	}

	/**
	 * Parse the text and returns all verifications found in the text
	 * @param text the text to parse
	 * @return all verifications found in the text
	 * @throws {OutputError.Types.invalidInput} if the parser cannot parse some parts of the text
	 * @throws {OutputError.Types.internalError} if this parser is in an invalid state
	 */
	abstract parse(text: string): Parser.VerificationInfo[]

	validate(): EntityErrors[] {
		const errors = super.validate()

		// Name
		if (this.name.length < Consts.NAME_LENGTH_MIN) {
			errors.push(EntityErrors.nameTooShort)
		}

		return errors
	}

	/**
	 * Checks whether this Parser is for the specified text
	 * @param text the text to see if this Parser is of
	 * @return true if the text should be parsed by this Parser, false otherwise
	 */
	isOfType(text: string): boolean {
		return this.identifier.test(text)
	}

	protected static fixDate(date: string, errors: string[]): string {
		const regexs: RegExp[] = [
			/[Jj]a(nuary|n)/,
			/[Ff]e(bruary|b)/,
			/[Mm]a(rch|r)/,
			/[Aa]p(ril|r)/,
			/[Mm]ay/,
			/[Jj]u(ne|n)/,
			/[Jj]u(ly|l)/,
			/[Aa]u(gust|g)/,
			/[Ss]e(ptember|p)/,
			/[Oo]c(tober|t)/,
			/[Nn]o(vember|v)/,
			/[Dd]e(cember|c)/,
		]

		for (let i = 0; i < regexs.length; ++i) {
			const regex = regexs[i]
			let month = String(i + 1)
			// Add 0 before month
			if (month.length == 1) {
				month = '0' + month
			}
			date = date.replace(regex, month)
		}

		if (!date.isValidIsoDate()) {
			errors.push(EntityErrors.parserDateInputInvalid)
		}

		return date
	}

	/**
	 * Converts a string currency amount to a valid number. Supports many different
	 * formats.
	 * ```
	 * 2.578,20
	 * 2 354,20
	 * 234
	 * 234,256.20
	 * 234,205
	 * 246 548
	 * 244'056
	 * 26'155.25
	 * 12,20
	 * 13.33
	 * ```
	 * @param amount the amount to convert to a valid number
	 * @return valid number
	 */
	protected static convertToValidAmount(amount: string): number {
		const regex = /^(\d{0,3})?[\. ,']?(\d{0,3})[.,](\d{2})$|^(\d{0,3})?[\.\ ,']?(\d{0,3})$/
		const replacement = '$1$2$4$5.$3'
		const converted = amount.replace(regex, replacement)
		return Number.parseFloat(converted)
	}
}

export namespace Parser {
	export enum Types {
		single = 'single',
		multi = 'multi',
	}

	export interface Option extends Entity.Option {
		name: string
		identifier: RegExp
	}

	export interface VerificationInfo {
		date: string
		name: string
		internalName: string
		code: Currency.Code
		type: Verification.Types
		accountFrom: number
		accountTo: number
		amount: number
	}
}
