<?php namespace App\Controllers;

use App\Models\AccountModel;
use App\Models\TransactionModel;
use App\Models\VerificationModel;
use Config\Services;
use RuntimeException;

class Account extends ApiController {
	private $accountModel;

	public function getAll() {
		$accountModel = new AccountModel();
		$accounts = $accountModel->orderBy('id', 'ASC')->findAll();
		return $this->respond($accounts);
	}

	public function getVatInfo() {
		$start_date = '2019-01-01';
		$end_date = '2019-12-31';
		$user_id = Services::auth()->getUserId();

		// Get all accounts with VAT information
		$accountModel = new AccountModel();
		$accounts = $accountModel
			->where('vat_code IS NOT NULL')
			->findAll();

		// Create empty dict for all amounts
		$amounts = [];
		$account_to_vat_code = [];
		foreach ($accounts as $account) {
			$account_to_vat_code[$account->id] = $account->vat_code;

			if (!isset($amounts[$account->vat_code])) {
				$amounts[$account->vat_code] = 0;
			}
		}

		// Get all verifications for the specified year
		$verificationModel = new VerificationModel();
		$verifications = $verificationModel
			->where('user_id', $user_id)
			->where("date >= '$start_date'")
			->where("date <= '$end_date'")
			->findAll();

		// Get all transactions for the verifications
		$transactionModel = new TransactionModel();
		foreach ($verifications as $verification) {
			$transactions = $transactionModel
				->where('verification_id', $verification->id)
				->findAll();

			foreach ($transactions as $transaction) {
				$account_id = $transaction->account_id;
				if (isset($account_to_vat_code[$account_id])) {
					$vat_code = $account_to_vat_code[$account_id];
					$amounts[$vat_code] += $transaction->amount;
				}
			}
		}

		return $this->respond($amounts);
	}

	public function fill() {
		$file = $this->request->getFile('file');

		if ($file == null) {
			throw new RuntimeException("No file supplied for parameter 'file'.");
		} elseif (!$file->isValid()) {
			throw new RuntimeException($file->getErrorString().'('.$file->getError().')');
		}

		// Read CSV file
		$this->accountModel = new AccountModel();
		ini_set('auto_detect_line_endings', TRUE);
		$handle = fopen($file->getPathName(), 'r');
		
		// Read one row
		while (($data = fgetcsv($handle)) !== FALSE) {
			if (is_numeric($data[0])) {
				$this->createAccount($data[0], $data[1]);
			}

			if (is_numeric($data[2])) {
				$this->createAccount($data[2], $data[3]);
			}
		}
		ini_set('auto_detect_line_endings', FALSE);
		fclose($handle);

		return ApiController::STATUS_OK;
	}

	private function createAccount($id, $name) {
		$this->accountModel->updateAccount(intval($id), trim($name));
	}
}
