<!DOCTYPE HTML>
<html lang="en" style="background: #1c1c1c;">

<head>

<meta charset="<?php bloginfo('charset'); ?>" />
<link rel="profile" href="http://gmpg.org/xfn/11" />

<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
<meta http-equiv="cache-control" content="no-cache" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

<title>Visual Editor: Loading</title>

<?php do_action('headway_visual_editor_head'); ?>

</head><!-- /head -->

<!-- This background color has been inlined to reduce the white flicker during loading. -->
<body class="visual-editor-open visual-editor-mode-<?php echo HeadwayVisualEditor::get_current_mode(); ?> <?php echo join(' ', get_body_class()); ?>" style="background: #1c1c1c;">

<?php do_action('headway_visual_editor_body_open'); ?>

<div id="ve-loading-overlay">
	<div class="cog-container"><div class="cog-bottom-left"></div><div class="cog-top-right"></div></div>
</div><!-- #ve-loading-overlay -->
	
<div id="menu">
	<span id="logo"></span>
	
	<ul id="modes">
		<?php do_action('headway_visual_editor_modes'); ?>
	</ul>
	
	<div id="menu-right">
		
		<div id="menu-links">
			<ul>
				<?php do_action('headway_visual_editor_menu_links'); ?>
			</ul>
		</div>
		
		<div id="current-layout">			
			<?php do_action('headway_visual_editor_page_switcher'); ?>
		</div>
		
		<div id="save-button-container" class="save-button-container">
			<span id="save-button" class="save-button">Save</span>
			<span id="inactive-save-button" class="save-button tooltip-top-right" title="Nothing to save at this time.&emsp;&lt;em&gt;Shortcut: Ctrl + S&lt;/em&gt;">Save</span>
		</div>

		<?php
		if ( HeadwayVisualEditor::is_mode('grid') )
			echo '
			<div id="preview-button-container" class="save-button-container">
				<span class="save-button preview-button tooltip-top-right" id="preview-button" title="Click to hide the grid and show how the website looks before saving.">Preview</span>
				<span class="save-button preview-button" id="inactive-preview-button">Preview</span>
			</div>
			';
		?>
		
	</div><!-- #menu-right -->
</div><!-- #menu -->

<!-- Big Boy iframe -->
<div id="iframe-container">
	<?php
	$layout_url = HeadwayVisualEditor::get_current_mode() == 'grid' ? home_url() : HeadwayLayout::get_url(HeadwayLayout::get_current());

	$iframe_url = add_query_arg(array(
		've-iframe' => 'true', 
		've-layout' => HeadwayLayout::get_current(), 
		've-iframe-mode' => HeadwayVisualEditor::get_current_mode(), 
		'rand' => rand(1, 999999)
	), $layout_url);

	echo '<iframe id="content" class="content" src="' . $iframe_url . '" scrolling="no"></iframe>';

	if ( HeadwayVisualEditor::is_mode('grid') )
		echo '<iframe id="preview" class="content" src="" style="display: none;" scrolling="no"></iframe>';

	echo '<div id="iframe-overlay"></div>';
	echo '<div id="iframe-loading-overlay"><div class="cog-container"><div class="cog-bottom-left"></div><div class="cog-top-right"></div></div></div>';

	?>
</div>
<!-- #iframe#content -->

<div id="panel">
				
	<ul id="panel-top">
				
		<?php do_action('headway_visual_editor_panel_top'); ?>
		
	</ul><!-- #ul#panel-top -->
		
	<?php do_action('headway_visual_editor_content'); ?>


</div><!-- div#panel -->

<div id="boxes">
	<?php do_action('headway_visual_editor_boxes'); ?>
</div><!-- div#boxes -->

<?php do_action('headway_visual_editor_footer'); ?>

<div id="notification-center"></div>
	
</body>
</html>