import { FileReader } from './FileReader'
import pdfParse from 'pdf-parse'
import { readFileSync } from 'fs'
import { InternalError } from '../../app/core/definitions/InternalError'

export class PdfReader implements FileReader {
	async read(file: string): Promise<string> {
		const promise = new Promise<string>((resolve) => {
			let dataBuffer: Buffer
			try {
				dataBuffer = readFileSync(file)
			} catch (error) {
				throw new InternalError(InternalError.Types.fileNotFound, file)
			}

			return pdfParse(dataBuffer)
				.then((data) => {
					return resolve(data.text)
				})
				.catch((error) => {
					throw new InternalError(InternalError.Types.readingFile, error)
				})
		})
		return promise
	}
}
