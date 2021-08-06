<?php
/**
 * Template Name: Sitemap
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template <?php echo $has_banner ?>">
	<main id="main" class="site-main wrapper" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<?php if ( !$banner ) { ?>
				<h1 class="page-title"><?php the_title(); ?></h1>
			<?php } ?>
			<div class="entry-content">
				<?php the_content(); ?>

				<div id="sitemap-wrap">
					<?php wp_nav_menu( array( 'theme_location' => 'sitemap', 'menu_id' => 'sitemap','container_class'=>'sitemap-links') ); ?>
				</div>
				
			</div>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
