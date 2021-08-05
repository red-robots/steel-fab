<?php
$args = array(
	'posts_per_page'   => -1,
	'post_type'        => 'careers',
	'post_status'      => 'publish'
);
$careers = new WP_Query($args);
if ( $careers->have_posts() ) { ?>
<div id="jobs" class="entry-content careers-list cf">
	<div class="wrapper">
		<div class="flexwrap">
		<?php while ( $careers->have_posts() ) : $careers->the_post();
			$id = get_the_ID();
			$jobtitle = get_the_title();
			$text = get_the_content();
			$summary = ($text) ? shortenText($text,200,'.', '...') : '';
			$locations = '';
			$division = get_the_terms($id,'divisions');
			if($division) {
				foreach($division as $k=>$d) {
					$comma = ($k>0) ? ', ':'';
					$locations .= $comma . $d->name;
				}
			}
			?>
			<div class="job">
				<div class="inside">
					<div class="wrap">
						<span class="arrow"></span>
						<div class="titlediv">
							<h3><?php echo $jobtitle ?></h3>
							<?php if ($locations) { ?>
							<div class="division"><?php echo $locations ?></div>
							<?php } ?>
						</div>

						<?php if ($summary) { ?>
							<div class="summary"><?php echo $summary ?></div>
						<?php } ?>

						<div class="more">
							<a href="<?php echo get_permalink(); ?>"><span>Read More</span><i class="a1"></i><i class="a2"></i><i class="a3"></i></a>
						</div>
					</div>
				</div>
			</div>
		<?php endwhile; wp_reset_postdata(); ?>
		</div>
	</div>
</div>
<?php } ?>