/**
 *	Custom jQuery Scripts
 *	
 *	Developed by: Lisa DeBona
 */

jQuery(document).ready(function ($) {

  var screenHeight = $(window).height();
  var contentHeight = $("#page").height();

  // if(contentHeight>screenHeight) {
  //   if ($(this).scrollTop() > 50) {
  //     $('body').addClass('scrolled');
  //   } else {
  //     $('body').removeClass('scrolled');
  //   }
  // }

  if ($(window).scrollTop() > 100) {
    $('body').addClass('scrolled');
  } else {
    $('body').removeClass('scrolled');
  }

  $(window).scroll(function(){
    var screenHeight = $(window).height();
    var contentHeight = $('#page').height();
    // if(contentHeight>=screenHeight) {
    //   if ($(this).scrollTop() > 50) {
    //     $('body').addClass('scrolled');
    //   } else {
    //     $('body').removeClass('scrolled');
    //   }
    // } else {
    //   $('body').removeClass('scrolled');
    // }
    if ($(this).scrollTop() > 100) {
      $('body').addClass('scrolled');
    } else {
      $('body').removeClass('scrolled');
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


  /* Smooth Scrolling to Anchor */
  // Select all links with hashes
  $('a[href*="#"]')
  // Remove links that don't actually link to anything
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {
    // On-page links
    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') 
      && 
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000, function() {
          // Callback after animation
          // Must change focus!
          var $target = $(target);
          $target.focus();
          if ($target.is(":focus")) { // Checking if the target was focused
            return false;
          } else {
            $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
            $target.focus(); // Set focus again
          };
        });
      }
    }
  });

  if(window.location.hash) {
    var hash = window.location.hash.substring(1); 
    if( $("#"+hash).length ) {
      var target = $("#"+hash);
      var navHeight = $(".site-header").height();
      var offset = navHeight + 100;
      $('html, body').animate({
        scrollTop: target.offset().top - offset
      }, 1000, function() {
        target.focus();
        if (target.is(":focus")) { 
          return false;
        } else {
          target.attr('tabindex','-1'); 
          target.focus(); 
        };
      });
    }
  }

  $(document).on("click","#page-more-btn",function(e){
    e.preventDefault();
    var pgnum = $(this).attr("data-next");
    var totalpage = $(this).attr("data-pagetotal");
    var baseurl = $(this).attr("data-baseurl");
    var newURL = baseurl + '?pg=' + pgnum;
    var next = parseInt(pgnum) + 1;
    $(this).attr("data-next",next);
    if(next>totalpage) {
      $('.button-more').hide();
    }
    $(".hidden-items").load(newURL + " .result",function(){
      var items = $(".hidden-items .result").html();
      if(items) {
        $("#list-container .result").append(items);
      }
    });
  });

  $('[data-fancybox]').fancybox({
    protect: true
  });

}); 