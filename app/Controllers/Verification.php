<?php namespace App\Controllers;

use App\Models\AccountModel;
use App\Models\TransactionModel;
use App\Models\VerificationModel;
use RuntimeException;

class Verification extends ApiController {
	public function getAll($fiscalId = null) {
		$verificationModel = new VerificationModel();
		$transactionModel = new TransactionModel();
		$accountModel = new AccountModel();

		$userId = \Config\Services::auth()->getUserId();
		if ($userId === null) {
			return $this->fail('Failed to get user');
		}

		$verifications = $verificationModel->getAll($userId, $fiscalId);

		// Get all transactions
		foreach ($verifications as $verification) {
			$verification->transactions = $transactionModel->getByVerificationId($verification->id);

			// Get all account names for the transactions
			foreach ($verification->transactions as $transaction) {
				$account = $accountModel->find($transaction->account_id);

				if ($account) {
					$transaction->account_name = $account->name;
				}
			}
		}

		return $this->respond($verifications);
	}

	public function create() {
		
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
