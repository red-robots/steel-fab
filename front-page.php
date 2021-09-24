<?php 
get_header(); 
?>

<?php while ( have_posts() ) : the_post(); ?>
<?php  
$row2_title = get_field("row2_title");
$row2_text = get_field("row2_text");
$row2_button = get_field("row2_button");
$row2_btnTxt = ( isset($row2_button['title']) && $row2_button['title'] ) ? $row2_button['title'] : '';
$row2_btnLink = ( isset($row2_button['url']) && $row2_button['url'] ) ? $row2_button['url'] : '';
$row2_btnTarget = ( isset($row2_button['target']) && $row2_button['target'] ) ? $row2_button['target'] : '_self';
$row2_group = get_field("row2_right_content");
if( $row2_title || $row2_text || ( isset($row2_group['columns']) && $row2_group['columns'] )  ) { ?>
<div id="home-row-2" class="home-row">
	<div class="div-bg" style="background-image:url('<?php echo get_images_dir("dev/home-header-bottom.png") ?>');"></div>
	<div class="wrapper">
		<div class="steelfabmap" style="background-image:url('<?php echo get_images_dir("dev/steelfab-map.png") ?>');"></div>
		<div class="flexwrap">
			<div class="fcol left">
				<div class="flexcenter">
					<div class="textwrap">
						<?php if ($row2_title) { ?>
							<h2 class="big-text"><?php echo $row2_title ?></h2>
						<?php } ?>
						<?php if ($row2_text) { ?>
						<div class="small-text">
							<?php echo $row2_text ?>
						</div>
						<?php } ?>

						<?php if ($row2_btnTxt && $row2_btnLink) { ?>
						<div class="button">
							<a href="<?php echo $row2_btnLink ?>" target="<?php echo $row2_btnTarget ?>" class="btn-outline"><?php echo $row2_btnTxt ?></a>
						</div>
						<?php } ?>
					</div>
				</div>
			</div>
			
			<?php if ( isset($row2_group['columns']) && $row2_group['columns'] ) { ?>
			<div class="fcol right">
				<div class="flexwrap locations">

					<?php foreach ($row2_group['columns'] as $col) { ?>
						<div class="subcol">
							<div class="inside">

								<?php if ( $col['small_title'] ) { ?>
								<div class="titlediv">
									<div class="num"></div>
									<?php if ( $col['small_title'] ) { ?>
									<div class="t1"><?php echo $col['small_title'] ?></div>
									<?php } ?>
								</div>
								<?php } ?>

								<?php if ( $col['content'] ) { ?>
								<div class="list">
									<?php echo $col['content'] ?>
								</div>
								<?php } ?>

							</div>
						</div>
					<?php } ?>

				</div>
			</div>
			<?php } ?>

		</div>
	</div>
</div>
<?php } ?>

<?php  
$commitment_title = get_field("commitment_title");
$commitment_text = get_field("commitment_text");
$commitments = get_field("commitments");
?>
<div id="home-row-3" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/commitments.png") ?>');">
	<div class="wrapper">
		<?php if ( $commitment_title || $commitment_text ) { ?>
		<div class="titlediv text-center">
			<h2 id="title-w-line" class="row-title"><span class="hr-left"></span><span class="middle"><?php echo $commitment_title ?></span><span class="hr-right"></span></h2>
			<?php if ($commitment_text) { ?>
			<div class="subtext"><?php echo $commitment_text ?></div>
			<?php } ?>
		</div>
		<?php } ?>

		<?php if ($commitments) { ?>
		<div class="commitments">
			<div class="flexwrap">
				<?php foreach ($commitments as $c) { ?>
				<div class="fcol text-center">
					<div class="pad">
						<?php if ($c['icon']) { ?>
						<div class="icon">
							<img src="<?php echo $c['icon']['url'] ?>" alt="<?php echo $c['icon']['title'] ?>">
						</div>	
						<?php } ?>

						<?php if ($c['title']) { ?>
							<h3 class="title"><?php echo $c['title'] ?></h3>
						<?php } ?>

						<?php if ($c['description']) { ?>
							<div class="description"><?php echo $c['description'] ?></div>
						<?php } ?>
					</div>
				</div>	
				<?php } ?>
			</div>
		</div>
		<?php } ?>
	</div>
</div>

<?php  
$hexagons = get_field("hexagons");
$row4_button = get_field("row4_button");
$row4_button_target = ( isset($row4_button['target']) && $row4_button['target'] ) ? $row4_button['target'] : '_self';
$row4_button_title = ( isset($row4_button['title']) && $row4_button['title'] ) ? $row4_button['title'] : '';
$row4_button_link = ( isset($row4_button['url']) && $row4_button['url'] ) ? $row4_button['url'] : '';
$row4Group = get_field("right_column_content_row4");
$row4_title = ( isset($row4Group['title']) && $row4Group['title'] ) ? $row4Group['title'] : '';
$row4_text = ( isset($row4Group['description']) && $row4Group['description'] ) ? $row4Group['description'] : '';
?>
<div id="home-row-4" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/innovation.png") ?>');">
	<div class="wrapper">
		<div class="flexwrap">
			<div class="fcol fl">
				
				<?php if ($hexagons) { ?>
				<div class="hexagons">

					<?php foreach ($hexagons as $h) { 
						$img = $h['image'];
						$title = $h['title'];
						$link = $h['link'];
						$link_open = '<div class="hexa-shape nolink">';
						$link_close = '</div>';
						if($link) {
							$link_open = '<a href="'.$link.'" class="hexa-shape pagelink">';
							$link_close = '</a>';
						}
						if( $img ) { ?>
						<?php echo $link_open ?>
							<span class="title"><?php echo $title ?></span>
							<div class="hexa">
								<div class="hex1">
									<div class="hex2">
										<div class="img" style="background-image:url('<?php echo $img['url'] ?>')"></div>
									</div>
								</div>
							</div>
							<span class="hex-border">
								<?php get_template_part('images/hexagon-svg'); ?>
							</span>
						<?php echo $link_close ?>
						<?php } ?>

					<?php } ?>
					
				</div>
				<?php } ?>

				<?php if ( $row4_button_title && $row4_button_link ) { ?>
				<div class="buttondiv">
					<a href="<?php echo $row4_button_link ?>" target="<?php echo $row4_button_target ?>" class="btn"><?php echo $row4_button_title ?></a>
				</div>
				<?php } ?>

			</div>

			<?php if ( $row4_title || $row4_text ) { ?>
			<div id="col-right-line" class="fcol fr">
				<span class="topline"></span>
				<span class="bottomline"></span>
				<div id="innovationTxt" class="wrap">
					<?php if ($row4_title) { ?>
					<h2 class="col-title"><?php echo $row4_title ?></h2>
					<?php } ?>
					
					<?php if ($row4_text) { ?>
					<div class="col-text">
						<?php echo $row4_text ?>
					</div>
					<?php } ?>
				</div>
			</div>
			<?php } ?>

		</div>
	</div>
</div>

<?php  
$row5_title = get_field("row5_title");
$row5_text = get_field("row5_text");
$row5_button = get_field("row5_button");
$row5BtnTarget = ( isset($row5_button['target']) && $row5_button['target'] ) ? $row5_button['target'] : '_self';
$row5BtnTitle = ( isset($row5_button['title']) && $row5_button['title'] ) ? $row5_button['title'] : '';
$row5BtnLink = ( isset($row5_button['url']) && $row5_button['url'] ) ? $row5_button['url'] : '';
if( $row5_title || $row5_text || $row5_button ) { ?>
<div id="home-row-5" class="home-row">
	<div class="wrapper">
		<?php if ($row5_title) { ?>
		<h2 class="col-title"><?php echo $row5_title ?></h2>
		<?php } ?>
		
		<?php if ($row5_text) { ?>
		<div class="text"><?php echo $row5_text ?></div>
		<?php } ?>

		<?php if ($row5BtnTitle && $row5BtnLink) { ?>
		<div class="button">
			<a href="<?php echo $row5BtnLink ?>" target="<?php echo $row5BtnTarget ?>" class="btn-outline"><?php echo $row5BtnTitle ?></a>
		</div>
		<?php } ?>
	</div>
</div>
<?php } ?>


<?php  
$row6_bg = get_field("row6_bg");
$row6_title = get_field("row6_title");
$row6_text = get_field("row6_text");
$row6_button = get_field("row6_button");
$row6BtnTarget = ( isset($row6_button['target']) && $row6_button['target'] ) ? $row6_button['target'] : '_self';
$row6BtnTitle = ( isset($row6_button['title']) && $row6_button['title'] ) ? $row6_button['title'] : '';
$row6BtnLink = ( isset($row6_button['url']) && $row6_button['url'] ) ? $row6_button['url'] : '';
$row6_ImageBg = ( isset($row6_bg['url']) && $row6_bg['url'] ) ? ' style="background-image:url('.$row6_bg['url'].')"' : '';
if( $row6_title || $row6_text || $row6_button ) { ?>
<div id="home-row-6" class="home-row"<?php echo $row6_ImageBg ?>>
	<div class="wrapper">
		<div class="flexwrap">
			<div class="fcol fl">
				<?php if ($row6_title) { ?>
				<h2 class="col-title"><?php echo $row6_title ?></h2>
				<?php } ?>

				<?php if ($row6_text) { ?>
				<div class="text"><?php echo $row6_text ?></div>
				<?php } ?>

				<?php if ($row6BtnTitle && $row6BtnLink) { ?>
				<div class="buttondiv">
					<a href="<?php echo $row6BtnLink ?>" target="<?php echo $row6BtnTarget ?>" class="btn-default"><?php echo $row6BtnTitle ?></a>
				</div>
				<?php } ?>
			</div>
		</div>
	</div>
	<div class="stripe-bg"><span></span><span></span><span></span></div>
</div>
<?php } ?>


<?php  
$row7_projects = get_field("row7_projects");
$row7_title = get_field("row7_title");
$row7_button = get_field("row7_button");
$row7BtnTarget = ( isset($row7_button['target']) && $row7_button['target'] ) ? $row7_button['target'] : '_self';
$row7BtnTitle = ( isset($row7_button['title']) && $row7_button['title'] ) ? $row7_button['title'] : '';
$row7BtnLink = ( isset($row7_button['url']) && $row7_button['url'] ) ? $row7_button['url'] : '';
if( $row7_title || $row7_projects || $row7_button ) { ?>
<div id="home-row-7" class="home-row">
	<?php if ($row7_title) { ?>
		<div class="top">
			<div class="wrapper"><h2 class="col-title"><?php echo $row7_title ?></h2></div>
		</div>
	<?php } ?>
	
	<?php if ($row7_projects) { ?>
	<div class="gallery">
		<?php $i=1; foreach ($row7_projects as $p) {
			$proj_id = $p->ID;
			$proj_title = $p->post_title;
			$proj_link = get_permalink($proj_id); 
			$proj_img = get_field("main_photo",$proj_id);
			$proj_style = ($proj_img) ? ' style="background-image:url('.$proj_img['url'].')"':'';
		?>
		<a href="<?php echo $proj_link ?>" class="photo">
			<figure class="image"<?php echo $proj_style ?>></figure>
				<img src="<?php echo get_images_dir("square.png") ?>" alt="" aria-hidden="true" />
				<span class="caption">
					<span class="info"><?php echo $proj_title ?></span>
				</span>
		</a>
		<?php $i++; } ?>
	</div>
	<?php } ?>

	<?php 
	/* 
	* Temporarily disable `See More` button
	* Remove the variables below to enable the button
	*/
	$row7BtnTitle = false;
	$row7BtnLink = false;
	?>
	<?php if ($row7BtnTitle && $row7BtnLink) { ?>
	<div class="button text-center">
		<a href="<?php echo $row7BtnLink ?>" target="<?php echo $row7BtnTarget ?>" class="btn-default"><?php echo $row7BtnTitle ?></a>
	</div>
	<?php } ?>

</div>
<?php } ?>


<?php  
$row8_title = get_field("row8_title");
$row8_text = get_field("row8_text");
$row8_button = get_field("row8_button");
$row8BtnTarget = ( isset($row8_button['target']) && $row8_button['target'] ) ? $row8_button['target'] : '_self';
$row8BtnTitle = ( isset($row8_button['title']) && $row8_button['title'] ) ? $row8_button['title'] : '';
$row8BtnLink = ( isset($row8_button['url']) && $row8_button['url'] ) ? $row8_button['url'] : '';
if( $row8_title || $row8_text || $row8_button ) { ?>
<div id="home-row-8" class="home-row bottom-blue-area">
	<div class="wrapper text-center"> 
		<?php if ($row8_title) { ?>
		<h2 class="col-title"><?php echo $row8_title ?></h2>
		<?php } ?>

		<?php if ($row8_text) { ?>
		<div class="small-text"><?php echo $row8_text ?></div>
		<?php } ?>

		<?php if ($row8BtnTitle && $row8BtnLink) { ?>
		<div class="button">
			<a href="<?php echo $row8BtnLink ?>" target="<?php echo $row8BtnTarget ?>" class="btn-outline"><?php echo $row8BtnTitle ?></a>
		</div>
		<?php } ?>
	</div>
</div>
<?php } ?>

<?php endwhile; ?>	

<script>
jQuery(document).ready(function($){

	//locations counter
	if( $("#home-row-2 .locations .subcol").length ) {
		$("#home-row-2 .locations .subcol").each(function(){
			var parent = $(this);
			if( $(this).find('.list li').length ) {
				var totalList = $(this).find('.list li').length;
				parent.find('.num').text(totalList);
			}
		});
	}

	title_with_lines();
	innovation_area_line();
	$(window).resize(function(){
		title_with_lines();
		innovation_area_line();
	});

	function title_with_lines() {
		var titleWidth = $("#title-w-line").width();
		var spanMiddle = $("#title-w-line span.middle").width();
		var sideWidth = Math.round( (titleWidth-spanMiddle) / 2 ) - 20;
		$("span.hr-left,span.hr-right").addClass("show").css("width",sideWidth+"px");
	}
	
	function innovation_area_line() {
		if( $("#innovationTxt").length ) {
			var columnHeight = $("#col-right-line").height();
			var textHeight = $("#innovationTxt").height();
			var b = (columnHeight - textHeight) / 2;
			var lineHeight = Math.round(b) - 15;
			$(".topline, .bottomline").css("height",lineHeight+"px");
		}
	}
	
	
});
</script>
<?php
get_footer();