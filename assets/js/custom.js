/**
 *	Custom jQuery Scripts
 *	
 *	Developed by: Lisa DeBona
 */

jQuery(document).ready(function ($) {

  $(window).scroll(function(){
    var screenHeight = $(window).height();
    var contentHeight = $("#page").height();
    if(contentHeight>screenHeight) {
      if ($(this).scrollTop() > 50) {
        $('body').addClass('scrolled');
      } else {
        $('body').removeClass('scrolled');
      }
    }
  });

  $("#menu-toggle").click(function(e){
    e.preventDefault();
    $("body").toggleClass('open-menu');
    $(this).toggleClass("open");
    $("#site-navigation").toggleClass("show");
  });

  $(document).on('click','.nav-overlay', function(e) {
    $("#menu-toggle").removeClass("open");
    $("body").removeClass('open-menu');
    $("#site-navigation").removeClass("show");
  });

}); 