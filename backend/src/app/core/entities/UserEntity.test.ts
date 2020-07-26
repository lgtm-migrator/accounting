import { UserEntity } from './UserEntity'
import * as faker from 'faker'
import { OutputError } from '../definitions/OutputError'

class UserEntityImpl extends UserEntity {
	constructor(data: UserEntity.Option) {
		super(data)
	}
}

describe('Validate user entity #cold', () => {
	let entity: UserEntityImpl

	beforeEach(() => {
		entity = new UserEntityImpl({
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
		expect(entity.validate()).toStrictEqual([{ type: OutputError.Types.userIdIsEmpty }])
	})
})
