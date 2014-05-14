<?php
class HeadwayVisualEditorIframeGrid {


	public static function display_grid_blocks($blocks, $wrapper) {
		
		echo '<div class="grid-container">';
				
			if ( is_array($blocks) ) {

				foreach ($blocks as $block_id => $block) {
						
					HeadwayBlocks::display_block($block, 'grid');

				}

			}

			/* Mirrored wrapper notice */
				$mirror_wrapper_id = HeadwayWrappers::format_wrapper_id(headway_get('mirror-wrapper', $wrapper));
				$mirror_wrapper = $mirror_wrapper_id ? HeadwayWrappers::get_wrapper($mirror_wrapper_id) : null;
				$mirror_wrapper_layout = $mirror_wrapper ? HeadwayLayout::get_name(headway_get('layout', $mirror_wrapper)) : null;
				$mirror_wrapper_alias = headway_get('alias', $mirror_wrapper) ? '(' . headway_get('alias', $mirror_wrapper) . ')' : null;

				echo '<div class="wrapper-mirror-notice">
						<div>
						<h2>Wrapper Mirrored</h2>
						<p>This wrapper is mirroring the blocks from Wrapper #<span class="wrapper-mirror-notice-id">' . $mirror_wrapper_id . '</span> <span class="wrapper-mirror-notice-alias">' . $mirror_wrapper_alias . '</span> <span class="wrapper-mirror-notice-layout">from "' . $mirror_wrapper_layout . '" layout</span></p>
						<small>Mirroring can be disabled via Wrapper Options in the right-click menu</small>
						</div>
					</div><!-- .wrapper-mirror-notice -->';
			/* End mirrored wrapper notice */

		echo '</div><!-- .grid-container -->';
		
	}


	public static function display_canvas() {

		echo '<!DOCTYPE HTML>
		<html lang="en">

		<head>

			<meta charset="' . get_bloginfo('charset') . '" />
			<link rel="profile" href="http://gmpg.org/xfn/11" />

			<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
			<meta http-equiv="cache-control" content="no-cache" />

			<title>Visual Editor Grid: ' . wp_title(false, false) . '</title>';

			do_action('headway_grid_iframe_head');

		echo '</head><!-- /head -->

		<body class="visual-editor-iframe-grid ' . join(' ', get_body_class()) . '">';

			$wrappers = HeadwayWrappers::get_layout_wrappers(HeadwayLayout::get_current_in_use());
			$blocks = HeadwayBlocksData::get_blocks_by_layout(HeadwayLayout::get_current_in_use());
		
			echo '<div id="whitewrap" data-wrappers="' . htmlspecialchars(json_encode($wrappers)) . '">';

			foreach ( $wrappers as $wrapper_id => $wrapper_settings ) {

				/* Setup wrapper classes */
					$wrapper_classes = array('wrapper');

					$wrapper_classes[] = headway_get('use-independent-grid', $wrapper_settings) ? 'independent-grid' : null;
					$wrapper_classes[] = $wrapper_settings['fluid'] ? 'wrapper-fluid' : 'wrapper-fixed';
					$wrapper_classes[] = $wrapper_settings['fluid'] && $wrapper_settings['fluid-grid'] ? 'wrapper-fluid-grid' : 'wrapper-fixed-grid';

					if ( HeadwayWrappers::get_wrapper_mirror($wrapper_settings) )
						$wrapper_classes[] = 'wrapper-mirrored';

				/* Populate wrapper with its blocks */
					$wrapper_blocks = array();

					foreach ( $blocks as $block_id => $block ) {

						/* Grab blocks belonging to this wrapper */
						if ( headway_get('wrapper', $block, HeadwayWrappers::$default_wrapper_id) === $wrapper_id )
							$wrapper_blocks[$block_id] = $block;

						/* If last wrapper, grab all blocks on this layout with invalid wrapper IDs to make sure they're editable somewhere */
						$last_wrapper_id = array_slice(array_keys($wrappers), -1, 1);
						$last_wrapper_id = $last_wrapper_id[0];

						if ( $last_wrapper_id == $wrapper_id && !headway_get(headway_get('wrapper', $block, HeadwayWrappers::$default_wrapper_id), $wrappers) )
							$wrapper_blocks[$block_id] = $block;

					}

				/* Output the wrapper */
				echo '<div id="' . $wrapper_id . '" class="' . implode(' ', array_filter($wrapper_classes)) . '">';

					echo '<div class="wrapper-mirror-overlay"></div><!-- .wrapper-mirror-overlay -->';
				
					self::display_grid_blocks($wrapper_blocks, $wrapper_settings);
				
				echo '</div><!-- #wrapper-' . $wrapper_id . ' -->';

			}

		echo '<div id="wrapper-buttons-template">';
			echo '<div class="wrapper-top-margin-handle wrapper-handle wrapper-margin-handle" title="Drag to change wrapper top margin"><span></span><span></span><span></span></div>';
			echo '<div class="wrapper-drag-handle wrapper-handle tooltip tooltip-right" title="Drag to change wrapper order"><span></span><span></span><span></span></div>';
			echo '<div class="wrapper-bottom-margin-handle wrapper-handle wrapper-margin-handle" title="Drag to change wrapper bottom margin"><span></span><span></span><span></span></div>';

			echo '<div class="wrapper-options tooltip tooltip-right" title="Click to open wrapper options"><span></span></div>';
		echo '</div><!-- .wrapper-buttons -->';


		do_action('headway_grid_iframe_footer');
			
		echo '</div><!-- #whitewrap -->
		</body>
		</html>';

	}


	public static function show() {

		//Prevent any type of caching on this page
		define('DONOTCACHEPAGE', true);
		define('DONOTMINIFY', true);
		
		add_action('headway_grid_iframe_head', array(__CLASS__, 'print_styles'), 12);
		add_action('headway_grid_iframe_styles', array(__CLASS__, 'enqueue_canvas_assets'));
		
		self::display_canvas();
		
	}


	public static function enqueue_canvas_assets() {

		HeadwayCompiler::register_file(array(
			'name' => 've-iframe-grid',
			'format' => 'less',
			'fragments' => array(
				HEADWAY_LIBRARY_DIR . '/media/css/reset.css',
				HEADWAY_LIBRARY_DIR . '/media/css/grid.css',
				HEADWAY_LIBRARY_DIR . '/media/css/block-basics.css',
				HEADWAY_LIBRARY_DIR . '/media/css/content-styling.css',
				HEADWAY_LIBRARY_DIR . '/media/css/alerts.css',
				HEADWAY_LIBRARY_DIR . '/visual-editor/css/editor-loading.css',
				HEADWAY_LIBRARY_DIR . '/visual-editor/css/editor-mixins.less',
				HEADWAY_LIBRARY_DIR . '/visual-editor/css/editor-iframe.less',
				HEADWAY_LIBRARY_DIR . '/visual-editor/css/editor-tooltips.less',
				HEADWAY_LIBRARY_DIR . '/visual-editor/css/editor-iframe-grid.less',
				HEADWAY_LIBRARY_DIR . '/visual-editor/css/editor-iframe-grid-block-content.less'
			),
			'require-hard-flush' => true,
			'iframe-cache' => true
		));

		HeadwayCompiler::register_file(array(
			'name' => 've-iframe-grid-dynamic',
			'format' => 'css',
			'fragments' => array(
				array('HeadwayDynamicStyle', 'wrapper')
			),
			'dependencies' => array(
				HEADWAY_LIBRARY_DIR . '/media/dynamic/style.php'
			)
		));

	}


	public static function print_styles() {
		
		global $wp_styles;
		$wp_styles = null;
		
		do_action('headway_grid_iframe_styles');
		
		wp_print_styles();
		
	}


}