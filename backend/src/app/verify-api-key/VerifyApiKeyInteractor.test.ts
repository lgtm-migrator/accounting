import { VerifyApiKeyInteractor } from './VerifyApiKeyInteractor'
import { VerifyApiKeyRepository } from './VerifyApiKeyRepository'
import { mock } from 'jest-mock-extended'
import { Id } from '../core/definitions/Id'

test('test', () => {
	const testKey = 'testKey'
	const testId = '11'
	const mockedRepository = mock<VerifyApiKeyRepository>()
	mockedRepository.findUserWithApiKey.mockReturnValue(
		new Promise<Id>((resolve) => {
			resolve(testId)
		})
	)
	let interactor = new VerifyApiKeyInteractor(mockedRepository)

	return interactor.execute({ apiKey: testKey }).then((data) => {
		expect(data).toStrictEqual({ id: testId })
	})
})
