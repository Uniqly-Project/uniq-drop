const Web3Utils = require('web3-utils');
const {
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');
const { account_private_keys } = require("../keys.json");
let BN = Web3Utils.BN;

const UniqDrop1 = artifacts.require("UniqDrop1")

let gasUsage = [];
function logGas(event, name) {
  let gas = event.receipt.gasUsed
  gasUsage.push({ name: name, value: gas });
}

contract("UniqDrop1", (accounts) => {

  let UniqDrop;

  let [deployer, owner] = accounts;
  let proxyAddress = '0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9' //fake! OpenSeaProxy
  beforeEach(async () => {
    // get current timestamp 
    UniqDrop = await UniqDrop1.new(
        "uniq.meta.api"
      , "UniqlyNFT-drop"
      , "UNIQ-drop"
      , "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9"
      , "0xa36085F69e2889c224210F603D836748e7dC0088"
      , "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4"
      , "100000000000000000"
      , accounts[0]
      , proxyAddress
      , { from: deployer }
    );
  })

  describe('calculatePrice:', () => {
    it('return eth price for exact tokens', async () => {
      await UniqDrop.startSale({ from: accounts[0] });
      let currentSupply = await UniqDrop.totalSupply();
      let uniqsToBuy = new BN(20);
      let resp = new BN(await UniqDrop.calculateEthPriceForExactUniqs(uniqsToBuy));
      console.log(resp);
      let price = new BN(Web3Utils.toWei('0.02', 'ether'));
      let amount = new BN(20);
      assert.equal(resp.toString(), price.mul(amount).toString(), 'price mismatch: ');
    })
    it('should change price after thresholds ', async function () {
      await UniqDrop.startSale({ from: accounts[0] });
      let price1 = new BN(Web3Utils.toWei('0.02', 'ether'));
      let price2 = new BN(Web3Utils.toWei('0.04', 'ether'));
      let sumUniqs = 0;
      let sumAmounts;
      for (i = 0; i < 24; i++) {
        resp = await UniqDrop.mintUniqly(20, { from: accounts[i], value: price1.mul(new BN(20)) });
        logGas(resp, "Mint 20 uniqlys")
        sumUniqs = sumUniqs + 20;
      }
      totalSupply = await UniqDrop.totalSupply();
      assert.equal(totalSupply.toString(), new BN(480).toString(), 'supply mismatch');

      await UniqDrop.mintUniqly(20, { from: accounts[25], value: price1.mul(new BN(19)).add(price2.mul(new BN(1))) });
      totalSupply = await UniqDrop.totalSupply();
      assert.equal(totalSupply.toString(), new BN(500).toString(), 'supply mismatch');
    });
  })

  describe('mintUniqly:', () => {
    it('reverts when equals 0 uniqs', async () => {
      await UniqDrop.startSale({ from: accounts[0] });
      let price = new BN(Web3Utils.toWei('0.02', 'ether'))
      await expectRevert(
        UniqDrop.mintUniqly(0, { from: accounts[1], value: price.mul(new BN(1)) }),
        'You can buy minimum 1, maximum 30 Uniqs',
      );
    })

    it('mint tokens to purchaser', async () => {
      await UniqDrop.startSale({ from: accounts[0] });
      let price = new BN(Web3Utils.toWei('0.02', 'ether'));
      let resp = await UniqDrop.mintUniqly(2, { from: accounts[1], value: price.mul(new BN(2)) });
      logGas(resp, "Mint 2 uniqlys")
      let tokenOwner = await UniqDrop.ownerOf(0);
      expect(tokenOwner == accounts[1]);
    })
  })

  describe('various functions gas usage', function () {
    it('initialMint', async function () {
      n = [1, 3, 5, 10, 20, 50]
      for (i = 0; i < n.length; i++) {
        resp = await UniqDrop.initialMint(accounts[n[i]], n[i], { from: accounts[0] });
        logGas(resp, "initialMint " + n[i])
      }
    })
  })

  describe('gas usage log', function () {
    it('logs gas usage', async function () {
      for (var i = 0; i < gasUsage.length; i++) {
        console.log('\tfunction:', gasUsage[i].name, '\t:', gasUsage[i].value)
      }
    })
  })

  describe('Burn tokens:', function () {
    it('burn token using signed message', async function () {
      await UniqDrop.startSale({ from: accounts[0] });
      let price1 = new BN(Web3Utils.toWei('0.02', 'ether'));
      await UniqDrop.mintUniqly(1, { from: accounts[1], value: price1 });
      resp = await UniqDrop.getMessageHash(accounts[1], 0, "Elon Musk");
      sign = await web3.eth.accounts.sign(resp, privateKeys[0]).signature;
      expectEvent( 
        await UniqDrop.burn(0, "Elon Musk", sign, { from: accounts[1] }),
        'Transfer',{
          from: accounts[1],
          to: "0x0000000000000000000000000000000000000000",
          tokenId: "0"
        }
      );
    })

    it('throws signature error', async function () {
      await UniqDrop.startSale({ from: accounts[0] });
      let price1 = new BN(Web3Utils.toWei('0.04', 'ether'));
      await UniqDrop.mintUniqly(2, { from: accounts[1], value: price1 });
      resp = await UniqDrop.getMessageHash(accounts[1], 0, "Elon Musk");
      sign = await web3.eth.accounts.sign(resp, privateKeys[0]).signature;
      await expectRevert( 
        UniqDrop.burn(0, "Brad Pitt", sign, { from: accounts[1] }),
        "Signature is not valid"
      );
      await expectRevert( 
        UniqDrop.burn(1, "Elon Musk", sign, { from: accounts[1] }),
        "Signature is not valid"
      );
    })

    it('throws ownership error', async function () {
      await UniqDrop.startSale({ from: accounts[0] });
      let price1 = new BN(Web3Utils.toWei('0.02', 'ether'));
      await UniqDrop.mintUniqly(1, { from: accounts[1], value: price1 });
      resp = await UniqDrop.getMessageHash(accounts[1], 0, "Elon Musk");
      sign = await web3.eth.accounts.sign(resp, privateKeys[0]).signature;
      await expectRevert( 
        UniqDrop.burn(0, "Elon Musk", sign, { from: accounts[2] }),
        "You need to own this token"
      );
    })
  })
})
