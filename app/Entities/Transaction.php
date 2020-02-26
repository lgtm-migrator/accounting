<?php namespace App\Entities;

class Transaction extends Entity {
	public function __construct($verification = null) {
		parent::__construct();
		if ($verification != null) {
			$this->date = $verification->date;

			if (isset($verification->id)) {
				$this->verification_id = $verification->id;
			}
		}
	}

	public function setAmount($amount) {
		$this->attributes['amount'] = static::getRoundedValue($amount);
		$this->setOriginalAmountIfNotSet($amount);
	}

	public function setDebit($amount) {
		$this->setAmount($amount);
	}

	public function setCredit($amount) {
		$this->setAmount(-$amount);
	}

	private static function getRoundedValue($amount) {
		return round($amount, 2);
	}

	private function setOriginalAmountIfNotSet($amount) {
		if (!isset($this->original_amount)) {
			$this->original_amount = $amount;
		}
	}
}
