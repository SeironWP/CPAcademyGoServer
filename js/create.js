window.addEventListener('load', function() {

  var createVueapp = new Vue({
    delimiters: ['${', '}'],
    el: '#createVueapp',
    data: {
      selling: 0,
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
    }
  });

});
