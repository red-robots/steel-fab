<?php
/**
 * The template for displaying all pages.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package bellaworks
 */

$parent_id = get_page_id_by_template('page-projects');
$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner",$parent_id);
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template <?php echo $has_banner ?>">
	<main id="main" class="site-main" role="main">

		<?php while ( have_posts() ) : the_post(); ?>
			<div class="wrapper">
				<div class="titlediv">
					<h1 class="col-title blue text-center"><?php the_title(); ?></h1>
				</div>
			</div>

			<?php  
			$content[] = array('title'=>'Location','content'=>get_field("location_content"));
			$content[] = array('title'=>'Project Information','content'=>get_field("project_information"));
			$content[] = array('title'=>'Architect & Engineer','content'=>get_field("architect_engineer_content"));
			$features = array();
			foreach($content as $k=> $data) {
				if( string_cleaner( strip_tags($data['content']) ) ) {
						$features[] = $data;
				}
			}
			if($features) { ?>
			<div class="project-features-section">
				<div class="wrapper">
					<div class="flexwrap">
						<?php $i=1; foreach ($features as $k=>$v) { 
							$slug = sanitize_title($v['title']);
							$first = ($i==1) ? ' first':'';
							?>
							<div id="feat_<?php echo $slug?>" class="featcol<?php echo $first ?>">
								<div class="wrap">
									<div class="name"><?php echo $v['title'] ?></div>
									<div class="info"><?php echo $v['content'] ?></div>
								</div>
							</div>	
						<?php $i++; } ?>
					</div>
				</div>
			</div>
			<?php } ?>

			<?php
			$project_description = get_field("project_description");
			$photo_type = get_field("photo_type");
      $projphoto = ($photo_type) ? $photo_type : 'single';
      $multiple_photos = get_field("multiple_photos");
      $project_image = get_field("main_photo");
      $has_proj_image = '';
      $is_carousel = '';
      $photo_count = 0;
      if($projphoto) {
        if ( $projphoto=='single' ) {
          $has_proj_image = get_field("main_photo");
          $photo_count = 1;
        } else {
          $has_proj_image = get_field("multiple_photos");
          $is_carousel = ( $multiple_photos && count($multiple_photos)>1 ) ? ' carousel':'';
          if($multiple_photos) {
            $photo_count = count($multiple_photos);
          }
        }
      }
      $project_class = ( $has_proj_image && $project_description ) ? 'twocol':'onecol';
      $pic_count = ($photo_count==1) ? 'one-image':'';
			if( $has_proj_image || $project_description ) { ?>
			<div class="project-description-area <?php echo $project_class ?>">
				<div class="wrapper">
					<div id="image-description" class="flexwrap">
						<?php if ($project_description) { ?>
						<div class="project-info left">
							<div id="textdiv" class="inside"><div class="align-middle"><?php echo email_obfuscator($project_description) ?></div></div>
						</div>	
						<?php } ?>

						<?php if ($has_proj_image) { ?>
						<div class="project-info right <?php echo $pic_count ?>">
							<div id="image-container" class="image<?php echo $is_carousel ?>">
                <?php if ( $projphoto=='single' ) { ?>
                  
                  <?php if ($project_image) { ?>
                    <div class="singlepic">
                      <img src="<?php echo $project_image['url'] ?>" alt="<?php echo $project_image['title'] ?>" class="actual-image" id="feat-image">
                    </div>
                  <?php } ?>

                <?php } else if( $projphoto=='multiple' ) { ?>

                  <?php if ( $multiple_photos ) { $numphotos = count($multiple_photos); ?>

                    <?php if ($numphotos>1) { ?>
                      <div class="swiper-container clear">
                        <div class="swipe-projects swiper-wrapper">
                            <?php $j=1; foreach($multiple_photos as $img) { ?>
                              <div class="slick-slide swipeImg<?php echo ($j==1) ? ' slick-current slick-active slick-center':''?>">
                                <div class="imagediv" style="background-image:url('<?php echo $img['url']; ?>')"></div>
                                <img src="<?php echo $img['url']; ?>" alt="<?php echo $img['title']; ?>" />
                              </div>
                            <?php $j++; } ?>
                        </div>
                      </div>
                    <?php } else { ?>

                      <div class="singlepic">
                        <img src="<?php echo $multiple_photos[0]['url'] ?>" alt="<?php echo $multiple_photos[0]['title'] ?>" class="actual-image" id="feat-image">
                      </div>

                    <?php } ?>

                  <?php } ?>

                <?php } ?>
								
							</div>

              <div id="sliderDots"></div>
						</div>	
						<?php } ?>
					</div>
				</div>
			</div>
			<?php } ?>
		<?php endwhile; ?>

    <div class="project-pagination">
      <div id="pagination" class="wrapper">
        <span class="prev"><?php next_post_link('%link','<i class="arrow"></i>Previous Project'); ?></span>
        <span class="next"><?php previous_post_link('%link','Next Project<i class="arrow"></i>'); ?></span>
      </div>
    </div>

	</main><!-- #main -->
</div><!-- #primary -->
<script type="text/javascript">
jQuery(document).ready(function($){

  /* Slick Carousel */
  if( $('.swipe-projects').length ) {
    $('.swipe-projects').on('init', function(event, slick){
      $(".slick-dots").appendTo("#sliderDots");
    });
    $('.swipe-projects').slick({
      dots: true,
      infinite: true,
      speed: 300,
      slidesToShow: 1,
      arrows: true,
      centerMode: true,
      variableWidth: true
    });
  }


  // adjust_featured_image();
  // $(window).on("resize orientationchange",function(){
  //   adjust_featured_image();
  // });
  // function adjust_featured_image() {
  //   var window_width = $(window).width();
  //   if( window_width>819) {
  //     var blueText = ( $("#textdiv").length ) ?  $("#textdiv").outerHeight() : '';
  //     var imageDIV = ( $("#feat-image").length ) ? $("#feat-image").outerHeight() : '';
  //     if( blueText && imageDIV ) {
  //       var imageURL = $("#feat-image").attr("src");
  //       if( blueText > imageDIV ) {
  //         $("#image-description").addClass("adjust-image");
  //         $("#image-container").css('background-image','url('+imageURL+')');
  //       } else {
  //         $("#image-description").removeClass("adjust-image");
  //       }
  //     }
  //   }
  // }

  resize_portrait_image();
  $(window).on("resize",function(){
    resize_portrait_image();
  });

  function resize_portrait_image() {
    if( $(".singlepic #feat-image").length ) {
      var image_width = $(".singlepic #feat-image").width();
      var image_height = $(".singlepic #feat-image").height();
      var image_src = $(".singlepic #feat-image").attr("src");
      var is_portrait = false;
      if( image_height > image_width ) {
        $(".singlepic").addClass("portrait");
        $(".singlepic").css("background-image","");
        is_portrait = true;
      } else {
        $(".singlepic").addClass("landscape");
        $(".singlepic").css("background-image","url("+image_src+")");
      }
      if(is_portrait) {
        $(".project-info.right").css("width", $(".singlepic #feat-image").width()+"px");
        $(".project-info #textdiv").css("height", $(".singlepic #feat-image").height()+"px");
      }
    }
  }

});
</script>
<?php
// $args = array(
//   'posts_per_page'  => -1,
//   'post_type'       => 'project',
//   'post_status'     => 'publish',
// );
// $entries = get_posts($args);
// $project_ids = array();
// if($entries) {
//   foreach($entries as $e) {
//     $project_ids[] = $e->ID;
//   }
// }
get_footer();
