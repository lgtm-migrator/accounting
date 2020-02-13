<?php namespace App\Libraries\Parser;

class ParserFactory {
	public static function create(string &$text) {
		// Google USD
		if (strpos($text, '5345-5088-6911') !== FALSE) {
			$parser = new GoogleInvoiceParser($text);
		}
		// Google EUR
		elseif (strpos($text, '9258-6331-6332') !== FALSE) {
			$parser = new GoogleInvoiceParser($text);
		}

		return $parser->createVerifications();
	}
}
