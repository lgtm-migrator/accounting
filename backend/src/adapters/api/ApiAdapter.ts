import { FiscalYearGetAllInput } from '../../app/fiscal-year/get-all/FiscalYearGetAllInput'
import { FiscalYearGetAllOutput } from '../../app/fiscal-year/get-all/FiscalYearGetAllOutput'
import { UserGetByKeyInput } from '../../app/user/get-by-key/UserGetByKeyInput'
import { VerificationGetAllInput } from '../../app/verification/get-all/VerificationGetAllInput'
import { VerificationGetAllOutput } from '../../app/verification/get-all/VerificationGetAllOutput'
import { VerificationNewCustomTransactionInput } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionInput'
import { VerificationNewFromParserInput } from '../../app/verification/new-from-parser/VerificationNewFromParserInput'
import { VerificationNewFromParserOutput } from '../../app/verification/new-from-parser/VerificationNewFromParserOutput'
import { VerificationNewInput } from '../../app/verification/new/VerificationNewInput'
import { VerificationSaveOutput } from '../../app/verification/save/VerificationSaveOutput'
import { UserGetByKeyOutput } from '../../app/user/get-by-key/UserGetByKeyOutput'

export interface ApiAdapter {
	verification: {
		getAll(input: VerificationGetAllInput): Promise<VerificationGetAllOutput>
		add(input: VerificationNewInput): Promise<VerificationSaveOutput>
		addCustom(input: VerificationNewCustomTransactionInput): Promise<VerificationSaveOutput>
		addFromParser(input: VerificationNewFromParserInput): Promise<VerificationNewFromParserOutput>
	}
	user: {
		getByKey(input: UserGetByKeyInput): Promise<UserGetByKeyOutput>
	}
	fiscalYear: {
		getAll(input: FiscalYearGetAllInput): Promise<FiscalYearGetAllOutput>
	}
}
