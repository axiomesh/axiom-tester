// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";


interface IWrappedERC20 is IERC20,IERC165 {

    function remoteToken() external view returns (address);

    function bridge() external returns (address);

    function mint(address _to, uint256 _amount) external;

    function burn(address _from, uint256 _amount) external;

    event Mint(address indexed _account, uint256 _amount);
    event Burn(address indexed _account, uint256 _amount);
}


contract WrappedToken is IWrappedERC20,ERC20 {
    address public immutable REMOTE_TOKEN;

    address public immutable BRIDGE;

    constructor(string memory tokenName,string memory tokenSymbol,address _bridge,address _remoteToken) ERC20(tokenName, tokenSymbol) {
        REMOTE_TOKEN=_remoteToken;
        BRIDGE =_bridge;
    }

    modifier onlyBridge() {
        require(msg.sender == BRIDGE, "MintableERC20: only bridge can mint and burn");
        _;
    }

    function remoteToken() public view override returns (address) {
        return REMOTE_TOKEN;
    }

    function bridge() public view override returns (address) {
        return BRIDGE;
    }

    function mint(address _to, uint256 _amount) external override onlyBridge() {
        _mint(_to, _amount);

         emit Mint(_to, _amount);
    }

    function burn(address _from,uint256 _amount) external override onlyBridge()  {
        _burn(_from,_amount);

         emit Burn(_from, _amount);
    }

    function supportsInterface(bytes4 _interfaceId) external pure virtual override returns (bool) {
        bytes4 iface1 = type(IERC165).interfaceId;
        bytes4 iface2 = type(IWrappedERC20).interfaceId;
        return _interfaceId == iface1 || _interfaceId == iface2;
    }
}
