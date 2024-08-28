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
			$apply_form = get_field('apply_form');
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

				<?php 
			      $button = get_field("ctabutton");
			      $ctabuttons = get_field("ctabuttons");
			      if( $ctabuttons ) { ?>

			        <div class="jobinfo-button multiple">
			          <?php foreach ($ctabuttons as $cb) { 
			            $btn = $cb['button'];
			            $buttonTarget = (isset($btn['target']) && $btn['target']) ? $btn['target'] : '_self';
			            $buttonText = (isset($btn['title']) && $btn['title']) ? $btn['title'] : '';
			            $buttonLink = (isset($btn['url']) && $btn['url']) ? $btn['url'] : '';
			            if($buttonText && $buttonLink) { ?>
			              <a href="<?php echo $buttonLink ?>" target="<?php echo $buttonTarget ?>" class="btn-default wide"><?php echo $buttonText ?></a>
			            <?php } ?>
			          <?php } ?>
			        </div>

			      <?php } else {

			        if ( $button ) { 
			          $buttonTarget = (isset($button['target']) && $button['target']) ? $button['target'] : '_self';
			          $buttonText = (isset($button['title']) && $button['title']) ? $button['title'] : '';
			          $buttonLink = (isset($button['url']) && $button['url']) ? $button['url'] : '';
			          if($buttonText && $buttonLink) { ?>
			          <div class="jobinfo-button">
			            <a href="<?php echo $buttonLink ?>" target="<?php echo $buttonTarget ?>" class="btn-default wide"><?php echo $buttonText ?></a>
			          </div>
			          <?php } ?>
			        <?php } ?>

			      <?php } ?>
				
			<?php } ?>
			<div class="entry-content">
				<?php the_content(); ?>
			</div>

			<?php if( $apply_form ) { ?>
				<div id="apply" class="entry-content bump-down">
					<?php echo $apply_form; ?>
				</div>
			<?php } ?>

      
		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
