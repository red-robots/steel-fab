<?php
/**
 * Template Name: Careers
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-careers-template <?php echo $has_banner ?>">
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
			$row2_title = get_field("row2_title");
			$row2_texts_icons = get_field("row2_text_icon");
			if( $row2_title || $row2_texts_icons ) { ?>
			<div id="row2" class="entry-content columns-with-icons">
				<div class="wrapper text-center">
					<?php if ($row2_title) { ?>
					<h2 class="col-title"><?php echo $row2_title ?></h2>	
					<?php } ?>

					<?php if ($row2_texts_icons) { ?>
					<div class="column-icons">
						<div class="flexwrap">
							<?php foreach ($row2_texts_icons as $e) { 
								$icon = $e['icon'];
								$title = $e['title'];
								$description = $e['description'];
								if($title || $description) { ?>
								<div class="fxcol">
									<div class="inner">
									<?php if ($icon) { ?>
										<div class="icon"><img src="<?php echo $icon['url'] ?>" alt="<?php echo $icon['title'] ?>" aria-hidden="true"></div>
									<?php } ?>
									<?php if ($title) { ?>
										<h3 class="title"><?php echo $title ?></h3>
									<?php } ?>

									<?php if ($description) { ?>
										<div class="description"><?php echo $description ?></div>
									<?php } ?>
									</div>
								</div>
								<?php } ?>
							<?php } ?>
						</div>
					</div>
					<?php } ?>
				</div>
			</div>
			<?php } ?>


			<!-- ROW 3 -->
			<?php  
			$row3_text = get_field("row3_text");
			$row3_img_bg = get_field("row3_img_bg");
			
      /* Button 1 */
      $row3_button = get_field("row3_button");
			$button_type = (isset($row3_button['link_type']) && $row3_button['link_type']) ? $row3_button['link_type'] : 'link';
			$buttonName = '';
			$buttonLink = '';
			$buttonTarget = '_self';
			if($button_type=='file') {
				$buttonName = $row3_button['btn_file_name'];
				$buttonLink = ( isset($row3_button['btn_file_link']) && $row3_button['btn_file_link']) ? $row3_button['btn_file_link'] : '';
				$buttonTarget = '_blank';
			} else {
				$buttonName = ( isset($row3_button['btn_link']['title']) && $row3_button['btn_link']['title'] ) ? $row3_button['btn_link']['title'] : '';
				$buttonLink = ( isset($row3_button['btn_link']['url']) && $row3_button['btn_link']['url'] ) ? $row3_button['btn_link']['url'] : '';
				$buttonTarget = ( isset($row3_button['btn_link']['target']) && $row3_button['btn_link']['target'] ) ? $row3_button['btn_link']['target'] : '';
			}

      /* Button 2 */
      $row3_button2 = get_field("row3_button2");
      $button_type2 = (isset($row3_button2['link_type']) && $row3_button2['link_type']) ? $row3_button2['link_type'] : 'link';
      $buttonName2 = '';
      $buttonLink2 = '';
      $buttonTarget2 = '_self';
      if($button_type2=='file') {
        $buttonName2 = $row3_button2['btn_file_name'];
        $buttonLink2 = ( isset($row3_button2['btn_file_link']) && $row3_button2['btn_file_link']) ? $row3_button2['btn_file_link'] : '';
        $buttonTarget2 = '_blank';
      } else {
        $buttonName2 = ( isset($row3_button2['btn_link']['title']) && $row3_button2['btn_link']['title'] ) ? $row3_button2['btn_link']['title'] : '';
        $buttonLink2 = ( isset($row3_button2['btn_link']['url']) && $row3_button2['btn_link']['url'] ) ? $row3_button2['btn_link']['url'] : '';
        $buttonTarget2 = ( isset($row3_button2['btn_link']['target']) && $row3_button2['btn_link']['target'] ) ? $row3_button2['btn_link']['target'] : '';
      }
			

			if( $row3_text ) { ?>
			<div id="row3" class="entry-content text-left-image-right">
				<?php if ($row3_img_bg) { ?>
				<div class="bg" style="background-image:url('<?php echo $row3_img_bg['url'] ?>')">
          <img src="<?php echo $row3_img_bg['url'] ?>" alt="<?php echo $row3_img_bg['title'] ?>">  
        </div>	
				<?php } ?>

				<div class="textcol careers-items">
					<div class="text">
						<?php echo $row3_text ?>

            <?php if ( ($buttonName && $buttonLink) || ($buttonName2 && $buttonLink2) ) { ?>
            <div class="button multiple-buttons">
  						<?php if ($buttonName && $buttonLink) { ?>
  						<a href="<?php echo $buttonLink ?>" target="<?php echo $buttonTarget ?>" class="btn-outline sm"><?php echo $buttonName ?></a>
  						<?php } ?>

              <?php if ($buttonName2 && $buttonLink2) { ?>
              <a href="<?php echo $buttonLink2 ?>" target="<?php echo $buttonTarget2 ?>" class="btn-outline sm"><?php echo $buttonName2 ?></a>
              <?php } ?>
            </div>
            <?php } ?>

					</div>
				</div>
			</div>
			<?php } ?>

			<!-- ROW 4 -->
			<?php  
			$has_job_list = has_job_list();
			$has_job = ($has_job_list) ? ' has-job-list':'';
			$row4_title = get_field("row4_title");
			$row4_text = get_field("row4_text");
			$row4_img_bg = get_field("row4_img_bg");
			if( $row4_title || $row4_text ) { ?>
			<div id="row4" class="entry-content text-blue-bg<?php echo $has_job ?>">
				<div class="wrapper sm text-center">
					<div class="textwrap">
						<?php if ($row4_title) { ?>
						<h2 class="col-title"><?php echo $row4_title ?></h2>
						<?php } ?>

						<?php if ($row4_text) { ?>
						<div class="col-text"><?php echo $row4_text ?></div>
						<?php } ?>
					</div>
				</div>
				<?php if ($row4_img_bg) { ?>
				<div class="bg-img" style="background-image:url('<?php echo $row4_img_bg['url'] ?>')"></div>
				<?php } ?>

				<?php if ($has_job_list) { ?>
				<div class="bottom-arrow"></div>					
				<?php } ?>

        <div id="jobs-anchor" style="width:100%;float:left;"></div>
			</div>
			<?php } ?>


		<?php endwhile; ?>

		<?php if (has_job_list()) { ?>
		<div id="lists"></div>
		<?php } ?>
		
		<!-- JOB LISTING -->
		<?php get_template_part('parts/job-list') ?>


		<!-- BLUE SECTION with Left and Right Arrow -->
		<?php get_template_part('parts/blue-section') ?>

	</main><!-- #main -->
</div><!-- #primary -->
<script type="text/javascript">
jQuery(document).ready(function($){
  if( $("#jobs .job").length ) {
    var jobs_target = ( $("#jobs-anchor").length ) ? '#jobs-anchor' : '#jobs';
    var hero_button = '<div class="hero-button"><a href="'+jobs_target+'" target="_self" class="btn-outline sm">See Available Positions</a></div>';
    if( $(".subpage-banner").length ) {
      $(".subpage-banner .inner").append(hero_button);
    }
  }
});
</script>
<?php
get_footer();
