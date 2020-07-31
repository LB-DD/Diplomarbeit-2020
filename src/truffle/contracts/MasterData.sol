pragma solidity ^0.5.0;
import "./DynBytes32ArrayExtended.sol";
import "./ExtendedBytes32.sol";
import "./DynAddressArray.sol";


contract MasterData {
    using DynBytes32ArrayExtended for bytes32[];
    using DynAddressArray for address[];
    using ExtendedBytes32 for bytes32;

    enum orgTypes {
        Employee,
        Department,
        Location,
        Corporation,
        BuisnessHub,
        Process,
        Port,
        Product
    }
    enum roles {none, participant, admin}
    bytes32[] private ids;
    mapping(bytes32 => orgElement) orgElements;

    //Central mapping to find all org. elements a passed address has owner rights for.
    mapping(address => bytes32[]) private ownerRights;
    //Central mapping to find all org. elements a passed address has admin rights for.
    mapping(address => bytes32[]) private adminRights;
    //Central mapping to find all org. elements a passed address has participant rights for.
    mapping(address => bytes32[]) private participantRights;

    struct dataF {
        string data;
        int256 rating;
        uint256 changedLast;
        bytes32[] signingIds;
        mapping(bytes32 => DataSig) signatures;
    }

    struct DataSig {
        address signingAddress;
        bytes32 dataHash;
        string signature;
        uint32 vaildFrom;
        uint32 vaildTo;
    }

    struct orgElement {
        bytes32 id;
        address owner;
        orgTypes orgType;
        address[] participants;
        bytes32[] relatedIds;
        mapping(bytes32 => bytes32[]) relationTypes;
        bytes32[] dataKeys;
        mapping(bytes32 => dataF) dataField;
        mapping(address => roles) rights;
    }

    modifier onlyOwner(bytes32 _id) {
        require(
            msg.sender == orgElements[_id].owner,
            "Only the owner can perform this function!"
        );
        _;
    }

    modifier onlyAdmin(bytes32 _id) {
        require(
            uint256(roles.admin) ==
                uint256(orgElements[_id].rights[msg.sender]) ||
                msg.sender == orgElements[_id].owner,
            "Only the owner or an admin can perform this function!"
        );
        _;
    }

    modifier onlyParticipant(bytes32 _id) {
        require(
            uint256(roles.participant) >=
                uint256(orgElements[_id].rights[msg.sender]) ||
                msg.sender == orgElements[_id].owner,
            "Only a participant can perform this function!"
        );
        _;
    }

    function newOrgElement(bytes32 _random, uint256 _orgType) public {
        bytes32 newId = _random;
        require(orgElements[newId].id == 0, "ID creation failed!");
        orgElements[newId] = orgElement(
            newId,
            msg.sender,
            orgTypes(_orgType),
            new address[](0),
            new bytes32[](0),
            new bytes32[](0)
        );
        ids.push(newId);
        ownerRights[msg.sender].push(newId);
    }

    function getIds() public view returns (bytes32[] memory) {
        return ids;
    }

    function setData(bytes32 _id, bytes32 _dataKey, string memory _data)
        public
        onlyOwner(_id)
    {
        require(
            !orgElements[_id].dataKeys.isIn(_dataKey),
            "This data field was set up already!"
        );
        orgElements[_id].dataField[_dataKey].data = _data;
        orgElements[_id].dataField[_dataKey].changedLast = block.timestamp;
        orgElements[_id].dataKeys.push(_dataKey);
    }

    function removeData(bytes32 _id, bytes32 _dataKey) public onlyOwner(_id) {
        require(
            orgElements[_id].dataKeys.isIn(_dataKey),
            "this data field does not exist!"
        );
        orgElements[_id].dataField[_dataKey].data = "";
        orgElements[_id].dataKeys.pop(_dataKey);
    }

    function changeData(bytes32 _id, bytes32 _dataKey, string memory _data)
        public
        onlyAdmin(_id)
    {
        require(
            bytes(orgElements[_id].dataField[_dataKey].data).length != 0,
            "This datafield wasn't initilized by the owner!"
        );
        orgElements[_id].dataField[_dataKey].data = _data;
        // Bug?
        delete orgElements[_id].dataField[_dataKey].signingIds;
        orgElements[_id].dataField[_dataKey].changedLast = block.timestamp;
    }

    function getData(bytes32 _id, bytes32 _dataKey)
        public
        view
        returns (string memory data)
    {
        data = orgElements[_id].dataField[_dataKey].data;
    }

    function getTimeLastChanged(bytes32 _id, bytes32 _dataKey)
        public
        view
        returns (uint256)
    {
        return orgElements[_id].dataField[_dataKey].changedLast;
    }

    function getDataKeys(bytes32 _id) public view returns (bytes32[] memory) {
        return orgElements[_id].dataKeys;
    }

    function getOrgType(bytes32 _id) public view returns (uint256) {
        return uint256(orgElements[_id].orgType);
    }

    function setOwner(bytes32 _id, address _addr) public onlyOwner(_id) {
        rmElementByOwner(msg.sender, _id);
        orgElements[_id].owner = _addr;
        addElementByOwner(_addr, _id);
    }

    function getOwner(bytes32 _id) public view returns (address) {
        return orgElements[_id].owner;
    }

    function addAdmin(bytes32 _id, address _addr) public onlyOwner(_id) {
        if (
            uint256(orgElements[_id].rights[_addr]) ==
            uint256(roles.participant)
        ) {
            orgElements[_id].rights[_addr] = roles.admin;
            rmElementByParticipant(_addr, _id);
            addElementByAdmin(_addr, _id);
        } else {
            revert("only a Particicpant can become an admin!");
        }
    }

    function rmAdmin(bytes32 _id, address _addr) public onlyOwner(_id) {
        orgElements[_id].rights[_addr] = roles.participant;
        rmElementByAdmin(_addr, _id);
        addElementByParticipant(_addr, _id);
    }

    function addParticipant(bytes32 _id, address _addr) public onlyAdmin(_id) {
        if (uint256(orgElements[_id].rights[_addr]) == uint256(roles.none)) {
            orgElements[_id].rights[_addr] = roles.participant;
            orgElements[_id].participants.push(_addr);
            addElementByParticipant(_addr, _id);
        } else {
            revert("Address is already a participant of this org. element.");
        }
    }

    function rmParticipant(bytes32 _id, address _addr) public onlyAdmin(_id) {
        if (
            uint256(orgElements[_id].rights[_addr]) ==
            uint256(roles.participant)
        ) {
            orgElements[_id].rights[_addr] = roles.none;
            orgElements[_id].participants.pop(_addr);
            rmElementByParticipant(_addr, _id);
        } else {
            revert("Address is not a participant of this org. element.");
        }
    }

    function getParticipants(bytes32 _id)
        public
        view
        returns (address[] memory)
    {
        return orgElements[_id].participants;
    }

    function getRight(bytes32 _id, address _addr)
        public
        view
        returns (uint256)
    {
        return uint256(orgElements[_id].rights[_addr]);
    }

    function rateData(bytes32 _id, bytes32 _dataKey, int256 _rateing)
        public
        onlyParticipant(_id)
    {
        orgElements[_id].dataField[_dataKey].rating += _rateing;
    }

    function getDataRateing(bytes32 _id, bytes32 _dataKey)
        public
        view
        returns (int256)
    {
        return orgElements[_id].dataField[_dataKey].rating;
    }

    function addRelation(
        bytes32 _id,
        bytes32 _relatedId,
        bytes32 _relationType,
        int16 _orientation
    ) public onlyAdmin(_id) {
        //first relation to this Element?
        if (!orgElements[_id].relatedIds.isIn(_relatedId)) {
            orgElements[_id].relatedIds.push(_relatedId);
            orgElements[_relatedId].relatedIds.push(_id);
        }

        //first relation of this kind between the Elements?
        if (
            !orgElements[_id].relationTypes[_relatedId].isIn(
                _relationType.prefix(_orientation)
            )
        ) {
            orgElements[_id].relationTypes[_relatedId].push(
                _relationType.prefix(_orientation)
            );
            orgElements[_relatedId].relationTypes[_id].push(
                _relationType.prefix(-_orientation)
            );
        }
    }

    function rmRelation(
        bytes32 _id,
        bytes32 _relatedId,
        bytes32 _relationType,
        int16 _orientation
    ) public onlyAdmin(_id) {
        if (
            orgElements[_id].relationTypes[_relatedId].isIn(
                _relationType.prefix(_orientation)
            )
        ) {
            orgElements[_id].relationTypes[_relatedId].pop(
                _relationType.prefix(_orientation)
            );
            orgElements[_relatedId].relationTypes[_id].pop(
                _relationType.prefix(-_orientation)
            );
        } else {
            revert("Relation not found");
        }
        if (orgElements[_id].relationTypes[_relatedId].length == 0) {
            orgElements[_id].relatedIds.pop(_relatedId);
            orgElements[_relatedId].relatedIds.pop(_id);
        }
    }

    //not a secure way to handle related Ids! Because everybody can find them in the public Chain!
    function getRelatedIds(bytes32 _id)
        public
        view
        onlyParticipant(_id)
        returns (bytes32[] memory)
    {
        return orgElements[_id].relatedIds;
    }

    //not a secure way to handle Relation! Because everybody can find them in the public Chain!
    function getRelation(bytes32 _id, bytes32 _relatedId)
        public
        view
        onlyParticipant(_id)
        returns (bytes32[] memory)
    {
        return orgElements[_id].relationTypes[_relatedId];
    }

    function addElementByOwner(address _addr, bytes32 _id) internal {
        ownerRights[_addr].push(_id);
    }

    function rmElementByOwner(address _addr, bytes32 _id) internal {
        if (ownerRights[_addr].isIn(_id)) {
            ownerRights[_addr].pop(_id);
        } else {
            revert("passed id not found!");
        }
    }

    function getElementsByOwner(address _addr)
        public
        view
        returns (bytes32[] memory)
    {
        return ownerRights[_addr];
    }

    function addElementByAdmin(address _addr, bytes32 _id) internal {
        adminRights[_addr].push(_id);
    }

    function rmElementByAdmin(address _addr, bytes32 _id) internal {
        if (adminRights[_addr].isIn(_id)) {
            adminRights[_addr].pop(_id);
        } else {
            revert("passed id not found!");
        }
    }

    function getElementsByAdmin(address _addr)
        public
        view
        returns (bytes32[] memory)
    {
        return adminRights[_addr];
    }

    function addElementByParticipant(address _addr, bytes32 _id) internal {
        participantRights[_addr].push(_id);
    }

    function rmElementByParticipant(address _addr, bytes32 _id) internal {
        if (participantRights[_addr].isIn(_id)) {
            participantRights[_addr].pop(_id);
        } else {
            revert("passed id not found!");
        }
    }

    function getElementsByParticipant(address _addr)
        public
        view
        returns (bytes32[] memory)
    {
        return participantRights[_addr];
    }

    function addSignature(
        bytes32 _id,
        bytes32 _dataKey,
        bytes32 _signingId,
        bytes32 _dataHash,
        string memory _sig,
        //Time should passed in UNIX
        uint32 _vaildFrom,
        uint32 _vaildTo
    ) public onlyParticipant(_id) onlyAdmin(_signingId) {
        if (!orgElements[_id].dataField[_dataKey].signingIds.isIn(_signingId)) {
            orgElements[_id].dataField[_dataKey].signingIds.push(_signingId);
        }
        orgElements[_id].dataField[_dataKey].signatures[_signingId]
            .signingAddress = msg.sender;
        orgElements[_id].dataField[_dataKey].signatures[_signingId]
            .dataHash = _dataHash;
        orgElements[_id].dataField[_dataKey].signatures[_signingId]
            .signature = _sig;
        orgElements[_id].dataField[_dataKey].signatures[_signingId]
            .vaildFrom = _vaildFrom;
        orgElements[_id].dataField[_dataKey].signatures[_signingId]
            .vaildFrom = _vaildTo;
    }

    function rmSignature(bytes32 _id, bytes32 _dataKey, bytes32 _signingId)
        public
        onlyAdmin(_signingId)
    {
        if (orgElements[_id].dataField[_dataKey].signingIds.isIn(_signingId)) {
            orgElements[_id].dataField[_dataKey].signingIds.pop(_signingId);
        } else {
            revert("passed Id wasn't found");
        }
    }

    function getSigningIds(bytes32 _id, bytes32 _dataKey)
        public
        view
        returns (bytes32[] memory)
    {
        return orgElements[_id].dataField[_dataKey].signingIds;
    }

    function getDataSig(bytes32 _id, bytes32 _dataKey, bytes32 signingId)
        public
        view
        returns (address, bytes32, string memory, uint32, uint32)
    {
        return (
            orgElements[_id].dataField[_dataKey].signatures[signingId]
                .signingAddress,
            orgElements[_id].dataField[_dataKey].signatures[signingId].dataHash,
            orgElements[_id].dataField[_dataKey].signatures[signingId]
                .signature,
            orgElements[_id].dataField[_dataKey].signatures[signingId]
                .vaildFrom,
            orgElements[_id].dataField[_dataKey].signatures[signingId].vaildTo
        );
    }
}