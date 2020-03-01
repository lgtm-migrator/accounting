<?php namespace App\Services\Parser;

use App\Entities\Verification;
use App\Libraries\VerificationFactory;
use RuntimeException;

class VisaGoldParser extends BaseParser {
	private const REGEX_PATTERN = '/(20\d{2}-\d{2}-\d{2})\n(.+\n{0,1}\D*)\n([0-9,]+)\n.*\n([0-9,]+)\n(\w+)\n/m';
	
	public function __construct(string &$text) {
		$this->text = $text;
	}

	public function createVerifications() {
		$found = preg_match(VisaGoldParser::REGEX_PATTERN, $this->text, $matches);

		if ($found !== 1) {
			throw new RuntimeException("Could not parse the PDF as VisaGoldParser.");
		}
		if (count($matches) != 6) {
			throw new RuntimeException("Could not parse the PDF as VisaGoldParser; invalid number of matches.");
		}

		$this->name = static::convertToValidName($matches[2]);

		$verificationFactory = new VerificationFactory();
		$verificationFactory
			->setDate($matches[1])
			->setType(Verification::TYPE_INVOICE_IN_PAYMENT)
			->setAccountFrom(2499)
			->setPayedInSek(static::convertToValidAmount($matches[3]))
			->setInvoiceAmount(static::convertToValidAmount($matches[4]))
			->setCurrency($matches[5]);

		$this->figureOutName($verificationFactory);

		return $verificationFactory->create();
	}

	private function figureOutName(VerificationFactory $verificationFactory) {
		if (strpos($this->name, 'GSUITE') !== FALSE) {
			$verificationFactory
				->setInternalName(static::VISA_GOLD_GOOGLE_G_SUITE_PAYMENT)
				->setName('Google G Suite (betalning) - VISA')
				->setInvoiceName(static::GOOGLE_INVOICE_G_SUITE_EUR);
		} else {
			$verificationFactory
				->setInternalName(static::GENERIC)
				->setInvoiceName(static::GENERIC)
				->setName($this->name . ' (betalning) - VISA')
				->setRequireConfirmation(true);
		}
	}
}
