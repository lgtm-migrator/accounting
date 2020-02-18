<?php namespace App\Libraries\Parser

use App\Entities\Transaction;

class VisaGoldParser extends BaseParser {
	private const REGEX_PATTERN = '/(20\d{2}-\d{2}-\d{2})\n(.+\n{0,1}\D*)\n([0-9,]+)\n.*\n([0-9,]+)\n(\w+)\n(\d+,\d+){0,1}/gm';
	public function __construct(string &$text) {
		
	}

	private function parse(string &$text) {
		
	}
}
