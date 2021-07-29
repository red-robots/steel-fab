<?php
/**
 * Single post for Team
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template single-team <?php echo $has_banner ?>">
	<main id="main" class="site-main wrapper" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<?php
				$id = get_the_ID();
				$division = get_the_terms($id,'divisions'); 
				$division_name = ($division) ? $division[0]->name : '';
				$photo = get_field('photo'); 
				$jobtitle = get_field('jobtitle'); 
				$phone = get_field("phone");
				$col_class = ($photo) ? 'hasphoto':'nophoto';
			?>

			<div class="backtoparent">
				<a href="<?php echo get_site_url() ?>/team/"><i class="fas fa-chevron-left"></i> Back to Team</a>
			</div>

			<div class="entry-content <?php echo $col_class ?>">
				<div class="inner">

					<div class="bio">
						<div class="titlediv">
							<?php if ( !$banner ) { ?>
								<h1 class="page-title title-primary"><?php the_title(); ?></h1>
							<?php } ?>
							<?php if ( $jobtitle ) { ?>
								<p class="jobtitle"><?php echo $jobtitle ?></p>
							<?php } ?>
							<?php if ( $division_name ) { ?>
								<p class="division sm"><?php echo $division_name ?></p>
							<?php } ?>
							<?php if ( $phone ) { ?>
								<p class="phone sm"><a href="tel:<?php echo format_phone_number($phone); ?>"><?php echo $phone ?></a></p>
							<?php } ?>
						</div>

						<?php the_content(); ?>
					</div>

					<?php if ($photo) { ?>
					<div class="photo">
						<img src="<?php echo $photo['url'] ?>" alt="<?php echo $photo['title'] ?>" />
					</div>
					<?php } ?>

					
				</div>
			</div>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
