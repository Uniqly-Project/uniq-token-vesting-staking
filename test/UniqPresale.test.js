const Web3Utils = require('web3-utils');
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const ether = require('@openzeppelin/test-helpers/src/ether');

const UniqPresale = artifacts.require("UniqPresale")

const PresaleLimit = 18
const MinPerUser = 1   // minimum as 1 ETH
const MaxPerUser = 10  // maximum as 10 ETH

const PresaleDuration = 60          // Presale duration for demo 2 minutes

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

contract("UniqPresale", (accounts) => {
  let UniqPresaleContract;
  beforeEach(async () => {
    // get current timestamp 
    // console.log(typeof Web3Utils.toWei(PresaleLimit, "ether"))
    const now = Math.round(new Date().getTime() / 1000)
    UniqPresaleContract = await UniqPresale.new(
      Web3Utils.toWei(PresaleLimit.toString(), 'ether'),
      Web3Utils.toWei(MinPerUser.toString(), 'ether'),
      Web3Utils.toWei(MaxPerUser.toString(), 'ether'),
      now + PresaleDuration,
      accounts[0]
    );
    await UniqPresaleContract.start();
  })

  describe('Ownership:', () => {
    it('deployer should be default owner on deployment', async () => {
      const onwer = await UniqPresaleContract.owner();
      assert.equal(onwer, accounts[0], "owner and deployer should be same.");
    })

    it('reverts when transferring called by not owner', async () => {
      await expectRevert(
        UniqPresaleContract.giveOwnership(accounts[1], { from: accounts[2] }),
        'Only for Owner',
      );
    })

    it('reverts when acceptOwnership called by not new owner', async () => {
      await UniqPresaleContract.giveOwnership(accounts[1], { from: accounts[0] })

      await expectRevert(
        UniqPresaleContract.acceptOwnership({ from: accounts[2] }),
        'Ure not New Owner',
      );
    })

    it('owner should be chaged after ownership transferation', async () => {
      await UniqPresaleContract.giveOwnership(accounts[1], { from: accounts[0] });

      await UniqPresaleContract.acceptOwnership({ from: accounts[1] });

      const new_owner = await UniqPresaleContract.owner();
      assert.equal(new_owner, accounts[1], "new owner is not set properly");
    })

  })

  describe('Deposite:', () => {
    it('should record depositers balance', async () => {
      await UniqPresaleContract.sendTransaction({ from: accounts[1], value: ether('2') });
      const deposite = await UniqPresaleContract.balanceOf(accounts[1]);
      assert.equal(deposite.toString(), ether('2'), "incorrect deposit");
    })

    it('should be bigger than minimum:', async () => {
      await expectRevert(
        UniqPresaleContract.sendTransaction({ from: accounts[1], value: ether('0.5') }),
        'Below buy-in',
      );
    })

    it('should be less than maximum:', async () => {
      await expectRevert(
        UniqPresaleContract.sendTransaction({ from: accounts[1], value: ether('11') }),
        'Over buy-in',
      );
    })

    it('should not be able to deposite after deadline:', async () => {
      await sleep((PresaleDuration + 1) * 1000);
      await expectRevert(
        UniqPresaleContract.sendTransaction({ from: accounts[1], value: ether('1') }),
        "Presale time's up"
      );
    })
  })

  describe('Withdraw:', () => {
    it('should not be able to withdraw before presale is ended:', async () => {
      await UniqPresaleContract.sendTransaction({ from: accounts[1], value: ether('1') });
      await UniqPresaleContract.withdraw({ from: accounts[0] })
      let deposit = await UniqPresaleContract.collected();
      assert.equal(deposit.toString(), ether('1'), "incorrect deposit");
    })

    it('owner should  be able to withdraw after presale is ended:', async () => {
      await UniqPresaleContract.sendTransaction({ from: accounts[1], value: ether('9') });
      await UniqPresaleContract.sendTransaction({ from: accounts[2], value: ether('9') });
      await UniqPresaleContract.withdraw({ from: accounts[0] })
      let deposit = await UniqPresaleContract.collected();
      assert.equal(deposit.toString(), ether('0'), "not widthrew properly");
    })
  })
})