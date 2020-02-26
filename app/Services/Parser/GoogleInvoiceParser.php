<?php namespace App\Services\Parser;

use App\Entities\Verification;
use App\Libraries\VerificationFactory;
use DateTime;

class GoogleInvoiceParser extends BaseParser {
	public function __construct(string &$text) {
		$this->text = $text;
	}

	protected function createVerifications() {
		$verificationFactory = new VerificationFactory();
		$verificationFactory
			->setType(Verification::TYPE_INVOICE_IN)
			->setCurrency(static::findCurrency($this->text))
			->setInvoiceAmount(static::findTotal($this->text))
			->setDate(static::convertDate(static::findDate($this->text)));

		if ($verificationFactory->currency === 'EUR') {
			$verificationFactory
				->setName('Google G Suite (faktura)')
				->setInternalName(BaseParser::GOOGLE_INVOICE_G_SUITE_EUR)
				->setAccountTo(5421);
		} elseif ($verificationFactory->currency === 'USD') {
			$verificationFactory
				->setName('Google Cloud Platform (faktura)')
				->setInternalName(BaseParser::GOOGLE_INVOICE_CLOUD_PLATFORM_USD)
				->setAccountTo(5422);
		}
		return $verificationFactory->create();
	}

	private static function findDate(string &$text) {
		$found = preg_match('/[JFMASOND][aepuco][nbrylgptvc]\ \d{2},\ 20\d{2}/', $text, $matches);

		if ($found === 1) {
			return $matches[0];
		} else {
			return null;
		}
	}

	private static function findCurrency(string &$text) {
		if (strpos($text, 'EUR') !== FALSE) {
			return 'EUR';
		} elseif (strpos($text, 'USD') !== FALSE) {
			return 'USD';
		} else {
			return null;
		}
	}

	private static function findTotal(string &$text) {
		$found = preg_match('/[$€](\d{1,2}\.\d{2})/', $text, $matches);

		if ($found === 1) {
			return doubleval($matches[1]);
		} else {
			return null;
		}
	}

	// Convert date from Jan 31, 2019 --> 2019-01-31
	private static function convertDate($date) {
		$date_time = DateTime::createFromFormat('M d, Y', $date);
		return $date_time->format('Y-m-d');
	}
}
