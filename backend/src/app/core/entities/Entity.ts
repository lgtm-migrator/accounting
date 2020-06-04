import { Id } from '../definitions/Id'
import { EntityErrors } from '../definitions/EntityErrors'

/** Date: 2000-01-01 */
const VALID_DATE_AFTER = 946684800000

export interface Entity {
	id?: Id
	dateCreated?: number
	dateModified?: number
	dateDeleted?: number
}

export class EntityImpl implements Entity {
	id?: Id
	dateCreated?: number
	dateModified?: number
	dateDeleted?: number

	constructor(data: Entity) {
		this.id = data.id
		this.dateCreated = data.dateCreated
		this.dateModified = data.dateModified
		this.dateDeleted = data.dateDeleted
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
		if (this.dateCreated) {
			// Invalid before a specified date
			if (this.dateCreated < VALID_DATE_AFTER) {
				errors.push(EntityErrors.dateCreatedTooEarly)
			}
			// In the future
			else if (this.dateCreated > new Date().getTime()) {
				errors.push(EntityErrors.dateCreatedInTheFuture)
			}
		}

		// Date modified
		if (this.dateModified) {
			// Requires date_created
			if (!this.dateCreated) {
				errors.push(EntityErrors.dateModifiedRequiresDateCreated)
			}
			// Before date created
			else if (this.dateModified < this.dateCreated) {
				errors.push(EntityErrors.dateModifiedBeforeCreated)
			}
			// In the future
			else if (this.dateModified > new Date().getTime()) {
				errors.push(EntityErrors.dateModifiedInTheFuture)
			}
		}

		// Date deleted
		if (this.dateDeleted) {
			// Requires date_modified
			if (!this.dateModified) {
				errors.push(EntityErrors.dateDeletedRequiresDateModified)
			}
			// Not equal to modified
			else if (this.dateDeleted !== this.dateModified) {
				errors.push(EntityErrors.dateDeletedNotSameAsModified)
			}
		}

		return errors
	}
}
