pragma solidity ^0.5.0;

library DynBytes32ArrayExtended{

    function pop(bytes32[] storage _self, bytes32 _element)public returns(bytes32[] memory){
        uint i = getIndexOf(_self, _element);
        uint j = _self.length;
        if(i < j-1 && j > 1){
            //If we are going to delete an id in the middle of the array we just overrite it with the last item.
            _self[i] = _self[j-1];
        }
        //The last Iteam of the arry was copied before or is the id we want to delat anyway.
        _self.pop();
        return _self;
    }

    // it is unefficent to itterate over the arrays twice. Consider to combine isIn an get IndexOf
    // function to get the current index of an id
    function getIndexOf(bytes32[] memory _self, bytes32 _element) public pure returns(uint){
        require (isIn(_self,_element),"passed bytes32 not found");
        uint j = _self.length;
        for(uint i = 0; i < j; i++){
            if(_self[i] == _element){
                return i;
            }
        }
    }

    // function to check if an passed id is in the array.
    function isIn(bytes32[] memory _self, bytes32 _element) public pure returns(bool) {
        uint j = _self.length;
        for(uint i = 0; i < j; i++){
            if(_element == _self[i])
            return true;
        }
        return false;
    }
}