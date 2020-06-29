import { VerificationSaveInteractor } from './VerificationSaveInteractor'
import { VerificationSaveRepository } from './VerificationSaveRepository'
import { VerificationSaveInput } from './VerificationSaveInput'
import { VerificationSaveOutput } from './VerificationSaveOutput'
import { Verification } from '../../core/entities/Verification'
import { Id } from '../../core/definitions/Id'
import * as faker from 'faker'

function faker_minimum_verification(): Verification {
	return new Verification({
		userId: faker.random.alphaNumeric(10),
		name: faker.commerce.productName(),
		date: '2020-01-01',
		type: Verification.Types.TRANSACTION,
		transactions: [],
	})
}

describe('Save Verification #cold #use-case', () => {
	let interactor: VerificationSaveInteractor
	let repository: VerificationSaveRepository
	let input: VerificationSaveInput
	let output: Promise<VerificationSaveOutput>
	let valid: VerificationSaveOutput

	let spyExists: any
	let spySaveVerification: any
	let spySaveFiles: any

	const NEW_ID = 1

	const EXISTING_VERIFICATION = faker_minimum_verification()
	EXISTING_VERIFICATION.id = faker.random.alphaNumeric(10)
	const EXISTING_VERIFICATION_WITH_FILES = faker_minimum_verification()
	EXISTING_VERIFICATION_WITH_FILES.id = faker.random.alphaNumeric(10)
	EXISTING_VERIFICATION_WITH_FILES.files = ['file1', 'file2']

	beforeEach(() => {
		repository = {
			async exists(verification: Verification): Promise<Verification | undefined> {
				return Promise.resolve(undefined)
			},

			async saveVerification(verification: Verification): Promise<Id> {
				if (verification.id) {
					return Promise.resolve(verification.id)
				}
				return Promise.resolve(NEW_ID)
			},

			async saveFiles(files: string[], verification: Verification): Promise<Verification> {
				let updated = new Verification(verification)
				if (files.length > 0) {
					if (!updated.files) {
						updated.files = []
					}
					updated.files = updated.files!.concat(files)

					// Make them unique (to test that we don't added files if they existed)
					updated.files = [...new Set(updated.files)]
				}

				return Promise.resolve(updated)
			},
		}
		interactor = new VerificationSaveInteractor(repository)

		spyExists = jest.spyOn(repository, 'exists')
		spySaveFiles = jest.spyOn(repository, 'saveFiles')
		spySaveVerification = jest.spyOn(repository, 'saveVerification')
	})

	it('New minimal verification', async () => {
		input = {
			verification: faker_minimum_verification(),
		}

		output = interactor.execute(input)
		valid = {
			successType: VerificationSaveOutput.SuccessTypes.ADDED_NEW,
			id: NEW_ID,
		}

		expect.assertions(4)
		await expect(output).resolves.toStrictEqual(valid)
		expect(spyExists).toHaveBeenCalledTimes(1)
		expect(spySaveFiles).toHaveBeenCalledTimes(0)
		expect(spySaveVerification).toHaveBeenCalledTimes(1)
	})

	it('New verification with files', async () => {
		input = {
			files: ['1', '2', '3'],
			verification: faker_minimum_verification(),
		}

		output = interactor.execute(input)
		valid = {
			successType: VerificationSaveOutput.SuccessTypes.ADDED_NEW,
			id: NEW_ID,
		}

		expect.assertions(4)
		await expect(output).resolves.toStrictEqual(valid)
		expect(spyExists).toHaveBeenCalledTimes(1)
		expect(spySaveFiles).toHaveBeenCalledTimes(1)
		expect(spySaveVerification).toHaveBeenCalledTimes(1)
	})

	it('Duplicate verification', async () => {
		input = {
			verification: EXISTING_VERIFICATION,
		}

		repository.exists = function (verification: Verification): Promise<Verification> {
			return Promise.resolve(EXISTING_VERIFICATION)
		}
		spyExists = jest.spyOn(repository, 'exists')

		output = interactor.execute(input)
		valid = {
			successType: VerificationSaveOutput.SuccessTypes.DUPLICATE,
			id: EXISTING_VERIFICATION.id!,
		}

		expect.assertions(4)
		await expect(output).resolves.toStrictEqual(valid)
		expect(spyExists).toHaveBeenCalledTimes(1)
		expect(spySaveFiles).toHaveBeenCalledTimes(0)
		expect(spySaveVerification).toHaveBeenCalledTimes(0)
	})

	it('Existing verification without files, add new files', async () => {
		input = {
			verification: faker_minimum_verification(),
			files: ['new1', 'new2'],
		}

		repository.exists = function (verification: Verification): Promise<Verification> {
			return Promise.resolve(EXISTING_VERIFICATION)
		}
		spyExists = jest.spyOn(repository, 'exists')

		output = interactor.execute(input)
		valid = {
			successType: VerificationSaveOutput.SuccessTypes.DUPLICATE_ADDED_FILES,
			id: EXISTING_VERIFICATION.id!,
		}

		expect.assertions(4)
		await expect(output).resolves.toStrictEqual(valid)
		expect(spyExists).toHaveBeenCalledTimes(1)
		expect(spySaveFiles).toHaveBeenCalledTimes(1)
		expect(spySaveVerification).toHaveBeenCalledTimes(1)
	})

	it('Existing verification with files, append new files', async () => {
		input = {
			verification: faker_minimum_verification(),
			files: ['new1', 'new2'],
		}

		repository.exists = function (verification: Verification): Promise<Verification> {
			return Promise.resolve(EXISTING_VERIFICATION_WITH_FILES)
		}
		spyExists = jest.spyOn(repository, 'exists')

		output = interactor.execute(input)
		valid = {
			successType: VerificationSaveOutput.SuccessTypes.DUPLICATE_ADDED_FILES,
			id: EXISTING_VERIFICATION_WITH_FILES.id!,
		}

		expect.assertions(4)
		await expect(output).resolves.toStrictEqual(valid)
		expect(spyExists).toHaveBeenCalledTimes(1)
		expect(spySaveFiles).toHaveBeenCalledTimes(1)
		expect(spySaveVerification).toHaveBeenCalledTimes(1)
	})

	it('Existing verification with files, try to add the same files', async () => {
		input = {
			verification: faker_minimum_verification(),
			files: EXISTING_VERIFICATION_WITH_FILES.files,
		}

		repository.exists = function (verification: Verification): Promise<Verification> {
			return Promise.resolve(EXISTING_VERIFICATION_WITH_FILES)
		}
		spyExists = jest.spyOn(repository, 'exists')

		output = interactor.execute(input)
		valid = {
			successType: VerificationSaveOutput.SuccessTypes.DUPLICATE,
			id: EXISTING_VERIFICATION_WITH_FILES.id!,
		}

		expect.assertions(4)
		await expect(output).resolves.toStrictEqual(valid)
		expect(spyExists).toHaveBeenCalledTimes(1)
		expect(spySaveFiles).toHaveBeenCalledTimes(1)
		expect(spySaveVerification).toHaveBeenCalledTimes(0)
	})
})
