import { Entity } from './Entity'
import { OutputError } from '../definitions/OutputError'
import { Consts } from '../definitions/Consts'
import { EntityErrors } from '../definitions/EntityErrors'

export namespace Account {
	export interface Option extends Entity.Option {
		number: number
		vatCode?: number
		vatPercentage?: number
		vatAccount?: number | Account
		reverseVatAccount?: number | Account
	}
}

export class Account extends Entity implements Account.Option {
	number: number
	vatCode?: number
	vatPercentage?: number
	vatAccount?: number | Account
	reverseVatAccount?: number | Account

	constructor(data: Account.Option) {
		super(data)
		this.number = data.number
		this.vatCode = data.vatCode
		this.vatPercentage = data.vatPercentage
		this.vatAccount = data.vatAccount
		this.reverseVatAccount = data.reverseVatAccount
	}

	static validateNumber(accountNumber: number, errors: OutputError.Info[]) {
		// Account number - Check that the account number is valid
		if (accountNumber < Consts.ACCOUNT_NUMBER_START || accountNumber > Consts.ACCOUNT_NUMBER_END) {
			errors.push({
				error: EntityErrors.accountNumberOutOfRange,
				data: `${accountNumber}`,
			})
		}

		// Account number is floating point
		if (!Number.isInteger(accountNumber)) {
			errors.push({
				error: EntityErrors.accountNumberInvalidFormat,
				data: `${accountNumber}`,
			})
		}
	}
}
