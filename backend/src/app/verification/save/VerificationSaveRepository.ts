import { Repository } from '../../core/definitions/Repository'
import { Verification } from '../../core/entities/Verification'
import { Id } from '../../core/definitions/Id'

export interface VerificationSaveRepository extends Repository {
	/**
	 * Saves a new verification or overwrite an existing verification if the verification Id has been set.
	 * This automatically saves all the transactions as well, but not the files.
	 * @param verification the verification to save
	 * @return id of the saved verification
	 */
	saveVerification(verification: Verification): Promise<Id>

	/**
	 * Save all the specified files
	 * @param files the new files to save. If the file already exists (checksum) it does nothing.
	 * If no files are specified, this method does nothing except to return the verification without changes.
	 * @param verification the verification to save the files for (used to determine file name)
	 * @return updated verification with all the new files. Note that this verification hasn't been saved.
	 * Only the files have been updated. If no files are specified, returns verification directly without changes.
	 */
	saveFiles(files: string[], verification: Verification): Promise<Verification>

	/**
	 * Check if the verification already exists and returns that instance.
	 * This method doesn't check by id, but rather on the content of the verification
	 * @param verification a comparable version of the verification to check if it exists
	 * @return the existing verification if it exists, undefined otherwise
	 */
	getExistingVerification(verification: Verification.Comparable): Promise<Verification | undefined>
}
