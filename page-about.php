<?php
/**
 * Template Name: Why Steel Fab
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

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
								<?php echo $row1_column_right ?>
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
			$timeline_data = get_field("timeline_data");
			$timeline_img_bg = get_field("timeline_img_bg");
			$timeline_bg = ($timeline_img_bg) ? ' style="background-image:url('.$timeline_img_bg['url'].')"':'';
			if($timeline_title || $timeline_data) { ?>
			<div id="timeline-area">
				<?php if ($timeline_img_bg) { ?>
				<div class="imagebg"<?php echo $timeline_bg ?>></div>
				<?php } ?>
				<div class="wrapper">
					<?php if ($timeline_title) { ?>
						<h2 class="col-title"><?php echo $timeline_title ?></h2>
					<?php } ?>

					<?php if ($timeline_data) { ?>
						<div class="timeline-content">
							<div class="horizontal-timeline" id="steelFab-timeline">
								<div class="events-content">
									<ol class="events-info">
									<?php $n=1; foreach ($timeline_data as $k=>$d) {
										$year = $d['year']; 
										$description = $d['description']; 
										$image = $d['image']; 
										$selected = ($n==1) ? ' selected':'';
										$interval = $year_prev + $k;
										?>
										<li class="history-data<?php echo $selected ?>" data-horizontal-timeline='{"date": "01/01/<?php echo $interval ?>", "customDisplay": "<?php echo $year ?>"}'>
											<?php if ($description || $image) { ?>
											<div class="info">
												<?php if ($description) { ?>
												<div class="text"><?php echo $description ?></div>
												<?php } ?>
												<?php if ($image) { ?>
												<div class="photo">
													<img src="<?php echo $image['url'] ?>" alt="<?php echo $image['title'] ?>">
												</div>
												<?php } ?>
											</div>
											<?php } ?>
										</li>
									<?php $n++; } ?>
									</ol>
								</div>
							</div>
						</div>
					<?php } ?>
				</div>
			</div>
			<?php } ?>


			<!-- BLUE SECTION with Left and Right Arrow -->
			<?php get_template_part('parts/blue-section') ?>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<script src="<?php echo get_bloginfo('template_url') ?>/assets/js/vendors/horizontal_timeline.2.0.min.js"></script>
<script type="text/javascript">
jQuery(document).ready(function($){

	if( $("#steelFab-timeline").length ) {
		$('#steelFab-timeline').horizontalTimeline({
			useScrollWheel: false,
			useTouchSwipe: true,
			useKeyboardKeys: false,
			addRequiredFile: true,
			useFontAwesomeIcons: false,
			useNavBtns: true,
			useScrollBtns: true,
			dateDisplay: "year",
			autoplay: false,
		});
		$(".timeline .events a").each(function(){
			var txt = $(this).text();
			$(this).attr('data-label',txt);
		});
	}

});
</script>
<?php
get_footer();
