<?php
/**
 * Template Name: Services
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");;
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-services-template <?php echo $has_banner ?>">
	<main id="main" class="site-main wrapper" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<?php if ( !$banner ) { ?>
				<h1 class="page-title"><?php the_title(); ?></h1>
			<?php } ?>
			<div id="row1" class="entry-content">
				<div class="flexwrap">
					<div class="fcol left">
						<div class="inside">
							<h2 class="col-title">Our team is by your side from budget estimates through to the very end of contstruction.</h2>
						</div>
					</div>
					<div class="fcol right">
						<div class="inside">
							<p>As one of the nation's largest AISC (American Institute of Steel Construction) structural steel fabricators, SteelFab has the resources and expertise to handle a wide range of challenging projects, regardless of size.</p>
							<p>All of our processes have been designed and fine-tuned over the years to ensure your projects are carried off without a hitch.</p>
						</div>
					</div>
				</div>
				
			</div>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
