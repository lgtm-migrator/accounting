import { Id } from '../definitions/Id'
import { EntityErrors } from '../definitions/EntityErrors'

/** Date: 2000-01-01 */
const VALID_DATE_AFTER = 946684800000

export interface Entity {
	id?: Id
	date_created?: number
	date_modified?: number
	date_deleted?: number
}

export class EntityImpl implements Entity {
	id?: Id
	date_created?: number
	date_modified?: number
	date_deleted?: number

	constructor(data?: Entity) {
		this.id = data?.id
		this.date_created = data?.date_created
		this.date_modified = data?.date_modified
		this.date_deleted = data?.date_deleted
	}

	/**
	 * Validate the entity so it has correct values
	 * @return all error, or empty list if the entity is valid
	 */
	validate(): EntityErrors[] {
		let errors: EntityErrors[] = []
		// ID checks
		if (typeof this.id === 'string') {
			if (this.id.length <= 0) {
				errors.push(EntityErrors.idIsEmpty)
			}
		}

		// Date created
		if (this.date_created) {
			// Invalid before a specified date
			if (this.date_created < VALID_DATE_AFTER) {
				errors.push(EntityErrors.dateCreatedTooEarly)
			}
			// In the future
			else if (this.date_created > new Date().getTime()) {
				errors.push(EntityErrors.dateCreatedInTheFuture)
			}
		}

		// Date modified
		if (this.date_modified) {
			// Requires date_created
			if (!this.date_created) {
				errors.push(EntityErrors.dateModifiedRequiresDateCreated)
			}
			// Before date created
			else if (this.date_modified < this.date_created) {
				errors.push(EntityErrors.dateModifiedBeforeCreated)
			}
			// In the future
			else if (this.date_modified > new Date().getTime()) {
				errors.push(EntityErrors.dateModifiedInTheFuture)
			}
		}

		// Date deleted
		if (this.date_deleted) {
			// Requires date_modified
			if (!this.date_modified) {
				errors.push(EntityErrors.dateDeletedRequiresDateModified)
			}
			// Not equal to modified
			else if (this.date_deleted !== this.date_modified) {
				errors.push(EntityErrors.dateDeletedNotSameAsModified)
			}
		}

		return errors
	}
}
