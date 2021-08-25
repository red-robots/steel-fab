<?php  
$is_subpage = ( is_front_page() || is_home() ) ? false : true;
if( $is_subpage ) { ?>
	<?php  
		$banner = get_field("banner");
		$page_title = get_the_title();
		if( is_singular('project') ) {
			$parent_id = get_page_id_by_template('page-projects');
			//$page_title = get_the_title($parent_id);
			$banner = get_field("banner",$parent_id);
			$page_title = get_field("project_main_page_title","option");
			if(empty($page_title)) {
				$page_title = get_the_title($parent_id);
			}
			
		}
		if( is_tax('divisions') ) {
			$banner = get_field("divisions_main_photo","option");
			$page_title = get_field("division_page_title","option");
		}
	?>
	<?php if ($banner) { ?>
	<div class="subpage-banner" style="background-image:url('<?php echo $banner['url']?>')">
		<div class="wrapper text-center">
			<div class="inner">
				<h1 class="page-title"><?php echo $page_title; ?></h1>
			</div>
		</div>
	</div>
	<?php } ?>

<?php } ?>