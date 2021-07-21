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
</style>
<?php }
add_action('admin_head', 'admin_head_custom_css');

function admin_footer_custom_script() { ?>
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
});
</script>
<?php }
add_action('admin_footer', 'admin_footer_custom_script');

