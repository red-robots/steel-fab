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
			get_template_directory_uri() . '/assets/js/vendors.min.js', 
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
			get_template_directory_uri() . '/assets/js/vendors/owl.carousel.min.js', 
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
			get_template_directory_uri() . '/assets/js/custom.js', 
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
.wgmza-map-editor-holder [data-custom-field-id="7"] { display: none!important; }
</style>
<?php }
add_action('admin_head', 'admin_head_custom_css');

add_action('admin_footer', 'admin_footer_custom_script');
function admin_footer_custom_script() { ?>
<?php if ( isset($_GET['page']) && $_GET['page']=='wp-google-maps-menu' ) { ?>
<script src='<?php echo get_site_url() ?>/wp-content/plugins/advanced-custom-fields-pro/assets/inc/select2/4/select2.full.min.js?ver=4.0' id='select2-js'></script>
<?php } ?>
<script>
jQuery(document).ready(function($){
	if( $('.acf-field-flexible-content .layout [data-name="title"]').length ) {
		$('.acf-field-flexible-content .layout [data-name="title"]').each(function(){
			var title = $(this).find('.acf-input-wrap input').val();
			var parent = $(this).parents('.layout');
			parent.addClass("has-title");
			parent.find('.acf-fc-layout-handle').attr("data-title",title);
		});
	}

	if( $('[data-custom-field-id="5"]').length ) {
		var divisions = '<?php echo get_all_divisions(); ?>';
		if(divisions) {
			divisions = $.parseJSON(divisions);
			var selectedVal = $('[data-custom-field-id="7"] input').val();
			var select = '<div class="divisions-select-wrap" style="margin-top:13px"><legend>Division URL</legend><select id="divisions_options" class="select-division selectjs select2">';
					select += '<option></option>';
					$(divisions).each(function(k,v){
						var selected = (selectedVal && selectedVal==v.term_id) ? ' selected':''; 
						select += '<option value="'+v.term_id+'"'+selected+'>'+v.name+'</option>';
					});
					select += '</select></div>';
			$('[data-custom-field-id="5"]').append(select);
			$("#divisions_options").select2({
			    placeholder: "Select a Division",
			    allowClear: true
			});
			
			$(document).on("change","#divisions_options",function(){
				var opt = $(this).val();
				var label = $(this).find('option:selected').text();
				//$('[data-custom-field-id="5"]').find('input').val(label);
				$('[data-custom-field-id="7"] input').val(opt);
			});

			$(document).ajaxComplete ( function(event, jqxhr, settings){
				var id = $('[data-custom-field-id="7"] input').val();
				$('#divisions_options').val(id).trigger('change');
				$("#divisions_options").select2({
				  placeholder: "Select a Division",
				  allowClear: true
				});
			});
		}
	}
});
</script>
<?php }


function get_all_divisions() {
	$categories = get_categories( array('taxonomy'=>'divisions') );
	return ($categories) ? @json_encode($categories) : '';
}

