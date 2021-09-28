<?php
/**
 * Custom functions that act independently of the theme templates.
 *
 * Eventually, some of the functionality here could be replaced by core features.
 *
 * @package bellaworks
 */

/**
 * Adds custom classes to the array of body classes.
 *
 * @param array $classes Classes for the body element.
 * @return array
 */
define('THEMEURI',get_template_directory_uri() . '/');

function bellaworks_body_classes( $classes ) {
    // Adds a class of group-blog to blogs with more than 1 published author.
    if ( is_multi_author() ) {
        $classes[] = 'group-blog';
    }

    // Adds a class of hfeed to non-singular pages.
    if ( ! is_singular() ) {
        $classes[] = 'hfeed';
    }

    if ( is_front_page() || is_home() ) {
        $classes[] = 'homepage';
    } else {
        $classes[] = 'subpage';
    }

    $browsers = ['is_iphone', 'is_chrome', 'is_safari', 'is_NS4', 'is_opera', 'is_macIE', 'is_winIE', 'is_gecko', 'is_lynx', 'is_IE', 'is_edge'];
    $classes[] = join(' ', array_filter($browsers, function ($browser) {
        return $GLOBALS[$browser];
    }));

    return $classes;
}
add_filter( 'body_class', 'bellaworks_body_classes' );


function add_query_vars_filter( $vars ) {
  $vars[] = "pg";
  return $vars;
}
add_filter( 'query_vars', 'add_query_vars_filter' );


function shortenText($string, $limit, $break=".", $pad="...") {
  // return with no change if string is shorter than $limit
  if(strlen($string) <= $limit) return $string;

  // is $break present between $limit and the end of the string?
  if(false !== ($breakpoint = strpos($string, $break, $limit))) {
    if($breakpoint < strlen($string) - 1) {
      $string = substr($string, 0, $breakpoint) . $pad;
    }
  }

  return $string;
}

function shortenText2($text, $max = 50, $append = '…') {
  if (strlen($text) <= $max) return $text;
  $return = substr($text, 0, $max);
  if (strpos($text, ' ') === false) return $return . $append;
  return preg_replace('/\w+$/', '', $return) . $append;
}

/* Fixed Gravity Form Conflict Js */
add_filter("gform_init_scripts_footer", "init_scripts");
function init_scripts() {
    return true;
}

function get_page_id_by_template($fileName) {
    $page_id = 0;
    if($fileName) {
        $pages = get_pages(array(
            'post_type' => 'page',
            'meta_key' => '_wp_page_template',
            'meta_value' => $fileName.'.php'
        ));

        if($pages) {
            $row = $pages[0];
            $page_id = $row->ID;
        }
    }
    return $page_id;
}

function string_cleaner($str) {
    if($str) {
        $str = str_replace(' ', '', $str); 
        $str = preg_replace('/\s+/', '', $str);
        $str = preg_replace('/[^A-Za-z0-9\-]/', '', $str);
        $str = strtolower($str);
        $str = trim($str);
        return $str;
    }
}

function format_phone_number($string) {
    if(empty($string)) return '';
    $append = '';
    if (strpos($string, '+') !== false) {
        $append = '+';
    }
    $string = preg_replace("/[^0-9]/", "", $string );
    $string = preg_replace('/\s+/', '', $string);
    return $append.$string;
}

function get_instagram_setup() {
    global $wpdb;
    $result = $wpdb->get_row( "SELECT option_value FROM $wpdb->options WHERE option_name = 'sb_instagram_settings'" );
    if($result) {
        $option = ($result->option_value) ? @unserialize($result->option_value) : false;
    } else {
        $option = '';
    }
    return $option;
}

function get_social_media() {
    $options = get_field("social_media","option");
    $icons = social_icons();
    $list = array();
    if($options) {
        foreach($options as $i=>$opt) {
            if( isset($opt['social_media_link']) && $opt['social_media_link'] ) {
                $url = $opt['social_media_link'];
                $parts = parse_url($url);
                $host = ( isset($parts['host']) && $parts['host'] ) ? $parts['host'] : '';
                if($host) {
                    foreach($icons as $type=>$icon) {
                        if (strpos($host, $type) !== false) {
                            $list[$i] = array('url'=>$url,'icon'=>$icon,'type'=>$type);
                        }
                    }
                }
            }
        }
    }

    return ($list) ? $list : '';
}

// function get_social_links() {
//     $social_types = social_icons();
//     $social = array();
//     foreach($social_types as $k=>$icon) {
//         if( $value = get_field($k,'option') ) {
//             $social[$k] = array('link'=>$value,'icon'=>$icon);
//         }
//     }
//     return $social;
// }

function social_icons() {
    $social_types = array(
        'facebook'  => 'fab fa-facebook',
        'twitter'   => 'fab fa-twitter',
        'linkedin'  => 'fab fa-linkedin',
        'instagram' => 'fab fa-instagram',
        'youtube'   => 'fab fa-youtube',
        'vimeo'  => 'fab fa-vimeo',
    );
    return $social_types;
}

function parse_external_url( $url = '', $internal_class = 'internal-link', $external_class = 'external-link') {

    $url = trim($url);

    // Abort if parameter URL is empty
    if( empty($url) ) {
        return false;
    }

    //$home_url = parse_url( $_SERVER['HTTP_HOST'] );     
    $home_url = parse_url( home_url() );  // Works for WordPress

    $target = '_self';
    $class = $internal_class;

    if( $url!='#' ) {
        if (filter_var($url, FILTER_VALIDATE_URL)) {

            $link_url = parse_url( $url );

            // Decide on target
            if( empty($link_url['host']) ) {
                // Is an internal link
                $target = '_self';
                $class = $internal_class;

            } elseif( $link_url['host'] == $home_url['host'] ) {
                // Is an internal link
                $target = '_self';
                $class = $internal_class;

            } else {
                // Is an external link
                $target = '_blank';
                $class = $external_class;
            }
        } 
    }

    // Return array
    $output = array(
        'class'     => $class,
        'target'    => $target,
        'url'       => $url
    );

    return $output;
}

function get_images_dir($fileName=null) {
    return get_bloginfo('template_url') . '/images/' . $fileName;
}

/* Remove richtext editor on specific page */
function remove_pages_editor(){
    global $wpdb;
    $post_id = ( isset($_GET['post']) && $_GET['post'] ) ? $_GET['post'] : '';
    $disable_editor = array();
    if($post_id) {        
        $page_ids_disable = get_field("disable_editor_on_pages","option");
        if( $page_ids_disable && in_array($post_id,$page_ids_disable) ) {
            remove_post_type_support( 'page', 'editor' );
        }
    }
}   
add_action( 'init', 'remove_pages_editor' );


function has_job_list() {
  global $wpdb;
  $result = $wpdb->get_row( "SELECT ID FROM $wpdb->posts WHERE post_type = 'careers' AND post_status='publish' LIMIT 1" );
  return ($result) ? true : false;
}

function extract_map_id($shortcode) {
  if( empty($shortcode) ) return '';
  $shortcode = str_replace('[','',$shortcode);
  $shortcode = str_replace(']','',$shortcode);
  $parts = explode("wpgmza",$shortcode);
  $id = '';
  if($parts && array_filter($parts)) {
      foreach(array_filter($parts) as $p) {
          if( $str = array_filter(explode("id=",$p)) ) {
              foreach($str as $s) {
                $s = string_cleaner($s);
                $id = preg_replace('/[^A-Za-z0-9\-]/', '', $s);
              }
          }
          
      }
  }
  return $id;
}

function get_marker_listing($map_shortcode) {
  global $wpdb;
  $listing = array();
  if( $map_id = extract_map_id($map_shortcode) ) {
    $prefix = $wpdb->prefix;
    $table = $prefix . 'wpgmza';
    $query = "SELECT * FROM  $table WHERE map_id=" . $map_id . " ORDER BY title ASC";
    $result = $wpdb->get_results($query);
    if($result) {
      foreach($result as $row) {
        $id = $row->id;
        $icon = ($row->icon) ? @json_decode($row->icon) : '';
        $row->icon = ( isset($icon->url) && $icon->url ) ? $icon->url : '';
        $cat_ids = get_map_location_category($id);
        $row->categories = array();
        //echo "<pre>";
        $custom_fields = get_location_custom_fields($id);
        $row->custom_fields = ($custom_fields) ? $custom_fields : '';
        if( $cat_ids ) {
          foreach($cat_ids as $c) {
            $catid = $c->category_id;
            if( $cat = get_map_category($catid) ) {
              $arg = new stdClass();
              $catIcon = ($cat->category_icon) ? @json_decode($cat->category_icon) : '';
              $arg->category_id = $catid;
              $arg->category_name = $cat->category_name;
              $arg->category_icon = ( isset($catIcon->url) && $catIcon->url ) ? $catIcon->url : '';
              $row->categories[] = $arg;
            }
          }        
        }

        // print_r($row);
        // echo "</pre>";     
        $listing[] = $row;
      }
    }
  }
  return $listing;
}

function get_map_location_category($marker_id) {
  global $wpdb;
  $prefix = $wpdb->prefix;
  $table = $prefix . 'wpgmza_markers_has_categories';
  $query = "SELECT category_id FROM  $table WHERE marker_id=" . $marker_id;
  $result = $wpdb->get_results($query);
  return ($result) ? $result : '';
}

function get_map_category($catid,$field=null) {
  global $wpdb;
  $prefix = $wpdb->prefix;
  $table = $prefix . 'wpgmza_categories';
  if($field) {
    $query = "SELECT $field FROM  $table WHERE id=" . $catid;
    $result = $wpdb->get_row($query);
    return ($result) ? $result->$field : '';
  } else {
    $query = "SELECT * FROM  $table WHERE id=" . $catid;
    $result = $wpdb->get_row($query);
    return ($result) ? $result : '';
  }
}

function get_map_category_list() {
  global $wpdb;
  $prefix = $wpdb->prefix;
  $markers = $prefix . 'wpgmza';
  $categories = $prefix . 'wpgmza_categories';
  $relation = $prefix . 'wpgmza_markers_has_categories';
  $query = "SELECT cat.id AS category_id, cat.category_name FROM  $relation rel, $markers marker, $categories cat 
            WHERE marker.id=rel.marker_id AND rel.category_id=cat.id GROUP BY cat.id ORDER BY cat.id ASC";
  $result = $wpdb->get_results($query);
  return ($result) ? $result : '';
}

function get_location_custom_fields($id) {
  global $wpdb;
  $prefix = $wpdb->prefix;
  $table1 = $prefix . 'wpgmza_markers_has_custom_fields';
  $table2 = $prefix . 'wpgmza_custom_fields';
  $query = "SELECT  t1.*,t2.name,t2.icon AS field_icon, t2.stack_order FROM  $table1 t1, $table2 t2 WHERE t1.field_id=t2.id 
            AND t1.object_id=" . $id;
  $result = $wpdb->get_results($query);
  return ($result) ? $result : '';
}


function page_has_hero() {
  $banner = get_field("banner");
  if( is_tax('divisions') ) {
    $banner = get_field("divisions_main_photo","option");
  }
  if( is_singular('project') ) {
    $parent_id = get_page_id_by_template('page-projects');
    $banner = get_field("banner",$parent_id);
  }
  if( is_front_page() || is_home() ) {
    $banner = true;
  }
  return ($banner) ? true : false;
}

// add_menu_page(
//   'Divisions', // Page Title
//   'Divisions', // Menu Title
//   'manage_options', // Capabiliy
//   './edit-tags.php?taxonomy=divisions&post_type=team', // Menu_slug
//   '', // function
//   'dashicons-location-alt', // icon_url
//   26   // position
// );

/* Add richtext editor to category description */
// remove the html filtering
remove_filter( 'pre_term_description', 'wp_filter_kses' );
remove_filter( 'term_description', 'wp_kses_data' );

// $taxonomy_edit_form_fields
add_filter('divisions_edit_form_fields', 'cat_description');
function cat_description($tag)
{
    ?>
        <table class="form-table">
            <tr class="form-field">
                <th scope="row" valign="top"><label for="description"><?php _ex('Description', 'Taxonomy Description'); ?></label></th>
                <td>
                <?php
                  $settings = array('wpautop' => true, 'media_buttons' => true, 'quicktags' => true, 'textarea_rows' => '15', 'textarea_name' => 'description' );
                  wp_editor(wp_kses_post($tag->description , ENT_QUOTES, 'UTF-8'), 'cat_description', $settings);
                ?>
                <br />
                <span class="description"><?php _e('The description is not prominent by default; however, some themes may show it.'); ?></span>
                </td>
            </tr>
        </table>
    <?php
}

add_action('admin_head', 'remove_default_category_description');
function remove_default_category_description()
{
  global $current_screen;
  $currentLink = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
  if ( $current_screen->id == 'edit-divisions' )
  {
  ?>
      <script type="text/javascript">
      jQuery(function($) {
          $('textarea#description').closest('tr.form-field').remove();
      });
      </script>
  <?php
  }
  if( isset($_GET['taxonomy']) && $_GET['taxonomy']=='divisions' && (strpos($currentLink, 'edit-tags') !== false) ) { ?>
    <style type="text/css">
      body.taxonomy-divisions .term-description-wrap, 
      body.taxonomy-divisions #acf-term-fields {
        display: none!important;
      }
    </style>
  <?php
  }
}

/* Remove description column in the wp table list */
add_filter('manage_edit-divisions_columns', function ( $columns ) {
  if( isset( $columns['description'] ) )
      unset( $columns['description'] );   
  return $columns;
} );


/* ACF CUSTOM OPTIONS TABS */
if( function_exists('acf_add_options_page') ) {
  acf_add_options_sub_page(array(
    'page_title'  => 'Divisions Options',
    'menu_title'  => 'Divisions Options',
    'parent_slug' => 'edit.php?post_type=team'
  ));
  // acf_add_options_sub_page(array(
  //   'page_title'  => 'Projects Options',
  //   'menu_title'  => 'Options',
  //   'parent_slug' => 'edit.php?post_type=project'
  // ));
}


/* SAVE ACF */
// add_action('acf/save_post', 'my_acf_save_post');
// function my_acf_save_post( $post_id ) {
//   global $wpdb;

//   $prefix = $wpdb->prefix;
//   $table1 = $prefix . 'wpgmza';
//   $table2 = $prefix . 'wpgmza_markers_has_categories';
//   $marker_id = '';
//   $lat_long_strs = '';
//   $lat = '';
//   $long = '';
//   $lastid = '';

//   $latlong = get_field("latlong",$post_id);
//   $lat_long_strs = ($latlong) ? preg_replace("/\s+/", "", $latlong) : '';
//   if( $lat_long_strs ) {
//     $parts = explode(",",$lat_long_strs);
//     $lat = ( isset($parts[0]) ) ? $parts[0] : '';
//     $long = ( isset($parts[1]) ) ? $parts[1] : '';
//     $query = "SELECT id FROM $table1 WHERE lat='".$lat."' AND lng='".$long."'";
//     $result = $wpdb->get_row($query);
//     $marker_id = ($result) ? $result->id : '';
//   }

//   /* If exists update entry */
//   $default_map_id = 1;
//   $terms = get_the_terms($post_id,'location-type');
//   $icon_value = '';
//   $post_title = get_the_title($post_id);

//   if( $marker_id ) {

//     $arg = array(
//       'map_id'    => $default_map_id,
//       'address'   => $lat_long_strs,
//       'icon'      => $icon_value,
//       'lat'       => $lat,
//       'lng'       => $long,
//       'title'     => $post_title,
//       'approved'  => 1,
//       'retina'    => 1
//     );
    

//     //$wpdb->update('table_name', array('id'=>$id, 'title'=>$title, 'message'=>$message), array('id'=>$id));

//   } else {

//     /* If not exists insert entry */
//     $term_count = ($terms) ? count($terms) : 0;
//     if($term_count>1) {
//       $icon['url'] = get_template_directory_uri() . '/images/markers/marker_all.png';
//       $icon['retina'] = false;
//       $icon_value = @json_encode($icon);
//     }
//     else if($term_count==1) {
//       $cat = $terms[0]->slug;
//       if($cat=='facilities') {
//         $icon['url'] = get_template_directory_uri() . '/images/markers/marker_facility.png';
//         $icon['retina'] = false;
//         $icon_value = @json_encode($icon);
//       }
//       else if($cat=='offices') {
//         $icon['url'] = get_template_directory_uri() . '/images/markers/marker_office.png';
//         $icon['retina'] = false;
//         $icon_value = @json_encode($icon);
//       }
//     }

//     $arg = array(
//       'map_id'    => $default_map_id,
//       'address'   => $lat_long_strs,
//       'icon'      => $icon_value,
//       'lat'       => $lat,
//       'lng'       => $long,
//       'title'     => $post_title,
//       'approved'  => 1,
//       'retina'    => 1
//     );

//     $wpdb->insert($table1,$arg);
//     $lastid = $wpdb->insert_id;
//     if($lastid) {

//       if( $terms ) {
//         foreach($terms as $term) {
//           $term_id = $term->name;
//           $map_cat_id = get_map_category_id($term_id);
//           if($map_cat_id) {
//             $map_arg = array(
//               'marker_id'   => $lastid,
//               'category_id' => $map_cat_id
//             );
//             $wpdb->insert($table2,$map_arg);
//           }
//         }
//       }
//     }

//   }
  
// }

// function get_map_marker_data($address) {
//   global $wpdb;
//   $prefix = $wpdb->prefix;
//   $table1 = $prefix . 'wpgmza';
//   if( empty($title) ) return '';
//   $result = $wpdb->get_row( "SELECT id FROM $table1 WHERE address = '".$address."'" );
//   return ($result) ? $result->id : '';
// }

// function get_map_category_id($catName) {
//   global $wpdb;
//   if( empty($catName) ) return '';
//   $prefix = $wpdb->prefix;
//   $table2 = $prefix . 'wpgmza_categories';
//   $result = $wpdb->get_row( "SELECT id FROM $table2 WHERE category_name = '".$catName."'" );
//   return ($result) ? $result->id : '';
// }


function getProtectedValue($obj, $name) {
  $array = (array)$obj;
  $prefix = chr(0).'*'.chr(0);
  return $array[$prefix.$name];
}





