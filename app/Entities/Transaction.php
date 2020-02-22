<?php namespace App\Entities;

class Transaction extends Entity {
	public function __construct($verification = null) {
		parent::__construct();
		if ($verification != null) {
			$this->date = $verification->date;
		}
	}

	public function setDebit($amount) {
		$this->attributes['debit'] = $amount;
		$this->setOriginalAmountIfNotSet($amount);
	}

	public function setCredit($amount) {
		$this->attributes['credit'] = $amount;
		$this->setOriginalAmountIfNotSet($amount);
	}

	private function getRoundedValue($amount) {
		return round($amount, 2);
	}

	private function setOriginalAmountIfNotSet($amount) {
		if (!isset($this->original_amount)) {
			$this->original_amount = $amount;
		}
	}
}
