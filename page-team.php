<?php
/**
 * Template Name: Team
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template <?php echo $has_banner ?>">
	<main id="main" class="site-main wrapper" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<h1 class="page-title" style="display:none"><?php the_title(); ?></h1>

			<?php 
			$left_large_text = get_field("left_large_text");
			$right_small_text = get_field("right_small_text");
			$row1_class = ($left_large_text && $right_small_text) ? 'colnum2':'colnum1';
			?>
			<?php if ($left_large_text || $right_small_text) { ?>
			<div id="row1" class="entry-content intro-two-col">
				<div class="wrapper">
					<div class="flexwrap <?php echo $row1_class ?>">
						<?php if ($left_large_text) { ?>
							<div class="fcol left">
								<div class="inside">
									<h2 class="col-title"><?php echo $left_large_text ?></h2>
								</div>
							</div>
						<?php } ?>

						<?php if ($right_small_text) { ?>
							<div class="fcol right">
								<div class="inside">
									<?php echo $right_small_text ?>
								</div>
							</div>
						<?php } ?>
					</div>
				</div>
			</div>
			<?php } ?>
		<?php endwhile; ?>

		<?php get_template_part('parts/team-list') ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
