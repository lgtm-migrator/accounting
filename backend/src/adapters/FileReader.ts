export interface FileReader {
	/**
	 * Reads a file and returns it as a string.
	 * @param file the file to read.
	 * @return all the text in the file
	 */
	read(file: string): Promise<string>
}
