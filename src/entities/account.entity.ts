import { AlgorithmId, CoinType } from 'dotbit'
import { Column, Entity, Index } from 'typeorm'
import { BasicEntity } from '../basic/basic.entity'
import config from '../config'

export enum AccountRegisterStatus {
  none,
  registering,
  registered,
}

@Entity(config.sqlite.table.account)
export class AccountEntity extends BasicEntity<AccountEntity> {
  @Column()
  account: string

  @Column()
  main_account: string

  @Column({
    default: AccountRegisterStatus.none,
  })
  register_status: AccountRegisterStatus

  @Column()
  owner_key: string

  @Column()
  owner_coin_type: CoinType
}
