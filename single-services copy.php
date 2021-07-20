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
			$row2_bg_img = get_field("row2_bg_img");
			$row2BgImg = ($row2_bg_img) ? ' style="background-image:url('.$row2_bg_img['url'].')"':'';
			if( $row2_title || $row2_text ) { ?>
			<div id="svc-row2" class="section"<?php echo $row2BgImg ?>>

				<div class="wrapper">
					<?php if ($row2_title) { ?>
					<h2 class="col-title white text-center"><?php echo $row2_title ?></h2>
					<?php } ?>
				
					<?php if ($row2_text) { ?>
					<div class="col-text"><?php echo $row2_text ?></div>
					<?php } ?>
				</div>


				<?php  
				$row3_title = get_field("row3_title");
				$row3_features = get_field("row3_features");
				if($row3_title || $row3_features) { ?>
				<!-- PROJECTS -->
				
				<?php } ?>


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
