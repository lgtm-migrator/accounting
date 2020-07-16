import { UserEntity } from './UserEntity'
import * as faker from 'faker'
import { EntityErrors } from '../definitions/EntityErrors'

describe('Validate user entity #cold', () => {
	let entity: UserEntity

	beforeEach(() => {
		entity = new UserEntity({
			userId: faker.random.number(),
		})
	})

	// User ID
	it('User id is of type number and valid', () => {
		entity.userId = faker.random.number()
		expect(entity.validate()).toStrictEqual([])
	})

	it('User id is of type string and valid', () => {
		entity.userId = faker.random.uuid()
		expect(entity.validate()).toStrictEqual([])
	})

	it('User id is of type string and invalid (empty)', () => {
		entity.userId = ''
		expect(entity.validate()).toStrictEqual([{ error: EntityErrors.userIdIsEmpty }])
	})
})
