<?php
$perpage = 21;
//$perpage = 3;
$paged = ( get_query_var( 'pg' ) ) ? absint( get_query_var( 'pg' ) ) : 1;
$args = array(
	'post_type'				=> 'project',
	'post_status'			=> 'publish',
	'posts_per_page'	=> $perpage,
	'paged'						=> $paged
);
$projects = new WP_Query($args);
if ( $projects->have_posts() ) { 
	$total_pages = $projects->max_num_pages;
	$totalpost = $projects->found_posts; 
?>
<section class="section projects-list cf">
	<div id="list-container" class="wrapper">
		<div class="flexwrap result">
			<?php while ( $projects->have_posts() ) : $projects->the_post();
			$id = get_the_ID();
			$photo = get_field("main_photo");
			$pagelink = get_permalink();
			$title = get_the_title();
			?>
			<div class="imagebox animated fadeIn <?php echo ($photo) ? 'hasphoto':'nophoto'; ?>">
				<div class="wrap">
					<a href="<?php echo $pagelink ?>" class="link">
						<span class="caption"><span class="title"><?php echo $title ?></span></span>
						<?php if ($photo) { ?>
							<span class="bg" style="background-image:url('<?php echo $photo['url'] ?>')"></span>
						<?php } ?>
						<img src="<?php echo get_images_dir('rectangle-lg.png') ?>" alt="" aria-hidden="true" class="helper">
					</a>
				</div>
			</div>
			<?php endwhile; wp_reset_postdata(); ?>
		</div>
	</div>
	<div class="hidden-items" style="display:none;"></div>

	<?php if ($total_pages > 1){ ?>
		<div id="pagination" class="pagination" style="display:none;">
      <?php
          $pagination = array(
              'base' => @add_query_arg('pg','%#%'),
              'format' => '?paged=%#%',
              'current' => $paged,
              'total' => $total_pages,
              'prev_text' => __( '&laquo;', 'red_partners' ),
              'next_text' => __( '&raquo;', 'red_partners' ),
              'type' => 'plain'
          );
          echo paginate_links($pagination);
      ?>
  	</div>
  	<div class="button-more">
  		<div class="wrapper">
  			<a href="#" id="page-more-btn" data-baseurl="<?php echo get_permalink() ?>" data-next="2" data-pagetotal="<?php echo $total_pages ?>" data-result="<?php echo $totalpost ?>" class="btn-default yellow">Load More</a>
  		</div>
  	</div>
	<?php } ?>
</section>
<?php } ?>