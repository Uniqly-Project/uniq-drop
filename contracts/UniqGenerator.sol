// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "./ERC721/ERC721Enumerable.sol";
import "./utils/Ownable.sol";
import "./utils/IERC2981.sol";
import "./utils/IERC20.sol";

contract UniqGenerator is ERC721Enumerable, IERC2981, Ownable {
    // ----- VARIABLES ----- //

    uint internal _verificationPrice;
    address internal _tokenForPaying;
    string public METADATA_PROVENANCE_HASH;
    string public BASE_URI;
    uint256 public immutable ROYALTY_FEE;
    mapping( bytes32 => bool ) internal _isItemMinted;
    mapping( uint => bytes32 ) internal _hashOf;
    mapping( bytes32 => address ) internal _verificationRequester;
    uint256 internal _tokenNumber;
    address internal _claimingAddress;


    // ----- MODIFIERS ----- //
    modifier notZeroAddress(address a) {
        require(a != address(0), "ZERO address can not be used");
        _;
    }

    // ----- PRIVATE METHODS ----- //
    constructor(
        string memory baseURI,
        string memory _name,
        string memory _symbol,
        address _owner_,
        address _proxyRegistryAddress, 
        uint _verfifyPrice,
        address _tokenERC20
    )
        notZeroAddress(_proxyRegistryAddress)
        ERC721(_name, _symbol)
        Ownable(_owner_)
    {
        BASE_URI = baseURI;
        proxyRegistryAddress = _proxyRegistryAddress;
        ROYALTY_FEE = 750000; //7.5%
        _verificationPrice = _verfifyPrice;
        _tokenForPaying = _tokenERC20;
    }

    /// @dev not test for functions related to signature
    function getMessageHash(
        address _requester,
        bytes32 _itemHash
    ) public pure returns (bytes32) {
        return
            keccak256(abi.encodePacked(_requester, _itemHash));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    /// @dev not test for functions related to signature
    function verifySignature(
        address _requester,
        bytes32 _itemHash,
        bytes memory _signature
    ) internal view returns (bool) {
        bytes32 messageHash =
            getMessageHash(_requester, _itemHash);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        return recoverSigner(ethSignedMessageHash, _signature) == owner();
    }

    /// @dev not test for functions related to signature
    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) internal pure returns (address) {
        require(_signature.length == 65, "invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
    
    // ----- VIEWS ----- //
    /// @dev should not test for internal functions 
    function _baseURI() internal view override returns (string memory) {
        return BASE_URI;
    }

    /// @dev this function is tested while other functions are testing
    function isMintedForHash(bytes32 _itemHash) external view returns(bool){
        return _isItemMinted[_itemHash];
    }

    /// @dev this function is tested while other functions are testing
    function verificationRequester(bytes32 _itemHash) external view returns(address){
        return _verificationRequester[_itemHash];
    }

    function getClaimerAddress() external view returns(address){
        return _claimingAddress;
    }

    function getVerificationPrice() external view returns(uint){
       return _verificationPrice;
    }

    function hashOf(uint _id) external view returns(bytes32){
        return _hashOf[_id];
    }

    /// @dev not test about copy of standard
    function royaltyInfo(uint256)
        external
        view
        override
        returns (address receiver, uint256 amount)
    {
        return (owner(), ROYALTY_FEE);
    }

    function tokensOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);
        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 index;
            for (index = 0; index < tokenCount; index++) {
                result[index] = tokenOfOwnerByIndex(_owner, index);
            }
            return result;
        }
    }

    /// @dev not test about copy of standard
    function burn(uint _tokenId) external{
        if(msg.sender != _claimingAddress){
            require(_isApprovedOrOwner(msg.sender,_tokenId), "Ownership or approval required");}
        _burn(_tokenId);
    }


    // ----- PUBLIC METHODS ----- //
    function setClaimingAddress(address _address) external onlyOwner{
        _claimingAddress = _address;
    }

    function payForVerification( bytes32 _itemHash ) external {
        require(!_isItemMinted[_itemHash], "Already minted");
        require(_verificationRequester[_itemHash]==address(0), "Verification already requested");
        require(IERC20(_tokenForPaying).transferFrom(msg.sender, address(this), _verificationPrice));
        _verificationRequester[_itemHash] = msg.sender;
    }

    function mintVerified(bytes32 _itemHash, bytes memory _signature) external {
        require(_verificationRequester[_itemHash]==msg.sender, "Verification Requester mismatch");
        require(!_isItemMinted[_itemHash], "Already minted");
        require(verifySignature(msg.sender, _itemHash, _signature), "Signature mismatch");
        _isItemMinted[_itemHash] = true;
        _safeMint(msg.sender, _tokenNumber);
        _hashOf[_tokenNumber] = _itemHash;
        _tokenNumber++;
    }


    // ----- OWNERS METHODS ----- //
    /// @dev not test because no get function
    function setProvenanceHash(string memory _hash) external onlyOwner {
        METADATA_PROVENANCE_HASH = _hash;
    }

    /// @dev this function is tested while other functions are testing
    function setTokenAddress(address _newAddress) external onlyOwner{
        _tokenForPaying = _newAddress;
    }

    function editVerificationPrice(uint _newPrice) external onlyOwner{
        _verificationPrice = _newPrice;
    }

    /// @dev not test because baseURi() is a interanl function
    function setBaseURI(string memory baseURI) external onlyOwner {
        BASE_URI = baseURI;
    }

    function recoverERC20(address token) external onlyOwner {
        uint256 val = IERC20(token).balanceOf(address(this));
        require(val > 0, "Nothing to recover");
        // use interface that not return value (USDT case)
        Ierc20(token).transfer(owner(), val);
    }

    /// @dev not test about copy of standard
    function receivedRoyalties(
        address,
        address _buyer,
        uint256 _tokenId,
        address _tokenPaid,
        uint256 _amount
    ) external override {
        emit ReceivedRoyalties(owner(), _buyer, _tokenId, _tokenPaid, _amount);
    }

    // OpenSea stuff
    address proxyRegistryAddress;

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    /// @dev not test about copy of standard
    function isApprovedForAll(address own, address spend)
        public
        view
        override
        returns (bool)
    {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(own)) == spend) {
            return true;
        }

        return super.isApprovedForAll(own, spend);
    }
}

// To recover broken ERC20 token contracts like USDT
// that are not returning value on transfer
interface Ierc20 {
    function transfer(address, uint256) external;
}

// for OpenSea integration
contract OwnableDelegateProxy {

}

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}
