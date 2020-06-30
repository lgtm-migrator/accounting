import { FileReader } from './FileReader'
import { FileReaderFactory } from './FileReaderFactory'
import { PdfReader } from './PdfReader'
import { InternalError } from '../app/core/definitions/InternalError'

describe('FileReaderFactory #cold #adapter', () => {
	const factory = new FileReaderFactory()
	let fileReader: FileReader

	it('Get PDF file reader', () => {
		fileReader = factory.create('simple.pdf')
		expect(fileReader).toBeInstanceOf(PdfReader)

		fileReader = factory.create('a more advanced/example/name.pdf')
		expect(fileReader).toBeInstanceOf(PdfReader)

		fileReader = factory.create('E:\\something\\folder\\name.pdf')
		expect(fileReader).toBeInstanceOf(PdfReader)

		fileReader = factory.create('/linux/style/from/root.pdf')
		expect(fileReader).toBeInstanceOf(PdfReader)
	})

	it('Not implemented file extensions', () => {
		expect.assertions(1)
		try {
			fileReader = factory.create('not-implemented.txt')
		} catch (error) {
			expect(error).toMatchObject({ type: InternalError.Types.notImplemented })
		}
	})
})
