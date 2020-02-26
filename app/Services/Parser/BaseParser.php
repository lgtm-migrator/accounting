<?php namespace App\Services\Parser;

use App\Libraries\VerificationFactory;
use RuntimeException;

abstract class BaseParser {
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

	public static function convertToValidAmount(&$amount) {
		$no_spaces = str_replace(' ', '', $amount);
		return floatval(str_replace(',', '.', $no_spaces));
	}

	public function getConvertedTotal() {
		return round($this->verification->total * $this->exchange_rate, 2);
	}

	protected abstract function createVerifications();

	public final function getVerifications() {
		$verifications = $this->createVerifications();

		// Convert to an array
		if (!is_array($verifications)) {
			$verifications = [$verifications];
		}
		return $verifications;
	}
}
