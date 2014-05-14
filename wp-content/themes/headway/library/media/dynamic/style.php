<?php
class HeadwayDynamicStyle {
	
	
	static function design_editor() {

		/* Action used for registering elements */
		do_action('headway_dynamic_style_design_editor_init');
		
		$elements = HeadwayElementsData::get_all_elements();
		
		$return = "/* DESIGN EDITOR STYLING */\n";
		
		foreach ( $elements as $element_id => $element_options ) {
			
			$element = HeadwayElementAPI::get_element($element_id);
			$selector = $element['selector'];
			$nudging_properties = array('top', 'left', 'position', 'z-index');
			
			//Continue to next element if the element/selector does not exist
			if ( !isset($selector) || $selector == false )
				continue;
			
			/* Regular Element */
			if ( isset($element_options['properties']) ) 
				$return .= HeadwayElementProperties::output_css($selector, self::filter_nudging_properties($element_options['properties'], $element));
			
			/* Layout-specific elements */
			if ( isset($element_options['special-element-layout']) && is_array($element_options['special-element-layout']) ) {
				
				//Handle every layout
				foreach ( $element_options['special-element-layout'] as $layout => $layout_properties ) {
					
					//Get the selector for the layout
					$layout_element_selector = 'body.layout-using-' . $layout . ' ' . $selector;
					
					//Since the layout selectors are targeted by the body element, we can't do anything body to style the actual body element.  Let's fix that.
					if ( $selector == 'body' )
						$layout_element_selector = str_replace(' body', '', $layout_element_selector); //The space inside str_replace is completely intentional.
					
					$return .= HeadwayElementProperties::output_css($layout_element_selector, self::filter_nudging_properties($layout_properties, $element));
					
				}
				
			}
			
			/* Instances */
			if ( isset($element_options['special-element-instance']) && is_array($element_options['special-element-instance']) ) {
				
				//Handle every instance
				foreach ( $element_options['special-element-instance'] as $instance => $instance_properties ) {
					
					//Make sure the instance exists
					if ( !isset($element['instances'][$instance]) )
						continue;
					
					//Get the selector for the instance
					$instance_selector = $element['instances'][$instance]['selector'];
					
					$return .= HeadwayElementProperties::output_css($instance_selector, self::filter_nudging_properties($instance_properties, $element));
					
				}
				
			}

			/* States */
			if ( isset($element_options['special-element-state']) && is_array($element_options['special-element-state']) ) {
				
				//Handle every instance
				foreach ( $element_options['special-element-state'] as $state => $state_properties ) {
					
					//Make sure the state exists
					if ( !isset($element['states'][$state]) )
						continue;
					
					//Get the selector for the layout
					$state_info = $element['states'][$state];

					$return .= HeadwayElementProperties::output_css($state_info['selector'], self::filter_nudging_properties($state_properties, $element));
					
				}
				
			}

		} //End main $elements foreach
		
		return $return;
		
	}



		private static function filter_nudging_properties($properties, $element) {

			if ( !isset($element['disallow-nudging']) || !$element['disallow-nudging'] )
				return $properties;

			/* If nudging is disallowed (i.g. sub menu element or body element), then do not even output the CSS */
			foreach ( array('top', 'left', 'position', 'z-index') as $blocked_nudging_property )
				unset($properties[$blocked_nudging_property]);

			return $properties;

		}


	static function wrapper() {

		$layout_id = headway_get('layout-in-use');
		$wrappers = HeadwayWrappers::get_layout_wrappers($layout_id);

		$return = '';

		/* Default Wrapper Margins */
			if ( headway_get('file') == 've-iframe-grid-dynamic' && headway_get('visual-editor-open') ) {

				$return .= HeadwayElementProperties::output_css('div.wrapper', array(
					'margin-top' => HeadwayElementsData::get_property('wrapper', 'margin-top', HeadwayWrappers::$default_wrapper_margin_top, 'structure'),
					'margin-bottom' => HeadwayElementsData::get_property('wrapper', 'margin-bottom', HeadwayWrappers::$default_wrapper_margin_bottom, 'structure'),
					'padding-top' => HeadwayElementsData::get_property('wrapper', 'padding-top', null, 'structure'),
					'padding-right' => HeadwayElementsData::get_property('wrapper', 'padding-right', null, 'structure'),
					'padding-bottom' => HeadwayElementsData::get_property('wrapper', 'padding-bottom', null, 'structure'),
					'padding-left' => HeadwayElementsData::get_property('wrapper', 'padding-left', null, 'structure')
				));

			}

		/* Wrappers for Layout */
		foreach ( $wrappers as $wrapper_id => $wrapper_settings ) {

			$wrapper_grid_width = HeadwayWrappers::get_grid_width($wrapper_settings);

			/* Set up variables for wrapper */
			$wrapper_selector = 'div#' . $wrapper_id;

			/* Fixed Wrapper */
				if ( !$wrapper_settings['fluid'] ) {

					/* Wrapper */
						$return .= $wrapper_selector . ' {
							width: ' . $wrapper_grid_width . 'px;
						}';

						if ( HeadwayResponsiveGrid::is_enabled() ) {

							$return .= $wrapper_selector . '.responsive-grid {
								width: auto !important;
								max-width: ' . $wrapper_grid_width . 'px;
							}';

						}

					/* Grid */
						if ( headway_get('file') != 've-iframe-grid-dynamic' || !headway_get('visual-editor-open') )
							$return .= HeadwayResponsiveGrid::is_enabled() ? self::responsive_grid($wrapper_settings) : self::fixed_grid($wrapper_settings);

			/* Fluid Wrapper */
				} else {

					/* Grid Container */
						/* Fixed Grid */
							if ( !$wrapper_settings['fluid-grid'] ) {

								$return .= $wrapper_selector . ' div.grid-container {
									width: ' . $wrapper_grid_width . 'px;
								}';

								if ( HeadwayResponsiveGrid::is_enabled() ) {

									$return .= $wrapper_selector . '.responsive-grid div.grid-container {
										width: auto !important;
										max-width: ' . $wrapper_grid_width . 'px;
									}';

								}

							}

					/* Grid */
						if ( headway_get('file') != 've-iframe-grid-dynamic' || !headway_get('visual-editor-open') )
							$return .= (HeadwayResponsiveGrid::is_enabled() || $wrapper_settings['fluid-grid']) ? self::responsive_grid($wrapper_settings) : self::fixed_grid($wrapper_settings);

				}

			/* Both Fixed and Fluid: Margin in Grid Mode */
				if ( headway_get('file') == 've-iframe-grid-dynamic' && headway_get('visual-editor-open') ) {

					$wrapper_instance_id = $wrapper_settings['id'] . '-layout-' . $wrapper_settings['layout'];

					$return .= HeadwayElementProperties::output_css($wrapper_selector, array(
						'margin-top' => HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'margin-top', null, 'structure'),
						'margin-bottom' => HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'margin-bottom', null, 'structure'),
						'padding-top' => HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'padding-top', null, 'structure'),
						'padding-right' => HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'padding-right', null, 'structure'),
						'padding-bottom' => HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'padding-bottom', null, 'structure'),
						'padding-left' => HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'padding-left', null, 'structure')
					));

				}

		}
		
		return $return;
		
	}
	
	
		
			static function fixed_grid(array $wrapper_settings) {

				global $wrapper_css_flags;

				/* If wrapper is mirrored then use settings from it for the grid */
				if ( $potential_wrapper_mirror = HeadwayWrappers::get_wrapper_mirror($wrapper_settings) )
					$wrapper_settings = $potential_wrapper_mirror;
					
				$grid_number = headway_get('columns', $wrapper_settings);
					
				$column_width = headway_get('use-independent-grid', $wrapper_settings) ? headway_get('column-width', $wrapper_settings) : HeadwayOption::get('column-width', false, HeadwayWrappers::$default_column_width);
				$gutter_width = headway_get('use-independent-grid', $wrapper_settings) ? headway_get('gutter-width', $wrapper_settings) : HeadwayOption::get('gutter-width', false, HeadwayWrappers::$default_gutter_width);

				/* Keep extraneous CSS from be created by wrappers that have the same settings */
					$grid_class = 'grid-fixed-' . $grid_number . '-' . $column_width . '-' . $gutter_width;

					if ( isset($wrapper_css_flags[$grid_class]) )
						return;
				/* End extraneous CSS check */

				$grid_wrapper_width = ($column_width * $grid_number) + ($grid_number * $gutter_width);

				/* Add CSS prefix */
				$prefix = 'div.' . $grid_class . ' ';
							
				/* Column left margins */
				$return = $prefix . '.column { margin-left: ' . ($gutter_width) . 'px; }';
			
				/* Widths and Lefts */
				for ( $i = 1; $i <= $grid_number; $i++ ) {
				
					/* Vars */
					$grid_width = $column_width * $i + (($i - 1) * $gutter_width);
					$grid_left_margin = (($column_width + $gutter_width) * $i) + $gutter_width;
			
					$return .= $prefix . '.grid-width-' . $i . ' { width:' . ($grid_width) . 'px; }';
					$return .= $prefix . '.grid-left-' . $i . ' { margin-left: ' . ($grid_left_margin) . 'px; }';
			
					/**
					 * If it's the first column in a row and the column doesn't start on the far left,
					 * then the additional gutter doesn't have to be taken into consideration
					 **/
					$return .= $prefix . '.column-1.grid-left-' . $i . ' { margin-left: ' . ($grid_left_margin - $gutter_width) . 'px; }';				

				}

				/* Create a flag keeping this same Grid CSS from being outputted */
					$wrapper_css_flags['grid-fixed-' . $grid_number . '-' . $column_width . '-' . $gutter_width] = true;
					
				return $return;
			
			}
		
			
			static function responsive_grid(array $wrapper_settings) {

				global $wrapper_css_flags;

				/* If wrapper is mirrored then use settings from it for the grid */
				if ( $potential_wrapper_mirror = HeadwayWrappers::get_wrapper_mirror($wrapper_settings) )
					$wrapper_settings = $potential_wrapper_mirror;
				
				$round_precision = 9;
				$return = '';

				$grid_number = headway_get('columns', $wrapper_settings);
					
				$column_width = headway_get('use-independent-grid', $wrapper_settings) ? headway_get('column-width', $wrapper_settings) : HeadwayOption::get('column-width', false, HeadwayWrappers::$default_column_width);
				$gutter_width = headway_get('use-independent-grid', $wrapper_settings) ? headway_get('gutter-width', $wrapper_settings) : HeadwayOption::get('gutter-width', false, HeadwayWrappers::$default_gutter_width);

				/* Render the Grid into arrays to see if sub column CSS will be needed */
					$wrapper_blocks = HeadwayBlocksData::get_blocks_by_wrapper(headway_get('layout-in-use'), $wrapper_settings['id']);
					$wrapper_rendered = new HeadwayGridRenderer($wrapper_blocks, $wrapper_settings);

					/* Process the blocks into arrays */
						$wrapper_rendered->process();

					$blocks_in_sub_columns = !empty($wrapper_rendered->blocks_in_sub_columns) ? true : false;

				/* Keep extraneous CSS from be created by wrappers that have the same settings */
					$grid_class = 'grid-fluid-' . $grid_number . '-' . $column_width . '-' . $gutter_width;

					/* If there are no sub columns and the main CSS has already been outputted, just stop here */
					if ( isset($wrapper_css_flags[$grid_class]) && !$blocks_in_sub_columns )
						return;
				/* End extraneous CSS check */

				/* Make calculations for the percentages */
					$grid_wrapper_width = ($column_width * $grid_number) + (($grid_number - 1) * $gutter_width);
					
					$resp_width_ratio = ($column_width * $grid_number) / $grid_wrapper_width;
					$resp_gutter_ratio = ($gutter_width * $grid_number) / $grid_wrapper_width;
					$resp_single_column_width = (100 / $grid_number) * $resp_width_ratio;
					$resp_single_column_margin = (100 / $grid_number) * $resp_gutter_ratio;

				/* Add CSS prefix */
					$prefix = 'div.' . $grid_class . ' ';

				/* Generate the main Grid CSS */
					if ( !isset($wrapper_css_flags[$grid_class]) ) {

						$return .= $prefix . '.column { margin-left: ' . round($resp_single_column_margin, $round_precision) . '%; }' . "\n";

						for ( $i = 1; $i <= $grid_number; $i++ ) {
											
							/* Vars */
							$resp_grid_width = ($resp_single_column_width * $i) + ($i * $resp_single_column_margin);
							$resp_grid_left_margin = (($resp_single_column_width + $resp_single_column_margin) * $i) + $resp_single_column_margin;
						
							/* Output */
							$return .= $prefix . '.grid-width-' . $i . ' { width: ' . round($resp_grid_width - $resp_single_column_margin, $round_precision) . '%; }' . "\n";					
							
							if ( $i < $grid_number ) {
								
								$return .= $prefix . '.grid-left-' . $i . ' { margin-left: ' . round($resp_grid_left_margin, $round_precision) . '%; }' . "\n";

								/**
								 * If it's the first column in a row and the column doesn't start on the far left,
								 * then the additional gutter doesn't have to be taken into consideration
								 **/
								$return .= $prefix . '.column-1.grid-left-' . $i . ' { margin-left: ' . round($resp_grid_left_margin - $resp_single_column_margin, $round_precision) . '%; }';		
								
							}
												
						}

						/* Create a flag keeping this same Grid CSS from being outputted */
							$wrapper_css_flags['grid-fluid-' . $grid_number . '-' . $column_width . '-' . $gutter_width] = true;

					}
				/* End main grid CSS */

				/* Responsive Sub Column CSS */
					if ( $blocks_in_sub_columns ) {

						/* Get the columns required for sub columns */
							$required_columns_for_sub_columns = array();

							foreach ( $wrapper_rendered->blocks_in_sub_columns as $block_in_sub_column_id )
								if ( isset($wrapper_rendered->blocks[$block_in_sub_column_id]['parent-column-width']) )
									$required_columns_for_sub_columns[] = $wrapper_rendered->blocks[$block_in_sub_column_id]['parent-column-width'];

							$required_columns_for_sub_columns = array_filter(array_unique($required_columns_for_sub_columns));
						/* End getting columns required for sub columns */

						for ( $i = 1; $i <= $grid_number; $i++ ) {

							/* Don't output the sub column CSS if there's no column of this number with sub columns and don't output it if has already by a previous wrapper. */
							if ( !in_array($i, $required_columns_for_sub_columns) || isset($wrapper_css_flags['grid-fluid-' . $grid_number . '-' . $column_width . '-' . $gutter_width . '-sub-columns-column-' . $i]) )
								continue;

							/* Vars */
							$resp_grid_width = ($resp_single_column_width * $i) + ($i * $resp_single_column_margin);
							$resp_grid_left_margin = (($resp_single_column_width + $resp_single_column_margin) * $i) + $resp_single_column_margin;

							$sub_column_single_width = ($resp_single_column_width / $resp_grid_width) * 100;
							$sub_column_single_margin = ($resp_single_column_margin / $resp_grid_width) * 100;

							$return .= $prefix . '.grid-width-' . $i . ' .sub-column { margin-left: ' . round($sub_column_single_margin, $round_precision) . '%; }' . "\n";

							for ( $sub_column_i = 1; $sub_column_i < $i; $sub_column_i++ ) {
													
								/* Sub column vars */
								$sub_column_width = ($sub_column_single_width * $sub_column_i) + ($sub_column_i * $sub_column_single_margin);
								$sub_column_margin = (($sub_column_single_width + $sub_column_single_margin) * $sub_column_i) + $sub_column_single_margin;
							
								$return .= $prefix . '.grid-width-' . $i . ' .sub-column.grid-width-' . $sub_column_i . ' { width: ' . round($sub_column_width - $sub_column_single_margin, $round_precision) . '%; }' . "\n";
								$return .= $prefix . '.grid-width-' . $i . ' .sub-column.grid-width-' . $sub_column_i . '.column-1 { width: ' . round($sub_column_width, $round_precision) . '%; }' . "\n";
								
								$return .= $prefix . '.grid-width-' . $i . ' .sub-column.grid-left-' . $sub_column_i . ' { margin-left: ' . round($sub_column_margin, $round_precision) . '%; }' . "\n";
								$return .= $prefix . '.grid-width-' . $i . ' .sub-column.grid-left-' . $sub_column_i . '.column-1 { margin-left: ' . round($sub_column_margin - $sub_column_single_margin, $round_precision) . '%; }' . "\n";
								
							}

							/* Create a flag keeping this same sub column CSS from being outputted */
								$wrapper_css_flags['grid-fluid-' . $grid_number . '-' . $column_width . '-' . $gutter_width . '-sub-columns-column-' . $i] = true;

						}

					}
				/* End responsive sub column CSS */
							
				return $return;
							
			}
			
			
			static function block_heights() {
				
				if ( !($blocks = HeadwayBlocksData::get_all_blocks()) )
					return false;

				$return = '';

				//Retrieve the blocks so we can check if the block type is fixed or fluid height
				$block_types = HeadwayBlocks::get_block_types();

				foreach ( $blocks as $block ) {

					$selector = '#block-' . $block['id'];

					/* If the block is mirrored then change the selector */
						if ( $mirrored_block_id = HeadwayBlocksData::is_block_mirrored($block, true) )
							$selector = '#block-' . $mirrored_block_id . '.block-original-' . $block['id'];

					//If it's a fluid block (which blocks ARE by default), then we need to use min-height.  Otherwise, if it's fixed, we use height.
					if ( headway_get('fixed-height', headway_get($block['type'], $block_types), false) !== true )
						$return .= $selector . ' { min-height: ' . $block['dimensions']['height'] . 'px; }';
					else
						$return .= $selector . ' { height: ' . $block['dimensions']['height'] . 'px; }';

				}

				return $return;

			}
	
	
	static function live_css() {
		
		if ( headway_get('visual-editor-open') )
			return null;
		
		return HeadwayOption::get('live-css');
		
	}
	
}