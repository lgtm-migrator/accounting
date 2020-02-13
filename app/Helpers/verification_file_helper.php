<?php

function saveVerificationFile($filepath, $filename, $verification) {
	// Get file extension
	$ext = pathinfo($filename, PATHINFO_EXTENSION);

	// Calculate destination file
	$dest_dir = WRITEPATH . 'verifications/' . $verification->getYear() . "/";
	$dest_filename = "$verification->date $verification->name.$ext";
	$dest = $dest_dir . $dest_filename;

	// Create directories
	if (!is_dir($dest_dir)) {
		mkdir($dest_dir, 0777, true);
	}

	// Copy file
	copy($filepath, $dest);

	// Update file in the verification
	$verification->file = $dest;
}
