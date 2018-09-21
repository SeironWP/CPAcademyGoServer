window.addEventListener('load', function() {

  prepareWeb3();

  window.createVueapp = new Vue({
    delimiters: ['${', '}'],
    el: '#createVueapp',
    data: {
      selling: 0,
      depositTime: 10,
      banks: '',
      other: '',
    },
    computed: {
      total: function () {
        return this.selling + this.summonFee + this.notifyFee
      },
      summonFee: function () {
        return this.selling*0.01
      },
      notifyFee: function () {
        return this.selling*0.005
      },
      details: function(){
        return "Banks: " + this.banks + ", Other: " + this.other;
      }
    }
  });

  //if (web3.eth.accounts.length == 0 || window.accountInfoPanelVueapp.email == 'loading...') {
  if (web3.eth.accounts.length == 0) {
    $("#onlyLoggedIn").show();
    $("#createSellOfferForm").hide();
  }

});

function handleNewTTResult(err, res) {
  if (err) alert(err.message);
  else {

  }
}

function callNewTT(valueInEth, sellerAddress, depositTimeInDays, details){
  var valueInWei = web3.toWei(valueInEth, 'ether');
  var deposoiteTimeInSeconds = depositTimeInDays*24*60*60;

  TTFactory.contractInstance.newToastytrade(sellerAddress, deposoiteTimeInSeconds, details,
    {'value': valueInWei,'gas': 1500000}, handleNewTTResult);
}

function newTTFromForm() {


  var sellerAddress = window.accountInfoPanelVueapp.ethereumAddress;

  var valueInEth = window.createVueapp.total;
  if (valueInEth == '') {
    alert("Must specify sell amount!");
    return;
  }
  valueInEth = Number(valueInEth);

  var depositTimeInDays = window.createVueapp.depositTime;
  if (depositTimeInDays == '') {
    alert("Must specify a default timeout length!");
    return;
  }
  depositTimeInDays = Number(depositTimeInDays);

  callNewTT(valueInEth, sellerAddress, depositTimeInDays, window.createVueapp.details);
}
