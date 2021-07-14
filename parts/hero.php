<?php  
$is_subpage = ( is_front_page() || is_home() ) ? false : true;
if( $is_subpage ) { ?>
	<?php  
		$banner = get_field("banner");
	?>
	<?php if ($banner) { ?>
	<div class="subpage-banner" style="background-image:url('<?php echo $banner['url']?>')">
		<div class="wrapper text-center">
			<div class="inner">
				<h1 class="page-title"><?php the_title(); ?></h1>
			</div>
		</div>
	</div>
	<?php } ?>
<?php } ?>