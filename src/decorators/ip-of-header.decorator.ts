import { createParamDecorator } from '@nestjs/common'
import { Address6 } from 'ip-address'

/**
 * Retrieve IP from req header
 */
export const IpOfHeader = createParamDecorator((fields, ctx) => {
  const req = ctx.switchToHttp().getRequest()

  // as we are using node.js behind a nginx server, so we can only get ip from headers['x-real-ip'] provided by nginx
  // as we are using cloudflare, so the real ip can only be retrieved from cf-connecting-ip
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.ip || ''

  // console.log(req.headers['cf-connecting-ip'], req.headers['true-client-ip'], req.headers['x-real-ip'], req.ip)

  // handle ipv6, like ::ffff:127.0.0.1 or 240e:3b7:3237:9f44:65fd:4673:67f2:535b
  return ip.includes(':') ? new Address6(ip).to4().correctForm() : ip
})
