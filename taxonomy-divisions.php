<?php
/**
 * The template for displaying all pages.
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site may use a
 * different template.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package bellaworks
 */
$obj = get_queried_object();
$current_term_name = ( isset($obj->name) && $obj->name ) ? $obj->name : '';
$current_term_id = ( isset($obj->term_id) && $obj->term_id ) ? $obj->term_id : '';
$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("divisions_main_photo","option");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
$taxonomy = ( isset($obj->taxonomy) && $obj->taxonomy ) ? $obj->taxonomy : '';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template tax-divisions <?php echo $has_banner ?>">
	

	<?php  
	$categories = get_categories( array('taxonomy'=>$taxonomy) );
	if( $categories ) { ?>
	<div class="term-divisions">
		<div class="wrapper">
			<div class="inner">
			<?php foreach ($categories as $term) { 
				$term_id = $term->term_id;
				$term_name = $term->name;
				$term_link = get_term_link($term);
				$is_active = ($term_id==$current_term_id) ? ' active':'';
				?>
			 	<div class="term<?php echo $is_active ?>"><a href="<?php echo $term_link ?>"><?php echo $term_name ?></a></div>
			<?php } ?>
			</div>
		</div>
	</div>
	<?php } ?>


	<?php  
	$field_id = $taxonomy.'_'.$current_term_id;
	$description = term_description($obj);
	$term_image = get_field("division_featured_image",$field_id);
  $multiple_images = get_field("divisionFeaturedImages",$field_id);
  $term_has_images = ($term_image || $multiple_images) ? true : false;
  $count_images = ($multiple_images) ? count($multiple_images) : '';
	$mailing = get_field("division_mailing",$field_id);
  $numcols = get_field("numcols",$field_id);
  $numcolClass = ($numcols) ? ' numcols-'.$numcols:'';
	$mailing_address = ( isset($mailing['address']) && $mailing['address'] ) ? $mailing['address'] : '';
	$sales = get_field("division_york_sales",$field_id);
	$sales_office_info = array();
	if($sales) {
		foreach($sales as $k=>$v) {
			if($v) {
				$sales_office_info[$k] = $v;
			}
		}
	}

	$specialty = get_field("division_specialty",$field_id);
	$specialty_info = array();
	if($specialty) {
		foreach($specialty as $a=>$b) {
			if($b) {
				$specialty_info[$a] = $b;
			}
		}
	}

	$locations = get_field("location",$field_id);
	//$has_extra_fields = ($mailing_address || $sales_office_info || $specialty_info) ? true : false;
	$div_class = ( ($description || $locations || $mailing_address) && $term_has_images ) ? 'twocol':'onecol';
	if($description || $term_has_images || $locations ) { ?>
  	
    <div class="project-description-area divisions <?php echo $div_class ?>">
  		<div class="wrapper">
  			<div class="flexwrap">
  				<?php if ($description || $locations ) { ?>
  				<div class="project-info left<?php echo $numcolClass ?>">
  					<div class="inside">
  						<div class="wrap">
  							<h2 class="term-name"><?php echo $current_term_name ?></h2>
  							<?php if ($description) { ?>
  							<div class="description">
  								<?php echo email_obfuscator($description) ?>	
  							</div>
  							<?php } ?>

  							<?php if ( $locations || $mailing_address) { ?>
  							<div class="division-info">
  								<?php if ($mailing_address) { ?>
  								<div class="info mailing-address">
  									<div class="title">Mailing Address</div>
  									<div class="val v_address"><?php echo $mailing_address ?></div>
  								</div>
  								<?php } ?>

  								<?php foreach ($locations as $k=>$obj) { 
  									if($obj['location_title']) { 
  										$slug_loc = ($obj['location_title']) ?  sanitize_title($obj['location_title']) : '';
  										?>
  										<div class="info <?php echo $k ?>-info">
  											<div class="title"><?php echo $obj['location_title'] ?></div>
  											<?php unset($obj['location_title']); ?>
  											<?php foreach($obj as $k=>$val) { 
  												if($val) { ?>
  													<div class="val v_<?php echo $k ?>"><?php echo $val ?></div>
  												<?php } ?>
  											<?php } ?>
  										</div>
  									<?php } ?>
  								<?php } ?>
  							</div>
  							<?php } ?>
  						</div>
  					</div>
  				</div>	
  				<?php } ?>

  				<?php if ($multiple_images) { ?>
  				<div class="project-info right">

            <?php if ($count_images==1) { ?>
  					<div class="image single-photo" style="background-image:url('<?php echo $multiple_images[0]['url'] ?>')">
  						<img src="<?php echo get_images_dir('rectangle-lg.png') ?>" alt="" aria-hidden="true" class="helper">
  					</div>
            <?php } else if($count_images>1) { ?>
            <div class="image multiple-photos">
              <div class="project-slider">
                <div class="swiper">
                  <div class="swiper-wrapper">
                    <?php foreach ($multiple_images as $p) { ?>
                      <div class="swiper-slide" style="background-image:url('<?php echo $p['url'] ?>')">
                        <img src="<?php echo $p['url'] ?>" alt="<?php echo $p['title'] ?>" style="display:none;" />
                        <?php if ( $p['caption'] ) { ?>
                         <div class="photo-caption"><div class="caption"><?php echo $p['caption']; ?></div></div> 
                        <?php } ?>
                      </div>
                    <?php } ?>
                  </div>
                  
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                  
                </div>
                <img src="<?php echo get_images_dir('rectangle-lg.png') ?>" alt="" class="helper">
              </div>
            </div>
            <?php } ?>

          </div>	
  				<?php } ?>
  			</div>
  		</div>
  	</div>

    <?php if ($numcols) { ?>
    <style type="text/css">
      .project-description-area.divisions .project-info.left .inside {
        padding-left: 30px;
        padding-right: 30px;
        padding-bottom: <?php echo ($numcols>1) ? ' 50px':' 30px'; ?>;
      }
      .project-description-area.divisions .project-info.left .division-info .info {
        margin-top: 0;
        margin-bottom: 40px;
      }
      .project-description-area.divisions .project-info.left .division-info .info:last-child {
        margin-bottom: 0;
      }
      .project-description-area.divisions .project-info.left .division-info {
        column-count: <?php echo $numcols ?>;
        column-gap: 3em;
      }
      @media screen and (max-width: 960px) {
        <?php if ($numcols>2) { ?>
        .project-description-area.divisions .project-info.left .division-info {
          column-count: 2;
        }
        <?php } ?>
      }
      @media screen and (max-width: 768px) {
        .project-description-area.divisions .project-info.left .division-info {
          column-count: 1;
        }
      }
    </style>
    <?php } ?>

  <?php } ?>

	<?php /* AVAILABLE JOBS */ ?>
	<?php
	$args = array(
		'posts_per_page'	=> 6,
		'post_type'				=> 'careers',
		'post_status'			=> 'publish',
		'orderby'					=> 'date',
		'order'						=> 'DESC'
	);
	$careers = get_posts($args);
	$job_title = get_field("divisions_job_title","option");
	$job_button = get_field("divisions_job_button","option");
	$jobBtnTarget = ( isset($job_button['target']) && $job_button['target'] ) ? $job_button['target'] : '_self';
	$jobBtnTitle = ( isset($job_button['title']) && $job_button['title'] ) ? $job_button['title'] : '';
	$jobBtnLink = ( isset($job_button['url']) && $job_button['url'] ) ? $job_button['url'] : '';

	if($careers) { ?>
	<div class="available-jobs-area">
		<div class="wrapper text-center">
			<?php if ($job_title) { ?>
				<h2 class="mid-title"><?php echo $job_title ?></h2>
			<?php } ?>

			<div class="careers">
				<?php foreach ($careers as $c) { 
					$pagelink = get_permalink($c->ID); ?>
					<div class="job"><a href="<?php echo $pagelink ?>"><?php echo $c->post_title ?></a></div>
				<?php } ?>
			</div>

			<?php if ($jobBtnTitle && $jobBtnLink) { ?>
			<div class="button">
				<a href="<?php echo $jobBtnLink ?>" target="<?php echo $jobBtnTarget ?>" class="btn-default sm"><?php echo $jobBtnTitle ?></a>
			</div>
			<?php } ?>
		</div>
	</div>
	<?php } ?>


	<!-- BLUE SECTION with Left and Right Arrow -->
	<?php get_template_part('parts/blue-section') ?>

</div><!-- #primary -->

<?php
get_footer();
