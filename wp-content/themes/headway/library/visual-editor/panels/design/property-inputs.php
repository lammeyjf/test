<?php
class HeadwayPropertyInputs {
	
	
	function display($element, $special_element_type = false, $special_element_meta = false, $data, $data_without_defaults) {
						
		if ( !is_array($element) || empty($element['properties']) )
			return null;

		$default_box_args = array(
			'group' => false,
			'element' => $element,
			'special_element_type' => $special_element_type,
			'special_element_meta' => $special_element_meta,
			'selective_properties' => false,
			'property_values' => $data,
			'property_values_excluding_defaults' => $data_without_defaults
		);
				
		/* Display the property groups registered to the element */			
			foreach ( $element['properties'] as $key => $value ) {
				
				//If the key is numeric, then the value is the group name.
				if ( is_numeric($key) ) {
					
					$group = $value;
					$selective_properties = false;
					
				//Otherwise, the key is the group name and the value is the selective properties.
				} else {
					
					$group = $key;
					$selective_properties = $value;
					
				}
				
				self::box(array_merge($default_box_args, array(
					'group' => $group,
					'selective_properties' => $selective_properties
				)));
							
			} 

		/* Include nudging and margin for all elements except for Body */
		if ( !(!empty($element['disallow-nudging']) && headway_fix_data_type($element['disallow-nudging']) === true) && !in_array('nudging', $element['properties']) ) {

			self::box(array_merge($default_box_args, array(
				'group' => 'nudging'
			)));

			self::box(array_merge($default_box_args, array(
				'group' => 'margins',
				'selective_properties' => ($element['inherit-location'] == 'default-block' || $element['id'] == 'wrapper') ? array('margin-top', 'margin-bottom') : false
			)));

		}
		
	}
	
	
	function box($args) {
		
		$defaults = array(
			'group' => null,
			'element' => null,
			'special_element_type' => false,
			'special_element_meta' => false,
			'selective_properties' => false,
			'property_values' => false,
			'property_values_excluding_defaults' => false,
			'unsaved_values' => false
		);
		
		extract(array_merge($defaults, $args));

		//Format the group name into capitalized and spaced
		$group = ucwords(str_replace('-', ' ', $group));
		
		//If the group doesn't exist, don't attempt to display it
		if ( !($properties = HeadwayElementProperties::get_properties_by_group($group)) )
			return false;
			
		/* Set up variables */
		$uncustomize_button = '<span class="uncustomize-property tooltip" title="Set the property to inherit."></span>';
		$customize_button = '<div class="customize-property"><span class="tooltip" title="Click to change the value for this property.  If left uncustomized, the property will automatically inherit to the default set for this element type in the defaults tab or the parent element if editing a state, instance, or layout-specific element.">Customize</span></div>';
		$element_selector_attr = isset($element['selector']) ? ' element_selector="' . htmlspecialchars($element['selector']) . '"' : null;
		
		/* Determine if it's a special element */
		$special_element = ( !$special_element_type || $special_element_type == 'default' ) ? false : true;

		/* Custom behaviors for special element types */
		switch ( $special_element_type ) {
			
			case 'default':

				$uncustomize_button = null;
				$customize_button = null;

			break;
			
			case 'instance':

				$instances = headway_get('instances', $element);
				$instance = $instances[$special_element_meta];
			
				$element_selector_attr = ' element_selector="' . htmlspecialchars($instance['selector']) . '"';

			break;
			
			case 'state':

				$states = headway_get('states', $element);
				$state = $states[$special_element_meta];
			
				$element_selector_attr = ' element_selector="' . htmlspecialchars($state['selector']) . '"';

			break;


			case 'layout':

				if ( isset($element['selector']) && isset($special_element_meta) ) {

					$element_selector_attr = ' element_selector="' . htmlspecialchars('body.layout-using-' . $special_element_meta . ' ' . $element['selector']) . '"';

					if ( $element['selector'] == 'body' )
						$element_selector_attr = str_replace(' body', '', $element_selector_attr);

				}

			break;
			
		} 

		/* Set customized box class flag */
			$customized_box_class = '';
			$property_box_title = '';

			foreach ( $property_values_excluding_defaults as $property_id => $property_value ) {

				if ( !isset($properties[$property_id]) )
					continue;

				$customized_box_class = ' design-editor-box-customized';
				$property_box_title = ' title="' . __('You have customized a property in this property group.', 'headway') . '"';
				break;

			}

		/* Create the box */
		echo '<div class="design-editor-box design-editor-box-' . str_replace(' ', '-', strtolower($group)) . ' design-editor-box-minimized' . $customized_box_class . '">';
			echo '<span class="design-editor-box-title"' . $property_box_title . '>' . $group . '</span>';
			echo '<span class="design-editor-box-toggle"></span>';

			if($group == 'Rounded Corners' || $group == 'Borders' || $group == 'Padding' || $group == 'Margins' )
				echo '<span class="design-editor-lock-sides" data-locked="false"></span>';
			
			echo '<ul class="design-editor-box-content">';
			
				foreach ( $properties as $property_id => $options ) {
					
					//If the $selective_properties variable is set, then make sure we're only showing those properties.
					if ( is_array($selective_properties) )
						if ( !in_array($property_id, $selective_properties) )
							continue;
						
					//Make sure the input type for the property really exists
					if ( !is_callable(array(__CLASS__, 'input_' . str_replace('-', '_', $options['type']))) )
						continue;
					
					if ( headway_fix_data_type(headway_get($property_id, $property_values)) || headway_fix_data_type(headway_get($property_id, $property_values)) === 0 ) {
						
						$options['value'] = $property_values[$property_id];
						$customized = true;
						
					//If the value isn't set try to get the inherit location value, if not, revert clear back to the default property type value
					} else {
																		
						$property_default = isset($options['default']) ? $options['default'] : null;
						$options['value'] = HeadwayElementsData::get_inherited_property($element['id'], $property_id, $property_default);
						$customized = false;
																			
					}	
						
					$js_callback = htmlspecialchars('
									(function(params){
										' . $options['js-callback'] . '
									})');
					
					/* Set up attributes */
						$property_title = '';
						$property_classes = array(
							'design-editor-property-' . $property_id
						);;

						if ( headway_fix_data_type(headway_get($property_id, $property_values_excluding_defaults)) || headway_fix_data_type(headway_get($property_id, $property_values_excluding_defaults)) === 0 ) {

							$property_classes[] = 'customized-property-by-user';
							$property_title = ' title="' . __('You have customized this property.', 'headway') . '"';

						} else {

							if ( !$customized && $special_element_type !== 'default' )
								$property_classes[] = 'uncustomized-property';

							if ( !$customized && headway_get($property_id, $property_values) === '' ) {

								$property_classes[] = 'uncustomized-property-by-user';
								$property_title = ' title="' . __('You have set this property to inherit.', 'headway') . '"';

							}

						}

					/* add a locked class if it's a lockable element only */
					if ( 
						$group == 'Rounded Corners' || 
						$group == 'Padding' || 
						$group == 'Margins' || 
						$property_id == 'border-top-width' || 
						$property_id == 'border-right-width' || 
						$property_id == 'border-bottom-width'|| 
						$property_id == 'border-left-width'
					) {
						$property_classes[] = 'lockable';
					}

					if ( $property_id == 'border-top-width' )
						echo '<li class="design-property-border-heading"><strong>Border Width</strong></li>';

					echo '<li class="' . implode(' ', array_filter($property_classes)) . '"' . $property_title . '>';
					
						echo '<strong><span class="property-label">' . $options['name'] . '</span>' . $uncustomize_button . '</strong>';
						echo '<div class="property-' . $options['type'] . ' property">';
														
							call_user_func(array(__CLASS__, 'input_' . str_replace('-', '_', $options['type'])), $options, $property_id);
							
							echo '<input ' . $element_selector_attr . ' element="' . $element['id'] . '" property="' . $property_id . '" data-element-group="' . $element['group'] . '" special_element_type="' . $special_element_type . '" special_element_meta="' . $special_element_meta . '" type="hidden" callback="' . $js_callback . '" class="property-hidden-input" value="' . $options['value'] . '" />';
							
						echo '</div>';
						
						echo $customize_button; 
						
					echo '</li>';
					
				}
				
			echo '</ul><!-- .design-editor-box-content -->';
		
		echo '</div><!-- .design-editor-box -->';
		
	}
	
	
	function input_integer($options, $id) {
		
		$unit = headway_get('unit', $options) ? '<span class="unit">' . headway_get('unit', $options) . '</span>' : null;

		echo '<input type="text" value="' . $options['value'] . '" />' . $unit;	
						
	}
	
	
	function input_color($options, $id) {
				
		echo '
		<div class="colorpicker-box-container">
			<div class="colorpicker-box-transparency"></div>
			<div class="colorpicker-box" style="background-color:' . headway_format_color($options['value']) . ';"></div>
		</div><!-- .colorpicker-box-container -->
		';
		
	}
	
	
	function input_select($options, $id) {
		
		echo '<div class="select-container"><select>';
						
			//If 'options' is a function, then call it and replace $options['options']
			if ( is_string($options['options']) && strpos($options['options'], '()') !== false ) {
				
				$sanitized_function = str_replace('()', '', $options['options']);
				
				//If is a method rather than function, the method must be declared as static otherwise it'll return false on PHP 5.2
				if ( !is_callable($sanitized_function) ) 
					continue;
				
				$options['options'] = call_user_func($sanitized_function);
				
			}
			
			if ( is_array($options['options']) ) {
				
				foreach ( $options['options'] as $value => $content ) {
					
					//If it's an optgroup, handle it.
					if ( is_array($content) ) {
						
						echo '<optgroup label="' . $value . '">';
						
						foreach ( $content as $value => $text ) {
				
							//If the current option is the value in the DB, then mark it as selected
							$selected_option = ( $value == $options['value'] ) ? ' selected="selected"' : null;

							echo '<option value="' . $value . '"' . $selected_option . '>' . $text . '</option>';
							
						} 
						
						echo '</optgroup>';
						
					//Otherwise it's just a normal option
					} else {
						
						//If the current option is the value in the DB, then mark it as selected
						$selected_option = ( $value == $options['value'] ) ? ' selected="selected"' : null;

						echo '<option value="' . $value . '"' . $selected_option . '>' . $content . '</option>';
						
					}
					
				}
				
			}	
				
			
		echo '</select></div><!-- .select-container -->';
		
	}
		
	
		static function font_size_options() {

			$font_sizes = array();

			for($i = 6; $i <= 72; $i++){
				$font_sizes[$i] = $i . 'px';
				
				if($i >= 20) $i++;						
			}			
			
			return $font_sizes;
			
		}
		
		
		static function line_height_options() {
			
			$line_heights = array();
			
			for($i = 5; $i <= 30; $i++){
				$percent = $i*10;

				$line_heights[$percent] = $percent . '%';
			}
			
			return $line_heights;
			
		}
	
	
	function input_image($options, $id) {
		
		$src_visibility = ( is_string($options['value']) && strlen($options['value']) > 0 && $options['value'] != 'none' ) ? '' : ' style="display:none;"';
		$filename = end(explode('/', $options['value']));
		
		echo '
			<span class="button">Choose</span>
			
			<div class="image-input-controls-container"' . $src_visibility . '>
				<span class="src">' . $filename . '</span>
				<span class="delete-image">Delete</span>
			</div>
		';
				
	}
	
	
	function input_checkbox($options, $id) {
		
	}
	
	
	function input_font_family_select($options, $id) {

		/* Output input */
			$font_fragments = explode('|', $options['value']);

			/* Web Font */
			if ( count($font_fragments) >= 2 ) {

				$font_stack = $font_fragments[1];
				$font_name = $font_fragments[1];

				$webfont_class = ' font-name-webfont';

			/* Traditional Font */
			} else {

				$font_stack = HeadwayFonts::get_stack($options['value']);
				$font_name = ucwords($options['value']);

				$webfont_class = null;

			}

			echo '<span class="font-name' . $webfont_class . '" style="font-family: ' . $font_stack . ';" data-webfont-value="' .  $options['value'] . '">' . $font_name . '</span>';

			echo '<span class="open-font-browser pencil-icon"></span>';

		/* Font Browser */
			echo '<div class="font-browser">';
					
					echo '<ul class="tabs">';
						do_action('headway_fonts_browser_tabs');
					echo '</ul>';

					do_action('headway_fonts_browser_content');

			echo '</div><!-- .font-browser -->';
				
	}
}