<?php namespace App\Entities;

use CodeIgniter\Entity;

class Transaction extends Entity {
	public function setDebit($amount) {
		$this->attributes['debit'] = $amount;
		$this->setAmountIfNotSet($amount);
	}

	public function setCredit($amount) {
		$this->attributes['credit'] = $amount;
		$this->setAmountIfNotSet($amount);
	}

	private function getRoundedValue($amount) {
		return round($amount, 2);
	}

	private function setAmountIfNotSet($amount) {
		if (!isset($this->original_amount)) {
			$this->original_amount = $amount;
		}
	}
}
