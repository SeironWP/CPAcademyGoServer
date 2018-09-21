const FACTORY_ADDRESS_ROPSTEN = "0x649cc62BB1cF4F73827387D2B663d89570016673"
const BP_FACTORY_ABI =
[
	{
		"constant": true,
		"inputs": [],
		"name": "notifyServiceProvider",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "notifyServiceFee",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "seller",
				"type": "address"
			},
			{
				"name": "autoreleaseInterval",
				"type": "uint256"
			},
			{
				"name": "_details",
				"type": "string"
			}
		],
		"name": "newToastytrade",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "toastytradeAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "details",
				"type": "string"
			}
		],
		"name": "ToastytradeCreated",
		"type": "event"
	}
]
