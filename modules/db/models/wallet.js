const timestamps = require('mongoose-time')
const BigNumber = require('bignumber.js')

module.exports = (osseus) => {
  const db = osseus.mongo
  const Schema = db.mongoose.Schema

  const setDecimal128 = (bignum) => {
    return db.mongoose.Types.Decimal128.fromString(bignum.toString())
  }

  const getDecimal128 = (decimal) => {
    const val = decimal ? decimal.toString() : 0
    return new BigNumber(val)
  }

  const BalanceSchema = new Schema({
    currency: {type: Schema.Types.ObjectId, ref: 'Currency'},
    blockchainAmount: {type: db.mongoose.Schema.Types.Decimal128, set: setDecimal128, get: getDecimal128},
    offchainAmount: {type: db.mongoose.Schema.Types.Decimal128, set: setDecimal128, get: getDecimal128},
    pendingTxs: [{type: String}]
  }).plugin(timestamps())

  const WalletSchema = new Schema({
    type: {type: String, enum: ['manager', 'users', 'merchants']},
    address: {type: String},
    index: {type: Number},
    balances: [{type: BalanceSchema}]
  }).plugin(timestamps())

  WalletSchema.index({address: 1}, {unique: true})

  BalanceSchema.set('toJSON', {
    getters: true,
    virtuals: true,
    transform: (doc, ret, options) => {
      const safeRet = {
        id: ret._id.toString(),
        createdAt: ret.created_at,
        updatedAt: ret.updated_at,
        currency: ret.currency,
        blockchainAmount: ret.blockchainAmount,
        offchainAmount: ret.offchainAmount,
        pendingTxs: ret.pendingTxs
      }
      return safeRet
    }
  })

  WalletSchema.set('toJSON', {
    getters: true,
    virtuals: true,
    transform: (doc, ret, options) => {
      const safeRet = {
        id: ret._id.toString(),
        createdAt: ret.created_at,
        updatedAt: ret.updated_at,
        type: ret.type,
        address: ret.address,
        index: ret.index,
        balances: ret.balances
      }
      return safeRet
    }
  })

  const Wallet = db.model('Wallet', WalletSchema)

  function wallet () {}

  wallet.create = (data) => {
    return new Promise((resolve, reject) => {
      const wallet = new Wallet(data)
      wallet.save((err, newObj) => {
        if (err) {
          return reject(err)
        }
        if (!newObj) {
          return reject(new Error('Wallet not saved'))
        }
        resolve(newObj)
      })
    })
  }

  wallet.update = (condition, update) => {
    return new Promise((resolve, reject) => {
      Wallet.findOneAndUpdate(condition, {$set: update}, {new: true}, (err, updatedObj) => {
        if (err) {
          return reject(err)
        }
        resolve(updatedObj)
      })
    })
  }

  wallet.getById = (id) => {
    return new Promise((resolve, reject) => {
      Wallet.findById(id, (err, doc) => {
        if (err) {
          return reject(err)
        }
        if (!doc) {
          return reject(new Error(`Wallet not found for id ${id}`))
        }
        resolve(doc)
      })
    })
  }

  wallet.getByAddress = (address) => {
    return new Promise((resolve, reject) => {
      Wallet.findOne({address: address}, (err, doc) => {
        if (err) {
          return reject(err)
        }
        if (!doc) {
          return reject(new Error(`Wallet not found for address: ${address}`))
        }
        resolve(doc)
      })
    })
  }

  wallet.getModel = () => {
    return Wallet
  }

  return wallet
}