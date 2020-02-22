<?php namespace App\Controllers;

use App\Models\TransactionModel;
use App\Models\VerificationModel;
use RuntimeException;

class Verification extends ApiController {
	public function getAll() {
		return 'Test';
	}

	public function createFromPdf() {
		// Get file information
		$file = $this->request->getFile('file');

		if ($file == null) {
			throw new RuntimeException("No file supplied for parameter 'file'.");
		} elseif (!$file->isValid()) {
			throw new RuntimeException($file->getErrorString().'('.$file->getError().')');
		}
		
		$filename = $file->getName();
		$filepath = $file->getPathName();

		$parser = \Config\Services::pdfParser();
		$verifications = $parser->parse($filepath);

		// Save Verifications and transactions
		helper('verification_file');
		$verificationModel = new VerificationModel();
		$transactionModel = new TransactionModel();
		foreach ($verifications as $verification) {
			// Check for duplicates
			if ($verificationModel->isDuplicate($verification)) {
				continue;
			}

			// Copy (save) PDF to verifications for the correct year
			saveVerificationFile($filepath, $filename, $verification);

			// Save verification
			$verification->id = $verificationModel->insert($verification);
			
			// Bind transactions to the created verifications
			$verification->updateIdForTransactions();

			// Save transactions
			foreach ($verification->transactions as $transaction) {
				$transactionModel->save($transaction);
			}
		}

		return ApiController::STATUS_OK;
	}
}
