<?php 
get_header(); 
?>

<?php while ( have_posts() ) : the_post(); ?>

<?php 
$row1_title = get_field("row1_title");
$row1_text = get_field("row1_text");
$row1_button = get_field("row1_button");
$row1_target = ( isset($row1_button['target']) && $row1_button['target'] ) ? $row1_button['target'] : '_self';
?>
<div id="home-row-1" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/home-header-top.png") ?>');">
	<div class="wrapper">
		<div class="hero-caption">
			<div class="hero-text animated fadeIn">
				<?php if ($row1_title) { ?>
				<h2 class="col-title"><?php echo $row1_title ?></h2>
				<?php } ?>
				
				<?php if ($row1_text || $row1_button) { ?>
				<div class="col-text">
					<?php if ($row1_text) { ?>
					<div class="text">
						<?php echo $row1_text ?>
					</div>
					<?php } ?>

					<?php if ($row1_button && ( isset($row1_button['title']) && $row1_button['title'] ) ) { ?>
					<div class="button">
						<a href="<?php echo $row1_button['url'] ?>" target="<?php echo $row1_target ?>" class="start-btn"><?php echo $row1_button['title'] ?></a>
					</div>
					<?php } ?>
				</div>
				<?php } ?>
			</div>
		</div>
		<div class="broken-lines"><span class="arrow animated fadeInDown"></span></div>
	</div>
</div>

<?php  
$row2_title = get_field("row2_title");
$row2_text = get_field("row2_text");
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
					</div>
				</div>
			</div>
			
			<?php if ( isset($row2_group['columns']) && $row2_group['columns'] ) { ?>
			<div class="fcol right">
				<div class="flexwrap locations">

					<?php foreach ($row2_group['columns'] as $col) { ?>
						<div class="subcol">
							<div class="inside">

								<?php if ( $col['big_title'] || $col['small_title'] ) { ?>
								<div class="titlediv">
									<?php if ( $col['big_title'] ) { ?>
										<div class="num"><?php echo $col['big_title'] ?></div>
									<?php } ?>
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
								<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.37 187.44"><polygon points="1 47.6 81.52 1.15 161.87 46.94 162.37 140.84 81.49 186.29 1.45 141.34 1 47.6" style="fill:none;stroke:#fff;stroke-miterlimit:10;stroke-width:2px"/></svg>
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

<div id="home-row-5" class="home-row">
	<div class="wrapper">
		<h2 class="col-title">SteelFab’s Mission</h2>
		<div class="text">
			<p>From local outreach to environmental impact, our team is committed to bettering the communities we serve through our processes, practices, and actions.</p>
		</div>
		<div class="button">
			<a href="#" class="btn-outline">Our Values</a>
		</div>
	</div>
</div>


<div id="home-row-6" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/construction.png") ?>');">
	<div class="wrapper">
		<div class="flexwrap">
			<div class="fcol fl">
				<h2 class="col-title">Join our team.</h2>
				<div class="text">
					<p>As our team continues to expand, SteelFab is always looking to fill a wide range of exciting positions all across the country. Ready to learn, grow, and innovate with us?</p>
				</div>
				<div class="button">
					<a href="#" class="btn-default">Browse Positions</a>
				</div>
			</div>
		</div>
	</div>
	<div class="stripe-bg"><span></span><span></span><span></span></div>
</div>


<div id="home-row-7" class="home-row">
	<div class="top">
		<div class="wrapper"><h2 class="col-title">Our work in your community.</h2></div>
	</div>
	<div class="gallery">
		<?php for($i=1; $i<=8; $i++) { ?>
		<a href="#" class="photo">
			<figure class="image" style="background-image:url('<?php echo get_images_dir("dev/sample".$i.".png") ?>');"></figure>
			<img src="<?php echo get_images_dir("square.png") ?>" alt="" aria-hidden="true" />
			<span class="caption">
				<span class="info">Tampa Internation Airport APM</span>
			</span>
		</a>
		<?php } ?>
	</div>
	<div class="button text-center">
		<a href="#" class="btn-default">See More</a>
	</div>
</div>


<div id="home-row-8" class="home-row">
	<div class="wrapper text-center">
		<h2 class="col-title">Get In Touch</h2>
		<div class="small-text">
			<p>Let us put our decades of experience to use helping you execute your next fabrication project with a level of skill and support you won’t find anywhere else.</p>
		</div>
		<div class="button">
			<a href="#" class="btn-outline">Contact</a>
		</div>
	</div>
</div>

<?php endwhile; ?>	

<script>
jQuery(document).ready(function($){
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