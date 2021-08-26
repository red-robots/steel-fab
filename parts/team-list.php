<?php
$args = array(
	'posts_per_page'   => -1,
	'post_type'        => 'team',
	'post_status'      => 'publish'
);
$team = new WP_Query($args);
if ( $team->have_posts() ) { ?>
<section class="section team-list cf">
	<div class="wrapper">
		<div class="flexwrap hexagons-large">

				<?php while ( $team->have_posts() ) : $team->the_post();
				$id = get_the_ID();
				$division = get_the_terms($id,'divisions'); 
				$photo = get_field('photo'); 
				$jobtitle = get_field('jobtitle'); 
				$phone = get_field("phone");
				$staff_name = get_the_title();
				$pagelink = get_permalink();
				$hasphoto = ($photo) ? 'hasImage':'noImage';
				$style = ($photo) ? ' style="background-image:url('.$photo['url'].')"':'';
				$division_name = ($division) ? $division[0]->name : '';
				$linkedin = get_field("linkedin");
				$enable_link = true;
				?>
				<div class="hexFigure square <?php echo $hasphoto ?>">
					<div class="hexagon" href="<?php echo $pagelink ?>">
						<img class="helper" src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true">
						<div class="hexInner">
							<div class="hex1">
								<div class="hex2">
									<!-- <div class="hexoverlay"></div> -->
									<?php if ($photo) { ?>
										<div class="heximg" style="background-image:url('<?php echo $photo['url'] ?>')"></div>
									<?php } ?>
								</div>
							</div>
						</div>
					</div>

					<div class="staff-info">
						<h3 class="name"><?php echo $staff_name ?></h3>
						<?php if ($division_name) { ?>
						<div class="info division"><?php echo $division_name ?></div>	
						<?php } ?>
						<?php if ($jobtitle) { ?>
						<div class="info jobtitle"><?php echo $jobtitle ?></div>	
						<?php } ?>
						<?php if ($phone) { ?>
						<div class="info phone"><span class="icon-phone"><i class="fas fa-phone"></i></span> <a href="tel:<?php echo format_phone_number($phone) ?>"><?php echo $phone ?></a></div>	
						<?php } ?>
						<?php if ($linkedin) { ?>
						<div class="info linkedin"><a href="<?php echo $linkedin ?>" target="_blank"><span class="icon"><i class="fab fa-linkedin"></i></span></a></div>	
						<?php } ?>
					</div>
				</div>
				<?php endwhile; wp_reset_postdata(); ?>

		</div>
	</div>
</section>
<?php } ?>