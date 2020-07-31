var Web3 = require('web3')
var masterDataContractJson = require('../truffle/build/contracts/MasterData.json')
var testAccs = parseAccs(require('../../testAccounts/ropstenTestAccounts.json'))
var web3 = undefined
var wallet = undefined
var master = undefined
var blacklist = []

//Save some relations for later removal
var relations = []
//Save some Signatures for later removal
var signatures = []
//Save the created OrgElements to fill them later with Data 
var createdOrgElements = []
//Save added participants for later useage
var addedParticipants = []
//save added Admins for later useage
var addedAdmins = []
//save removed Admins for later useage
var removedAdmins = []
var transactionDefaults = {
  gasPrice: 125000000000, //75000000000//175000000000
  gas: 6000000,
}
var orgElementsIdsOfUsers
var transactions = []
readings = {
  createdElements: 0,
  createdBHUBS: 0,
  createdCorps: 0,
  createdLocations: 0,
  createdDepartments: 0,
  createdEmployees: 0,
  createdProcesses: 0,
  createdProducts: 0,
  createdRelations: 0,
  setDatacount: 0,
  gasUsed: 0,
  transactionsCount: 0,
  duration: 0,
  addParticipantCount: 0,
  addAdminCount: 0,
  relationCounter: 0,
  rateDataCounter: 0,
  changeDataCount: 0,
  rmAdminCount: 0,
  rmParticipantCount: 0,
  setNewOwnerCount: 0,
  rmRelationCount: 0,
  addSigCount: 0,
  rmSigCount: 0
}

test()

async function test() {
  await init()


  //create random OrgElements
  console.log("Create random Org elements with random data")
  for (let i = 0; i < 50; i++) {
    createRandomOrgElementTxs()
  }

  await runTransaktions()
  await loadOrgElementIdsForAllUsers()

  //fill all created OrgElements with random data
  console.log("fill OrgElements with random data")
  //createOrgElementDataTxs()

  await runTransaktions();
  await loadOrgElementIdsForAllUsers()


  //add random users as participants
  console.log("add random users as Participants")
  for (let i = 0; i < 30; i++) {
    addRandomUserAsParticipant();
  }
  await runTransaktions()
  await loadOrgElementIdsForAllUsers()

  //add 20 admins
  console.log("add Admins")
  for (let i = 0; i < 20; i++) {
    upgradeParticpantsToAdmins();
  }
  await runTransaktions()
  await loadOrgElementIdsForAllUsers()

  //remove 10 admins
  console.log("remove Admins")
  for (let i = 0; i < 10; i++) {
    downgradeAdminsToParticipant();
  }

  await runTransaktions()
  await loadOrgElementIdsForAllUsers()

  //remove 10 admins
  console.log("remove Participants")
  for (let i = 0; i < 10; i++) {
    downgradeParticipants();
  }

  await runTransaktions()
  await loadOrgElementIdsForAllUsers()



  //set new Owners
  console.log("set random new Owner for random Elements")
  for (let i = 0; i < 20; i++) {
    setNewOwnerForRandomElement();
  }

  await runTransaktions();
  await loadOrgElementIdsForAllUsers()





  console.log("create Random Relations")
  //add random Relations
  for (let i = 0; i < 50; i++) {
    createRandomRelations();
  }

  await runTransaktions();
  await loadOrgElementIdsForAllUsers()

  console.log("remove Random Relations")
  //add random Relations
  for (let i = 0; i < 25; i++) {
    removeRandomRelation();
  }

  await runTransaktions();
  await loadOrgElementIdsForAllUsers()

  //change random data 
  console.log("change random Data")
  for (let i = 0; i < 50; i++) {
    await changeRandomData().catch((err) => { })
  }

  await runTransaktions()
  await loadOrgElementIdsForAllUsers()

  //add random Data rateings
  console.log("create random data ratings")
  for (let i = 0; i < 50; i++) {
    try { await createRandomRating() } catch (err) { }
  }
  await runTransaktions();
  await loadOrgElementIdsForAllUsers()

  //add random data Signatures
  console.log("create random data signatures")
  for (let i = 0; i < 50; i++) {
    try { await createRandomDataSig() }
    catch (err) { }

  }
  await runTransaktions()
  await loadOrgElementIdsForAllUsers()

  //remove random data Signatures 
  console.log("remove random data signatures")
  for (let i = 0; i < 25; i++) {
    removeRandomDataSig()
  }

  await runTransaktions();

  return
}


//procedural initialization
async function init() {
  console.log('init-startet')
  return new Promise((resolve, reject) => {
    initWeb3()
      .then(() => {
        initWallet()
      })
      .then(() => {
        //console.log(wallet)
        initMasterData().then(() => {
          //console.log(master)
          getInitalNonces().then(() => {
            console.log('init finished')
            resolve()
          })
        })
      })
  })
}
//init Function
async function initWeb3() {
  return new Promise(async (resolve, reject) => {
    //create web3 Obj with connection to evan test node
    const provider = new Web3.providers.HttpProvider(
      "*"//**************// */ URL of Ropsten testnode,
      {
        clientConfig: {
          keepalive: true,
          keepaliveInterval: 50000,
          useNativeKeepalive: true,
        },
        protocol: [],
      },
    )
    web3 = await new Web3(provider, null, {
      transactionConfirmationBlocks: 3,
    })
    resolve()
  })
}

async function initWallet() {
  return new Promise(async (resolve, reject) => {
    try {
      //create web3js integrated wallet
      wallet = web3.eth.accounts.wallet.create(0)
      //add all testAcc to Wallet (private Keys)
      testAccs.forEach((testAcc) => {
        wallet.add(testAcc[1])
      })
      resolve()
    } catch (err) {
      console.log(err), reject(err)
    }
  })
}

async function initMasterData() {
  master = new web3.eth.Contract(masterDataContractJson.abi)
  master.options.address ="*" //**************//contract Address as HexString
}

//creation functions

//create transaktions to change data
async function changeRandomData() {
  return new Promise((reject, resolve) => {
    let senderAcc
    let id
    do {
      console.log("run")
      senderAcc = selectRandomUser()
      id = selectRandomOwnedElement(senderAcc)
    }
    while (id == undefined)

    loadOrgElementDatakeys(id).then((dataKeys) => {
      if (dataKeys == undefined) {
        console.log("err: no dataKeys")
        console.log(id)
      }

      try {
        let randomDataKey = dataKeys[Math.floor(Math.random() * dataKeys.length)]
        createChangeDataTx(id, randomDataKey, senderAcc)
        resolve()
      } catch (err) { reject() }
    })
  })
}

function createChangeDataTx(id, dataKey, senderAcc) {
  let newData = randomSentence(1, 10)
  let txData = master.methods.changeData(id, dataKey, newData).encodeABI()
  readings.changeDataCount++
  addTxtoTransctions(txData, senderAcc)
}

//create transactions for signatures
async function createRandomDataSig() {
  return new Promise((reject, resolve) => {
    let senderAcc
    let signingId
    let id
    //check if the User has an element with participant rights. in case start over
    do {
      senderAcc = selectRandomUser();
      signingId = selectRandomAdminElement(senderAcc);
      id = selectRandomParticipantElement(senderAcc);
    } while (id == undefined || signingId == undefined)
    console.log("pasedID:", id)
    loadOrgElementDatakeys(id).then((dataKeys) => {
      if (dataKeys == undefined) {
        console.log("err: no dataKeys")
        console.log(id)
      }

      try {
        let randomDataKey = dataKeys[Math.floor(Math.random() * dataKeys.length)]
        console.log(randomDataKey)
        createAddSigTx(id, randomDataKey, signingId, senderAcc)
        resolve()
      } catch (err) { reject() }
    })
  })

}
function removeRandomDataSig() {
  let signature = signatures.pop()
  console.log(signature)
  let id = signature[0]
  let dataKey = signature[1]
  let signingId = signature[2]
  let senderAcc = signature[3]

  createRmSigTx(id, dataKey, signingId, senderAcc)
}

function createRmSigTx(_id, _dataKey, _signingId, senderAcc) {
  console.log(_dataKey)
  console.log(_signingId)
  let txData = master.methods.rmSignature(
    _id,
    _dataKey,
    _signingId,
  ).encodeABI()
  readings.rmSigCount++
  addTxtoTransctions(txData, senderAcc)
}

function createAddSigTx(_id, _dataKey, _signingId, senderAcc) {
  let randomTime = Math.round((Date.now() / 1000) + Math.random() * 10000000)
  let vaildFrom = randomTime
  let vaildTo = Math.round(randomTime + Math.random() * 100000000)
  let data = randomSentence(10, 30)
  let dataHash = web3.utils.soliditySha3(data)
  let dataSig = web3.eth.accounts.sign(data, senderAcc[1])
  let txData = master.methods.addSignature(
    _id,
    _dataKey,
    _signingId,
    dataHash,
    dataSig,
    vaildFrom,
    vaildTo
  ).encodeABI()
  readings.addSigCount++
  signatures.push([_id, _dataKey, _signingId, senderAcc])
  addTxtoTransctions(txData, senderAcc)





}

//create transactions for ratings
async function createRandomRating() {
  console.log("createRandom Rating is called")
  return new Promise((reject, resolve) => {
    console.log("promise is created")
    try {
      let senderAcc = selectRandomUser()
      let id = selectRandomParticipantElement(senderAcc)
      console.log(id)
      //check if the User has an element with participant rights. in case start over
      do {
        console.log("run")
        senderAcc = selectRandomUser()
        id = selectRandomParticipantElement(senderAcc)
      } while (id == undefined)
      console.log("passedID: ", id)
      loadOrgElementDatakeys(id).then((dataKeys) => {
        if (dataKeys == undefined) {
          console.log("err: no dataKeys")
          console.log(id)
        }
        console.log(dataKeys)
        try {
          let randomDataKey = dataKeys[Math.floor(Math.random() * dataKeys.length)]
          createRatingTx(id, randomDataKey, senderAcc)
          resolve()
        } catch (err) { reject() }
      })
    } catch (err) { console.log(err) }
  })

}
function createRatingTx(id, dataKey, senderAcc) {
  //random in (-10,+10)
  let randomRating = Math.round(((Math.random() * 2) - 1) * 20);
  let txData = master.methods.
    rateData(
      id,
      dataKey,
      randomRating
    )
    .encodeABI()
  readings.rateDataCounter++
  console.log("Tx added");
  addTxtoTransctions(txData, senderAcc)
}

//create transactions for relations 
function createRandomRelations() {
  let senderAcc = selectRandomUser()
  let idOne = selectRandomOwnedElement(senderAcc)
  let idTwo = selectRandomAdminElement(senderAcc)
  //make sure there are vaild Elemennts. In case start over

  if (idOne == undefined || idTwo == undefined) {
    createRandomRelations()
    return;
  }
  createRelationTx(idOne, idTwo, senderAcc)
}

function removeRandomRelation() {
  let relation = relations.pop()
  let senderAcc = relation[4]
  let orientation = relation[3]
  let relationType = relation[2]
  let idTwo = relation[1]
  let idOne = relation[0]
  createRmRelationTx(idOne, idTwo, relationType, orientation, senderAcc)
}

function createRmRelationTx(idOne, idTwo, relationType, orientation, senderAcc) {

  let txData = master.methods
    .rmRelation(
      idOne,
      idTwo,
      encDataToHex(relationType),
      orientation
    )
    .encodeABI();


  readings.rmRelationCount++
  addTxtoTransctions(txData, senderAcc)
}

function createRelationTx(idOne, idTwo, senderAcc) {
  let relationType = randomString(5, 10)
  let possibleOrientations = [-1, 0, 1]
  let orientation = possibleOrientations[Math.floor(Math.random() * possibleOrientations.length)]

  let txData = master.methods
    .addRelation(
      idOne,
      idTwo,
      encDataToHex(relationType),
      orientation
    )
    .encodeABI();

  relations.push([idOne, idTwo, relationType, orientation, senderAcc])
  readings.relationCounter++
  addTxtoTransctions(txData, senderAcc)
}

//crate transactions for OrgElements
function createRandomOrgElementTxs() {
  let random = Math.floor(Math.random() * 7)

  switch (random) {
    case 0:
      createRandomBHUBTx();
      readings.createdBHUBS++;
      break;
    case 1:
      createRandomCorpTx()
      readings.createdCorps++
      break;
    case 2:
      createRandomLocationTx()
      readings.createdLocations++
      break;
    case 3:
      createRandomDepartmentTx()
      readings.createdDepartments++
      break;
    case 4:
      createRandomEmployeeTx()
      readings.createdEmployees++
      break;
    case 5:
      createRandomProcessTx()
      readings.createdProcesses++
      break;
    case 6:
      createRandomProductTx();
      readings.createdProducts++
      break;

  }
  readings.createdElements++
}

function createOrgElementDataTxs() {
  createdOrgElements.forEach((orgElement) => {
    let id = orgElement[0]
    let orgType = orgElement[1]
    let senderAcc = orgElement[2]

    switch (orgType) {
      case 0:
        createRandomEmployeeDataTx(id, senderAcc)
        break;
      case 1:
        createRandomDepartmentDataTx(id, senderAcc)
        break;
      case 2:
        createRandomLocationDataTx(id, senderAcc)
        break;
      case 3:
        createRandomCorpDataTx(id, senderAcc)
        break;
      case 4:
        createRandomBHUBDataTx(id, senderAcc)
        break;
      case 5:
        createRandomProcessDataTx(id, senderAcc)
        break;
      case 7:
        createRandomProductDataTx(id, senderAcc);
        break;

    }
  })
}

function createRandomBHUBTx() {
  let id = createOrgElementId()
  let txData = master.methods.newOrgElement(id, '4').encodeABI()
  let owner = selectRandomUser()
  addTxtoTransctions(txData, owner)
  createdOrgElements.push([id, 4, owner])

  return id
}

function createRandomBHUBDataTx(id, senderAcc) {
  let data = createRandomBHUBData()
  data.map((data) => {
    let txData = master.methods
      .setData(id, encDataToHex(data[0]), data[1])
      .encodeABI()
    addTxtoTransctions(txData, senderAcc)
  })
}

function createRandomCorpTx() {
  let id = createOrgElementId()
  let txData = master.methods.newOrgElement(id, '3').encodeABI()
  let owner = selectRandomUser()
  addTxtoTransctions(txData, owner)
  createdOrgElements.push([id, 3, owner])

  return id
}

function createRandomCorpDataTx(id, senderAcc) {
  let data = createRandomCorpData()
  data.map((data) => {
    let txData = master.methods
      .setData(id, encDataToHex(data[0]), data[1])
      .encodeABI()
    addTxtoTransctions(txData, senderAcc)
  })
}

function createRandomLocationTx() {
  let id = createOrgElementId()
  let txData = master.methods.newOrgElement(id, '2').encodeABI()
  let owner = selectRandomUser()
  addTxtoTransctions(txData, owner)
  createdOrgElements.push([id, 2, owner])

  return id
}

function createRandomLocationDataTx(id, senderAcc) {
  let data = createRandomLocationData()
  data.map((data) => {
    let txData = master.methods
      .setData(id, encDataToHex(data[0]), data[1])
      .encodeABI()
    addTxtoTransctions(txData, senderAcc)
  })
}

function createRandomDepartmentTx() {
  let id = createOrgElementId()
  let txData = master.methods.newOrgElement(id, '1').encodeABI()
  let owner = selectRandomUser()
  addTxtoTransctions(txData, owner)
  createdOrgElements.push([id, 1, owner])

  return id
}

function createRandomDepartmentDataTx(id, senderAcc) {
  let data = createRandomDepartmentData()
  data.map((data) => {
    let txData = master.methods
      .setData(id, encDataToHex(data[0]), data[1])
      .encodeABI()
    addTxtoTransctions(txData, senderAcc)
  })
}

function createRandomEmployeeTx() {
  let id = createOrgElementId()
  let txData = master.methods.newOrgElement(id, '0').encodeABI()
  let owner = selectRandomUser()
  addTxtoTransctions(txData, owner)
  createdOrgElements.push([id, 0, owner])

  return id
}

function createRandomEmployeeDataTx(id, senderAcc) {
  let data = createRandomEmployeeData()
  data.map((data) => {
    let txData = master.methods
      .setData(id, encDataToHex(data[0]), data[1])
      .encodeABI()
    addTxtoTransctions(txData, senderAcc)
  })
}

function createRandomProcessTx() {
  let id = createOrgElementId()
  let txData = master.methods.newOrgElement(id, '5').encodeABI()
  let owner = selectRandomUser()
  addTxtoTransctions(txData, owner)
  createdOrgElements.push([id, 5, owner])

  return id
}

function createRandomProcessDataTx(id, senderAcc) {
  let data = createRandomProcessData()
  data.map((data) => {
    let txData = master.methods
      .setData(id, encDataToHex(data[0]), data[1])
      .encodeABI()
    addTxtoTransctions(txData, senderAcc)
  })
}

function createRandomProductTx() {
  let id = createOrgElementId()
  let txData = master.methods.newOrgElement(id, '7').encodeABI()
  let owner = selectRandomUser()
  addTxtoTransctions(txData, owner)
  createdOrgElements.push([id, 7, owner])

  return id
}

function createRandomProductDataTx(id, senderAcc) {
  let data = createRandomProductData()
  data.map((data) => {
    let txData = master.methods
      .setData(id, encDataToHex(data[0]), data[1])
      .encodeABI()
    addTxtoTransctions(txData, senderAcc)
  })
}

// createTransaktions for right management
function setNewOwnerForRandomElement() {
  let senderAcc = selectRandomUser()
  let newOwner = selectRandomUser()
  let id = selectRandomOwnedElement(senderAcc)
  if (senderAcc[0] == newOwner[0] || id == undefined || blacklist.includes(JSON.stringify([senderAcc[0], id]))) {
    setNewOwnerForRandomElement()
    return
  }
  blacklist.push(JSON.stringify([senderAcc[0], id]))

  createSetNewOwnerTx(id, senderAcc, newOwner)
}

function addRandomUserAsParticipant() {
  let senderAcc = selectRandomUser();
  let newParticipant = selectRandomUser();

  let orgElementId = selectRandomOwnedElement(senderAcc)
  let associatedElements = orgElementsIdsOfUsers.find((obj) => {
    return obj.acc[0] == newParticipant[0]
  })
  console.log(JSON.stringify([orgElementId, newParticipant[0]]))

  if (blacklist.includes(JSON.stringify([orgElementId, newParticipant[0]]))) {
    console.log("duplicte found")
    addRandomUserAsParticipant();
    return
  }
  blacklist.push(JSON.stringify([orgElementId, newParticipant[0]]))

  //make sure to not add someone who already has some rights
  if (senderAcc[0] == newParticipant[0] ||
    orgElementId == undefined ||
    associatedElements.participantRights.includes(orgElementId) ||
    associatedElements.adminRights.includes(orgElementId)) {
    addRandomUserAsParticipant()
    return;
  }

  createParticipantTx(orgElementId, senderAcc, newParticipant)
  addedParticipants.push([orgElementId, newParticipant, senderAcc])
}

function upgradeParticpantsToAdmins() {
  let addedParticipant = addedParticipants.pop()
  let participantAcc = addedParticipant[1]
  let id = addedParticipant[0]
  let senderAcc = addedParticipant[2]

  addedAdmins.push([id, participantAcc, senderAcc])
  createAddAdminTx(id, participantAcc, senderAcc)

}

function downgradeAdminsToParticipant() {
  let addedAdmin = addedAdmins.pop()
  let adminAcc = addedAdmin[1]
  let id = addedAdmin[0]
  let senderAcc = addedAdmin[2]

  removedAdmins.push([id, adminAcc, senderAcc])
  createRmAdminTx(id, senderAcc, adminAcc)
}

function downgradeParticipants() {
  let removedAdmin = removedAdmins.pop()
  let participantAcc = removedAdmin[1]
  let id = removedAdmin[0]
  let senderAcc = removedAdmin[2]
  createRmParticipantTx(id, senderAcc, participantAcc)
}



function createSetNewOwnerTx(id, senderAcc, newOwner) {
  let txData = master.methods.setOwner(id, newOwner[0]).encodeABI()
  readings.setNewOwnerCount++
  addTxtoTransctions(txData, senderAcc)
}

function createRmParticipantTx(id, senderAcc, participantAcc) {
  let txData = master.methods
    .rmParticipant(id, participantAcc[0])
    .encodeABI();
  readings.rmParticipantCount++
  addTxtoTransctions(txData, senderAcc)
}

function createRmAdminTx(id, senderAcc, adminAcc) {
  let txData = master.methods
    .rmAdmin(id, adminAcc[0])
    .encodeABI();
  readings.rmAdminCount++
  addTxtoTransctions(txData, senderAcc)
}

function createParticipantTx(id, senderAcc, participantAcc) {
  let txData = master.methods
    .addParticipant(id, participantAcc[0])
    .encodeABI();
  readings.addParticipantCount++
  addTxtoTransctions(txData, senderAcc)

}

function createAddAdminTx(id, adminAcc, senderAcc) {
  let txData = master.methods
    .addAdmin(id, adminAcc[0])
    .encodeABI();
  readings.addAdminCount++
  addTxtoTransctions(txData, senderAcc)
}

// create random OrgElement Data
function createRandomCorpData() {
  let randomData = [
    ['name', randomString(8, 20) + ' ' + randomString(3, 8)],
    ['phone', '+0' + randomIntString(2, 3) + '-' + randomIntString(10, 20)],
    ['ustID', randomString(2, 4) + randomIntString(12, 17)],
    ['email', randomAlphaIntString(8, 25) + '@' + randomString(5, 10) + '.com'],
    [
      'postalAddr',
      randomString(10, 30) +
      ' ' +
      randomIntString(1, 5) +
      ' / ' +
      randomIntString(5, 10) +
      '  ' +
      randomString(10, 15) +
      ' /' +
      randomString(10, 20),
    ],
    ['description', randomSentence(10, 20)],
    ['website', 'www.' + randomString(10, 20) + '.com'],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 10),
    ],
  ]
  //console.log(randomData)
  return randomData
}

function createRandomLocationData() {
  let randomData = [
    ['name', randomString(8, 20) + ' ' + randomString(3, 8)],
    ['phone', '+0' + randomIntString(2, 3) + '-' + randomIntString(10, 20)],
    ['email', randomAlphaIntString(8, 25) + '@' + randomString(5, 10) + '.com'],
    [
      'postalAddr',
      randomString(10, 30) +
      ' ' +
      randomIntString(1, 5) +
      ' / ' +
      randomIntString(5, 10) +
      '  ' +
      randomString(10, 15) +
      ' /' +
      randomString(10, 20)
    ],
    ['description', randomSentence(10, 20)],
    [
      'website',
      'www.' + randomString(10, 20) + '.com' + '/' + randomString(3, 20)
    ],
    [
      '#URL' + randomString(10, 15),
      'http://' + randomString(5, 15) + '/' + randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 20) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 10) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 16)
    ],
  ]
  //console.log(randomData)
  return randomData
}

function createRandomDepartmentData() {
  let randomData = [
    ['name', randomString(8, 20) + ' ' + randomString(3, 8)],
    ['phone', '+0' + randomIntString(2, 3) + '-' + randomIntString(10, 20)],
    ['email', randomAlphaIntString(8, 25) + '@' + randomString(5, 10) + '.com'],
    [
      'postalAddr',
      randomString(10, 30) +
      ' ' +
      randomIntString(1, 5) +
      ' / ' +
      randomIntString(5, 10) +
      '  ' +
      randomString(10, 15) +
      ' /' +
      randomString(10, 20)
    ],
    ['description', randomSentence(10, 25)],
    [
      'website',
      'www.' +
      randomString(10, 20) +
      '.com' +
      '/' +
      randomString(3, 20) +
      '/' +
      randomString(3, 20)
    ],
    [
      '#URL' + randomString(10, 15),
      'http://' + randomString(5, 15) + '/' + randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 20) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 10) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 16),
    ]
  ]

  //console.log(randomData)
  return randomData
}

function createRandomEmployeeData() {
  let randomData = [
    ['name', randomString(8, 20) + ' ' + randomString(3, 8)],
    [
      'phone',
      '+0' +
      randomIntString(2, 3) +
      '-' +
      randomIntString(10, 20) +
      '-' +
      randomIntString(3, 6)
    ],
    ['email', randomAlphaIntString(8, 25) + '@' + randomString(5, 10) + '.com'],
    [
      'postalAddr',
      randomString(10, 30) +
      ' ' +
      randomIntString(1, 5) +
      ' / ' +
      randomIntString(5, 10) +
      '  ' +
      randomString(10, 15) +
      ' /' +
      randomString(10, 20)
    ],
    ['position description', randomSentence(10, 25)],
    ['skills', randomSentence(10, 25)],
    [
      'office hours',
      randomIntString(2, 2) +
      ':' +
      randomIntString(2, 2) +
      ' - ' +
      randomIntString(2, 2) +
      ':' +
      randomIntString(2, 2)
    ],
    [
      '#URL' + randomString(10, 15),
      'http://' + randomString(5, 15) + '/' + randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 20) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 10) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 16)
    ],
  ]
  //console.log(randomData)
  return randomData
}

function createRandomBHUBData() {
  let randomData = [
    ['name', randomString(8, 20) + ' ' + randomString(3, 8)],

    ['email', randomAlphaIntString(8, 25) + '@' + randomString(5, 10) + '.com'],

    ['description', randomSentence(10, 25)],
    ['purpose', randomSentence(10, 25)],
    [
      '#URL' + randomString(10, 15),
      'http://' + randomString(5, 15) + '/' + randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 20) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 10) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 16)
    ]
  ]
  //console.log(randomData)
  return randomData
}

function createRandomProductData() {
  let randomData = [
    ['name', randomString(8, 20) + ' ' + randomString(3, 8)],
    [
      'serial number',
      '+0' +
      randomIntString(2, 3) +
      '-' +
      randomIntString(10, 20) +
      '-' +
      randomIntString(3, 6)
    ],
    [
      'Support email',
      randomAlphaIntString(8, 25) + '@' + randomString(5, 10) + '.com'
    ],

    ['description', randomSentence(10, 25)],
    ['specs', randomSentence(10, 25)],

    [
      '#URL' + randomString(10, 15),
      'http://' + randomString(5, 15) + '/' + randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 20) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 10) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 16)
    ]
  ]
  //console.log(randomData)
  return randomData
}

function createRandomProcessData() {
  let randomData = [
    ['name', randomString(8, 20) + ' ' + randomString(3, 8)],
    ['input', randomSentence(10, 18)],
    ['output', randomSentence(10, 15)],
    ['consumption gods', randomSentence(10, 12)],
    ['description', randomSentence(10, 25)],
    ['specs', randomSentence(10, 25)],

    [
      '#URL' + randomString(10, 15),
      'http://' + randomString(5, 15) + '/' + randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 20) +
      '/' +
      randomString(5, 10)
    ],
    [
      '#URL-' + randomString(10, 15),
      'http://' +
      randomString(5, 15) +
      '/' +
      randomString(5, 10) +
      '/' +
      randomString(5, 30) +
      '/' +
      randomString(5, 16)
    ]
  ]
  //console.log(randomData)
  return randomData
}

function createRandomData() {
  return [randomString(5, 12), randomString(10, 30)]
}

//helper Functions
function selectRandomUser() {
  let users = testAccs
  let randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex];
}

function selectRandomOwnedElement(acc) {

  let associatedElements = orgElementsIdsOfUsers.find((obj) => {
    return obj.acc[0] == acc[0]
  });
  let numberOfElements = associatedElements.ownerRights.length
  randomIndex = Math.floor(Math.random() * numberOfElements);

  return associatedElements.ownerRights[randomIndex]
}

function selectRandomAdminElement(acc) {

  let associatedElements = orgElementsIdsOfUsers.find((obj) => {
    return obj.acc[0] == acc[0]
  });
  let numberOfElements = associatedElements.adminRights.length
  randomIndex = Math.floor(Math.random() * numberOfElements);

  return associatedElements.adminRights[randomIndex]
}
function selectRandomParticipantElement(acc) {

  let associatedElements = orgElementsIdsOfUsers.find((obj) => {
    return obj.acc[0] == acc[0]
  });
  let numberOfElements = associatedElements.participantRights.length
  randomIndex = Math.floor(Math.random() * numberOfElements);

  return associatedElements.participantRights[randomIndex]
}

function createOrgElementId() {
  let randomHex = web3.utils.randomHex(54)
  randomHex = randomHex.substring(0, 66)
  let newElementId = web3.utils.soliditySha3(randomHex)
  return newElementId
}

async function getInitalNonces() {
  return new Promise(async (resolve, reject) => {
    testAccs = await Promise.all(
      testAccs.map(async (testAcc) => {
        testAccNonce = await web3.eth.getTransactionCount(testAcc[0])
        return [testAcc[0], testAcc[1], testAccNonce]
      }),
    )
    resolve()
  })
}

function incrementNonce(address) {
  let user = testAccs.find((user) => user[0] == address)
  nonce = user[2]
  user[2]++
  return nonce
}

function encDataToHex(_dataKey) {
  return web3.utils.fromAscii(_dataKey, 32).padEnd(66, 0)
}

function addTxtoTransctions(txData, senderAcc) {
  let nonce = incrementNonce(senderAcc[0])
  transactions.push([txData, senderAcc, nonce])
}

async function sendTx(txData, senderAcc, txNonce) {

  return new Promise(async (resolve, reject) => {
    try {
      let hash = await web3.eth.sendTransaction({
        from: senderAcc[0],
        gasPrice: web3.utils.toHex(transactionDefaults.gasPrice),
        gas: web3.utils.toHex(transactionDefaults.gas),
        to: master.options.address,
        value: '0',
        data: txData,
        nonce: txNonce,
      })
      if (hash.status) {
        readings.transactionsCount++;
        readings.gasUsed += hash.gasUsed;
      } //else { console.log(hash); }

      resolve(hash)
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

async function runTransaktions() {
  let startTime = Date.now()
  await Promise.all(
    transactions.map((transaction) => {
      return sendTx(transaction[0], transaction[1], transaction[2])
    })
  ).then(() => {
    let time = Date.now() - startTime
    readings.time = time
    console.log(readings)
    resetReadings()
    transactions = []
  })
}

function resetReadings() {
  for (let prop in readings) {
    readings[prop] = 0;
  }
}



async function loadOrgElementIdsForAllUsers() {
  orgElementsIdsOfUsers = await Promise.all(
    testAccs.map((testAcc) => {
      return loadOrgElementIds(testAcc);
    })
  )
}

async function loadOrgElementIds(acc) {
  return new Promise(async (resolve, reject) => {
    try {
      let ownerRights = await master.methods.getElementsByOwner(acc[0]).call()
      let adminRights = await master.methods.getElementsByAdmin(acc[0]).call()
      let participantRights = await master.methods.getElementsByParticipant(acc[0]).call()

      resolve({
        acc: acc,
        ownerRights: ownerRights,
        adminRights: adminRights,
        participantRights: participantRights
      })
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

async function loadOrgElementDatakeys(id) {
  //console.log("dataKeys are called for:", id)
  try {

    console.log("recived id: ", id)
    return await master.methods.getDataKeys(id).call().catch(err => console.log(err))
  } catch (err) {
    console.log(err)
  }
}

//create Random Data Parts
function randomString(minlength, maxlength) {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
  let randomstring = ''
  let length = minlength + Math.round((maxlength - minlength) * Math.random())
  for (var i = 0; i < length; i++) {
    var rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
  }
  return randomstring
}

function randomIntString(minlength, maxlength) {
  let chars = '0123456789'
  let randomstring = ''
  let length = minlength + Math.round((maxlength - minlength) * Math.random())
  for (var i = 0; i < length; i++) {
    var rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
  }
  return randomstring
}

function randomAlphaIntString(minlength, maxlength) {
  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
  let randomstring = ''
  let length = minlength + Math.round((maxlength - minlength) * Math.random())
  for (var i = 0; i < length; i++) {
    var rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
  }
  return randomstring
}

function randomSentence(minlength, maxlength) {
  let randomstring = ''
  let length = minlength + Math.round((maxlength - minlength) * Math.random())
  for (var i = 0; i < length; i++) {
    randomstring += ' ' + randomString(3, 7) + ' ' + randomString(10, 30)
  }
  return randomstring
}

function parseAccs(testJson) {
  console.log(testJson)
  let testAccs = []
  testAccs = testJson.users.map((user) => {
    return [user.accountID, user.privateKey]
  })
  console.log(testAccs)
  return testAccs
}