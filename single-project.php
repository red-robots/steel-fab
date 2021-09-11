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
			$project_image = get_field("main_photo");
			$project_class = ( $project_image && $project_description ) ? 'twocol':'onecol';
			if( $project_image || $project_description ) { ?>
			<div class="project-description-area <?php echo $project_class ?>">
				<div class="wrapper">
					<div id="image-description" class="flexwrap">
						<?php if ($project_description) { ?>
						<div class="project-info left">
							<div id="textdiv" class="inside"><div class="align-middle"><?php echo email_obfuscator($project_description) ?></div></div>
						</div>	
						<?php } ?>

						<?php if ($project_image) { ?>
						<div class="project-info right">
							<div id="image-container" class="image">
								<img src="<?php echo $project_image['url'] ?>" alt="<?php echo $project_image['title'] ?>" aria-hidden="true" class="helper" id="feat-image">
							</div>
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

  adjust_featured_image();
  $(window).on("resize orientationchange",function(){
    adjust_featured_image();
  });
  function adjust_featured_image() {
    var window_width = $(window).width();
    if( window_width>819) {
      var blueText = ( $("#textdiv").length ) ?  $("#textdiv").outerHeight() : '';
      var imageDIV = ( $("#feat-image").length ) ? $("#feat-image").outerHeight() : '';
      if( blueText && imageDIV ) {
        var imageURL = $("#feat-image").attr("src");
        if( blueText > imageDIV ) {
          $("#image-description").addClass("adjust-image");
          $("#image-container").css('background-image','url('+imageURL+')');
        } else {
          $("#image-description").removeClass("adjust-image");
        }
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
