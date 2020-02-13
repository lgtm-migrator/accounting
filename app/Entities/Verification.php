<?php namespace App\Entities;

use CodeIgniter\Entity;
use Models\Transaction;

class Verification extends Entity {
	public $transaction;

	public function updateIdForTransactions() {
		if (isset($transactions)) {
			foreach ($transactions as $transaction) {
				$transaction->verification_id = $this->id;
			}
		}
	}

	public function getYear() {
		return substr($this->date, 0, 4);
	}
}
