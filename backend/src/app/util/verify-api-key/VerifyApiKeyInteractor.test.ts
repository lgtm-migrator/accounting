import { VerifyApiKeyInteractor } from './VerifyApiKeyInteractor'
import { VerifyApiKeyRepository } from './VerifyApiKeyRepository'
import * as faker from 'faker'
import { VerifyApiKeyInput } from './VerifyApiKeyInput'
import { VerifyApiKeyOutput } from './VerifyApiKeyOutput'
import { InternalError } from '../../core/definitions/InternalError'
import { OutputError } from '../../core/definitions/OutputError'

describe('Verify Api Key #cold #use-case', () => {
	let interactor: VerifyApiKeyInteractor
	let repository: VerifyApiKeyRepository
	let input: VerifyApiKeyInput
	let output: VerifyApiKeyOutput

	beforeEach(() => {
		input = {
			apiKey: faker.internet.password(),
		}
		output = {
			id: faker.random.uuid(),
		}
	})

	it('Search and find a user with API key', () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => Promise.resolve(output.id)),
		}

		interactor = new VerifyApiKeyInteractor(repository)

		return expect(interactor.execute(input)).resolves.toStrictEqual(output)
	})

	it(`Can't find a user with API key`, async () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => {
				throw new InternalError(InternalError.Types.userNotFound)
			}),
		}

		interactor = new VerifyApiKeyInteractor(repository)

		expect.assertions(1)
		await expect(interactor.execute(input)).rejects.toEqual({
			type: OutputError.Types.userNotFound,
			errors: [],
		})
	})

	it('Repository throws an unknown internal error', async () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => {
				throw new InternalError(InternalError.Types.unknown)
			}),
		}

		interactor = new VerifyApiKeyInteractor(repository)

		expect.assertions(1)
		await expect(interactor.execute(input)).rejects.toEqual({
			type: OutputError.Types.internalError,
			errors: [],
		})
	})

	it(`Repository throws an error that isn't of the Internal Error type. Should still be treated as an internal error`, async () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => {
				throw new Error(faker.lorem.words(5))
			}),
		}

		interactor = new VerifyApiKeyInteractor(repository)

		expect.assertions(1)
		await expect(interactor.execute(input)).rejects.toEqual({
			type: OutputError.Types.internalError,
			errors: [],
		})
	})
})
