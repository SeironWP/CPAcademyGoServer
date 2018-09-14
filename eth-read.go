package main

import (
	"context"
	"github.com/SomniaStellarum/StellarUtilities/slog"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"log"
	"math/big"
	"time"
)

const ROPSTEN_FACTORY_ADDRESS = "0x649cc62BB1cF4F73827387D2B663d89570016673"

var cli *ethclient.Client

var (
	factoryAddress     common.Address
	toastytradeFactory *ToastytradeFactory
)

var (
	CreatedTopic         common.Hash
	FundsAddedTopic      common.Hash
	PayerStatementTopic  common.Hash
	WorkerStatementTopic common.Hash
	FundsRecoveredTopic  common.Hash
	CommittedTopic       common.Hash
	FundsBurnedTopic     common.Hash
	FundsReleasedTopic   common.Hash
	ClaimStartedTopic    common.Hash
	ClaimCanceledTopic   common.Hash
	ClaimTriggeredTopic  common.Hash
	ClosedTopic          common.Hash
	UnclosedTopic        common.Hash
)

func initEthStuff() error {
	CreatedTopic = crypto.Keccak256Hash([]byte("Created(address,bool,address,uint256,uint256,string)"))
	FundsAddedTopic = crypto.Keccak256Hash([]byte("FundsAdded(address,uint256)"))
	PayerStatementTopic = crypto.Keccak256Hash([]byte("PayerStatement(string)"))
	WorkerStatementTopic = crypto.Keccak256Hash([]byte("WorkerStatement(string)"))
	FundsRecoveredTopic = crypto.Keccak256Hash([]byte("FundsRecovered()"))
	CommittedTopic = crypto.Keccak256Hash([]byte("Committed(address)"))
	FundsBurnedTopic = crypto.Keccak256Hash([]byte("FundsBurned(uint256)"))
	FundsReleasedTopic = crypto.Keccak256Hash([]byte("FundsReleased(uint256)"))
	ClaimStartedTopic = crypto.Keccak256Hash([]byte("ClaimStarted()"))
	ClaimCanceledTopic = crypto.Keccak256Hash([]byte("ClaimCanceled()"))
	ClaimTriggeredTopic = crypto.Keccak256Hash([]byte("ClaimTriggered()"))
	ClosedTopic = crypto.Keccak256Hash([]byte("Closed()"))
	UnclosedTopic = crypto.Keccak256Hash([]byte("Unclosed()"))

	factoryAddress = common.HexToAddress(ROPSTEN_FACTORY_ADDRESS)

	var err error

	cli, err = ethclient.Dial("wss://ropsten.infura.io/ws")
	if err != nil {
		return err
	}

	toastytradeFactory, err = NewToastytradeFactory(common.HexToAddress(ROPSTEN_FACTORY_ADDRESS), cli)
	if err != nil {
		return err
	}

	return nil
}

func ethReadLoop(fromBlock uint64) {
	slog.DebugPrint("starting eth read loop")
	ctx := context.Background()

	lastBlockScanned := big.NewInt(int64(fromBlock) - 1)
	var queryStartBlock, queryEndBlock big.Int

	for {
		//Set the beginning of the queried range to the block just after the last block scanned
		queryStartBlock.Add(lastBlockScanned, big.NewInt(1))

		//Get latest block
		block, err := cli.HeaderByNumber(ctx, nil)
		if err != nil {
			log.Panic("error getting block number: ", err)
		}

		//Set the end of the range to the latest block
		//(We could use 'latest', but this way we have finer control, to make sure we aren't re-scanning blocks)
		queryEndBlock = *block.Number

		if queryStartBlock.Cmp(&queryEndBlock) == 1 { // If queryStartBlock > queryEndBlock
			//Indicates there has been no new block since last loop. Sleep a bit and continue.
			time.Sleep(time.Minute)
			continue
		}

		var query ethereum.FilterQuery
		query.FromBlock = &queryStartBlock
		query.ToBlock = &queryEndBlock

		//This range will be used for both filter calls that follow in this loop.

		//Get all events ToastytradeCreated events from Factory contract, and extract address of new BPs

		query.Addresses = []common.Address{factoryAddress}

		logs, err := cli.FilterLogs(ctx, query)
		if err != nil {
			log.Panic("error filtering for factory events", err)
		}

		var newToastytradeAddresses []common.Address

		for _, log := range logs {
			event := new(ToastytradeFactoryToastytradeCreated)
			toastytradeFactory.ToastytradeFactoryFilterer.contract.UnpackLog(event, "ToastytradeCreated", log)

			newToastytradeAddresses = append(newToastytradeAddresses, event.ToastytradeAddress)
		}

		//Additionally fetch all already-cached BP addresses from DB

		getAllToastytradeAddressesReqChan <- true
		result := <-getAllToastytradeAddressesResChan
		if result.err != nil {
			log.Panic(result.err)
		}
		ttAddressesFromDB := result.addresses

		//Concacenate the DB's adddresses and those from the newly-created BPs.
		toastytradeAddresses := append(ttAddressesFromDB, newToastytradeAddresses...)

		//create toastytradeContract instances to use their filterer in the next loop
		toastytradeContracts := make(map[common.Address]*BurnablePayment)
		for _, addr := range toastytradeAddresses {
			contract, err := NewBurnablePayment(addr, cli)
			if err != nil {
				log.Panic("error creating toastytrade @ ", addr.Hex())
			}

			toastytradeContracts[addr] = contract
		}

		//now deal with each new event from each toastytrade
		query.Addresses = toastytradeAddresses

		logs, err = cli.FilterLogs(ctx, query)
		if err != nil {
			log.Panic("error filtering for toastytrade events", err)
		}

		for _, thisLog := range logs {
			addr := thisLog.Address

			switch thisLog.Topics[0] {
			case CreatedTopic:
				slog.DebugPrint("Created event found")
				//decode event
				event := new(BurnablePaymentCreated)
				toastytradeContracts[addr].BurnablePaymentFilterer.contract.UnpackLog(event, "Created", thisLog)

				ttEntry := new(toastytradeEntry)
				ttEntry.Seller = event.Creator

				state, _, _, _, balance, commitThreshold, _, _, _, autoreleaseInterval, _, err := toastytradeContracts[addr].BurnablePaymentCaller.GetFullState(nil)
				if err != nil {
					log.Panic("error calling bp.getFullState: ", err)
				}

				ttEntry.State = state
				ttEntry.Balance = *balance
				ttEntry.CommitThreshold = *commitThreshold
				ttEntry.AutoreleaseInterval = *autoreleaseInterval

				createdUpdate := new(createdUpdate)
				createdUpdate.ttAddr = addr
				createdUpdate.entry = ttEntry

				createdUpdateChan <- createdUpdate

				err = notifyParties(addr, event)
				if err != nil {
					log.Panic(err)
				}

			case CommittedTopic:
				slog.DebugPrint("Committed event found")

				event := new(BurnablePaymentCommitted)
				toastytradeContracts[addr].BurnablePaymentFilterer.contract.UnpackLog(event, "Committed", thisLog)

				committedUpdate := new(committedUpdate)
				committedUpdate.ttAddr = addr
				committedUpdate.buyerAddr = addr

				committedUpdateChan <- committedUpdate

				err := notifyParties(addr, event)
				if err != nil {
					log.Panic(err)
				}
			}
		}

		lastBlockScanned.Set(&queryEndBlock)

		time.Sleep(time.Minute)
	}
}
