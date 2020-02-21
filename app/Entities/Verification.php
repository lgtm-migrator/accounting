<?php namespace App\Entities;

use CodeIgniter\Entity;

class Verification extends Entity {
	public $transactions = [];

	// All verification types
	public const TYPE_INVOICE = 'INVOICE';
	public const TYPE_PAYMENT = 'PAYMENT';
	public const TYPE_TRANSACTION = 'TRANSACTION';


	public function updateIdForTransactions() {
		if (isset($this->transactions)) {
			foreach ($this->transactions as $transaction) {
				$transaction->verification_id = $this->id;
			}
		}
	}

	public function getYear() {
		return substr($this->date, 0, 4);
	}
}
