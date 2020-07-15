import { Entity } from '../../app/core/entities/Entity'
import * as faker from 'faker'
import { MongoConverter } from './MongoConverter'
import { InternalError } from '../../app/core/definitions/InternalError'
import { ObjectId } from 'mongodb'

describe('MongoConverter #cold #helper', () => {
	// toDbObject()
	it('toDbObject() Test simple object', () => {
		const entity: any = {
			text: faker.random.words(),
			number: faker.random.number(),
		}

		const object = MongoConverter.toDbObject(entity)
		entity._id = object._id
		expect(object).toStrictEqual(entity)
	})

	it('toDbObject() Test object hiearchy', () => {
		const entity = {
			text: faker.random.words(),
			innerObject: {
				otherText: faker.random.words(),
			},
		}

		const object = MongoConverter.toDbObject(entity)

		const valid = {
			_id: object._id,
			text: entity.text,
			innerObject: {
				otherText: entity.innerObject.otherText,
			},
		}

		expect(object).toStrictEqual(valid)
	})

	it('toDbObject() Test bigint', () => {
		const entity = {
			biggie: 12345678912356546456n,
		}

		const object = MongoConverter.toDbObject(entity)

		const valid = {
			_id: object._id,
			biggie: `${entity.biggie}n`,
		}
		expect(object).toStrictEqual(valid)
	})

	it('toDbObject() Test undefined', () => {
		const entity = {
			text: '',
			nothing: undefined,
		}

		const object = MongoConverter.toDbObject(entity)

		const valid = {
			_id: object._id,
			text: '',
		}

		expect(object).toStrictEqual(valid)
	})

	it('toDbObject() Test null', () => {
		const entity = {
			text: '',
			nothing: null,
		}

		const object = MongoConverter.toDbObject(entity)

		const valid = {
			_id: object._id,
			text: '',
		}

		expect(object).toStrictEqual(valid)
	})

	it('toDbObject() Test arrays', () => {
		const entity = {
			array: ['test', 123n],
		}

		const object = MongoConverter.toDbObject(entity)

		const valid = {
			_id: object._id,
			array: ['test', '123n'],
		}

		expect(object).toStrictEqual(valid)
	})

	it('toDbObject() Test ids', () => {
		const entity = {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
		}

		const valid = {
			_id: new ObjectId(entity.id),
			userId: new ObjectId(entity.userId),
		}

		const object = MongoConverter.toDbObject(entity)

		expect(object).toStrictEqual(valid)
	})

	it('toDbObject() Test empty object', () => {
		expect.assertions(1)
		try {
			MongoConverter.toDbObject({})
		} catch (exception) {
			expect(exception).toBeInstanceOf(InternalError)
		}
	})

	// toEntity()
	it('toEntity() Test simple object', () => {
		const entity: any = {
			text: faker.random.words(),
			number: faker.random.number(),
		}

		const object = MongoConverter.toEntity(entity)
		expect(object).toStrictEqual(entity)
	})

	it('toEntity() Test object hiearchy', () => {
		const entity = {
			text: faker.random.words(),
			innerObject: {
				otherText: faker.random.words(),
			},
		}

		const object = MongoConverter.toEntity(entity)

		expect(object).toStrictEqual(entity)
	})

	it('toEntity() Test bigint', () => {
		const valid = {
			biggie: 12345678912356546456n,
		}
		const entity = {
			biggie: `${valid.biggie}n`,
		}

		const object = MongoConverter.toEntity(entity)

		expect(object).toStrictEqual(valid)
	})

	it('toEntity() Test null', () => {
		const entity = {
			text: '',
			nothing: null,
		}

		const object = MongoConverter.toEntity(entity)

		expect(object).toStrictEqual(entity)
	})

	it('toEntity() Test arrays', () => {
		const entity = {
			array: ['test', '123n'],
		}

		const object = MongoConverter.toEntity(entity)

		const valid = {
			array: ['test', 123n],
		}

		expect(object).toStrictEqual(valid)
	})

	it('toEntity() Test ids', () => {
		const valid = {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
		}

		const entity = {
			_id: new ObjectId(valid.id),
			userId: new ObjectId(valid.userId),
		}

		const object = MongoConverter.toEntity(entity)

		expect(object).toStrictEqual(valid)
	})

	it('toEntity() Test empty object', () => {
		expect.assertions(1)
		try {
			MongoConverter.toEntity({})
		} catch (exception) {
			expect(exception).toBeInstanceOf(InternalError)
		}
	})
})
