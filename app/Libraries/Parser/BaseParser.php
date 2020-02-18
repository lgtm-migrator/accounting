<?php namespace App\Libraries\Parser;

use App\Entities\Verification;
use RuntimeException;

abstract class BaseParser {
	public $verification;
	public $exchange_rate = 10.353063; // TODO remove

	// All internal names for the parsers
	public const GENERIC = 'GENERIC';
	public const GOOGLE_INVOICE_G_SUITE_EUR = 'GOOGLE_INVOICE_G_SUITE_EUR';
	public const GOOGLE_INVOICE_CLOUD_PLATFORM_USD = 'GOOGLE_INVOICE_CLOUD_PLATFORM_USD';
	public const VISA_GOLD_GOOGLE_G_SUITE_PAYMENT = 'VISA_GOLD_GOOGLE_G_SUITE_PAYMENT';

	public function __construct() {
		$this->verification = new Verification();
	}

	public static function convertFromCommaToDot(&$amount) {
		return floatval(str_replace(',', '.', $amount));
	}

	public function getConvertedTotal() {
		return round($this->verification->total * $this->exchange_rate, 2);
	}

	public function createVerifications() {
		helper('currency');
		
		if (isset($this->currency) && $this->currency != 'SEK') {
// 			$this->exchange_rate = exchangeRateToSek($this->currency, $this->verification->date);
		}

		$this->verification->transactions = $this->createTransactions();
		$this->checkTransactionSum();

		return [$this->verification];
	}

	public abstract function createTransactions();

	private function checkTransactionSum() {
		$sum = 0;
		foreach ($this->verification->transactions as $transaction) {
			if (isset($transaction->debit)) {
				$sum += $transaction->debit;
			} else if (isset($transaction->credit)) {
				$sum -= $transaction->credit;
			}
		}

		if (round($sum, 4) != 0) {
			throw new RuntimeException("Transactions doesn't sum to 0. Sum: $sum");
		}
	}
}
