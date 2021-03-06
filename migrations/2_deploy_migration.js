const UniqDrop = artifacts.require("UniqDrop");
const UniqGenerator = artifacts.require("UniqGenerator");
const Token = artifacts.require("UniqToken");

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

module.exports = async function (deployer, network, accounts) {

  /*
    _baseUri = ?
    _name = "UniqlyNFT-drop"
    _symbol = "UNIQ-drop"
    _vrfCoordinator = 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
    _link = 0xa36085F69e2889c224210F603D836748e7dC0088
    _keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
    _fee = 1000000000000000000
    _address _owner_,
    _address _proxyRegistryAddress
  */
  // await deployer.deploy(
  //   UniqDrop, 
  //   "https://gateway.pinata.cloud/ipfs/QmWg5aNKpHDTRTuF89Wf1Dho93HhKESyxmkibfw4MroWDQ", 
  //   "UniqlyNFT-drop",
  //   "UNIQ-drop",
  //   "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9",
  //   "0xa36085F69e2889c224210F603D836748e7dC0088",
  //   "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
  //   tokens("10"),
  //   accounts[0],
  //   accounts[0],
  // );

  // const uniqDrop = await UniqDrop.deployed();

  // await uniqDrop.initialMint(accounts[0], 50);
  // await uniqDrop.initialMint(accounts[0], 50);
  // await uniqDrop.startSale();

  // const price = await uniqDrop.calculateEthPriceForExactUniqs(5);
  // await uniqDrop.mintUniqly(5, { from: accounts[0], value: price });

  await deployer.deploy(Token, web3.utils.toWei("13000000", "ether"));
  const token = await Token.deployed();

  await deployer.deploy(
    UniqGenerator,
    "http://localhost:4000/api/metadata/",
    "UniqlyNFT-generator",
    "UNIQ-generator",
    accounts[0],
    "0xa36085F69e2889c224210F603D836748e7dC0088",
    web3.utils.toWei("1", "ether"),
    token.address
    );

  const gen = await UniqGenerator.deployed();
  await gen.setTokenAddress(token.address);
  await token.approve(accounts[0], "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
  const t = await token.transferFrom(accounts[0], "0x9018528B859FaeD3285c6947D556aa9bf78c93d0", web3.utils.toWei("3000000", "ether"));

  await gen.setBaseURI("http://localhost:4000/api/metadata/");
};
