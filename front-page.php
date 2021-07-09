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


<div id="home-row-4" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/innovation.png") ?>');">
	<div class="wrapper">
		<div class="flexwrap">
			<div class="fcol fl">
				
				<div class="hexagons">
					<a href="#" class="hexa-shape">
						<span class="title">Fabrication</span>
						<div class="hexa">
							<div class="hex1">
								<div class="hex2">
									<div class="img" style="background-image:url('<?php echo get_images_dir("dev/engineers.jpg") ?>')"></div>
								</div>
							</div>
						</div>
						<span class="hex-border">
							<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.37 187.44"><polygon points="1 47.6 81.52 1.15 161.87 46.94 162.37 140.84 81.49 186.29 1.45 141.34 1 47.6" style="fill:none;stroke:#fff;stroke-miterlimit:10;stroke-width:2px"/></svg>
						</span>
					</a>

					<a href="#" class="hexa-shape">
						<span class="title">Engineering & Detailing</span>
						<div class="hexa">
							<div class="hex1">
								<div class="hex2">
									<div class="img" style="background-image:url('<?php echo get_images_dir("dev/engineers.jpg") ?>')"></div>
								</div>
							</div>
						</div>
						<span class="hex-border">
							<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.37 187.44"><polygon points="1 47.6 81.52 1.15 161.87 46.94 162.37 140.84 81.49 186.29 1.45 141.34 1 47.6" style="fill:none;stroke:#fff;stroke-miterlimit:10;stroke-width:2px"/></svg>
						</span>
					</a>

					<a href="#" class="hexa-shape">
						<span class="title">Pre-Construction</span>
						<div class="hexa">
							<div class="hex1">
								<div class="hex2">
									<div class="img" style="background-image:url('<?php echo get_images_dir("dev/engineers.jpg") ?>')"></div>
								</div>
							</div>
						</div>
						<span class="hex-border">
							<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.37 187.44"><polygon points="1 47.6 81.52 1.15 161.87 46.94 162.37 140.84 81.49 186.29 1.45 141.34 1 47.6" style="fill:none;stroke:#fff;stroke-miterlimit:10;stroke-width:2px"/></svg>
						</span>
					</a>

					<a href="#" class="hexa-shape">
						<span class="title">Miscellaneous Metals</span>
						<div class="hexa">
							<div class="hex1">
								<div class="hex2">
									<div class="img" style="background-image:url('<?php echo get_images_dir("dev/engineers.jpg") ?>')"></div>
								</div>
							</div>
						</div>
						<span class="hex-border">
							<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.37 187.44"><polygon points="1 47.6 81.52 1.15 161.87 46.94 162.37 140.84 81.49 186.29 1.45 141.34 1 47.6" style="fill:none;stroke:#fff;stroke-miterlimit:10;stroke-width:2px"/></svg>
						</span>
					</a>

					<a href="#" class="hexa-shape">
						<span class="title">Project Management</span>
						<div class="hexa">
							<div class="hex1">
								<div class="hex2">
									<div class="img" style="background-image:url('<?php echo get_images_dir("dev/engineers.jpg") ?>')"></div>
								</div>
							</div>
						</div>
						<span class="hex-border">
							<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.37 187.44"><polygon points="1 47.6 81.52 1.15 161.87 46.94 162.37 140.84 81.49 186.29 1.45 141.34 1 47.6" style="fill:none;stroke:#fff;stroke-miterlimit:10;stroke-width:2px"/></svg>
						</span>
					</a>
				</div>

			</div>
			<div class="fcol fr">
				<h2 class="col-title">Where innovation<BR>meets precision.</h2>
				<div class="col-text">
					<p>The work we do at SteelFab is cutting edge, but every project comes down to how our team handles your needs. That’s why your dedicated project team is with you every step of the way, focusing on your unique design ideas, budget, and schedule.</p> 
					<p>Our turnkey steel fabrication services range from the design phase through to the very end of your project.</p>
				</div>
			</div>
		</div>
	</div>
</div>

<?php endwhile; ?>	

<script>
jQuery(document).ready(function($){
	title_with_lines();
	$(window).resize(function(){
		title_with_lines();
	});
	function title_with_lines() {
		var titleWidth = $("#title-w-line").width();
		var spanMiddle = $("#title-w-line span.middle").width();
		var sideWidth = Math.round( (titleWidth-spanMiddle) / 2 ) - 20;
		$("span.hr-left,span.hr-right").addClass("show").css("width",sideWidth+"px");
	}
	
});
</script>
<?php
get_footer();