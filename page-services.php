<?php
/**
 * Template Name: Services
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-services-template <?php echo $has_banner ?>">
	<main id="main" class="site-main" role="main">

		<?php while ( have_posts() ) : the_post(); ?>

			<?php if ( !$banner ) { ?>
				<h1 class="page-title"><?php the_title(); ?></h1>
			<?php } ?>

			<!-- ROW 1 -->
			<?php  
			$row1_column_left = get_field("row1_column_left");
			$row1_column_right = get_field("row1_column_right");
			$row1_yellow_bar_text = get_field("row1_yellow_bar_text");
			$row1_col_class = ($row1_column_left && $row1_column_right) ? 'colnum2':'colnum1';
			if( $row1_column_left || $row1_column_right ) { ?>
			<div id="row1" class="entry-content">
				<div class="wrapper">
					<div class="flexwrap <?php echo $row1_col_class ?>">
						<?php if ($row1_column_left) { ?>
							<div class="fcol left">
								<div class="inside">
									<h2 class="col-title"><?php echo $row1_column_left ?></h2>
								</div>
							</div>
						<?php } ?>
						
						<?php if ($row1_column_right) { ?>
						<div class="fcol right">
							<div class="inside">
								<?php echo $row1_column_right ?>
							</div>
						</div>
						<?php } ?>
					</div>
				</div>
			</div>
			<?php } ?>

			<!-- YELLOW BAR -->
			<?php if ($row1_yellow_bar_text) { ?>
			<div class="yellow-bar">
				<div class="wrapper text-center">
					<?php echo wpautop($row1_yellow_bar_text) ?>
				</div>
			</div>
			<?php } ?>

			<?php  
			$row2_title = get_field("row2_title");
			$row2_services = get_field("row2_services");
			$row3_title = get_field("row3_title");
			$row3_features = get_field("row3_features");
			if( $row2_title || $row2_services || ($row3_title || $row3_features) ) { ?>
			<!-- HEXAGONS SECTION -->
			<div id="hex-sections" class="section has-hexagons">

				<div class="wrapper">
					<?php if ($row2_title) { ?>
					<h2 class="col-title blue text-center"><?php echo $row2_title ?></h2>
					<?php } ?>
				
					<?php if ($row2_services) { ?>
					<div class="hexagons-large">
						
						<?php foreach ($row2_services as $row) { 
							$img = $row['image'];
							$title = $row['title'];
							$description = $row['description'];
							$button = $row['button'];
							$btnTarget = ( isset($button['target']) && $button['target'] ) ? $button['target'] : '_self';
							$btnTitle = ( isset($button['title']) && $button['title'] ) ? $button['title'] : '';
							$btnLink = ( isset($button['url']) && $button['url'] ) ? $button['url'] : '';
							if($title || $description) { ?>
							<div class="hex-figure <?php echo ($img) ? 'hasImage':'noImage'; ?>">
								<div class="hexagon">
									<img class="helper" src="<?php echo get_images_dir('square.png') ?>" alt="" aria-hidden="true">
									<div class="hexInner">
										<div class="hex1">
											<div class="hex2">
												<div class="hexoverlay"></div>
												<?php if ($img) { ?>
													<div class="heximg" style="background-image:url('<?php echo $img['url'] ?>')"></div>
												<?php } ?>
											</div>
										</div>

										<?php if ( $title || $description || $button ) { ?>
										<div class="hex-caption">
											<div class="hex-text">
												<?php if ($title) { ?>
												<h3 class="h3"><?php echo $title ?></h3>
												<?php } ?>
												
												<?php if ($description) { ?>
												<div class="textwrap"><?php echo wpautop($description) ?></div>
												<?php } ?>

												<?php if ($btnTitle && $btnLink) { ?>
												<div class="button">
													<a href="<?php echo $btnLink ?>" target="<?php echo $btnTarget ?>" class="more"><span><?php echo $btnTitle ?> <i class="arrow"></i><i class="arrow a1"></i><i class="arrow a2"></i></span></a>
												</div>
												<?php } ?>
											</div>
										</div>
										<?php } ?>
									</div>
								</div>
							</div>
							<?php } ?>

						<?php } ?>
					</div>
					<?php } ?>
				</div>


				<?php  
				if($row3_title || $row3_features) { ?>
				<!-- PROJECTS -->
				<div class="wrapper project-features">
					<?php if ($row3_title) { ?>
					<h2 class="col-title white text-center"><?php echo $row3_title ?></h2>
					<?php } ?>

					<?php if ($row3_features) { ?>
					<div class="project-feature-list">
						<div class="flexwrap">

							<?php foreach ($row3_features as $feat) { ?>
								<div class="pfcol">
									<div class="inner">
										<?php if ( $feat['icon'] ) { ?>
										<div class="icon">
											<img src="<?php echo $feat['icon']['url'] ?>" alt="" aria-hidden="true">
										</div>
										<?php } ?>
										
										<?php if ( $feat['title'] || $feat['description'] ) { ?>
										<div class="text">
											<?php if ( $feat['title'] ) { ?>
											<h3 class="h3"><?php echo $feat['title'] ?></h3>
											<?php } ?>

											<?php if ( $feat['description'] ) { ?>
											<div class="info">
												<?php echo wpautop($feat['description']) ?>
											</div>
											<?php } ?>
										</div>
										<?php } ?>
									</div>
								</div>
							<?php } ?>

						</div>
					</div>
					<?php } ?>
				</div>
				<?php } ?>

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
			<?php } ?>

			<?php 
			$row4_title = get_field("row4_title");
			$row4_text = get_field("row4_text");
			$row4_button = get_field("row4_button");
			$btn4Target = ( isset($row4_button['target']) && $row4_button['target'] ) ? $row4_button['target'] : '_self';
			$btn4Title = ( isset($row4_button['title']) && $row4_button['title'] ) ? $row4_button['title'] : '';
			$btn4Link = ( isset($row4_button['url']) && $row4_button['url'] ) ? $row4_button['url'] : '';
			if( $row4_title || $row4_text || $row4_button ) { ?>
			<div id="bottom-blue" class="bottom-blue-area">
				<div class="wrapper text-center">
					<?php if($row4_title) { ?>
					<h2 class="col-title"><?php echo $row4_title ?></h2>
					<?php } ?>

					<?php if($row4_text) { ?>
					<div class="small-text"><?php echo wpautop($row4_text) ?></div>
					<?php } ?>

					<?php if ($btn4Title && $btn4Link) { ?>
					<div class="button">
						<a href="<?php echo $btn4Link ?>" target="<?php echo $btn4Target ?>" class="btn-outline"><?php echo $btn4Title ?></a>
					</div>
					<?php } ?>
				</div>
			</div>
			<?php } ?>

		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
