const OsseusHelper = require('./helpers/osseus')
const expect = require('chai').expect

const ColuLocalNetwork = artifacts.require('cln-solidity/contracts/ColuLocalNetwork.sol')
const CurrencyFactory = artifacts.require('cln-solidity/contracts/CurrencyFactory.sol')
const EllipseMarketMakerLib = artifacts.require('cln-solidity/contracts/EllipseMarketMakerLib.sol')

const TOKEN_DECIMALS = 10 ** 18
const CLN_MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS
const CC_MAX_TOKENS = 15 * 10 ** 6 * TOKEN_DECIMALS

contract('WALLET', async (accounts) => {
  let osseus

  let cln

  let currencyAddress
  let marketMakerAddress

  let currencyBlockchainInfo

  const validateWallet = (wallet1, wallet2, currency, offchainAmount, blockchainAmount) => {
    expect(wallet1).to.be.a('Object')
    expect(wallet1.id).to.be.a('string')
    if (wallet2) expect(wallet1.id).to.equal(wallet2.id)
    expect(['manager', 'users', 'merchants']).to.contain(wallet1.type)
    if (wallet2) expect(wallet1.type).to.equal(wallet2.type)
    expect(wallet1.address).to.be.a('string')
    expect(wallet1.index).to.be.a('number')
    expect(wallet1.exid).to.be.a('string')
    if (wallet2) expect(wallet1.exid).to.equal(wallet2.exid)
    expect(wallet1.balances).to.be.an('array')
    expect(wallet1.balances).to.have.lengthOf(1)
    expect(wallet1.balances[0].currency.id.toString()).to.equal(wallet2 ? wallet2.balances[0].currency.toString() : currency.id)
    expect(wallet1.balances[0].blockchainAmount.toNumber()).to.equal(wallet2 ? wallet2.balances[0].blockchainAmount.toNumber() : (blockchainAmount || 0))
    expect(wallet1.balances[0].offchainAmount.toNumber()).to.equal(wallet2 ? wallet2.balances[0].offchainAmount.toNumber() : (offchainAmount || 0))
  }

  before(async function () {
    this.timeout(60000)

    const mmLib = await EllipseMarketMakerLib.new()

    cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS)
    await cln.makeTokensTransferable()

    const currencyFactory = await CurrencyFactory.new(mmLib.address, cln.address, {from: accounts[0]})
    const result = await currencyFactory.createCurrency('TestLocalCurrency', 'TLC', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: accounts[0]})
    currencyAddress = result.logs[0].args.token
    currencyBlockchainInfo = {
      blockHash: result.logs[0].blockHash,
      blockNumber: result.logs[0].blockNumber,
      transactionHash: result.logs[0].transactionHash
    }

    marketMakerAddress = await currencyFactory.getMarketMakerAddressFromToken(currencyAddress)

    await currencyFactory.openMarket(currencyAddress)

    osseus = await OsseusHelper()
  })

  beforeEach(function () {
    Object.keys(osseus.db_models).forEach(model => {
      osseus.db_models[model].getModel().remove({}, () => {})
    })
  })

  it('should create a wallet', async () => {
    let currency = await osseus.lib.Currency.create(currencyAddress, marketMakerAddress, osseus.abi.cc, osseus.abi.mm, currencyBlockchainInfo, osseus.helpers.randomStr(10))
    let wallet = await osseus.db_models.wallet.create({
      address: accounts[0],
      type: 'manager',
      index: 0,
      exid: osseus.helpers.randomNum(10),
      balances: [{
        currency: currency,
        blockchainAmount: 0,
        offchainAmount: 10 * TOKEN_DECIMALS,
        blockNumberOfLastUpdate: 0,
        pendingTxs: []
      }]
    })
    validateWallet(wallet, undefined, currency, 10 * TOKEN_DECIMALS)
  })

  it('should not create a wallet with same address', async () => {
    let currency = await osseus.lib.Currency.create(currencyAddress, marketMakerAddress, osseus.abi.cc, osseus.abi.mm, currencyBlockchainInfo, osseus.helpers.randomStr(10))
    await osseus.db_models.wallet.create({
      address: accounts[0],
      type: 'manager',
      index: 0,
      exid: osseus.helpers.randomNum(10),
      balances: [{
        currency: currency,
        blockchainAmount: 0,
        offchainAmount: 10 * TOKEN_DECIMALS,
        blockNumberOfLastUpdate: 0,
        pendingTxs: []
      }]
    })
    let wallet = await osseus.db_models.wallet.create({
      address: accounts[0],
      type: 'users',
      index: 0,
      exid: osseus.helpers.randomNum(10),
      balances: [{
        currency: currency,
        blockchainAmount: 0,
        offchainAmount: 10 * TOKEN_DECIMALS,
        blockNumberOfLastUpdate: 0,
        pendingTxs: []
      }]
    }).catch(err => {
      expect(err).not.to.be.undefined
    })
    expect(wallet).to.be.undefined
  })

  it('should get wallet (by id)', async () => {
    let currency = await osseus.lib.Currency.create(currencyAddress, marketMakerAddress, osseus.abi.cc, osseus.abi.mm, currencyBlockchainInfo, osseus.helpers.randomStr(10))
    let wallet1 = await osseus.db_models.wallet.create({
      address: accounts[0],
      type: 'manager',
      index: 0,
      exid: osseus.helpers.randomNum(10),
      balances: [{
        currency: currency,
        blockchainAmount: 0,
        offchainAmount: 10 * TOKEN_DECIMALS,
        blockNumberOfLastUpdate: 0,
        pendingTxs: []
      }]
    })
    let wallet2 = await osseus.db_models.wallet.getById(wallet1.id)
    validateWallet(wallet1, wallet2)
  })

  it('should get wallet (by address)', async () => {
    let currency = await osseus.lib.Currency.create(currencyAddress, marketMakerAddress, osseus.abi.cc, osseus.abi.mm, currencyBlockchainInfo, osseus.helpers.randomStr(10))
    let wallet1 = await osseus.db_models.wallet.create({
      address: accounts[0],
      type: 'manager',
      index: 0,
      exid: osseus.helpers.randomNum(10),
      balances: [{
        currency: currency,
        blockchainAmount: 0,
        offchainAmount: 10 * TOKEN_DECIMALS,
        blockNumberOfLastUpdate: 0,
        pendingTxs: []
      }]
    })
    let wallet2 = await osseus.db_models.wallet.getByAddress(wallet1.address)
    validateWallet(wallet1, wallet2)
  })

  it('should get error if wallet not found (by id)', async () => {
    let fakeId = '123abc'
    let currency = await osseus.lib.Currency.create(currencyAddress, marketMakerAddress, osseus.abi.cc, osseus.abi.mm, currencyBlockchainInfo, osseus.helpers.randomStr(10))
    let wallet1 = await osseus.db_models.wallet.create({
      address: accounts[0],
      type: 'manager',
      index: 0,
      exid: osseus.helpers.randomNum(10),
      balances: [{
        currency: currency,
        blockchainAmount: 0,
        offchainAmount: 10 * TOKEN_DECIMALS,
        blockNumberOfLastUpdate: 0,
        pendingTxs: []
      }]
    })
    validateWallet(wallet1, undefined, currency, 10 * TOKEN_DECIMALS)
    let wallet2 = await osseus.db_models.wallet.getById(fakeId).catch(err => {
      expect(err).not.to.be.undefined
    })
    expect(wallet2).to.be.undefined
  })

  it('should get blockchain balance', async () => {
    let currency = await osseus.lib.Currency.create(currencyAddress, marketMakerAddress, osseus.abi.cc, osseus.abi.mm)
    let wallet1 = await osseus.db_models.wallet.create({
      address: accounts[0],
      type: 'manager',
      index: 0,
      exid: osseus.helpers.randomNum(10),
      balances: [{
        currency: currency,
        blockchainAmount: 10 * TOKEN_DECIMALS,
        offchainAmount: 10 * TOKEN_DECIMALS,
        blockNumberOfLastUpdate: 0,
        pendingTxs: []
      }]
    })
    let bcBalance = await osseus.db_models.wallet.getBlockchainBalance(wallet1.address, currency.id)
    expect(bcBalance).to.equal(10 * TOKEN_DECIMALS)
  })

  after(async function () {
    Object.keys(osseus.db_models).forEach(model => {
      osseus.db_models[model].getModel().remove({}, () => {})
    })
    osseus.agenda.purge()
  })
})
