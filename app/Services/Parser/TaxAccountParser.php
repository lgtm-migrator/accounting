<?php namespace App\Services\Parser;

use App\Entities\Verification;
use App\Entities\Transaction;
use Config\Services;
use RuntimeException;

class TaxAccountParser extends BaseParser {
	private const REGEX_PATTERN = '/(\d{6})\s+(.*?)\s{4}\s+(-?\d*?\s?\d*)\s{4}/';

	public function __construct(string &$text_layout) {
		$this->verifications = [];
		$this->text_layout = $text_layout;
	}

	public function createVerifications()	{
		$this->parse($this->text_layout);
		return $this->verifications;
	}

	private function parse(string &$text_layout) {
		$found = preg_match_all(TaxAccountParser::REGEX_PATTERN, $text_layout, $matches_arr, PREG_SET_ORDER);

		if ($found == 0) {
			throw new RuntimeException("Could not parse the PDF as TaxAccountParser");
		}

		$user_id = Services::auth()->getUserId();

		foreach ($matches_arr as $matches) {
			$verification = new Verification();
			$verification->user_id = $user_id;
			$verification->date = static::parseDate($matches[1]);
			$verification->type = Verification::TYPE_TRANSACTION;
			$verification->name = "Skattekonto - $matches[2]";
			$this->createInternalName($verification);
			if ($verification->internal_name !== BaseParser::SKIP) {
				$verification->total = static::convertToValidAmount($matches[3]);
				$this->createTransactions($verification);
				$this->verifications[] = $verification;
			}
		}
	}

	private static function parseDate(&$date) {
		return '20' . substr($date, 0, 2) . '-' . substr($date, 2, 2) . '-' . substr($date, 4);
	}

	private function createInternalName($verification) {
		$name = $verification->name;

		// Preliminärskatt
		if (strpos($name, 'preliminärskatt') !== FALSE) {
			$verification->internal_name = BaseParser::TAX_ACCOUNT_PRELIMINARY_TAX;
		}
		// Inbetalning (SKIP)
		elseif (strpos($name, 'Inbetalning') !== FALSE) {
			$verification->internal_name = BaseParser::SKIP;
		}
		// Utbetalning
		elseif (strpos($name, 'Utbetalning') !== FALSE) {
			$verification->internal_name = BaseParser::TAX_ACCOUNT_PAYOUT;
		}
		// Moms
		elseif (strpos($name, 'Moms') !== FALSE) {
			$verification->internal_name = BaseParser::TAX_ACCOUNT_TAX_COLLECT;
		}
		// Intäktsränta
		elseif (strpos($name, 'Intäktsränta') !== FALSE) {
			$verification->internal_name = BaseParser::TAX_ACCOUNT_INTEREST_INCOME;
		}
		// Kostnadsränta
		elseif (strpos($name, 'ostnadsränta') !== FALSE) {
			$verification->internal_name = BaseParser::TAX_ACCOUNT_INTEREST_EXPENSE;
		}
		// Invalid parse
		else {
			throw new RuntimeException("Couldn't parse Tax Account row: $name, unknown type");
		}
	}

	public function createTransactions(&$verification) {
		$amount = $verification->total;

		// 1630 Skattekonto
		$transaction = new Transaction($verification);
		$transaction->account_id = 1630;
		if ($amount > 0) {
			$transaction->debit = $amount;
		} else {
			$transaction->credit = -$amount;
		}
		$verification->transactions[] = $transaction;


		$transaction = new Transaction($verification);

		// 2518 Debiterad Preliminärskatt (F-skatt)
		if ($verification->internal_name == BaseParser::TAX_ACCOUNT_PRELIMINARY_TAX) {
			$transaction->account_id = 2518;
			if ($amount > 0) {
				$transaction->credit = $amount;
			} else {
				$transaction->debit = -$amount;
			}
		}
		// 1650 Momsfodran
		elseif ($verification->internal_name == BaseParser::TAX_ACCOUNT_TAX_COLLECT) {
			$transaction->account_id = 1650;
			if ($amount > 0) {
				$transaction->credit = $amount;
			} else {
				$transaction->debit = -$amount;
			}
		}
		// 8423 Kostnadsränta
		elseif ($verification->internal_name == BaseParser::TAX_ACCOUNT_INTEREST_EXPENSE) {
			$transaction->account_id = 8423;
			$transaction->debit = -$amount;
		}
		// 8314 Intäktsränta
		elseif ($verification->internal_name == BaseParser::TAX_ACCOUNT_INTEREST_INCOME) {
			$transaction->account_id = 8314;
			$transaction->credit = $amount;
		}
		// 1920 Utbetalning till Plusgiro
		elseif ($verification->internal_name == BaseParser::TAX_ACCOUNT_PAYOUT) {
			$transaction->account_id = 1920;
			$transaction->debit = -$amount;
		}
		
		$verification->transactions[] = $transaction;
	}
}
