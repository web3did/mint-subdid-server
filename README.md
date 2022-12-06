## mint-subdid-server

#### dev
``` bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:8080
$ yarn run dev
```

### build
```bash
# build for production and launch server
$ yarn run build
$ yarn run start
```

### use pm2 deployment
```bash 
$ yarn run reload_production
```

### config/default.ts
`mainAccount`: to mint the parent account of the child account, for example: sfbw22.bit.

`managerKey`: address of the management account (ethereum address);

`managerPrivateKey`: Private key for ethereum address.


### api docs
http://127.0.0.1:8090/api/docs


### overview
http://127.0.0.1:8090/api/sfbw22/overview
