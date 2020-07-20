import { FileReader } from './FileReader'

export interface FileGateway {
	/**
	 * Creates a correct file reader depending on the file's extension
	 * @param filename the filename to create a reader for
	 * @return a file reader that can read the specified file
	 * @throws {InternalError.Types.notImplemented} if the file's extension hasn't been implemented
	 */
	create(filename: string): FileReader
}
