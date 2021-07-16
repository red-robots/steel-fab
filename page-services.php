<?php
/**
 * Template Name: Services
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");;
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-services-template <?php echo $has_banner ?>">
	<main id="main" class="site-main" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<?php if ( !$banner ) { ?>
				<h1 class="page-title"><?php the_title(); ?></h1>
			<?php } ?>
			<div id="row1" class="entry-content">
				<div class="wrapper">
					<div class="flexwrap">
						<div class="fcol left">
							<div class="inside">
								<h2 class="col-title">Our team is by your side from budget estimates through to the very end of contstruction.</h2>
							</div>
						</div>
						<div class="fcol right">
							<div class="inside">
								<p>As one of the nation's largest AISC (American Institute of Steel Construction) structural steel fabricators, SteelFab has the resources and expertise to handle a wide range of challenging projects, regardless of size.</p>
								<p>All of our processes have been designed and fine-tuned over the years to ensure your projects are carried off without a hitch.</p>
							</div>
						</div>
					</div>
				</div>
			</div>


			<div id="row2" class="yellow-bar">
				<div class="wrapper text-center">
					<p>We pride ourselves on helping to guide you through the process as seamlessly as possible.</p>
				</div>
			</div>

			<div id="row3" class="section has-hexagons">

				<div class="wrapper">
					<h2 class="col-title blue text-center">Our Services</h2>
				
					<div class="hexagons-large">
						
						<div class="hex-figure">
							<div class="hexagon">
								<img class="helper" src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true">
								<div class="hexInner">
									<div class="hex1">
										<div class="hex2">
											<div class="hexoverlay"></div>
											<div class="heximg" style="background-image:url('<?php echo get_images_dir('dev/engineers.jpg') ?>')"></div>
										</div>
									</div>

									<div class="hex-caption">
										<div class="hex-text">
											<h3 class="h3">Fabrication</h3>
											<p>Our eleven fabrication facilities utilize the latest high-tech machinery and cutting-edge computer-driven processes to bring the pieces you need to life with the precision you rely on.</p>
											<div class="button">
												<a href="#" class="more"><span>Learn More <i class="arrow"></i><i class="arrow a1"></i><i class="arrow a2"></i></span></a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>


						<div class="hex-figure">
							<div class="hexagon">
								<img class="helper" src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true">
								<div class="hexInner">
									<div class="hex1">
										<div class="hex2">
											<div class="hexoverlay"></div>
											<div class="heximg" style="background-image:url('<?php echo get_images_dir('dev/engineers.jpg') ?>')"></div>
										</div>
									</div>

									<div class="hex-caption">
										<div class="hex-text">
											<h3 class="h3">Engineering & Detailing</h3>
											<p>Since 1976, SteelFab has maintained and supported an in-house detailing department. Though our methods have changed over the years, our dedication to quality has always remained.</p>
											<div class="button">
												<a href="#" class="more"><span>Learn More <i class="arrow"></i><i class="arrow a1"></i><i class="arrow a2"></i></span></a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="hex-figure">
							<div class="hexagon">
								<img class="helper" src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true">
								<div class="hexInner">
									<div class="hex1">
										<div class="hex2">
											<div class="hexoverlay"></div>
											<div class="heximg" style="background-image:url('<?php echo get_images_dir('dev/engineers.jpg') ?>')"></div>
										</div>
									</div>

									<div class="hex-caption">
										<div class="hex-text">
											<h3 class="h3">Pre-Construction</h3>
											<p>Our team provides pre-construction services starting from the beginning of the design development stage. Our goal is always to add as much value as possible while remaining conscious of your timeline and budget.</p>
											<div class="button">
												<a href="#" class="more"><span>Learn More <i class="arrow"></i><i class="arrow a1"></i><i class="arrow a2"></i></span></a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="hex-figure">
							<div class="hexagon">
								<img class="helper" src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true">
								<div class="hexInner">
									<div class="hex1">
										<div class="hex2">
											<div class="hexoverlay"></div>
											<div class="heximg" style="background-image:url('<?php echo get_images_dir('dev/engineers.jpg') ?>')"></div>
										</div>
									</div>

									<div class="hex-caption">
										<div class="hex-text">
											<h3 class="h3">Project Management</h3>
											<p>Your project management team will be your go-to point of contact throughout the entirety of your project, providing ongoing guidance and support for best practices.</p>
											<div class="button">
												<a href="#" class="more"><span>Learn More <i class="arrow"></i><i class="arrow a1"></i><i class="arrow a2"></i></span></a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="hex-figure">
							<div class="hexagon">
								<img class="helper" src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true">
								<div class="hexInner">
									<div class="hex1">
										<div class="hex2">
											<div class="hexoverlay"></div>
											<div class="heximg" style="background-image:url('<?php echo get_images_dir('dev/engineers.jpg') ?>')"></div>
										</div>
									</div>

									<div class="hex-caption">
										<div class="hex-text">
											<h3 class="h3">Miscellaneous Metals</h3>
											<p>Our team maintains long-lasting relationships with trusted suppliers that specialize in fabricating miscellaneous metals, ensuring on-time delivery within your budget.</p>
											<div class="button">
												<a href="#" class="more"><span>Learn More <i class="arrow"></i><i class="arrow a1"></i><i class="arrow a2"></i></span></a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>



					</div>
				</div>

				<!-- PROJECTS -->
				<div class="wrapper project-features">
					<h2 class="col-title white text-center">On every project, you can expect:</h2>	
					<div class="project-feature-list">
						<div class="flexwrap">
							<div class="pfcol">
								<div class="inner">
									<div class="icon">
										<img src="<?php echo get_images_dir('dev/clock.png') ?>" alt="" aria-hidden="true">
									</div>
									<div class="text">
										<h3 class="h3">Value add services</h3>
										<div class="info">
											<p>Our pre-construction and design phases include input from our team of experts to maximize the value of your project.</p>
										</div>
									</div>
								</div>
							</div>

							<div class="pfcol">
								<div class="inner">
									<div class="icon">
										<img src="<?php echo get_images_dir('dev/clock.png') ?>" alt="" aria-hidden="true">
									</div>
									<div class="text">
										<h3 class="h3">Value add services</h3>
										<div class="info">
											<p>Our pre-construction and design phases include input from our team of experts to maximize the value of your project.</p>
										</div>
									</div>
								</div>
							</div>

							<div class="pfcol">
								<div class="inner">
									<div class="icon">
										<img src="<?php echo get_images_dir('dev/clock.png') ?>" alt="" aria-hidden="true">
									</div>
									<div class="text">
										<h3 class="h3">Value add services</h3>
										<div class="info">
											<p>Our pre-construction and design phases include input from our team of experts to maximize the value of your project.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="pattern-overlay"><span></span></div>
				<div class="diagonal-line d1"></div>
				<div class="diagonal-line d2"></div>
				<div class="diagonal-line d3"></div>
				<div class="diagonal-line d4"></div>
				<div class="diagonal-line d5"></div>
				<div class="diagonal-line d6">
					<div class="overlay"></div>
					<div class="overlay ov2"></div>
					<div class="pattern"></div>
				</div>
			</div>

			<div id="bottom-blue" class="bottom-blue-area">
				<div class="wrapper text-center">
					<h2 class="col-title">Need a team with the skill and experience to seamlessly pull off your next fabrication project?</h2>

					<!-- <div class="small-text"></div> -->

					<div class="button">
						<a href="#" target="_blank" class="btn-outline">Get In Touch</a>
					</div>
				</div>
			</div>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
