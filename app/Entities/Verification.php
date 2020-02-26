<?php namespace App\Entities;

class Verification extends Entity {
	public $transactions = [];

	// All verification types
	public const TYPE_INVOICE_IN = 'INVOICE_IN';
	public const TYPE_INVOICE_IN_PAYMENT = 'INVOICE_IN_PAYMENT';
	public const TYPE_INVOICE_OUT = 'INVOICE_OUT';
	public const TYPE_INVOICE_OUT_PAYMENT = 'INVOICE_OUT_PAYMENT';
	public const TYPE_PAYMENT_DIRECT = 'PAYMENT_DIRECT';
	public const TYPE_TRANSACTION = 'TRANSACTION';


	public function updateIdForTransactions() {
		if (isset($this->transactions)) {
			foreach ($this->transactions as $transaction) {
				$transaction->verification_id = $this->id;
			}
		}
	}

	public function setTotal($total) {
		$this->attributes['total'] = abs($total);
	}

	public function setTotalSek($total) {
		$this->attributes['total_sek'] = abs($total);
	}

	public function getYear() {
		return substr($this->date, 0, 4);
	}

	public function jsonSerialize() {
		$this->attributes['transactions'] = $this->transactions;
		return parent::jsonSerialize();
	}
}
