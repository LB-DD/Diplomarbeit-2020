const masterData = artifacts.require("MasterData.sol");
const DynAddressArray = artifacts.require("DynAddressArray.sol");
const DynBytes32Array = artifacts.require("DynBytes32ArrayExtended.sol");
const ExtendedBytes32 = artifacts.require("ExtendedBytes32.sol");
module.exports = async function (deployer, accounts) {
  accounts = await web3.eth.getAccounts();
  var dynBytes32 = await deployer.deploy(DynBytes32Array);
  var dynAddr = await deployer.deploy(DynAddressArray);
  var extBytes32 = await deployer.deploy(ExtendedBytes32);
  await deployer.link(DynBytes32Array, masterData);
  await deployer.link(DynAddressArray, masterData);
  await deployer.link(ExtendedBytes32, masterData);
  var master = await deployer.deploy(masterData);
};
