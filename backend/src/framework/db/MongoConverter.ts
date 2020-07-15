import { Entity } from '../../app/core/entities/Entity'
import { ObjectId } from 'mongodb'
import { InternalError } from '../../app/core/definitions/InternalError'
import { type } from 'os'

export namespace MongoConverter {
	/**
	 * Serialize an entity to a DB object.
	 * Automatically converts bigint to string, and ids to Mongo db's internal id type.
	 * The id property is mapped to _id.
	 * @param entity the entity to serialize to a DB object
	 * @return the serialized object
	 * @throws {InternalError.Types.dbError} if the entity is empty, or only contains undefined or null properties
	 */
	export function toDbObject(entity: {}): { _id: ObjectId } {
		if (!entity || Object.keys(entity).length === 0) {
			throw new InternalError(InternalError.Types.dbError, 'toEntity() empty object')
		}

		const dbObject = serialize(entity) as { _id: ObjectId }

		if (typeof dbObject === 'undefined') {
			throw new InternalError(InternalError.Types.dbError, 'toDbObject() supplied empty object')
		}

		if (typeof dbObject._id === 'undefined') {
			dbObject._id = new ObjectId()
		}

		return dbObject
	}

	function serialize(entity: {}): {} | undefined {
		const object: any = entity instanceof Array ? [] : {}
		for (let [key, value] of Object.entries(entity)) {
			if (typeof value !== 'undefined' && value !== null) {
				// Convert id
				if ((key === 'id' || key.endsWith('Id')) && (typeof value === 'string' || typeof value === 'number')) {
					if (key === 'id') {
						object._id = new ObjectId(value)
					} else {
						object[key] = new ObjectId(value)
					}
				}

				// Convert bigint
				else if (typeof value === 'bigint') {
					object[key] = `${value}n`
				}

				// Recursive object
				else if (typeof value === 'object') {
					const child = serialize(value!)
					if (child) {
						object[key] = child
					}
				}

				// Use value
				else {
					object[key] = value
				}
			}
		}

		return object
	}

	/**
	 * Deserialize a Mongo DB object to an entity.
	 * Automatically converts bigint, and Mongo db's internal id to string ids.
	 * The _id property is mapped to id.
	 * @param object the DB object to serialize to an entity
	 * @return the serialized object
	 * @throws {InternalError.Types.dbError} if the object is empty
	 */
	export function toEntity<EntityType extends Entity>(object: {}): EntityType {
		if (!object || Object.keys(object).length === 0) {
			throw new InternalError(InternalError.Types.dbError, 'toEntity() empty object')
		}

		return deserialize(object) as EntityType
	}

	function deserialize(object: {}): {} {
		const entity: any = object instanceof Array ? [] : {}

		for (let [key, value] of Object.entries(object)) {
			// Convert id
			if (value instanceof ObjectId) {
				if (key === '_id') {
					entity.id = value.toHexString()
				} else {
					entity[key] = value.toHexString()
				}
			}

			// Convert bigint
			else if (typeof value === 'string' && /^-?\d+n$/.test(value)) {
				entity[key] = BigInt(value.substr(0, value.length - 1))
			}

			// Recursive object
			else if (typeof value === 'object' && value) {
				entity[key] = deserialize(value)
			}

			// Use value
			else {
				entity[key] = value
			}
		}

		return entity
	}
}
