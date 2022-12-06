import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { ApiBody, ApiProperty } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { BitSubAccount, CoinType, createInstance, EthersSigner, graphemesAccount } from 'dotbit'
import { SubAccountParams } from 'dotbit/lib/BitAccount'
import { Repository } from 'typeorm'
import config from '../config'
import { IpOfHeader } from '../decorators/ip-of-header.decorator'
import { AccountEntity, AccountRegisterStatus } from '../entities/account.entity'
import { AccountService } from '../entities/account.service'
import { BasicError, ErrorCode } from '../error/basic.error'
import { ethers, Wallet } from 'ethers'

const privateKey1 = config.activities.sfbw22.managerPrivateKey
const provider = new ethers.providers.InfuraProvider()
const wallet = new Wallet(privateKey1, provider)
const signer = new EthersSigner(wallet)

const dotbit = createInstance({
  network: config.dotbit.network,
  signer,
})

// for simplicity, the controller and services are combined.

class MintSubDidDto {
  @ApiProperty()
  account: string

  @ApiProperty()
  owner_key: string

  @ApiProperty()
  owner_coin_type: CoinType
}

@Controller(config.activities.sfbw22.id)
export class SFBWController {
  constructor (
    @InjectRepository(AccountEntity, config.sqlite.name)
    readonly accountRepo: Repository<AccountEntity>,

    readonly accountService: AccountService,
  ) {}

  activityConfig = config.activities.sfbw22

  @Interval(30 * 1000)
  // @Timeout(1)
  async handleRegisteringAccounts () {
    const mainBitAccount = dotbit.account(this.activityConfig.mainAccount)
    // handle registering accounts
    // we should handle registering accounts first, and then handle none registered accounts
    const registeringAccounts = await this.accountRepo.find({
      where: {
        register_status: AccountRegisterStatus.registering,
      },
      take: 10,
    })
    registeringAccounts.length && console.log('handle registering', registeringAccounts.length)
    for (const registeringAccount of registeringAccounts) {
      const bitAccount = await dotbit.account(registeringAccount.account)
      const info = await bitAccount.info().catch(err => console.log(err.message))

      if (info) {
        await this.accountService.updateAccountStatus(bitAccount.account, AccountRegisterStatus.registered)
      }
      // if the register time over half an hour, then there should be something happened.
      else if (Date.now() - Number(registeringAccount.created_at) > 30 * 60 * 1000) {
        await this.accountService.updateAccountStatus(bitAccount.account, AccountRegisterStatus.none)
        console.log(`registeringAccountError: ${bitAccount.account} createdAt ${registeringAccount.created_at.toTimeString()}, is none now`) // todo: maybe a lark bot
      }
    }

    // handle none registered accounts
    const noneAccounts = await this.accountRepo.find({
      where: {
        register_status: AccountRegisterStatus.none,
      },
      // 100 sub-accounts will block the chain. So we mint 10 accounts at a time prudentially.
      take: 10,
    })
    noneAccounts.length && console.log('handle none', noneAccounts.length)
    const realNoneAccounts: AccountEntity[] = []
    for (const noneAccount of noneAccounts) {
      const bitAccount = dotbit.account(noneAccount.account)
      const info = await bitAccount.info().catch(err => console.log(err.message))

      if (info) {
        await this.accountService.updateAccountStatus(bitAccount.account, AccountRegisterStatus.registered)
      }
      else {
        realNoneAccounts.push(noneAccount)
      }
    }

    if (realNoneAccounts.length) {
      const accountsToMint: SubAccountParams[] = realNoneAccounts.map(noneAccount => {
        return {
          account: noneAccount.account,
          keyInfo: {
            key: noneAccount.owner_key,
            coin_type: noneAccount.owner_coin_type,
          },
          registerYears: 1,
        }
      })
      try {
        await mainBitAccount.mintSubAccounts(accountsToMint)
        for (const realNoneAccount of realNoneAccounts) {
          await this.accountService.updateAccountStatus(realNoneAccount.account, AccountRegisterStatus.registering)
        }
      }
      catch (e) {
        console.error('handle mintSubAccounts failed', e)
      }
    }
  }

  @Post('/mint-subdid')
  async mintSubDID (@Body() dto: MintSubDidDto, @IpOfHeader() ip: string) {
    // throw new BasicError('The activity is closed. Please follow @dotbitHQ for more activities.', ErrorCode.activityIsClosed)

    const { register_status, main_account } = await this.checkSubDID(dto.account)
    const bitMainAccount = dotbit.account(this.activityConfig.mainAccount)

    const accountWithSameAddressCounts = await this.accountService.countBy({
      owner_key: dto.owner_key,
      main_account: bitMainAccount.account,
    })

    if (accountWithSameAddressCounts) {
      throw new BasicError('You can only mint at most 1 accounts with the same address', ErrorCode.tooManyAccountsForSameAddress)
    }

    if (register_status === AccountRegisterStatus.none) {
      const result = await bitMainAccount.checkSubAccounts([{
        type: 'blockchain',
        account: dto.account,
        key_info: {
          key: dto.owner_key,
          coin_type: dto.owner_coin_type,
        },
        register_years: 1,
        account_char_str: graphemesAccount(dto.account.split('.')[0])
      }])
      if (result.result[0].status === 0) {
        await this.accountRepo.insert({
          account: dto.account,
          main_account,
          register_status: AccountRegisterStatus.none,
          owner_key: dto.owner_key,
          owner_coin_type: dto.owner_coin_type,
        })

        console.log(`mint: inserted ${dto.account} ${dto.owner_coin_type} ${dto.owner_key}`)
      }
      else {
        throw new BasicError(result.result[0].message, ErrorCode.invalidSubDIDParams)
      }
    }
    return {
      account: dto.account,
      registering_status: AccountRegisterStatus.registering,
    }
  }

  @Get('/check-subdid')
  async checkSubDID (@Query('account') subDidString: string): Promise<{account: string, main_account: string, register_status: AccountRegisterStatus}> {
    const subDID = dotbit.account(subDidString) as BitSubAccount
    const bitMainAccount = dotbit.account(this.activityConfig.mainAccount)

    if (subDID.isSubAccount && subDID.mainAccount !== bitMainAccount.account) {
      throw new BasicError(`${subDID.account} is not valid subDID of ${bitMainAccount.account}`, ErrorCode.invalidSubDID)
    }

    const localAccount = await this.accountRepo.findOneBy({
      account: subDID.account,
    })

    if (!localAccount) {
      return {
        account: subDID.account,
        main_account: bitMainAccount.account,
        register_status: AccountRegisterStatus.none,
      }
    }
    else if (localAccount.register_status === AccountRegisterStatus.registered) {
      return {
        account: subDID.account,
        main_account: bitMainAccount.account,
        register_status: AccountRegisterStatus.registered,
      }
    }
    else {
      return {
        account: subDID.account,
        main_account: bitMainAccount.account,
        register_status: AccountRegisterStatus.registering,
      }
    }
  }

  @Get('/overview')
  async overview () {
    return {
      counts: {
        total: await this.accountService.countBy({
          main_account: this.activityConfig.mainAccount,
        }),
        registering: await this.accountService.countBy({
          main_account: this.activityConfig.mainAccount,
          register_status: AccountRegisterStatus.registering
        }),
        registered: await this.accountService.countBy({
          main_account: this.activityConfig.mainAccount,
          register_status: AccountRegisterStatus.registered,
        }),
        owner_keys: await this.accountService.countDistinctOwnerKeys()
      }
    }
  }
}
