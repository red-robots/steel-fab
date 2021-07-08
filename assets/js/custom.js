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

}); 