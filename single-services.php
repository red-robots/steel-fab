<?php
$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default single-services-page <?php echo $has_banner ?>">
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
			<div class="yellow-bar single-entry">
				<div class="wrapper text-center">
					<?php echo wpautop($row1_yellow_bar_text) ?>
				</div>
			</div>
			<?php } ?>

			<?php  
			$row2_title = get_field("row2_title");
			$row2_text = get_field("row2_text");
			$row2_content = get_field("row2_content");
			$row2_bg_img = get_field("row2_bg_img");
			$row2BgImg = ($row2_bg_img) ? ' style="background-image:url('.$row2_bg_img['url'].')"':'';
			if( $row2_title || $row2_text || $row2_content ) { ?>
			<div id="row2" class="section-wrap">
				
				<?php if( $row2_title || $row2_text ) { ?>
				<div id="svc1" class="svc"<?php echo $row2BgImg ?>>
					<div class="wrapper sm text-center">
						<?php if ($row2_title) { ?>
						<h2 class="col-title white text-center"><?php echo $row2_title ?></h2>
						<?php } ?>
					
						<?php if ($row2_text) { ?>
						<div class="col-text"><?php echo $row2_text ?></div>
						<?php } ?>
					</div>
				</div>
				<?php } ?>

				<?php if($row2_content) { $count_col = count($row2_content); ?>
				<div id="svc2" class="column-content count<?php echo $count_col ?>">
					<div class="wrapper">
						<div class="flexwrap">
						<?php foreach ($row2_content as $r) { 
							$c_title = $r['title']; 
							$c_text = $r['description']; 
							if( $c_title || $c_text ) { ?>
							<div class="fcol">
								<div class="inner">
								<?php if ($c_title) { ?>
								<h3 class="t1"><?php echo $c_title ?></h3>	
								<?php } ?>
								<?php if ($c_text) { ?>
								<div class="t2"><?php echo $c_text ?></div>	
								<?php } ?>
								</div>
							</div>
							<?php } ?>
						<?php } ?>
						</div>
					</div>
				</div>
				<?php } ?>

			</div>
			<?php } ?>


			<?php  
			$row3_title = get_field("row3_title");
			$row3_text = get_field("row3_text");
			$row3_content = get_field("row3_content");
			$row3_bg_img = get_field("row3_bg_img");
			$row3BgImg = ($row3_bg_img) ? ' style="background-image:url('.$row3_bg_img['url'].')"':'';
			if( $row3_title || $row3_text || $row3_content ) { ?>
			<div id="row3" class="section-wrap">
				
				<?php if( $row3_title || $row3_text ) { ?>
				<div class="svc primary-bg-color"<?php echo $row3BgImg ?>>
					<div class="overlay"></div>
					<div class="wrapper sm text-center">
						<?php if ($row3_title) { ?>
						<h2 class="col-title white text-center"><?php echo $row3_title ?></h2>
						<?php } ?>
					
						<?php if ($row3_text) { ?>
						<div class="col-text"><?php echo $row3_text ?></div>
						<?php } ?>
					</div>
				</div>
				<?php } ?>

				<?php if($row3_content) { $row3_count = count($row3_content); ?>
				<div class="column-content count<?php echo $row3_count; ?>">
					<div class="wrapper">
						<div class="flexwrap">
						<?php foreach ($row3_content as $r) { 
							$c_title = $r['title']; 
							$c_text = $r['description']; 
							if( $c_title || $c_text ) { ?>
							<div class="fcol">
								<div class="wrap">
									<!-- <div class="skew"></div> -->
									<div class="inner">
									<?php if ($c_title) { ?>
									<h3 class="t1"><?php echo $c_title ?></h3>	
									<?php } ?>
									<?php if ($c_text) { ?>
									<div class="t2"><?php echo $c_text ?></div>	
									<?php } ?>
									</div>
								</div>
							</div>
							<?php } ?>
						<?php } ?>
						</div>
					</div>
				</div>
				<?php } ?>

			</div>
			<?php } ?>


		<?php endwhile; ?>

	</main><!-- #main -->
</div><!-- #primary -->

<?php
get_footer();
