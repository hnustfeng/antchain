contract AssetSample {
    using SafeMath for uint256;
    using Strings for uint256;

    identity admin; 

    string name;

    uint256 private _nextMintedTokenId;

    mapping (identity => uint256) private _balances;

    mapping(uint256 => identity) private _tokenAllowance;

    mapping(uint256 => identity) private _owners;

    mapping(identity => mapping(uint256 => uint256)) private _ownerTokens;

    uint256[] private _allTokens;

    mapping(uint256 => uint256) private _ownerTokensIndex;

    mapping(uint256 => uint256) private _allTokensIndex;

    mapping(uint256 => string) private _tokenURL;

    string _baseURL;

    event Mint(identity to, uint256 tokenId);

    event Transfer(identity from, identity to, uint256 tokenId);

    event Approval(identity owner, identity to, uint256 tokenId);

    event MultipeMint(identity to, uint256 value, uint256 endTokenId);



    modifier onlyAdmin() {
        require(msg.sender == admin, "Permission denied");
        _;
    }


    constructor() public {
        admin = msg.sender;
        name = "test";
        _baseURL = "www.baidu.com/";
        _nextMintedTokenId = 0;
    }
    
    function totalSupply() public view returns (uint256) {
        return _allTokens.length;
    }

  
    function getName() public view returns (string memory) {
        return name;
    }

   
    function getBaseURL() public view returns (string memory) {
        return _baseURL;
    }

 
    function _exists(uint256 tokenId) internal view  returns (bool){
        return _owners[tokenId] != identity(0);
    }

   
    function ownerOf(uint256 tokenId) public view returns (identity){
        identity owner = _owners[tokenId];
        require(owner != identity(0), "Asset: owner query for nonexistent token");
        return owner;
    }

  
    function balanceOf(identity owner) public view returns (uint256) {
        return _balances[owner];
    }


    function setBaseURL(string BaseURL) onlyAdmin() public  returns (bool) {
        require(bytes(BaseURL).length > 0, "Asset: baseURL is null");
        _baseURL = BaseURL;
        return true;
    }

    function setName(string Name) onlyAdmin() public  returns (bool) {
        require(bytes(Name).length > 0, "Asset: name is null");
        name = Name;
        return true;
    }

  
    function getTokenURL(uint256 tokenId)public view returns (string) {
        require(_exists(tokenId), "Asset: URI query for nonexistent token");
        string memory base = _getBaseURL();
        string memory itemId = Strings.toString(tokenId);
        return string(abi.encodePacked(base, itemId));

    }

   
    function transfer(identity to, uint256 tokenId) public returns (bool) {
        if (ownerOf(tokenId) == msg.sender){
            _transfer(msg.sender, to, tokenId);
        }else{
            require(isApproved(tokenId, msg.sender), "Asset:not owner of this token or not approve");
            _transfer(ownerOf(tokenId), to, tokenId);
        }
        return true;
    }

   
    function approve(identity to, uint256 tokenId) public returns (bool) {
        require(msg.sender == ownerOf(tokenId), "Asset: transfer from incorrect owner");
        require(to != msg.sender, "Asset: approval to current owner");

        _approve(to, tokenId);
        emit Approval(msg.sender, to, tokenId);
        return true;
    }

  
    function mint(identity to, uint256 value) onlyAdmin() public returns (bool) {
        uint256 newTokenId = _returnNextMintedTokenId();
        for (uint256 i = 0; i < value; i++){
            _mint(to, newTokenId);
            newTokenId = newTokenId.add(1);
        }
        _nextMintedTokenId = _nextMintedTokenId.add(value);
        emit MultipeMint(to, value, _nextMintedTokenId - 1);
        return true;
    }

   
    function _transfer(identity from, identity to, uint256 tokenId) internal {
        require(from == ownerOf(tokenId), "Asset: transfer from incorrect owner");
        require(to != identity(0), "Asset: transfer to the zero identity");

        _beforeTokenTransefer(from,to,tokenId);

        _approve(identity(0),tokenId);

        _balances[from] = _balances[from].sub(1);
        _balances[to] = _balances[to].add(1);
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    
    function _approve(identity to, uint256 tokenId) internal {
        _tokenAllowance[tokenId] = to;
    }

   
    function _mint(identity to, uint256 tokenId) internal {
        require(to != identity(0), "Asset: issue to the zreo identity");
        require(!_exists(tokenId), "Asset: token already issued");

        _beforeTokenTransefer(identity(0), to, tokenId);

        _balances[to] = _balances[to].add(1);
        _owners[tokenId] = to;
    }
    
    function _beforeTokenTransefer(identity from, identity to, uint256 tokenId) internal {
        if (from == identity(0)){
            _allTokensIndex[tokenId] = _allTokens.length;
            _allTokens.push(tokenId);
        }else if (from != to){
            uint256 lastTokenIndex = balanceOf(from) - 1;
            uint256 tokenIndex = _ownerTokensIndex[tokenId];

            if (tokenIndex != lastTokenIndex){
                uint256 lastTokenId = _ownerTokens[from][lastTokenIndex];

                _ownerTokens[from][tokenIndex] = lastTokenId;
                _ownerTokensIndex[lastTokenId] = tokenIndex;
            }

            delete _ownerTokensIndex[tokenId];
            delete _ownerTokens[from][lastTokenIndex];
        }

        if (to == identity(0)){
            uint256 lastTokenIndexto = _allTokens.length - 1;
            uint256 tokenIndexto = _allTokensIndex[tokenId];
            uint256 lastTokenIdto = _allTokens[lastTokenIndex];

            _allTokens[tokenIndexto] = lastTokenIdto;
            _allTokensIndex[lastTokenIdto] = tokenIndexto;

            delete _allTokensIndex[tokenId];
            // _allTokens.pop();
            delete _allTokens[lastTokenIndexto];
        }else if (to != from){
            uint256 length = balanceOf(to);
            _ownerTokens[to][length] = tokenId;
            _ownerTokensIndex[tokenId] = length;
        }
    }

   
    function _returnNextMintedTokenId() internal  view returns (uint256) {
        return _nextMintedTokenId;
    }

    function _getBaseURL() internal  view returns (string) {
        return _baseURL;
    }

 
    function isApproved(uint256 tokenId, identity from) internal view returns (bool){
        return _tokenAllowance[tokenId] == from;
    }

}

library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

  
    function toString(uint256 value) internal pure returns (string memory) {

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

  
    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0x00";
        }
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }

  
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
}


library SafeMath {
    
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

