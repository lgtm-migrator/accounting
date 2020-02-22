<?php namespace App\Controllers;

use App\Models\AccountModel;
use RuntimeException;

class Account extends ApiController {
	private $accountModel;

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
