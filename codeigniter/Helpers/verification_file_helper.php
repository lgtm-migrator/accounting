<?php

function saveVerificationFile($filepath, $verification) {
	// Check for duplicates
	if (_isDuplicate($filepath, $verification)) {
		return false;
	}

	// Calculate destination file
	$dest_dir = _getVerificationDir($verification);
	$dest_filename = _getVerificationFilename($verification);
	$dest = $dest_dir . $dest_filename;

	// Create directories
	if (!is_dir($dest_dir)) {
		mkdir($dest_dir, 0777, true);
	}

	// Copy file
	copy($filepath, $dest);

	// Update file in the verification
	$verification->file = $dest;

	return true;
}

function _isDuplicate($filepath, $verification) {
	$dir = _getVerificationDir($verification);
	log_message('debug', "_isDuplicate() file count: $verification->file_count");
	for ($i = 1; $i < $verification->file_count; ++$i) {
		$existing_filepath = $dir . _getVerificationFilename($verification, $i);

		// Check filesize first -> Then SHA1
		if (filesize($filepath) == filesize($existing_filepath)) {
			if (sha1_file($filepath) == sha1_file($existing_filepath)) {
				return true;
			}
		}
	}

	return false;
}

function _getVerificationDir($verification) {
	return WRITEPATH . 'verifications/' . $verification->getYear() . "/";
}

function _getVerificationFilename($verification, $file_count = null) {
	if (!$file_count) {
		$file_count = $verification->file_count;
	}
	return "$verification->date $verification->name ($file_count).pdf";
}
