import { BitNetwork } from 'dotbit'
import * as path from 'path'

export default {
  port: 8090,
  sqlite: {
    database: path.resolve(process.cwd(), '.db/db.sqlite'),
    name: 'mint-subdid-server',
    table: {
      account: 't_account',
    }
  },
  dotbit: {
    network: BitNetwork.mainnet,
  },
  activities: {
    sfbw22: {
      id: 'sfbw22',
      mainAccount: '',
      managerKey: '',
      managerPrivateKey: '',
    }
  }
}
