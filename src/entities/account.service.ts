import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BasicService } from '../basic/basic.service'
import config from '../config'
import { AccountEntity, AccountRegisterStatus } from './account.entity'

@Injectable()
export class AccountService extends BasicService<AccountEntity> {
  constructor (
    @InjectRepository(AccountEntity, config.sqlite.name)
    readonly repo: Repository<AccountEntity>,
  ) {
    super()
  }

  updateAccountStatus (account: string, status: AccountRegisterStatus) {
    return this.repo.update({
      account
    }, {
      register_status: status,
    })
  }

  countDistinctOwnerKeys () {
    return this.repo.createQueryBuilder().select('count(distinct(owner_key))', 'count').execute().then(res => res[0].count)
  }
}
