<?php
/**
 * The template for displaying all pages.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package bellaworks
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template <?php echo $has_banner ?>">
	<main id="main" class="site-main wrapper narrow" role="main">

		<div class="backtoparent">
			<a href="<?php echo get_site_url() ?>/careers/#lists"><i class="fas fa-chevron-left"></i> Back to Careers</a>
		</div>

		<?php while ( have_posts() ) : the_post(); ?>

			<?php  
			$id = get_the_ID();
			$locations = '';
			$division = get_the_terms($id,'divisions');
			if($division) {
				foreach($division as $k=>$d) {
					$comma = ($k>0) ? ', ':'';
					$locations .= $comma . $d->name;
				}
			}
			?>
			<?php if ( !$banner ) { ?>
				<div class="titlediv">
					<h1 class="page-title"><?php the_title(); ?></h1>
					<?php if ($locations) { ?>
					<div class="locations"><?php echo $locations ?></div>	
					<?php } ?>
				</div>
				
			<?php } ?>
			<div class="entry-content">
				<?php the_content(); ?>
			</div>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
