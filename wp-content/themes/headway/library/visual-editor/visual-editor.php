<?php
class HeadwayVisualEditor {


	protected static $modes = array();
	
	
	protected static $default_mode = 'grid';
	
	
	protected static $default_layout = 'index';
	
	
	public static function init() {
		
		if ( !HeadwayCapabilities::can_user_visually_edit() )
			return;
					
		//If no child theme is active or if a child theme IS active and the grid is supported, use the grid mode.
		if ( current_theme_supports('headway-grid') )
			self::$modes['Grid'] = 'Add blocks and arrange your website structure';		
		
		self::$modes['Design'] = 'Choose fonts, colors, and other styles';
		
		//If the grid is disabled, set Design as the default mode.
		if ( !current_theme_supports('headway-grid') )
			self::$default_mode = 'design';
		
		//Attempt to raise memory limit to max
		@ini_set('memory_limit', apply_filters('headway_memory_limit', WP_MAX_MEMORY_LIMIT));
		
		//Load libraries and content
		Headway::load('visual-editor/preview', 'VisualEditorPreview');
			
		//Put in action so we can run top level functions
		do_action('headway_visual_editor_init');
				
		//Visual Editor AJAX		
		add_action('wp_ajax_headway_visual_editor', array(__CLASS__, 'ajax'));
		
		if ( HeadwayOption::get('debug-mode') )
			add_action('wp_ajax_nopriv_headway_visual_editor', array(__CLASS__, 'ajax'));

		//Iframe handling
		add_action('headway_body_close', array(__CLASS__, 'iframe_load_flag'));
		add_action('headway_grid_iframe_footer', array(__CLASS__, 'iframe_load_flag'));
				
	}
	
	
	public static function ajax() {
				
		Headway::load('visual-editor/display', 'VisualEditorDisplay');
		Headway::load('visual-editor/visual-editor-ajax');
		
		//Authenticate nonce
		check_ajax_referer('headway-visual-editor-ajax', 'security');
		
		$method = headway_post('method') ? headway_post('method') : headway_get('method');

		//Check for a non-secure (something that doesn't save data) AJAX request first (let debug mode authentication pass through)
		if ( method_exists('HeadwayVisualEditorAJAX', 'method_' . $method) && HeadwayCapabilities::can_user_visually_edit() ) {
			do_action('headway_visual_editor_ajax_pre_' . $method);
			call_user_func(array('HeadwayVisualEditorAJAX', 'method_' . $method));
			do_action('headway_visual_editor_ajax_post_' . $method);
		}
						
		//Check for a secure (something that saves data) AJAX request and require genuine authentication
		elseif ( method_exists('HeadwayVisualEditorAJAX', 'secure_method_' . $method) && HeadwayCapabilities::can_user_visually_edit(true) ) {
			do_action('headway_visual_editor_ajax_pre_' . $method);
			call_user_func(array('HeadwayVisualEditorAJAX', 'secure_method_' . $method));
			do_action('headway_visual_editor_ajax_post_' . $method);
		}
			
		die();
						
	}


	public static function save($options, $current_layout = false, $mode = false) {

		if ( !$current_layout )
			$current_layout = headway_post('layout');

		if ( !$mode )
			$mode = headway_post('mode');

		//Handle triple slash bullshit
		if ( get_magic_quotes_gpc() === 1 )
			$options = array_map('stripslashes_deep', $options);

		$blocks = isset($options['blocks']) ? $options['blocks'] : null;
		$wrappers = isset($options['wrappers']) ? $options['wrappers'] : null;
		$layout_options = isset($options['layout-options']) ? $options['layout-options'] : null;
		$options_inputs = isset($options['options']) ? $options['options'] : null;
		$design_editor_inputs = isset($options['design-editor']) ? $options['design-editor'] : null;

		//Set the current layout to customized if it's the grid mode
		if ( $mode == 'grid' )
			HeadwayLayoutOption::set($current_layout, 'customized', true); 
						
		/* Blocks */
			if ( $blocks ) {
				
				foreach ( $blocks as $id => $methods ) {
				
					foreach ( $methods as $method => $value ) {
					
						switch ( $method ) {
						
							case 'new':
						
								if ( HeadwayBlocksData::get_block($id) )
									continue;
									
								$dimensions = explode(',', $blocks[$id]['dimensions']);	
								$position = explode(',', $blocks[$id]['position']);		
								
								$settings = isset($blocks[$id]['settings']) ? $blocks[$id]['settings'] : array();
									
								$args = array(
									'id' => $id,
									'type' => $value,
									'position' => array(
										'left' => $position[0],
										'top' => $position[1]
									),
									'dimensions' => array(
										'width' => $dimensions[0],
										'height' => $dimensions[1]
									),
									'settings' => $settings
								);
									
								HeadwayBlocksData::add_block($current_layout, $args);
						
							break;
						
							case 'delete':
						
								HeadwayBlocksData::delete_block($current_layout, $id);
						
							break;
						
							case 'dimensions':
							
								$dimensions = explode(',', $value);	
							
								$args = array(
									'dimensions' => array(
										'width' => $dimensions[0],
										'height' => $dimensions[1]
									)
								);
								
								HeadwayBlocksData::update_block($current_layout, $id, $args);
															
							break;
						
							case 'position':
							
								$position = explode(',', $value);	
							
								$args = array(
									'position' => array(
										'left' => $position[0],
										'top' => $position[1]
									)
								);
								
								HeadwayBlocksData::update_block($current_layout, $id, $args);

							break;

							case 'wrapper':
														
								$args = array(
									'wrapper' => $value
								);
								
								HeadwayBlocksData::update_block($current_layout, $id, $args);
							
							break;
						
							case 'settings':
														
								//Retrieve all blocks from layout
								$layout_blocks = HeadwayBlocksData::get_blocks_by_layout($current_layout);
								
								//Get the block from the layout
								$block = headway_get($id, $layout_blocks);
								
								//If block doesn't exist, we can't do anything.
								if ( !$block )
									continue;
									
								//If there aren't any options, then don't do anything either	
								if ( !is_array($value) || count($value) === 0 )
									continue;	
									
								$block['settings'] = array_merge($block['settings'], $value);
								
								HeadwayBlocksData::update_block($current_layout, $id, $block);
							
							break;
						
						}
					
					}
				
				}
				
			}
		/* End Blocks */

		/* Wrappers */
			if ( $wrappers ) {

				/* Pluck last-id out of wrappers and send it to DB */
				if ( headway_get('last-id', $wrappers) ) {

					$last_id = $wrappers['last-id'];
					unset($wrappers['last-id']);

					HeadwayOption::set('last-id', $last_id, 'wrappers');

				}
		
				/* Save layout wrappers to dB */
				HeadwayOption::set($current_layout, $wrappers, 'wrappers');

			}
		/* End Wrappers */

		/* Layout Options */
			if ( $layout_options ) {

				foreach ( $layout_options as $group => $options ) {

					foreach ( $options as $option => $value ) {							
						HeadwayLayoutOption::set($current_layout, $option, $value, $group);
					}

				}

			}
		/* End Layout Options */
		
		/* Options */
			if ( $options_inputs ) {
				
				foreach ( $options_inputs as $group => $options ) {

					foreach ( $options as $option => $value ) {							
						HeadwayOption::set($option, $value, $group);
					}

				}
				
			}
		/* End Options */
		
		/* Design Editor Inputs */
			if ( $design_editor_inputs ) {

				/* If skin import is set to true then nuke all design settings to prevent overlapping settings */
					if ( headway_get('skin-import', $design_editor_inputs) )
						HeadwayElementsData::delete_all();
				/* End skin import nuke */
				
				/* Handle skin templates */
					$skin_templates = headway_get('skin-import-templates', $design_editor_inputs);

					if ( is_array($skin_templates) && count($skin_templates) ) {

						$skin_template_block_id_translations = array();
						$skin_template_wrapper_id_translations = array();

						foreach ( $skin_templates as $skin_template_name => $skin_template_blocks ) {

							/* Pluck wrappers array out of blocks array */
								$skin_template_wrappers = $skin_template_blocks['wrappers'];
								unset($skin_template_blocks['wrappers']);

							$template = HeadwayLayout::add_template($skin_template_name, $skin_template_blocks, $skin_template_wrappers);

							/* Use + rather than array_merge because + preserves numeric keys */
							$skin_template_block_id_translations = $skin_template_block_id_translations + $template['block-id-translations'];
							$skin_template_wrapper_id_translations = $skin_template_wrapper_id_translations + $template['wrapper-id-translations']; 

						}

						/* Re-map block IDs in instances according to block ID translations */
						foreach ( $design_editor_inputs as $element_id => $element_data ) {

							if ( !is_array($element_data) || !isset($element_data['special-element-instance']) )
								continue;

							foreach ( $element_data['special-element-instance'] as $instance_id => $instance_properties ) {

								$instance_id_fragments = explode('-', $instance_id);

								$instance_potential_block_id_search = preg_match('/\bblock\b\-[0-9]+/', $instance_id, $instance_potential_block_id_search_results);
								$instance_potential_block_id = str_replace('block-', '', end($instance_potential_block_id_search_results));
								$instance_potential_wrapper_id = $instance_id_fragments[1];

								/* Wrapper instance conditional. Modify new instance ID accordingly */
									if ( strpos($instance_id, 'wrapper-') === 0 && isset($skin_template_wrapper_id_translations[intval($instance_potential_wrapper_id)]) ) {

										$new_wrapper_id = $skin_template_wrapper_id_translations[intval($instance_potential_wrapper_id)]['id'];
										$new_wrapper_layout = $skin_template_wrapper_id_translations[intval($instance_potential_wrapper_id)]['layout'];

										$new_instance_id = 'wrapper-' . $new_wrapper_id . '-layout-' . $new_wrapper_layout;

								/* Block instance conditional.  Modify new instance ID accordingly */
									} else if ( strpos($instance_id, 'block-') !== false && is_numeric($instance_potential_block_id) && isset($skin_template_block_id_translations[intval($instance_potential_block_id)]) ) {

										$new_block_id = $skin_template_block_id_translations[intval($instance_potential_block_id)];
										$new_instance_id = str_replace('block-' . $instance_potential_block_id, 'block-' . $new_block_id, $instance_id);

								/* Not a proper block or wrapper instance, just skip it */
									} else {

										continue;

									}

								/* Remove existing instance key/value pair */
								unset($design_editor_inputs[$element_id]['special-element-instance'][$instance_id]);

								/* Add new instance key/value pair with new instance ID */
								$design_editor_inputs[$element_id]['special-element-instance'][$new_instance_id] = $instance_properties;
								
							}

						}

					}
				/* End skin template handling */
			
				/* Loop through to get every element and its properties */
					foreach ( $design_editor_inputs as $element_id => $element_data ) {

						if ( !is_array($element_data) || !isset($element_data['group']) )
							continue;

						$element_group = $element_data['group'];
										
						//Dispatch depending on type of element data
						foreach ( $element_data as $element_data_node => $element_data_node_data ) {

							//Handle different nodes depending on what they are
							if ( $element_data_node == 'properties' ) {

								//Set each property for the regular element
								foreach ( $element_data_node_data as $property_id => $property_value )
									HeadwayElementsData::set_property($element_group, $element_id, $property_id, $property_value);

							//Handle instances, states, etc.
							} else if ( strpos($element_data_node, 'special-element-') === 0 ) {

								$special_element_type = str_replace('special-element-', '', $element_data_node);

								//Loop through the special elements
								foreach ( $element_data_node_data as $special_element => $special_element_properties )
									//Set the special element properties now
									foreach ( $special_element_properties as $special_element_property => $special_element_property_value )
										HeadwayElementsData::set_special_element_property($element_group, $element_id, $special_element_type, $special_element, $special_element_property, $special_element_property_value);

							}
							
						}
						
					}
				/* End loop */
				
			}
		/* End Design Editor Inputs */

		//This hook is used by cache flushing, plugins, etc.  Do not fire on preview save because it'll flush preview options
		if ( !headway_get('ve-preview') )
			do_action('headway_visual_editor_save');

		return true;

	}

	
	public static function display() {
		
		self::check_if_ie();
		
		Headway::load('visual-editor/display', 'VisualEditorDisplay');
		HeadwayVisualEditorDisplay::display();
		
	}


	public static function check_if_ie() {
		
		/* Only show this on IE versions less than 9 */
		if ( !headway_is_ie() || (headway_is_ie(9) || headway_is_ie(10) || headway_is_ie(11)) )
			return false;
			
		$message = '
			<span style="text-align: center;font-size: 26px;width: 100%;display: block;margin-bottom: 20px;">Error</span>

			Unfortunately, the Headway Visual Editor does not work with Internet Explorer due to its lack of modern features.<br /><br />

			Please upgrade to a modern browser such as <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or <a href="http://firefox.com" target="_blank">Mozilla Firefox</a>.<br /><br />

			If this message persists after upgrading to a modern browser, please visit <a href="http://support.headwaythemes.com" target="_blank">Headway Support</a>.
		';

		return wp_die($message);
		
	}

	
	public static function get_modes() {
				
		return apply_filters('headway_visual_editor_get_modes', self::$modes);
		
	}	
		
	
	public static function get_current_mode() {
		
		$mode = headway_get('visual-editor-mode');		
				
		if ( $mode ) {
			
			if ( array_search(strtolower($mode), array_map('strtolower', array_keys(self::$modes))) ) {
				
				return strtolower($mode);
				
			} 
		
		}
			
		return strtolower(self::$default_mode);
	
	}	
		
	
	public static function is_mode($mode) {
				
		if ( self::get_current_mode() === strtolower($mode) )
			return true;
			
		if ( !headway_get('visual-editor-mode') && strtolower($mode) === strtolower(self::$default_mode) )
			return true;
			
		return false;
		
	}


	//////////////////    iframe handling   ///////////////////////
	public static function iframe_load_flag() {

		echo '<script type="text/javascript">
			/* Set the iframe as loaded for the iframe load checker */
			document.getElementsByTagName("body")[0].className += " iframe-loaded";
		</script>';

	}
	
	
}