(function() {
  $(window).unload(function() {
    $('#scroll-mem').val($(window).scrollTop());
    console.log('New scroll value is:' + $('#scroll-mem').val());
  });
  var pos = parseInt($('#scroll-mem').val());
  if (pos) {
    $(window).scrollTop(pos);
  }
})();
