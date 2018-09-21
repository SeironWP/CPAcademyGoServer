function prepareTTFactoryContract() {
    TTFactory.ABI = BP_FACTORY_ABI;
    TTFactory.contract = web3.eth.contract(TTFactory.ABI);
    TTFactory.contractInstance = TTFactory.contract.at(TTFactory.address);
}

var web3 = typeof web3 === 'undefined' ? undefined : web3;

function prepareWeb3() {
    if (typeof web3 === 'undefined') {
        var ethereumProvider = metamask.createDefaultProvider();
        web3 = new Web3();
        web3.setProvider(ethereumProvider);
    }
    console.log(web3.version);

    var accountIntervalID = setInterval(function() {
        if (web3.eth.accounts.length == 0) {
            $('#web3LockedWarning').show();
        } else {
            $('#web3LockedWarning').hide();
            web3.eth.defaultAccount = web3.eth.accounts[0];
            clearInterval(accountIntervalID);
        }
    }, 250)

    window.TTFactory = {};
    web3.version.getNetwork((err, netID) => {
        if (netID !== '3') {
            if (netID !== '1') {
                web3.setProvider(new Web3.providers.HttpProvider("http://35.153.227.213:8545"));

            }
            console.log("You are on the Ethereum mainnet!");
            window.etherscanURL = "https://etherscan.io/"
            window.etherscanAPIURL = "https://api.etherscan.io/api?";
            TTFactory.address = FACTORY_ADDRESS;
            prepareTTFactoryContract();
        } else if (netID === '3') {
            console.log("You are on the Ropsten net!");
            window.etherscanURL = "https://ropsten.etherscan.io/";
            window.etherscanAPIURL = "https://ropsten.etherscan.io/api?";
            TTFactory.address = FACTORY_ADDRESS_ROPSTEN;
            prepareTTFactoryContract();
        }
      });
    }
