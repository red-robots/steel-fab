<?php
/**
 * Template Name: Our Values
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-values-template <?php echo $has_banner ?>">
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
			<div id="row1" class="entry-content intro-two-col">
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

			<!-- ROW 2 -->
			<?php  
			$row2_title = get_field("row2_title");
			$row2_commitment = get_field("row2_commitment");
			$row2_text2 = get_field("row2_text2");
			$row2_button = get_field("row2_button");
			if( $row2_title || $row2_commitment || $row2_text2 ) { ?>
			<div id="row2" class="entry-content columns-with-icons">
				<div class="wrapper text-center">
					<?php if ($row2_title) { ?>
					<h2 class="col-title"><?php echo $row2_title ?></h2>	
					<?php } ?>

					<?php if ($row2_commitment) { ?>
					<div class="column-icons">
						<div class="flexwrap">
							<?php foreach ($row2_commitment as $e) { 
								$icon = $e['icon'];
								$title = $e['title'];
								$description = $e['description'];
								if($title || $description) { ?>
								<div class="fxcol">
									<div class="inner">
									<?php if ($icon) { ?>
										<div class="icon"><img src="<?php echo $icon['url'] ?>" alt="<?php echo $icon['title'] ?>" aria-hidden="true"></div>
									<?php } ?>
									<?php if ($title) { ?>
										<h3 class="title"><?php echo $title ?></h3>
									<?php } ?>

									<?php if ($description) { ?>
										<div class="description"><?php echo $description ?></div>
									<?php } ?>
									</div>
								</div>
								<?php } ?>
							<?php } ?>
						</div>
					</div>
					<?php } ?>

					<?php if ($row2_text2 || $row2_button) { ?>
					<div class="bottom-text">
						<?php if ($row2_text2) { ?>
							<div class="text"><?php echo $row2_text2 ?></div>
						<?php } ?>

						<?php if ($row2_button) { 
							$btn_target = ( isset($row2_button['target']) && $row2_button['target'] ) ? $row2_button['target'] : '_self';
							$btn_title = ( isset($row2_button['title']) && $row2_button['title'] ) ? $row2_button['title'] : '';
							$btn_url = ( isset($row2_button['url']) && $row2_button['url'] ) ? $row2_button['url'] : '';
							if($btn_title && $btn_url) { ?>
							<div class="button">
								<a href="<?php echo $btn_url ?>" target="<?php echo $btn_target ?>" class="btn-outline sm"><?php echo $btn_title ?></a>
							</div>
							<?php } ?>
						<?php } ?>
					</div>	
					<?php } ?>
				</div>
			</div>
			<?php } ?>


			<!-- ROW 3 -->
			<?php
			$row3_blocks = get_field("row3_blocks");
			$row3_text = ( isset($row3_blocks['text_content_bg']) && $row3_blocks['text_content_bg'] ) ? $row3_blocks['text_content_bg'] : '';
			$row3_text_bg = ( isset($row3_blocks['text_bg_image']) && $row3_blocks['text_bg_image'] ) ? $row3_blocks['text_bg_image'] : '';
			$row3LeftColText = ( isset($row3_blocks['left_column_text']) && $row3_blocks['left_column_text'] ) ? $row3_blocks['left_column_text'] : '';
			$row3LeftColBtn = ( isset($row3_blocks['left_column_button']) && $row3_blocks['left_column_button'] ) ? $row3_blocks['left_column_button'] : '';
			$row3BtnTarget = ( isset($row3LeftColBtn['target']) && $row3LeftColBtn['target'] ) ? $row3LeftColBtn['target'] : '_self';
			$row3BtnTitle = ( isset($row3LeftColBtn['title']) && $row3LeftColBtn['title'] ) ? $row3LeftColBtn['title'] : '';
			$row3BtnLink = ( isset($row3LeftColBtn['url']) && $row3LeftColBtn['url'] ) ? $row3LeftColBtn['url'] : '';
			$row3LeftColTextImg = ( isset($row3_blocks['left_column_bg_img']) && $row3_blocks['left_column_bg_img'] ) ? $row3_blocks['left_column_bg_img'] : '';
			$row3_arrs = array($row3_text,$row3LeftColText);
			$row3_has_content = (array_filter($row3_arrs)) ? true : false;
			$row3_pad_bottom = ($row3LeftColText) ? ' bottom-pad-large':'';
			$row3BgImg = ($row3LeftColTextImg) ? ' style="background-image:url('.$row3LeftColTextImg['url'].')"':'';
			if( $row3_has_content ) { ?>
			<div id="row3" class="entry-content text-imgbg-section">
				<?php if ( $row3_text ) { ?>
				<div class="fw-text text-center">
					<?php if ($row3_text_bg) { ?>
					<div class="bg-img" style="background-image:url('<?php echo $row3_text_bg['url'] ?>')"></div>
					<?php } ?>
					<div class="wrapper<?php echo $row3_pad_bottom ?>">
						<?php echo $row3_text ?>
					</div>
				</div>
				<?php } ?>

				<?php if ( $row3LeftColText ) { ?>
				<div class="twocol-text-image">
					<div class="image-bg"<?php echo $row3BgImg ?>></div>
					<div class="flexwrap">
						<div class="fxcol left">
							<div class="text"><?php echo $row3LeftColText ?></div>
							<?php if ($row3BtnTitle && $row3BtnLink) { ?>
							<div class="button">
								<a href="<?php echo $row3BtnLink ?>" target="<?php echo $row3BtnTarget ?>" class="btn-default sm"><?php echo $row3BtnTitle ?></a>
							</div>
							<?php } ?>
						</div>
						<div class="fxcol right"></div>
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
