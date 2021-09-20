const Presale = artifacts.require("UniqPresale");
const Token = artifacts.require("UniqToken");
const Vesting = artifacts.require("UniqVesting");
const VestingSE = artifacts.require("UniqVestingSE");
const DummyToken = artifacts.require("DummyToken");
const Staking = artifacts.require("UniqStaking");
const Collection = artifacts.require("UniqBonus");

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(
    Presale,
    tokens("10"),
    tokens("0.3"),
    tokens("1"),
    1622279673,
    accounts[0],
  );

  const presaleA = await Presale.deployed();
  await deployer.deploy(
    Presale,
    tokens("20"),
    tokens("0.3"),
    tokens("1.2"),
    1622279673,
    accounts[0],
  );

  const presaleB = await Presale.deployed();
  await presaleA.start();
  // web3.eth.sendTransaction({
  //   from: accounts[0],
  //   value: tokens("1"),
  // });

  await presaleB.start();
  // web3.eth.sendTransaction({
  //   from: accounts[0],
  //   to: presaleB.address,
  //   value: tokens("0.5"),
  // });

  await deployer.deploy(Token, tokens("13000000"));
  const token = await Token.deployed();

  await deployer.deploy(
    Vesting,
    token.address,
    [presaleA.address, presaleB.address],
    [5000, 10000],
    1618213273,
  );

  await deployer.deploy(VestingSE, token.address, 1618421921);

  const vestingSE = await VestingSE.deployed();
  await token.transfer(vestingSE.address, tokens("20000"), {
    from: accounts[0],
  });
  vestingSE.addInvestor(accounts[0], tokens("9999"));

  const vesting = await Vesting.deployed();
  token.transfer(vesting.address, tokens("20000"), { from: accounts[0] });

  await deployer.deploy(DummyToken, tokens("11000000"));
  const dummyToken = await DummyToken.deployed();

  await deployer.deploy(Staking, "www.uniqly.io");
  const staking = await Staking.deployed();

  await deployer.deploy(Collection, 
    "0x98bfB9d3CE116a12588a8FB6ad64de0A510B8511",
    "UniqlyNFT-bonus",
    "UNIQ-bonus",
    "https://uniqly.com/api/nft-collections/",
    "0xc4F91d4318609C38B340f37700bCB212947fD12F",
    "0x940500eA6b822fAf8b092D778e2AD1114EA082eA"
  );

  const collection = await Collection.deployed();

  token.transfer(accounts[1], tokens("5000"), { from: accounts[0] });
  dummyToken.transfer(accounts[1], tokens("6000"), { from: accounts[0] });

  await staking.addStakePool(
    1,
    tokens("1000"),
    token.address,
    280,
    15,
    "QmU8pbdP1ZjZAKfW4w3N5HNCZjsJFRsDPQ7UotDqTQ3uM9",
    "T-Shirt (2 days lock)",
    {
      requiredErc20Token: token.address,
      requiredErc20TokenQuantity: tokens("1000"),
      requiredErc721Token: collection.address,
      requiredErc721TokenQuantity: 10
    }
  );
  
  await staking.addStakePool(
    3,
    tokens("4000"),
    dummyToken.address,
    5040,
    30,
    "QmTVWa5KgL8KgKkQEKDojz4dj9rDLGxy5T3T31dvcmqhho",
    "Jeans 2",
    {
      requiredErc20Token: token.address,
      requiredErc20TokenQuantity: tokens("4000"),
      requiredErc721Token: collection.address,
      requiredErc721TokenQuantity: 10
    }
  );
};
