<?php
/**
 * Template Name: Locations
 */

$placeholder = THEMEURI . 'images/rectangle.png';
$banner = get_field("banner");
$has_banner = ($banner) ? 'hasbanner':'nobanner';
get_header(); ?>

<div id="primary" class="content-area-full content-default page-default-template locations-page <?php echo $has_banner ?>">
  <main id="main" class="site-main" role="main">

    <?php while ( have_posts() ) : the_post(); ?>

      <?php if ( !$banner ) { ?>
      <div class="titlediv wrapper">
        <h1 class="page-title"><?php the_title(); ?></h1>
      </div>
      <?php } ?>

      <?php $map_shortcode = get_field("map_shortcode"); ?>

      <?php if ($map_shortcode && do_shortcode($map_shortcode)) { 
        $locations = get_marker_listing($map_shortcode);
        $marker_categories = get_map_category_list();
      ?>
      <div class="map-locations-section">
        <?php if ($marker_categories) { ?>
        <div class="legend">
          <div class="wrapper">
            <div class="info">
            <?php foreach ($marker_categories as $cat) { 
              $cat_slug = ($cat->category_name) ? sanitize_title($cat->category_name) : '';
              if($cat_slug) { ?>
              <span class="<?php echo $cat_slug ?>"><?php echo $cat->category_name ?></span>
              <?php } ?>
            <?php } ?>
            </div>
          </div>
        </div>
        <?php } ?>
        <div id="mapArea" class="wrapper">
          <?php echo do_shortcode($map_shortcode) ?>
        </div>

        <?php if ($locations) { ?>
        <div class="map-locations">
          <div class="wrapper">
            <div id="accordion">
            <?php $i=1; foreach ($locations as $row) { 
              $loc_name = $row->title;
              $loc_slug = ($row->title) ? sanitize_title($row->title) : '';
              $categories = ( isset($row->categories) && $row->categories ) ? $row->categories : '';
              $custom_fields = ( isset($row->custom_fields) && $row->custom_fields ) ? $row->custom_fields : '';
              $custom_fields_order = array();
              if($custom_fields) {
                foreach($custom_fields as $cc) {
                  $index = $cc->stack_order;
                  $custom_fields_order[$index] = $cc;
                }
              }

              if($custom_fields_order) {
                ksort($custom_fields_order);
              }

              $map_galleries = '';
              $other_data = ( isset($row->other_data) && $row->other_data ) ? @unserialize($row->other_data) : '';
              if( isset($other_data['gallery']) && $other_data['gallery'] ) {
                $map_galleries = getProtectedValue( $other_data['gallery'] ,'items' ); 
              }
              if($loc_name) { ?>
              <div id="panel_<?php echo $i?>" data-location="<?php echo $loc_slug ?>" class="panel">
                <a href="#" class="ptitle">
                  <?php if($categories) { ?>
                  <span class="marker">
                    <?php foreach ($categories as $cat) { 
                      $slug = sanitize_title($cat->category_name); ?>
                      <i class="icon icon-<?php echo $slug?>"></i>  
                    <?php } ?>
                  </span>
                  <?php } ?>
                  <span class="name"><?php echo $loc_name ?></span>
                </a>

                <?php if ($custom_fields_order) { ?>
                  <div class="pcontent <?php echo ($map_galleries) ? 'hasImages':'noImages' ?>">
                    <div class="m-info-wrap">
                      <div class="m-info left">
                        <?php
                          $division_page_link = '';
                          $division_link = '';
                          foreach ($custom_fields_order as $j=>$cf) {
                            $field_name_slug = ( isset($cf->name) && $cf->name ) ? sanitize_title($cf->name) : '';
                            if($field_name_slug=='division-url') {
                              unset($custom_fields_order[$j]);
                              if( $term = get_term($cf->value,'divisions') ) {
                                $division_link = get_term_link($term,'divisions');
                              }
                            }
                          }
                          if (filter_var($division_link, FILTER_VALIDATE_URL)) {
                            $division_page_link = $division_link;
                          }
                        ?>  
                        <ul class="info">
                          <?php foreach ($custom_fields_order as $k=>$cf) { 
                            
                            $field_name = $cf->name;
                            $field_name_slug = ($field_name) ? sanitize_title($field_name) : '';
                            $field_value = $cf->value;
                            $field_icon = ( isset($cf->field_icon) && $cf->field_icon ) ? 'si fa fa-'.$cf->field_icon : '';
                            if($field_name_slug=='division') {
                              $field_icon = 'si ci-steelfab';
                              if($division_page_link) {
                                $field_value = '<a href="'.$division_page_link.'">'.$field_value.'</a>';
                              }
                            }
                            if ($field_name && $field_value) { ?>
                            <li class="data-<?php echo $field_name_slug ?>">
                              <?php if ($field_icon) { ?>
                              <i class="<?php echo $field_icon ?>"></i> 
                              <?php } ?>

                              <?php if ($field_name) { ?>
                              <strong class="f-name"><?php echo $field_name ?>: </strong> 
                              <?php } ?>

                              <?php if ($field_value) { ?>
                                <span class="f-value"><?php echo $field_value ?></span> 
                              <?php } ?>
                            </li> 
                            <?php } ?>
                          <?php } ?>
                        </ul>
                      </div>

                      <?php if ($map_galleries) { 
                        $map_img_count = count($map_galleries); ?>
                        <div class="m-info right count-<?php echo $map_img_count; ?>">
                          <?php foreach ($map_galleries as $m) { 
                            $image_url = ($map_img_count>1) ? $m->thumbnail : $m->url;
                          ?>
                          <div class="map-img">
                            <div class="img" style="background-image:url('<?php echo $image_url ?>')">
                             <a href="<?php echo $m->url ?>" data-fancybox><img src="<?php echo get_images_dir('rectangle.png') ?>" alt="" class="helper" /></a>
                            </div>
                          </div>
                          <?php } ?>
                        </div>
                      <?php } ?>
                    </div>
                  </div>
                <?php } ?>

              </div>
              <?php $i++; } ?>
            <?php } ?>
            </div>
          </div>
        </div>  
        <?php } ?>
      </div>  
      <?php } ?>
        

      <!-- BLUE SECTION with Left and Right Arrow -->
      <?php get_template_part('parts/blue-section') ?>

    <?php endwhile; ?>

  </main><!-- #main -->

  <div class="diagonalLines">
    <div class="b1"></div>
    <div class="b2"></div>
    <div class="b3"></div>
    <div class="b4"></div>
    <div class="b5"></div>
    <div class="b6"></div>
  </div>
</div><!-- #primary -->

<script>
jQuery(document).ready(function($){
  $("#accordion .ptitle").on("click",function(e){
    e.preventDefault();
    if( $(this).next('.pcontent').length ) {
      $(".pcontent").not( $(this).next('.pcontent') ).slideUp();
      $(".panel").not( $(this).parents('.panel') ).removeClass('active');
      $(this).next('.pcontent').slideToggle();
      $(this).parents(".panel").toggleClass('active');
    }
  });

  $(document).on("click",".wpgmza_infowindow_title",function(e){
    var str = slugify( $(this).text() );
    var target = $('.panel[data-location="'+str+'"]');
    if (target.length) {
      e.preventDefault();
      var navHeight = $('#masthead').height();
      var offset = navHeight + 100;

      target.addClass('active');
      target.find('.pcontent').slideDown();
      $(".pcontent").not( target.find('.pcontent') ).slideUp();
      $(".panel").not( target ).removeClass('active');

      $('html, body').animate({
        scrollTop: target.offset().top - offset
      }, 1000, function() {
        target.focus();
        if (target.is(":focus")) {
          return false;
        } else {
          target.attr('tabindex','-1'); 
          target.focus();
        };
      });
    }
  });

  function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

});
</script>
<?php
get_footer();
