import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindOneOptions, FindManyOptions, DeleteResult, FindOptionsWhere } from 'typeorm'
import { plainToClass } from 'class-transformer'
import { validateOrReject } from 'class-validator'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { BasicEntity } from './basic.entity'

@Injectable()
export class BasicService<T extends BasicEntity<any>> {
  readonly repo: Repository<T>
  readonly entity: any

  async insertOne (body: QueryDeepPartialEntity<T>): Promise<T> {
    body = plainToClass(this.entity, body)

    await validateOrReject(body)

    return (await this.repo.insert(body)).generatedMaps[0] as T
  }

  async findOne (condition: FindOneOptions<T>) {
    return await this.repo.findOne(condition)
  }

  async findOneById (id: number) {
    return await this.repo.findOneBy({ id } as any)
  }

  async updateOneById (id: number, update: QueryDeepPartialEntity<T>, shouldReturnResult = false) {
    await this.repo.update(id, update)
    if (shouldReturnResult) {
      return await this.findOneById(id)
    }
  }

  async deleteOneById (id: number) {
    return await this.repo.delete(id)
  }

  async delete (where: FindOptionsWhere<T>): Promise<DeleteResult> {
    // mock delete, only returning result
    // return {
    //   affected: await this.repo.count({ where }),
    //   raw: [],
    // }
    return await this.repo.delete(where)
  }

  async insertMany (items: Array<QueryDeepPartialEntity<T>>) {
    if (this.entity) {
      for (let i = 0; i < items.length; i++) {
        items[i] = plainToClass(this.entity, items[i])
        await validateOrReject(this.entity)
      }
    }

    return await this.repo.insert(items)
  }

  async update (condition: FindOptionsWhere<T>, update: QueryDeepPartialEntity<T>) {
    return (await this.repo.update(condition, update)).generatedMaps
  }

  async find (findManyOptions?: FindManyOptions<T>) {
    return await this.repo.find(findManyOptions)
  }

  async findAndCount (findManyOptions: FindManyOptions<T>) {
    return await this.repo.findAndCount(findManyOptions)
  }

  async count (findManyOptions?: FindManyOptions<T>) {
    return await this.repo.count(findManyOptions)
  }

  async countBy (options: FindOptionsWhere<T>) {
    return await this.repo.countBy(options)
  }
}

export function createBasicService<E extends BasicEntity<any>> (EntityClass: any, connection: string) {
  @Injectable()
  class CreatedService extends BasicService<E> {
    entity = EntityClass

    constructor (
      @InjectRepository(EntityClass, connection)
      readonly repo: Repository<E>,
    ) {
      super()
    }
  }

  return CreatedService
}
