<?php 
get_header(); 
?>

<?php while ( have_posts() ) : the_post(); ?>

<div id="home-row-1" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/home-header-top.png") ?>');">
	<div class="wrapper">
		<div class="hero-caption">
			<div class="hero-text animated fadeIn">
				<h2 class="big-text">
					Nationally renowned steel<BR>
					fabrication services.
				</h2>
				<div class="small-text">
					<p>A third-generation family-owned company, SteelFab is one of the largest and most experienced steel fabricators in the United States.</p>
					<div class="button">
						<a href="#" class="start-btn">Start Your Project</a>
					</div>
				</div>
			</div>
		</div>
		<div class="broken-lines"><span class="arrow animated fadeInDown"></span></div>
	</div>
</div>


<div id="home-row-2" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/home-header-bottom.png") ?>');">
	<div class="wrapper">
		<div class="steelfabmap" style="background-image:url('<?php echo get_images_dir("dev/steelfab-map.png") ?>');"></div>
		<div class="flexwrap">
			<div class="fcol left">
				<div class="flexcenter">
					<div class="textwrap">
						<h2 class="big-text">
							Local Roots.<BR>
							National Recognition.
						</h2>
						<div class="small-text">
							<p>Having evolved from a local business with roots in Charlotte, NC into a national brand with 11 fabrication facilities and 15 offices across the country, our team prides itself on outstanding customer service and on-time delivery of a superior product.</p>
						</div>
					</div>
				</div>
			</div>
			<div class="fcol right">
				<div class="flexwrap locations">
					<div class="subcol">
						<div class="inside">
							<div class="titlediv">
								<div class="num">11</div>
								<div class="t1">Fabrication Facilities</div>
							</div>
							<div class="list">
								<ul>
									<li>Charlotte, NC</li>
									<li>Dublin, GA</li>
									<li>Alexandria, VA</li>
									<li>Norcross, GA</li>
									<li>Roanoke, AL</li>
									<li>York, SC</li>
									<li>N. Charleston, SC</li>
									<li>Florence, SC</li>
									<li>Raleigh, NC</li>
									<li>Emporia, VA</li>
									<li>McKinney, TX</li>
								</ul>
							</div>
						</div>
					</div>
					<div class="subcol">
						<div class="inside">
							<div class="titlediv">
								<div class="num">15</div>
								<div class="t1">Offices</div>
							</div>
							<div class="list">
								<ul>
									<li>Charlotte, NC</li>
									<li>Dublin, GA</li>
									<li>Alexandria, VA</li>
									<li>Norcross, GA</li>
									<li>Roanoke, AL</li>
									<li>York, SC</li>
									<li>N. Charleston, SC</li>
									<li>Florence, SC</li>
									<li>Raleigh, NC</li>
									<li>Emporia, VA</li>
									<li>McKinney, TX</li>
									<li>Austin, TX</li>
									<li>Durant, OK</li>
									<li>Brentwood, TN</li>
									<li>Tangent, OR</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>


<div id="home-row-3" class="home-row" style="background-image:url('<?php echo get_images_dir("dev/commitments.png") ?>');">
	<div class="wrapper">
		<div class="titlediv text-center">
			<h2 id="title-w-line" class="row-title"><span class="hr-left"></span><span class="middle">Our Commitments To You.</span><span class="hr-right"></span></h2>
			<p class="subtext">With every job we take on, SteelFab promise to deliver:</p>
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