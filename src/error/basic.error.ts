import { HttpException, HttpStatus } from '@nestjs/common'

export class BasicError extends HttpException {
  code: number | string

  constructor (message: string, code: number | string, status = HttpStatus.INTERNAL_SERVER_ERROR) {
    super({
      message,
      code,
    }, status)

    this.code = code
  }
}

export enum ErrorCode {
  // account
  noAuth = 1001,

  // subdid
  invalidSubDID = 2001,
  invalidSubDIDParams = 2002,
  tooManyAccountsForSameAddress,
  activityIsClosed = 2004,
}
