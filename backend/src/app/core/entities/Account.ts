import { Entity } from './Entity'

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
}
