<?php
/**
 * The template for displaying 404 pages (not found).
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package bellaworks
 */

$title = get_field("title404","option");
$content = get_field("content404","option");
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template page404">
  <main id="main" class="site-main wrapper" role="main">

    <?php if ($title || $content) { ?>

      <?php if ($title) { ?>
        <h1 class="page-title"><?php echo $title ?></h1>
      <?php } ?>

      <?php if ($content) { ?>
      <div class="content404"><?php echo email_obfuscator($content) ?></div>
      <?php } ?>


    <?php } else { ?>

      <h1 class="page-title"><?php esc_html_e( 'Oops! That page can&rsquo;t be found.', 'bellaworks' ); ?></h1>
      <div class="content404">
        <p><?php esc_html_e( 'It looks like nothing was found at this location. Maybe try one of the links below.', 'bellaworks' ); ?></p>
      </div>

    <?php } ?>


      <?php if ( has_nav_menu('sitemap') ) { ?>
      <div id="sitemap-wrap">
        <?php wp_nav_menu( array( 'theme_location' => 'sitemap', 'menu_id' => 'sitemap-links','container_class'=>'sitemap-links') ); ?>
      </div>
    <?php } ?>

  </main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();