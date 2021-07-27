<?php namespace App\Services\Parser;

use Spatie\PdfToText\Pdf;
use RuntimeException;

class ParserFactory {
	public function parse(string &$filepath) {
		// Read text
		$text = Pdf::getText($filepath);
		$text_layout = Pdf::getText($filepath, null, ['layout']);

		// Google USD
		if (strpos($text, '5345-5088-6911') !== FALSE) {
			$parser = new GoogleInvoiceParser($text);
		}
		// Google EUR/SEK
		elseif (strpos($text, '9258-6331-6332') !== FALSE) {
			$parser = new GoogleInvoiceParser($text);
		}
		// VISA Business Gold
		elseif (strpos($text, 'Löpnummer:') !== FALSE && strpos($text, 'Inköpsställe:') !== FALSE) {
			$parser = new VisaGoldParser($text);
		}
		elseif (strpos($text, 'FAKTURA BUSINESS GOLD') !== FALSE) {
			$parser = new VisaInvoiceParser($text_layout);
		}
		// First Card Invoice
		elseif (strpos($text, '8010630') !== FALSE && strpos($text, 'First Card') !== FALSE) {
			$parser = new FirstCardInvoiceParser($text_layout);
		}
		// Skattekonto
		elseif (strpos($text, 'Skattekonto') !== FALSE && strpos($text, 'Omfattar transaktionstyp:') !== FALSE) {
			$parser = new TaxAccountParser($text_layout);
		}
		// Undefined parser
		else {
			throw new RuntimeException('No parser defined for PDF');
		}

		return $parser->getVerifications();
	}
}
