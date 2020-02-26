<?php namespace App\Controllers;

use App\Entities\Verification as EntitiesVerification;
use App\Libraries\VerificationFactory;
use App\Models\AccountModel;
use App\Models\TransactionModel;
use App\Models\VerificationModel;

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

	public function createPayment() {
		$json = $this->request->getPost('json');
		$input = json_decode($json, true);
		$file = $this->getFile();

		$verificationFactory = new VerificationFactory($input);
		$verificationFactory->setInternalName('MANUAL');
		$verification = $verificationFactory->create();

		$this->saveVerification($verification, $file);

		return $this->respondCreated(null, 'Verification successfully created');
	}

	public function createTransaction() {
		$json = $this->request->getPost('json');
		$input = json_decode($json, true);
		$file = $this->getFile();

		$verificationFactory = new VerificationFactory($input);
		$verificationFactory->setInternalName('MANUAL');
		$verificationFactory->setType(EntitiesVerification::TYPE_TRANSACTION);
		$verification = $verificationFactory->create();

		$this->saveVerification($verification, $file);

		return $this->respondCreated(null, 'Transaction successfully created');
	}

	public function createFromPdf() {
		// Get file information
		$file = $this->getFile();
		$filepath = $file->getPathName();

		$parser = \Config\Services::pdfParser();
		$verifications = $parser->parse($filepath);

		$this->saveVerifications($verifications, $file);

		return ApiController::STATUS_OK;
	}

	private function getFile() {
		return $this->request->getFile('file');
	}

	private function saveVerifications(&$verifications, &$file) {
		foreach ($verifications as $verification) {
			$this->saveVerification($verification, $file);
		}
	}

	private function saveVerification(&$verification, &$file) {
		helper('verification_file');
		$verificationModel = new VerificationModel();
		$transactionModel = new TransactionModel();
		
		// Check for duplicates
		if ($verificationModel->isDuplicate($verification)) {
			return;
		}

		// Copy (save) PDF to verifications for the correct year
		if ($file) {
			$filename = $file->getName();
			$filepath = $file->getPathName();
			saveVerificationFile($filepath, $filename, $verification);
		}

		// Save verification
		$verification->id = $verificationModel->insert($verification);
		
		// Bind transactions to the created verifications
		$verification->updateIdForTransactions();

		// Save transactions
		foreach ($verification->transactions as $transaction) {
			$transactionModel->save($transaction);
		}
	}
}
