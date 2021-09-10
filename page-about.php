<?php
/**
 * Template Name: Why Steel Fab
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
$timeline_data = get_field("timeline_data"); ?>
<style type="text/css">
<?php
$n=1; foreach ($timeline_data as $k=>$d) { 
$move = ( isset($d['moveup']) && $d['moveup'] ) ? $d['moveup'] : '';
if ($move) { ?>
  @media screen and (min-width:820px) { #history-info-<?php echo $n ?>{transform: translateY(<?php echo $move ?>%)!important; } }
<?php }
$n++; } ?>
</style> 
<?php get_header(); ?>

<div id="primary" class="content-area-full content-default page-values-template <?php echo $has_banner ?>">
	<main id="main" class="site-main" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<?php if ( !$banner ) { ?>
				<h1 class="page-title"><?php the_title(); ?></h1>
			<?php } ?>

			<!-- ROW 1 -->
			<?php  
			$row1_column_left = get_field("left_large_text");
			$row1_column_right = get_field("right_small_text");
			$row1_col_class = ($row1_column_left && $row1_column_right) ? 'colnum2':'colnum1';
			if( $row1_column_left || $row1_column_right ) { ?>
			<div id="row1" class="entry-content intro-two-col">
				<div class="wrapper">
					<div class="flexwrap <?php echo $row1_col_class ?>">
						<?php if ($row1_column_left) { ?>
							<div class="fcol left">
								<div class="inside">
									<h2 class="col-title"><?php echo $row1_column_left ?></h2>
								</div>
							</div>
						<?php } ?>
						
						<?php if ($row1_column_right) { ?>
						<div class="fcol right">
							<div class="inside">
								<?php echo email_obfuscator($row1_column_right) ?>
							</div>
						</div>
						<?php } ?>
					</div>
				</div>
			</div>
			<?php } ?>

			<!-- ROW 2 -->
			<?php  
			$yellow_bg_area = get_field("yellow_bg_area");
			if($yellow_bg_area) { ?>
			<div id="yellow-bar" class="yellow-bar normal-text">
				<div class="wrapper sm text-center">
					<?php echo $yellow_bg_area ?>
				</div>
			</div>
			<?php } ?>


			<!-- TIMELINE -->
			<?php  
			$year_now = date('Y');
			$year_prev = $year_now - 1;
			$timeline_title = get_field("timeline_title");
			$timeline_img_bg = get_field("timeline_img_bg");
			$timeline_bg = ($timeline_img_bg) ? ' style="background-image:url('.$timeline_img_bg['url'].')"':'';
			if($timeline_title || $timeline_data) { ?>
			<div id="timeline-area" class="timeline-wrapper">
				<?php if ($timeline_title) { ?>
				<div class="timeline-large-title">
					<div class="wrapper">
						<h2 class="col-title"><?php echo $timeline_title ?></h2>
					</div>
					<?php if ($timeline_img_bg) { ?>
					<div class="imagebg"<?php echo $timeline_bg ?>></div>
					<?php } ?>
				</div>
				<?php } ?>

				<?php if ($timeline_data) { ?>
				<div class="timeline">
					<div class="wrapper">
						<div class="timeline-inner">
							<?php  
							$count_timeline = count($timeline_data);
							$n=1; foreach ($timeline_data as $k=>$d) { 
								$year = $d['year']; 
								$description = $d['description']; 
								$image = $d['image']; 
								$selected = ($n==1) ? ' selected':'';
								$interval = $year_prev + $k;
								$has_text_image = ($description && $image) ? 'half':'full';
								$class = ($n==1) ? ' first':'';
                $class .= ($image) ? ' hasimage':' noimage';
								$class .= ($n==$count_timeline) ? ' last':'';
                $class .= ($n % 2) ? ' odd':' even';
							  ?>
								<div id="history-info-<?php echo $n ?>" class="history<?php echo $class ?>">
									<div class="h-title"><?php echo $year ?></div>
									<?php if ($description || $image) { ?>
									<div class="h-text <?php echo $has_text_image ?>">
										<?php if ($description) { ?>
											<div class="text"><?php echo $description ?></div>
										<?php } ?>
										<?php if ($image) { ?>
										<div class="photo">
											<a data-fancybox href="<?php echo $image['url'] ?>"  class="pic" style="background-image:url('<?php echo $image['url'] ?>')">
												<img src="<?php echo $image['url'] ?>" alt="<?php echo $image['title'] ?>" class="actual-image">
												<img src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true" class="helper">
											</a>
										</div>
										<?php } ?>
									</div>
									<?php } ?>
								</div>
							<?php $n++; } ?>
							<div class="middle-line"></div>
						</div>
					</div>
				</div>
				<?php } ?>
			</div>
			<?php } ?>


			<!-- BLUE SECTION with Left and Right Arrow -->
			<?php get_template_part('parts/blue-section') ?>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<!-- <script src="<?php //echo get_bloginfo('template_url') ?>/assets/js/vendors/horizontal_timeline.2.0.min.js"></script> -->
<script type="text/javascript">
jQuery(document).ready(function($){


  // adjust_timeline_height();
  // $("window").on("resize orientationchange",function(){
  //   adjust_timeline_height();
  // });

  // function adjust_timeline_height() {
  //   $(".timeline .history").each(function(){
  //     var target = $(this);
  //     var title_height = ( $(this).find('.h-title').length ) ? $(this).find('.h-title').height() : 0;
  //     var text_height = ( $(this).find('.h-text').length ) ? $(this).find('.h-text').height() : 0;
  //     var image_height = ( $(this).find('.photo').length ) ? $(this).find('.photo').height() : 0;
  //     var total = (title_height + text_height + image_height);
  //     if(text_height) {
  //       total = total - text_height;
  //     }
  //     if(image_height) {
  //       total = total + 50;
  //       target.css("height",total+"px");
  //     }
  //   });
  // }

});
</script>
<?php
get_footer();
