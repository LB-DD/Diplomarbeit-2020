pragma solidity ^0.5.0;


library ExtendedBytes32{

    function leftShift(bytes32 _self, uint _n) public pure returns(bytes32)
    {
        uint aInt = uint(_self);
        uint shifted = aInt*(16**_n);
        return (bytes32(shifted));
    }

    function rightShift(bytes32 _self, uint _n) public pure returns(bytes32)
    {
        uint aInt = uint(_self);
        uint shifted = aInt/(16**_n);
        return (bytes32(shifted));
    }

    function prefix(bytes32 _self, bytes2 _prefix) public pure returns(bytes32)
    {
        bytes32 body = rightShift(_self, _prefix.length);
        return body | _prefix;
    }

    function prefix(bytes32 _self, int16 _prefix) public pure returns(bytes32)
    {
        bytes2 prefixBytes = bytes2(_prefix);
        bytes32 body = rightShift(_self, 4);
        return body | prefixBytes;

    }
}
