import { Module, NestModule, MiddlewareConsumer, CacheModule } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import config from './config'
import { AccountEntity } from './entities/account.entity'
import { AccountService } from './entities/account.service'
import { SFBWController } from './sfbw/sfbw.controller'

const entities = [
  AccountEntity,
]

@Module({
  imports: [
    TypeOrmModule.forFeature(entities, config.sqlite.name),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      ...config.sqlite,
      entities,
      synchronize: true,
    }),
    ScheduleModule.forRoot()
  ],
  controllers: [
    AppController,
    SFBWController,
  ],
  providers: [
    AccountService,
  ],
  exports: [
  ]
})
export class ApplicationModule {
}
