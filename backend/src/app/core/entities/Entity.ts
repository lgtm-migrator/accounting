import { Id } from '../definitions/Id'
import { EntityErrors } from '../definitions/EntityErrors'

/** Date: 2000-01-01 */
const VALID_DATE_AFTER = 946684800000

export class Entity {
	id?: Id
	date_created?: number
	date_modified?: number
	date_deleted?: number

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
		if (typeof this.date_created !== 'undefined') {
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
		if (typeof this.date_modified !== 'undefined') {
			// Requires date_created
			if (typeof this.date_created === 'undefined') {
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
		if (typeof this.date_deleted !== 'undefined') {
			// Requires date_modified
			if (typeof this.date_modified === 'undefined') {
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
