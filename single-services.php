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
								<?php echo email_obfuscator($row1_column_right) ?>
							</div>
						</div>
						<?php } ?>
					</div>
				</div>
			</div>
			<?php } ?>

			<!-- YELLOW BAR -->
			<?php if ($row1_yellow_bar_text) { ?>
			<div class="yellow-bar capitalize">
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
			$row2_column_content = array();
			if($row2_content) {
				$ct=1; foreach($row2_content as $rc) {
					$rc_title = ($rc['title']) ? string_cleaner($rc['title']) : ''; 
					$rc_text = ($rc['description']) ? string_cleaner($rc['description']) : ''; 
					if($rc_title || $rc_text) {
						$row2_column_content[] = $ct;
					}
					$ct++;
				}
			}
			if( $row2_title || $row2_text || $row2_column_content ) { ?>
			<div id="row2" class="section-wrap row2-services">
				
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
				<div id="svc2" class="column-content-svc2 count<?php echo $count_col ?>">
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
			$row3_col_class = ($row3_content) ? 'hascol':'nocol';

			$row3_column_content = array();
			if($row3_content) {
				$ct=1; foreach($row3_content as $rc) {
					$rc_title = ($rc['title']) ? string_cleaner($rc['title']) : ''; 
					$rc_text = ($rc['description']) ? string_cleaner($rc['description']) : ''; 
					if($rc_title || $rc_text) {
						$row3_column_content[] = $ct;
					}
					$ct++;
				}
			}

			if( $row3_title || $row3_text || $row3_column_content ) { ?>
			<div id="row3" class="section-wrap row3-services">
				
				<?php if( $row3_title || $row3_text ) { ?>
				<div class="svc primary-bg-color full-text <?php echo $row3_col_class ?>"<?php echo $row3BgImg ?>>
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
						<?php $fc=1; foreach ($row3_content as $r) { 
							$c_title = $r['title']; 
							$c_text = $r['description']; 
							if( $c_title || $c_text ) { ?>
							<div class="fcol col<?php echo $fc ?>">
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
						<?php $fc++; } ?>
						</div>
					</div>
				</div>
				<?php } ?>

			</div>
			<?php } ?>


			<?php
			$text_blocks = get_field("text_photo");
			if($text_blocks) { ?>
			<div id="row4" class="section-wrap flexible-content-wrap">
				<?php $j=1; foreach ($text_blocks as $b) { 
					$title = $b['title'];
					$text = $b['description'];
					$buttons = $b['buttons'];
					$image = $b['image'];
					$section_class = ( ($title || $text) &&  $image ) ? 'col-two':'col-one';
					if( $title || $text || $image) { 
						$section_class .= ($j % 2==0) ? ' even':' odd';
					?>
					<section id="flex-content<?php echo $j?>" class="flex-content <?php echo $section_class ?>">
						<div class="flexwrap">
							<?php if ($title || $text) { ?>
							<div class="fcol textcol">
								<div class="wrap">
								<?php if ($title) { ?>
									<h2 class="col-title"><?php echo $title ?></h2>
								<?php } ?>
								<?php if ($text) { ?>
									<div class="col-text"><?php echo $text ?></div>
								<?php } ?>
								<?php if ($buttons) { ?>
									<?php foreach ($buttons as $b) { 
										$btn = $b['button'];
										if($b) {
											$btnName = $btn['title']; 
											$btnLink = $btn['url']; 
											$btnTarget = ( isset($btn['target']) && $btn['target'] ) ? $btn['target'] : '_self'; 
											?>
											<a href="<?php echo $btnLink?>" target="<?php echo $btnTarget?>" class="flx-btn btn-outline sm"><?php echo $btnName?></a>
										<?php } ?>
									<?php } ?>
								<?php } ?>
								</div>
							</div>	
							<?php } ?>

							<?php if ($image) { ?>
							<div class="fcol imagecol">
								<div class="imgbg" style="background-image:url('<?php echo $image['url'] ?>')">
									<img src="<?php echo get_images_dir('rectangle.png') ?>" alt="" aria-hidden="true">
								</div>
							</div>	
							<?php } ?>
						</div>
					</section>
					<?php $j++; } ?>
				<?php } ?>
			</div>
			<?php } ?>


			<?php 
			$row5_title = get_field("row5_title");
			$row5_text = get_field("row5_text");
			$row5_button = get_field("row5_button");
			$btn5Target = ( isset($row5_button['target']) && $row5_button['target'] ) ? $row5_button['target'] : '_self';
			$btn5Title = ( isset($row5_button['title']) && $row5_button['title'] ) ? $row5_button['title'] : '';
			$btn5Link = ( isset($row5_button['url']) && $row5_button['url'] ) ? $row5_button['url'] : '';
			if( $row5_title || $row5_text || $row5_button ) { ?>
			<div id="bottom-blue" class="bottom-blue-area">
				<div class="wrapper text-center">
					<?php if($row5_title) { ?>
					<h2 class="col-title"><?php echo $row5_title ?></h2>
					<?php } ?>

					<?php if($row5_text) { ?>
					<div class="small-text"><?php echo wpautop($row5_text) ?></div>
					<?php } ?>

					<?php if ($btn5Title && $btn5Link) { ?>
					<div class="button">
						<a href="<?php echo $btn5Link ?>" target="<?php echo $btn5Target ?>" class="btn-outline"><?php echo $btn5Title ?></a>
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
