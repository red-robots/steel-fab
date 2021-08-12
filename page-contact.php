<?php
/**
 * Template Name: Contact
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full contact-page content-default page-default-template generic-layout <?php echo $has_banner ?>">
	<main id="main" class="site-main" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<?php if ( !$banner ) { ?>
			<div class="titlediv wrapper">
				<h1 class="page-title"><?php the_title(); ?></h1>
			</div>
				
			<?php } ?>
			
			<!-- ROW 1 -->
			<?php  
			$row1_column_left = get_field("left_large_text");
			$row1_column_right = get_field("right_small_text");
			$row1_col_class = ($row1_column_left && $row1_column_right) ? 'colnum2':'colnum1';
			if( $row1_column_left || $row1_column_right ) { ?>
			<div id="row1" class="entry-content intro-two-col text-center">
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
				$column1_small_text = get_field("column1_small_text");
				$column1_large_text = get_field("column1_large_text");
				$column1_button = get_field("column1_button");
				$column1_image = get_field("column1_image");
				$column2_content = get_field("column2_content");
				$has_column1_content = ( $column1_small_text||$column1_large_text||$column1_image ) ? true : false;
				$has_column2_content = ( $column2_content ) ? true : false;
				$column_class = ($has_column1_content && $has_column2_content) ? 'twocol':'onecol';
			?>

			<?php if ($has_column1_content || $has_column2_content) { ?>
			<div id="row2" class="row2-contact">
				<div class="wrapper">
					<div class="flexwrap <?php echo $column_class ?>">
							<?php if ($has_column1_content) { ?>
							<div class="fcol left">
								<div class="wrap">
									<?php if ( $column1_small_text ) { ?>
									<div class="small-txt"><?php echo $column1_small_text ?></div>	
									<?php } ?>
									<?php if ( $column1_large_text ) { ?>
									<div class="large-txt"><?php echo $column1_large_text ?></div>	
									<?php } ?>

									<?php if ( $column1_image ) { ?>
									<div class="location-image">
										<?php if ($column1_button) { 
											$target = ( isset($column1_button['target']) && $column1_button['target'] ) ? $column1_button['target'] : '_self';
											$button_text = ( isset($column1_button['title']) && $column1_button['title'] ) ? $column1_button['title'] : '';
											$button_link = ( isset($column1_button['url']) && $column1_button['url'] ) ? $column1_button['url'] : '';
											?>
											<?php if ($button_text && $button_link) { ?>
											<div class="buttondiv">
												<div><a href="<?php echo $button_link ?>" class="btn-outline"><?php echo $button_text ?></a></div>	
											</div>
											<?php } ?>
										<?php } ?>
										<img src="<?php echo get_images_dir('rectangle-lg.png') ?>" alt="" aria-hidden="true" class="helper">
										<div class="bgimg" style="background-image:url('<?php echo $column1_image['url'] ?>')"></div>
										<div class="bgcolor"></div>
									</div>	
									<?php } ?>
								</div>
							</div>
							<?php } ?>

							<?php if ($has_column2_content) { ?>
							<div class="fcol right contact-form">
								<div class="wrap"><?php echo $column2_content ?></div>
							</div>
							<?php } ?>
					</div>
				</div>
			</div>	
			<?php } ?>


		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
