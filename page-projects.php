<?php
/**
 * Template Name: Projects
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template project-page <?php echo $has_banner ?>">
	<main id="main" class="site-main wrapper" role="main">

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

		<?php endwhile; ?>


		<?php get_template_part('parts/projects-list') ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
