	</div><!-- #content -->
	
	<?php  
	$footer_logo = get_field("footer_logo","option");
	$footer_links = get_field("footer_links","option");
	$social_media = get_social_media();
	?>
	<footer id="colophon" class="site-footer" role="contentinfo">
		<div class="wrapper">
			<div class="flexwrap">
				<?php if ($footer_logo) { ?>
					<div class="footer-logo">
						<img src="<?php echo $footer_logo['url'] ?>" alt="<?php echo $footer_logo['title'] ?>">
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
						<a href="<?php echo $s['url'] ?>" class="<?php echo $s['type'] ?> link"><i class="<?php echo $s['icon'] ?>"></i></a>
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
