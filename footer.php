	</div><!-- #content -->
	
	<?php  
	$footer_logo = get_field("footer_logo","option");
	$footer_links = get_field("footer_links","option");
  $footer_other_logos = get_field("footer_other_logos","option");
  $other_logos = array();
  if($footer_other_logos) {
    foreach($footer_other_logos as $e) {
      if($e['logo']) {
        $other_logos[] = $e;
      }
    }
  }
	$social_media = get_social_media();
	?>
	<footer id="colophon" class="site-footer" role="contentinfo">
		<div class="wrapper">
			<div class="flexwrap">
				<?php if ($footer_logo || $other_logos) { ?>
					<div class="footer-logo">
            <?php if ($footer_logo) { ?>
              <img src="<?php echo $footer_logo['url'] ?>" alt="<?php echo $footer_logo['title'] ?>">
            <?php } ?>
						
            <?php if ($other_logos) { ?>
            <div class="other-logos">
              <?php foreach ($other_logos as $r) { 
                $openLink = '';
                $closeLink = '';
                if($r['url']) {
                  $openLink = '<a href="'.$r['url'].'">';
                  $closeLink = '</a>';
                }
                ?>
                <div><?php echo $openLink; ?><img src="<?php echo $r['logo']['url'] ?>" alt="<?php echo $r['logo']['title'] ?>"><?php echo $closeLink; ?></div>
              <?php } ?>
            </div>
            <?php } ?>
					</div>
				<?php } ?>

				<?php if (has_nav_menu('footer')) { ?>
				<div class="footer-links">
					<?php wp_nav_menu( array( 'theme_location' => 'footer', 'menu_id' => 'footer-menu','link_before'=>'<span>','link_after'=>'</span>','container'=>false) ); ?>
				</div>	
				<?php } ?>

				<?php if ($social_media) { ?>
					<div class="social-media">
					<?php foreach ($social_media as $s) { ?>
						<a href="<?php echo $s['url'] ?>" class="<?php echo $s['type'] ?> link" target="_blank"><i class="<?php echo $s['icon'] ?>"></i></a>
					<?php } ?>
					</div>
				<?php } ?>
			</div>
		</div>
	</footer><!-- #colophon -->
	
</div><!-- #page -->
<div id="loaderDiv"> <div class="loaderInline"> <div class="sk-chase"> <div class="sk-chase-dot"></div> <div class="sk-chase-dot"></div> <div class="sk-chase-dot"></div> <div class="sk-chase-dot"></div> <div class="sk-chase-dot"></div> <div class="sk-chase-dot"></div> </div> </div> </div>
<?php wp_footer(); ?>
</body>
</html>
