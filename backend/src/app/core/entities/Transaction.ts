import { Entity } from './Entity'

export interface Transaction extends Entity {
	account_number: number
	amount_local: number
	amount_original: number
	exchange_rate: number
	currency: string
}

// TODO Create transaction implementation
