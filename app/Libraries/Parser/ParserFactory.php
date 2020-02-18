<?php namespace App\Libraries\Parser;

use RuntimeException;

class ParserFactory {
	public static function create(string &$text, string &$text_layout) {
		// Google USD
		if (strpos($text, '5345-5088-6911') !== FALSE) {
			$parser = new GoogleInvoiceParser($text);
		}
		// Google EUR
		elseif (strpos($text, '9258-6331-6332') !== FALSE) {
			$parser = new GoogleInvoiceParser($text);
		}
		// VISA Business Gold
		elseif (strpos($text, 'Löpnummer:') !== FALSE && strpos($text, 'Inköpsställe:') !== FALSE) {
			$parser = new VisaGoldParser($text);
		}
		// Skattekonto
		elseif (strpos($text, 'Skattekonto') !== FALSE && strpos($text, 'Omfattar transaktionstyp:') !== FALSE) {
			$parser = new TaxAccountParser($text_layout);
		}
		// Undefined parser
		else {
			throw new RuntimeException('No parser defined for PDF');
		}

		return $parser->createVerifications();
	}
}
