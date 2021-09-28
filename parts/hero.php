<?php  
//$is_subpage = ( is_front_page() || is_home() ) ? false : true;
if ( is_front_page() || is_home() ) { ?>

  <?php  
  $hero_type = get_field("hero_type");
  $hero_image = '';
  $hero_mp4 = '';
  $hero_ogg = '';
  if($hero_type=='image') {
    $hero_image = get_field("hero_image");
  } else if($hero_type=='video') {
    $hero_mp4 = get_field("hero_video_mp4");
    $hero_ogg = get_field("hero_video_ogg");
  }
  $row1_title = get_field("row1_title");
  $row1_text = get_field("row1_text");
  $row1_button = get_field("row1_button");
  $row1_target = ( isset($row1_button['target']) && $row1_button['target'] ) ? $row1_button['target'] : '_self';
  $hero_content = '';
  ob_start(); ?>
  <div class="wrapper">
    <div class="hero-caption">
      <div class="hero-text animated fadeIn">
        <?php if ($row1_title) { ?>
        <h2 class="col-title"><?php echo $row1_title ?></h2>
        <?php } ?>
        
        <?php if ($row1_text || $row1_button) { ?>
        <div class="col-text">
          <?php if ($row1_text) { ?>
          <div class="text">
            <?php echo $row1_text ?>
          </div>
          <?php } ?>

          <?php if ($row1_button && ( isset($row1_button['title']) && $row1_button['title'] ) ) { ?>
          <div class="button">
            <a href="<?php echo $row1_button['url'] ?>" target="<?php echo $row1_target ?>" class="start-btn"><?php echo $row1_button['title'] ?></a>
          </div>
          <?php } ?>
        </div>
        <?php } ?>
      </div>
    </div>
  </div>
  <?php 
  $hero_content = ob_get_contents(); 
  ob_get_clean();

  if($hero_type=='image') { ?>

    <?php if ($hero_image) { ?>
    <div id="home-row-1" class="home-row home-hero hero-image" style="background-image:url('<?php echo $hero_image['url'] ?>');">
      <?php echo $hero_content; ?>
      <div class="hero-bottom-line"><div class="wrapper"><div class="broken-lines"><span class="arrow animated fadeInDown"></span></div></div></div>
    </div>
    <?php } ?>

  <?php } else if( $hero_type=='video' ) { 
    if ($hero_mp4 || $hero_ogg) { ?>
      <div id="home-row-1" class="home-row home-hero hero-video">
        <div class="hero-inner-wrap">
          <div class="hero-video-content">
            <?php echo $hero_content; ?>
          </div>
          <div class="hero-video-wrap">
            <div class="video-wrap">
              <video width="960" height="720" autoplay controls muted loop>
                <?php if ($hero_mp4) { ?>
                  <source src="<?php echo $hero_mp4['url'] ?>" type="video/mp4">
                <?php } else if($hero_ogg) { ?>
                  <source src="<?php echo $hero_ogg['url'] ?>" type="video/ogg">
                <?php } ?>
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <img src="<?php echo get_images_dir('rectangle.png') ?>" alt="" class="video-helper">
        </div>
        <div class="hero-bottom-line"><div class="wrapper"><div class="broken-lines"><span class="arrow animated fadeInDown"></span></div></div></div>
      </div>
    <?php } ?>

  <?php } ?>


<?php } else {  

  $banner = get_field("banner");
  $page_title = get_the_title();
  if( is_singular('project') ) {
    $parent_id = get_page_id_by_template('page-projects');
    $page_title = get_the_title($parent_id);
    $banner = get_field("banner",$parent_id);
  }
  if( is_tax('divisions') ) {
    $banner = get_field("divisions_main_photo","option");
    $page_title = get_field("division_page_title","option");
  }
  if ($banner) { ?>
  <div class="subpage-banner" style="background-image:url('<?php echo $banner['url']?>')">
    <div class="wrapper text-center">
      <div class="inner">
        <h1 class="page-title"><?php echo $page_title; ?></h1>
      </div>
    </div>
  </div>
  <?php } ?>

<?php } ?>