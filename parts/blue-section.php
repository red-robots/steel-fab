<?php 
$blue_area_title = get_field("blue_section_title");
$blue_area_text = get_field("blue_section_text");
$blue_area_button = get_field("blue_section_button");
$blueBtnTarget = ( isset($blue_area_button['target']) && $blue_area_button['target'] ) ? $blue_area_button['target'] : '_self';
$blueBtnTitle = ( isset($blue_area_button['title']) && $blue_area_button['title'] ) ? $blue_area_button['title'] : '';
$blueBtnLink = ( isset($blue_area_button['url']) && $blue_area_button['url'] ) ? $blue_area_button['url'] : '';
if( $blue_area_title || $blue_area_text || $blue_area_button ) { ?>
<div id="bottom-blue" class="bottom-blue-area">
	<div class="wrapper text-center">
		<?php if($blue_area_title) { ?>
		<h2 class="col-title"><?php echo $blue_area_title ?></h2>
		<?php } ?>

		<?php if($blue_area_text) { ?>
		<div class="small-text"><?php echo wpautop($blue_area_text) ?></div>
		<?php } ?>

		<?php if ($blueBtnTitle && $blueBtnLink) { ?>
		<div class="button">
			<a href="<?php echo $blueBtnLink ?>" target="<?php echo $blueBtnTarget ?>" class="btn-outline"><?php echo $blueBtnTitle ?></a>
		</div>
		<?php } ?>
	</div>
</div>
<?php } ?>