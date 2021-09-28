<?php
/**
 * Enqueue scripts and styles.
 */
function bellaworks_scripts() {
	wp_enqueue_style( 'bellaworks-style', get_stylesheet_uri() );

	wp_deregister_script('jquery');
		wp_register_script('jquery', 'https://code.jquery.com/jquery-3.3.1.min.js', false, '3.5.1', false);
		wp_enqueue_script('jquery');

	wp_enqueue_script( 
			'jquery-migrate','https://code.jquery.com/jquery-migrate-1.4.1.min.js', 
			array(), '20200713', 
			false 
		);

	wp_enqueue_script( 
			'bellaworks-blocks', 
			get_template_directory_uri() . '/assets/js/vendor.min.js', 
			array(), '20200713', 
			true 
		);

	wp_enqueue_script( 
			'vimeo-player', 
			'https://player.vimeo.com/api/player.js', 
			array(), '2.12.2', 
			true 
		);

  wp_enqueue_script( 
      'bellaworks-carousel', 
      get_template_directory_uri() . '/assets/js/vendor/fancybox.js', 
      array(), '20200101', 
      true 
    );
  
	wp_enqueue_script( 
			'bellaworks-carousel', 
			get_template_directory_uri() . '/assets/js/vendor/owl.carousel.min.js', 
			array(), '20200101', 
			true 
		);

	wp_enqueue_script( 
			'bellaworks-boostrap', 
			'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js', 
			array(), '20200101', 
			true 
		);

	wp_enqueue_script( 
			'bellaworks-boostrap', 
			get_template_directory_uri() . 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js', 
			array(), '20200713', 
			true 
		);


	wp_enqueue_script( 
			'bellaworks-custom', 
			get_template_directory_uri() . '/assets/js/custom.min.js', 
			array(), '20200713', 
			true 
		);

	wp_localize_script( 'bellaworks-custom', 'frontajax', array(
		'ajaxurl' => admin_url( 'admin-ajax.php' )
	));

	
	wp_enqueue_script( 
		'font-awesome', 
		'https://use.fontawesome.com/8f931eabc1.js', 
		array(), '20180424', 
		true 
	);



	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'bellaworks_scripts' );

function admin_head_custom_css() { ?>
<style type="text/css">
<?php if ( isset($_GET['page']) && $_GET['page']=='wp-google-maps-menu' ) { ?>
@import url('<?php echo get_site_url() ?>/wp-content/plugins/advanced-custom-fields-pro/assets/inc/select2/4/select2.min.css?ver=4.0');
<?php } ?>
.acf-field-flexible-content .layout.has-title .acf-fc-layout-handle {
	position: relative;
	color: transparent;
}
.acf-field-flexible-content .layout.has-title .acf-fc-layout-handle:before{
	content: attr(data-title);
	display: inline-block;
	position: absolute;
	left: 40px;
	font-size: 14px;
	font-weight: bold;
	color: #000;
}
.divisions-select-wrap {
	width: 100%;
	position: relative;
}
.divisions-select-wrap .select2 {
	width: 100%!important;
}
/*.wgmza-map-editor-holder [data-custom-field-id="7"],
.wgmza-map-editor-holder [data-custom-field-id="5"] input {
	display: none!important;
}*/

/*.wgmza-map-editor-holder [data-custom-field-id="7"] { display: none!important; }*/
#divisionListPopUp {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99999;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,.65);
  padding: 15px;
}
#divisionListPopUp.loading {
  background-image: url('<?php echo get_images_dir('loader-white.gif') ?>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: 70px;
}
#divisionsContentOuter {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  top: 5%;
}
#divisionsContent {
  width: 100%;
  height: 70vh;
  overflow: auto;
  background: #FFF;
  border-radius: 10px;
}

#divisionListDiv {
  padding: 20px;
}
#divisionListDiv .bulkactions,
#divisionListDiv .check-column,
#divisionListDiv .column-slug,
#divisionListDiv .column-posts,
#divisionListDiv .row-actions,
#divisionListDiv table.table-view-list thead,
#divisionListDiv table.table-view-list tfoot {
  display: none!important;
}
#divisionListClose {
  display: inline-block;
  width: 20px;
  height: 20px;
  position: absolute;
  top: 10px;
  right: 10px;
  background: #FFF;
  z-index: 10;
  transition: all ease .3s;
}
#divisionListClose:hover {
  opacity: 0.5;
}
#divisionListClose span {
  visibility: hidden;
}
#divisionListClose:before,
#divisionListClose:after {
  content: "";
  display: block;
  width: 100%;
  height: 2px;
  background: #000;
  position: absolute;
  top: 9px;
  left: 0;
}
#divisionListClose:before {
  transform: rotate(45deg);
}
#divisionListClose:after {
  transform: rotate(-45deg);
}
[data-custom-field-id="7"] legend {
  width: 100%!important;
  max-width: 250px!important;
}
[data-custom-field-id="7"] input:not(#divisionLinkInput) {
  display: none;
}
</style>
<script>
  var divisionTaxURL = '<?php echo get_admin_url(); ?>edit-tags.php?taxonomy=divisions&post_type=team';
  let divisionData = '<?php echo get_all_divisions(); ?>';
  if(divisionData) {
    divisionData = JSON.parse(divisionData);
  }
</script>
<?php }
add_action('admin_head', 'admin_head_custom_css');

add_action('admin_footer', 'admin_footer_custom_script');
function admin_footer_custom_script() { ?>
<?php if ( isset($_GET['page']) && $_GET['page']=='wp-google-maps-menu' ) { ?>
<script src='<?php echo get_site_url() ?>/wp-content/plugins/advanced-custom-fields-pro/assets/inc/select2/4/select2.full.min.js?ver=4.0' id='select2-js'></script>
<?php } ?>
<script>
jQuery(document).ready(function($){
  var division_options = '';
  var divisionList = '<div id="divisionListPopUp"><div id="divisionsContentOuter"><a href="#" id="divisionListClose"><span>X</span></a><div id="divisionsContent"><div id="divisionListDiv"><div></div></div></div>';
  $('body').append(divisionList);

  if( $('[data-custom-field-id="7"]').length ) {
    $('[data-custom-field-id="7"] legend').html('Division URL &mdash; <a href="#" id="browseDivisions">Browse Here</a>');
    $('[data-custom-field-id="7"]').insertAfter('[data-custom-field-id="5"]');
    $('[data-custom-field-id="7"]').append('<input type="text" id="divisionLinkInput" value="" readonly>');
  

    $(document).on("click","#browseDivisions",function(e){
      e.preventDefault();
      $("#divisionListPopUp").addClass('loading').show();
      $("#divisionListDiv").load(divisionTaxURL+" #wpbody-content #posts-filter",function(){
        $("body").css("overflow","hidden");
        $("#divisionListPopUp").removeClass('loading');
      });
      $(document).on("click","#divisionListDiv .pagination-links a",function(e){
        e.preventDefault();
        var url = $(this).attr("href");
        $("#divisionListDiv").load(url+" #wpbody-content #posts-filter",function(){
        });
      });

      $(document).on("click","#divisionListDiv .row-title",function(e){
        e.preventDefault();
        var parent = $(this).parents("tr");
        var term_id = parent.attr("id").replace("tag-","");
        var link = parent.find('span.view a').attr("href");
        $('[data-custom-field-id="7"] input').val(term_id);
        $("#divisionLinkInput").val(link);
        $("#divisionListPopUp").hide();
        $("body").css("overflow","");
      });

      $(document).on("click","#divisionListClose",function(e){
        e.preventDefault();
        $("#divisionListPopUp").hide();
        $("body").css("overflow","");
      });

    });

    $(document).ajaxComplete ( function(event, jqxhr, settings){
      var id = $('[data-ajax-name="custom_field_7"]').val();
      if(divisionData) {
        $(divisionData).each(function(k,v){
          if( v.term_id==id ) {
            $("#divisionLinkInput").val(v.term_link);
          }
        });
      }
    });

  }
});
</script>
<?php }



function get_all_divisions() {
	$categories = get_categories( array('taxonomy'=>'divisions') );
  if($categories) {
    foreach($categories as $term) {
      $link = get_term_link($term,'divisions');
      $term->term_link = $link;
    }
  }
	return ($categories) ? @json_encode($categories) : '';
}

