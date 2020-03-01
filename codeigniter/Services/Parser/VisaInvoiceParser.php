<?php namespace App\Services\Parser;

use App\Entities\Verification;
use App\Libraries\VerificationFactory;
use RuntimeException;

class VisaInvoiceParser extends BaseParser {
	private const REGEX_PATTERN = '/Datum\ (\d+-\d+-\d+).*KORTTOTAL:\s+(.*?,\d{2})/s';
	private $date = null;
	private $amount = null;

	public function __construct(string &$text_layout) {
		$this->text_layout = $text_layout;
	}

	public function createVerifications() {
		$this->parse();

		$verificationFactory = new VerificationFactory();
		$verificationFactory
			->setDate($this->date)
			->setType(Verification::TYPE_TRANSACTION)
			->setAmount($this->amount)
			->setName('Nordea VISA Business Gold (faktura)')
			->setInternalName(static::VISA_GOLD_INVOICE);

		// Add transactions (Skulder till närstående personer)
		$verificationFactory
			->addTransaction(2499, $this->amount)
			->addTransaction(2893, -$this->amount);
	
		return $verificationFactory->create();
	}

	private function parse() {
		$found = preg_match(static::REGEX_PATTERN, $this->text_layout, $matches);

		if ($found === 0) {
			throw new RuntimeException("Could not parse the PDF as VisaInvoiceParser");
		}

		$this->setDate($matches[1]);
		$this->setAmount($matches[2]);
	}

	/**
	 * Convert date from invoice layout to the correct format
	 * @param string $date 
	 * @return void 
	 */
	private function setDate(string $date) {
		$this->date = '20' . $date;
	}

	/**
	 * Convert the amount from the invoice layout to a correct float value
	 * @param string $amount string amount from the layout
	 * @return void 
	 */
	private function setAmount(string $amount) {
		$this->amount = static::convertToValidAmount($amount);
	}
}