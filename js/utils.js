const ROPSTEN_FACTORY_ADDRESS = "0x649cc62BB1cF4F73827387D2B663d89570016673"

function prepareBPFactoryContract() {
    BPFactory.ABI = BP_FACTORY_ABI;
    BPFactory.contract = web3.eth.contract(BPFactory.ABI);
    BPFactory.contractInstance = BPFactory.contract.at(BPFactory.address);
}

var web3 = typeof web3 === 'undefined' ? undefined : web3;

function prepareWeb3() {
    if (typeof web3 === 'undefined') {
        var ethereumProvider = metamask.createDefaultProvider();
        web3 = new Web3();
        web3.setProvider(ethereumProvider);
    }
    console.log(web3.version)
    $('#web3Div').show();
    var accountIntervalID = setInterval(function() {
        if (web3.eth.accounts.length == 0) {
            $('#web3LockedWarning').show();
        } else {
            $('#web3LockedWarning').hide();
            web3.eth.defaultAccount = web3.eth.accounts[0];
            clearInterval(accountIntervalID);
        }
    }, 250)

    window.BPFactory = {};
    web3.version.getNetwork((err, netID) => {
        if (netID !== '3') {
            if (netID !== '1') {
                web3.setProvider(new Web3.providers.HttpProvider("http://35.153.227.213:8545"));

            }
            console.log("You are on the Ethereum mainnet!");
            window.filterStartBlock = FILTER_START_BLOCK;
            window.etherscanURL = "https://etherscan.io/"
            window.etherscanAPIURL = "https://api.etherscan.io/api?";
            BPFactory.address = BP_FACTORY_ADDRESS;
            prepareBPFactoryContract();
            onWeb3Ready();
        } else if (netID === '3') {
            console.log("You are on the Ropsten net!");
            window.filterStartBlock = FILTER_START_BLOCK_ROPSTEN;
            window.etherscanURL = "https://ropsten.etherscan.io/";
            window.etherscanAPIURL = "https://ropsten.etherscan.io/api?";
            BPFactory.address = BP_FACTORY_ADDRESS_ROPSTEN;
            prepareBPFactoryContract();
            $('#ropstenWarning').show();
            onWeb3Ready();
        }
});
