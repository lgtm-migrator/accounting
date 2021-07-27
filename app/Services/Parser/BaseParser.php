<?php namespace App\Services\Parser;

use App\Libraries\VerificationFactory;
use RuntimeException;

abstract class BaseParser {
	// All internal names for the parsers
	public const SKIP = 'SKIP'; // Skip adding this verification
	public const GENERIC = 'GENERIC';
	public const GOOGLE_INVOICE_G_SUITE_EUR = 'GOOGLE_INVOICE_G_SUITE_EUR';
	public const GOOGLE_INVOICE_G_SUITE_SEK = 'GOOGLE_INVOICE_G_SUITE_SEK';
	public const GOOGLE_INVOICE_CLOUD_PLATFORM_USD = 'GOOGLE_INVOICE_CLOUD_PLATFORM_USD';
	public const VISA_GOLD_GOOGLE_G_SUITE_PAYMENT = 'VISA_GOLD_GOOGLE_G_SUITE_PAYMENT';
	public const VISA_GOLD_INVOICE = 'VISA_GOLD_INVOICE';
	public const FIRST_CARD_INVOICE = 'FIRST_CARD_INVOICE';
	public const TAX_ACCOUNT_PRELIMINARY_TAX = 'TAX_ACCOUNT_PRELIMINARY_TAX';
	public const TAX_ACCOUNT_INTEREST_EXPENSE = 'TAX_ACCOUNT_INTEREST_EXPENSE';
	public const TAX_ACCOUNT_INTEREST_INCOME = 'TAX_ACCOUNT_INTEREST_INCOME';
	public const TAX_ACCOUNT_TAX_COLLECT = 'TAX_ACCOUNT_TAX_COLLECT';
	public const TAX_ACCOUNT_PAYOUT = 'TAX_ACCOUNT_PAYOUT';

	/**
	 * Converts a string currency amount to a valid float. Supports many different
	 * formats.
	 * ```
	 * 2.578,20
	 * 2 354,20
	 * 234
	 * 234,256.20
	 * 234,205
	 * 246 548
	 * 244'056
	 * 26'155.25
	 * 12,20
	 * 13.33
	 * ```
	 * @param string $amount 
	 * @return float 
	 */
	public static function convertToValidAmount(string &$amount) {
		$pattern = "/^(\\d{0,3})?[\\.\\ ,']?(\\d{0,3})[.,](\\d{2})$|^(\\d{0,3})?[\\.\\ ,']?(\\d{0,3})$/";
		$replacement = '$1$2$4$5.$3';
		return floatval(preg_replace($pattern, $replacement, $amount));
	}

	protected static function convertToValidName(string &$name) {
		$pattern = '/([^\w\d\h])/m';
		$replacement = '-';
		return preg_replace($pattern, $replacement, $name);
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
