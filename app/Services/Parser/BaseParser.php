<?php namespace App\Services\Parser;

use App\Entities\Verification;
use Config\Services;
use RuntimeException;

abstract class BaseParser {
	public $verification;
	public $exchange_rate = 10.353063; // TODO remove

	// All internal names for the parsers
	public const SKIP = 'SKIP'; // Skip adding this verification
	public const GENERIC = 'GENERIC';
	public const GOOGLE_INVOICE_G_SUITE_EUR = 'GOOGLE_INVOICE_G_SUITE_EUR';
	public const GOOGLE_INVOICE_CLOUD_PLATFORM_USD = 'GOOGLE_INVOICE_CLOUD_PLATFORM_USD';
	public const VISA_GOLD_GOOGLE_G_SUITE_PAYMENT = 'VISA_GOLD_GOOGLE_G_SUITE_PAYMENT';
	public const TAX_ACCOUNT_PRELIMINARY_TAX = 'TAX_ACCOUNT_PRELIMINARY_TAX';
	public const TAX_ACCOUNT_INTEREST_EXPENSE = 'TAX_ACCOUNT_INTEREST_EXPENSE';
	public const TAX_ACCOUNT_INTEREST_INCOME = 'TAX_ACCOUNT_INTEREST_INCOME';
	public const TAX_ACCOUNT_TAX_COLLECT = 'TAX_ACCOUNT_TAX_COLLECT';
	public const TAX_ACCOUNT_PAYOUT = 'TAX_ACCOUNT_PAYOUT';

	public function __construct() {
		$this->verification = new Verification();
	}

	public static function convertToValidAmount(&$amount) {
		$no_spaces = str_replace(' ', '', $amount);
		return floatval(str_replace(',', '.', $no_spaces));
	}

	public function getConvertedTotal() {
		return round($this->verification->total * $this->exchange_rate, 2);
	}

	public function createVerifications() {
		if (isset($this->currency) && $this->currency != 'SEK') {
			helper('currency');
			// TODO use the exchange rate
// 			$this->exchange_rate = exchangeRateToSek($this->currency, $this->verification->date);
		}

		// Single verification -> Multiple Verifications
		if (isset($this->verification) && !isset($this->verifications)) {
			$this->verifications = [$this->verification];
		}

		$auth = Services::auth();
		$verification_count = count($this->verifications);
		for ($i = 0; $i < $verification_count; ++$i) {
			$verification = $this->verifications[$i];
			// Set user_id for the verification
			$verification->user_id = $auth->getUserId();

			// Remove verifications that are labeled as SKIP
			if ($verification->internal_name == BaseParser::SKIP) {
				unset($this->verifications[$i]);
			}
		}

		// Create transactions
		foreach ($this->verifications as $verification) {
			$this->createTransactions($verification);
		}
		$this->checkTransactionSum();

		return $this->verifications;
	}

	public abstract function createTransactions(&$verification);

	protected function checkTransactionSum() {
		// Multiple Transactions
		if (isset($this->verifications)) {
			foreach ($this->verifications as $verification) {
				$sum = 0;
				foreach ($verification->transactions as $transaction) {
					$sum += BaseParser::getTransactionAmount($transaction);
				}
				
				if (round($sum, 4) != 0) {
					throw new RuntimeException("Transactions doesn't sum to 0. Sum: $sum");
				}
			}
		}
	}

	private static function getTransactionAmount(&$transaction) {
		if (isset($transaction->debit)) {
			return $transaction->debit;
		} else if (isset($transaction->credit)) {
			return -$transaction->credit;
		} else {
			return 0;
		}
	}
}
