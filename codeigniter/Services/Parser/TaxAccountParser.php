<?php namespace App\Services\Parser;

use App\Entities\Verification;
use App\Libraries\VerificationFactory;
use RuntimeException;

class TaxAccountParser extends BaseParser {
	private const REGEX_PATTERN = '/(\d{6})\s+(.*?)\s{4}\s+(-?\d*?\s?\d*)\s{4}/';

	public function __construct(string &$text_layout) {
		$this->verifications = [];
		$this->text_layout = $text_layout;
	}

	public function createVerifications()	{
		$this->parse();
		return $this->verifications;
	}

	private function parse() {
		$found = preg_match_all(static::REGEX_PATTERN, $this->text_layout, $matches_arr, PREG_SET_ORDER);

		if ($found == 0) {
			throw new RuntimeException("Could not parse the PDF as TaxAccountParser");
		}

		foreach ($matches_arr as $matches) {
			$verificationFactory = new VerificationFactory();
			$verificationFactory
				->setDate(static::parseDate($matches[1]))
				->setType(Verification::TYPE_TRANSACTION)
				->setName("Skattekonto - $matches[2]")
				->setInternalName(static::getInternalName($verificationFactory->name));
			if ($verificationFactory->internal_name !== static::SKIP) {
				$verificationFactory->
					setAmount(static::convertToValidAmount($matches[3]));
				static::createTransactions($verificationFactory);
				$this->verifications[] = $verificationFactory->create();
			}
		}
	}

	private static function parseDate(&$date) {
		return '20' . substr($date, 0, 2) . '-' . substr($date, 2, 2) . '-' . substr($date, 4);
	}

	private static function getInternalName($name) {
		// Preliminärskatt
		if (strpos($name, 'preliminärskatt') !== FALSE) {
			return static::TAX_ACCOUNT_PRELIMINARY_TAX;
		}
		// Inbetalning (SKIP)
		elseif (strpos($name, 'Inbetalning') !== FALSE) {
			return static::SKIP;
		}
		// Utbetalning
		elseif (strpos($name, 'Utbetalning') !== FALSE) {
			return static::TAX_ACCOUNT_PAYOUT;
		}
		// Moms
		elseif (strpos($name, 'Moms') !== FALSE) {
			return static::TAX_ACCOUNT_TAX_COLLECT;
		}
		// Intäktsränta
		elseif (strpos($name, 'Intäktsränta') !== FALSE) {
			return static::TAX_ACCOUNT_INTEREST_INCOME;
		}
		// Kostnadsränta
		elseif (strpos($name, 'ostnadsränta') !== FALSE) {
			return static::TAX_ACCOUNT_INTEREST_EXPENSE;
		}
		// Invalid parse
		else {
			throw new RuntimeException("Couldn't parse Tax Account row: $name, unknown type");
		}
	}

	public static function createTransactions(VerificationFactory &$verificationFactory) {
		$amount = $verificationFactory->amount;

		// 1630 Skattekonto
		$verificationFactory->addTransaction(1630, $amount);

		$account_id = 0;
		// 2518 Debiterad Preliminärskatt (F-skatt)
		if ($verificationFactory->internal_name == static::TAX_ACCOUNT_PRELIMINARY_TAX) {
			$account_id = 2518;
		}
		// 1650 Momsfodran
		elseif ($verificationFactory->internal_name == static::TAX_ACCOUNT_TAX_COLLECT) {
			$account_id = 1650;
		}
		// 8423 Kostnadsränta
		elseif ($verificationFactory->internal_name == static::TAX_ACCOUNT_INTEREST_EXPENSE) {
			$account_id = 8423;
		}
		// 8314 Intäktsränta
		elseif ($verificationFactory->internal_name == static::TAX_ACCOUNT_INTEREST_INCOME) {
			$account_id = 8314;
		}
		// 1920 Utbetalning till Plusgiro
		elseif ($verificationFactory->internal_name == static::TAX_ACCOUNT_PAYOUT) {
			$account_id = 1920;
		}
		$verificationFactory->addTransaction($account_id, -$amount);
	}
}
