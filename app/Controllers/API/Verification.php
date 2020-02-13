<?php namespace App\Controllers\API;

use Spatie\PdfToText\Pdf;
use App\Libraries\Parser\ParserFactory;
use App\Models\TransactionModel;
use App\Models\VerificationModel;

class Verification extends ApiController {
	public function index() {
		return 'Test';
	}

	public function create() {
		
	}

	public function create_from_pdf() {
		// Get file information
		if ($files = $this->request->getFiles()) {
			foreach ($files as $file) {
				$filename = $file->getName();
				$filepath = $file->getPathName();
			}
		}

		$text = Pdf::getText($filepath);
		$verifications = ParserFactory::create($text);


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
			$verificationModel->save($verification);
			
			// Bind transactions to the created verifications
			$verification->updateIdForTransactions();

			// Save transactions
			foreach ($verification->transactions as $transaction) {
				$transactionModel->save($transaction);
			}
		}

		return ":)";
	}
}
