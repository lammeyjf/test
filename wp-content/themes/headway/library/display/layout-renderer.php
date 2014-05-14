<?php
class HeadwayLayoutRenderer {


	private $id;


	private $blocks;


	private $wrappers;


	public function __construct() {

		$this->id = HeadwayLayout::get_current_in_use();
		$this->blocks = HeadwayBlocksData::get_blocks_by_layout($this->id);
		
		$this->wrappers = HeadwayWrappers::get_layout_wrappers($this->id);

	}


	public function display() {

		if ( !$this->blocks )
			return $this->display_no_blocks_message();

		foreach ( $this->wrappers as $wrapper_id => $wrapper_settings ) {

			$wrapper_id_for_blocks = $wrapper_id;

			/* Check if mirroring.  If mirroring, change wrapper ID to the wrapper being mirrored and preserve original ID for a later class */
				if ( $wrapper_being_mirrored = HeadwayWrappers::get_wrapper_mirror($wrapper_settings) ) {

					$mirrored_wrapper_id = $wrapper_being_mirrored['id'];
					$wrapper_id_for_blocks = $mirrored_wrapper_id;

					foreach ( HeadwayBlocksData::get_blocks_by_wrapper($wrapper_being_mirrored['layout'], $mirrored_wrapper_id) as $block_from_mirrored_wrapper )
						$this->blocks[$block_from_mirrored_wrapper['id']] = $block_from_mirrored_wrapper;

				}

			/* Grab blocks belonging to this wrapper */
				$wrapper_blocks = array();

				foreach ( $this->blocks as $block_id => $block ) {

					if ( headway_get('wrapper', $block, HeadwayWrappers::$default_wrapper_id) === $wrapper_id_for_blocks )
						$wrapper_blocks[$block_id] = $block;

					/* If there's only one wrapper and the block does not have a proper ID or is default, move it to that wrapper */
					if ( count($this->wrappers) === 1 && (headway_get('wrapper', $block) === null || headway_get('wrapper', $block) == 'wrapper-default' || !isset($this->wrappers[headway_get('wrapper', $block)])) )
						$wrapper_blocks[$block_id] = $block;

				}

			/* Setup wrapper classes */
				$wrapper_column_width = headway_get('use-independent-grid', $wrapper_settings) ? headway_get('column-width', $wrapper_settings) : HeadwayOption::get('column-width', false, HeadwayWrappers::$default_column_width);
				$wrapper_gutter_width = headway_get('use-independent-grid', $wrapper_settings) ? headway_get('gutter-width', $wrapper_settings) : HeadwayOption::get('gutter-width', false, HeadwayWrappers::$default_gutter_width);

				$wrapper_classes = array('wrapper');

				$wrapper_classes[] = $wrapper_settings['fluid'] ? 'wrapper-fluid' : 'wrapper-fixed';
				$wrapper_classes[] = HeadwayResponsiveGrid::is_active() ? 'responsive-grid' : null;
				$wrapper_classes[] = headway_get('use-independent-grid', $wrapper_settings) ? 'independent-grid' : null;
				$wrapper_classes[] = 'grid-' . ($wrapper_settings['fluid-grid'] || HeadwayResponsiveGrid::is_enabled() ? 'fluid' : 'fixed') . '-' . $wrapper_settings['columns'] . '-' . $wrapper_column_width . '-' . $wrapper_gutter_width;
				$wrapper_classes[] = $wrapper_being_mirrored ? 'wrapper-mirroring-' . HeadwayWrappers::format_wrapper_id($mirrored_wrapper_id) : null;
				
				$last_wrapper_id = array_slice(array_keys($this->wrappers), -1, 1);
				$last_wrapper_id = $last_wrapper_id[0];

				$first_wrapper_id = array_keys($this->wrappers);
				$first_wrapper_id = $first_wrapper_id[0];

				if ( $last_wrapper_id == $wrapper_id )
					$wrapper_classes[] = 'wrapper-last';
				else if ( $first_wrapper_id == $wrapper_id )
					$wrapper_classes[] = 'wrapper-first';

				/* Custom wrapper classes */
				$custom_css_classes = explode(' ', str_replace('  ', ' ', str_replace(',', ' ', htmlspecialchars(strip_tags(headway_get('css-classes', $wrapper_settings, ''))))));
				$wrapper_classes = array_merge($wrapper_classes, $custom_css_classes);

			/* Display the wrapper */	
				do_action('headway_before_wrapper');
			
				echo '<div id="' . $wrapper_id . '" class="' . implode(' ', array_unique(array_filter($wrapper_classes))) . '">' . "\n\n";
				
					do_action('headway_wrapper_open');

						$wrapper = new HeadwayGridRenderer($wrapper_blocks, $wrapper_settings);
						$wrapper->render_grid();
					
					do_action('headway_wrapper_close');
				
				echo '</div><!-- .wrapper -->' . "\n\n";
				
				do_action('headway_after_wrapper');
			/* End displaying wrapper */

		}

	}


	private function display_no_blocks_message() {
		
		echo '<div class="wrapper wrapper-no-blocks wrapper-fixed" id="wrapper-default">' . "\n\n";
			
			echo '<div class="block-type-content">';
		
				echo '<div class="entry-content">';
			
					echo '<h1 class="entry-title">' . __('No Content to Display', 'headway') . '</h1>';
		
					$visual_editor_url = add_query_arg(array('visual-editor' => 'true', 'visual-editor-mode' => 'grid', 've-layout' => HeadwayLayout::get_current()), home_url());
					
					if ( HeadwayCapabilities::can_user_visually_edit() ) {
			
						echo sprintf(__('<p>There are no blocks to display.  Add some by going to the <a href="%s">Headway Grid</a>!</p>', 'headway'), $visual_editor_url);
			
					} else {
													
						echo sprintf(__('<p>There is no content to display.  Please notify the site administrator or <a href="%s">login</a>.</p>', 'headway'), $visual_editor_url);
										
					}
			
				echo '</div><!-- .entry-content -->';
			
			echo '</div><!-- .block-type-content -->';
				
		echo '</div><!-- .wrapper -->';
		
		return false;
		
	}


}