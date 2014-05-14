<?php
class HeadwayWrapperOptions extends HeadwayVisualEditorPanelAPI {


	public function register() {

		return true;

	}


	public function display($wrapper, $layout) {
		
		//Set block properties
		$this->wrapper = $wrapper;

		//Set up arguments
		$args = array(
			'wrapper' => $this->wrapper,
			'layoutID' => $layout
		);

		//Get and display panel
		$this->modify_arguments($args);
		$this->panel_content($args);
		
	}
	
	
	public $id = 'wrapper-options';
	public $name = 'Wrapper Options';
	public $mode = 'grid';
	
	public $tabs = array(
		'setup' => 'Grid &amp; Margins',
		'config' => 'Mirroring &amp; Config'
	);
	
	public $inputs = array(
		'setup' => array(		
			'grid-setup-heading' => array(
				'type' => 'heading',
				'name' => 'grid-setup-heading',
				'label' => 'Grid'
			),

				'column-count' => array(
					'type' => 'slider',
					'name' => 'columns',
					'label' => 'Columns',
					'default' => 24,
					'tooltip' => 'Number of columns in the Grid.  Suggested values 9, 12, 16, and 24.<br /><br /><strong>Note:</strong> The wrapper must be empty of all blocks prior to changing the column count.  Either move the blocks to another wrapper or delete them if they are not needed.',
					'slider-min' => 6,
					'slider-max' => 24,
					'slider-interval' => 1,
					'callback' => 'wrapperOptionCallbackColumnCount(input, value);'
				),

				'use-independent-grid' => array(
					'type' => 'checkbox',
					'name' => 'use-independent-grid',
					'label' => 'Use Independent Grid',
					'tooltip' => 'Check this if you would like this wrapper to have different Grid settings than the Global Grid settings.',
					'callback' => 'wrapperOptionCallbackIndependentGrid(input, value);',
					'toggle' => array(
						'true' => array(
							'show' => array(
								'#input-column-width',
								'#input-gutter-width',
								'#input-grid-width'
							)
						),
						'false' => array(
							'hide' => array(
								'#input-column-width',
								'#input-gutter-width',
								'#input-grid-width'
							)
						)
					)
				),

				'column-width' => array(
					'type' => 'slider',
					'name' => 'column-width',
					'label' => 'Column Width',
					'default' => 20,
					'tooltip' => 'The column width is the amount of space inside of each column.  This is represented by the grey regions on the grid.',
					'unit' => 'px',
					'slider-min' => 10,
					'slider-max' => 80,
					'slider-interval' => 1,
					'callback' => 'wrapperOptionCallbackColumnWidth(input, value);'
				),
				
				'gutter-width' => array(
					'type' => 'slider',
					'name' => 'gutter-width',
					'label' => 'Gutter Width',
					'default' => 20,
					'tooltip' => 'The gutter width is the amount of space between each column.  This is the space between each of the grey regions on the grid.',
					'unit' => 'px',
					'slider-min' => 0,
					'slider-max' => 40,
					'slider-interval' => 1,
					'callback' => 'wrapperOptionCallbackGutterWidth(input, value);'
				),
				
				'grid-width' => array(
					'type' => 'integer',
					'unit' => 'px',
					'default' => 940,
					'name' => 'grid-width',
					'label' => 'Grid Width',
					'readonly' => true
				),

			'wrapper-margins-heading' => array(
				'type' => 'heading',
				'name' => 'wrapper-margins-heading',
				'label' => 'Wrapper Margins'
			),

				'wrapper-margin-top' => array(
					'type' => 'slider',
					'name' => 'wrapper-margin-top',
					'label' => 'Top Margin',
					'default' => 30,
					'tooltip' => 'Space in between the top of this wrapper and the top of the page or the wrapper above it.',
					'unit' => 'px',
					'slider-min' => 0,
					'slider-max' => 200,
					'slider-interval' => 1,
					'callback' => 'wrapperOptionCallbackMarginTop(input, value);',
					'data-handler-callback' => 'dataSetDesignEditorProperty({
						group: "structure", 
						element: "wrapper", 
						property: "margin-top", 
						value: args.value.toString(), 
						specialElementType: "instance", 
						specialElementMeta: args.wrapper.id + "-layout-" + args.wrapper.layout
					});'
				),

				'wrapper-margin-bottom' => array(
					'type' => 'slider',
					'name' => 'wrapper-margin-bottom',
					'label' => 'Bottom Margin',
					'default' => 0,
					'tooltip' => 'Space in between this wrapper and the bottom of the page.',
					'unit' => 'px',
					'slider-min' => 0,
					'slider-max' => 200,
					'slider-interval' => 1,
					'callback' => 'wrapperOptionCallbackMarginBottom(input, value);',
					'data-handler-callback' => 'dataSetDesignEditorProperty({
						group: "structure", 
						element: "wrapper", 
						property: "margin-bottom", 
						value: args.value.toString(), 
						specialElementType: "instance", 
						specialElementMeta: args.wrapper.id + "-layout-" + args.wrapper.layout
					});'
				)
		),
		
		'config' => array(
			'mirror-wrapper' => array(
				'type' => 'select',
				'name' => 'mirror-wrapper',
				'label' => 'Mirror Blocks From Another Wrapper',
				'default' => '',
				'tooltip' => 'By using this option, you can tell a wrapper to "mirror" another wrapper and all of its blocks.  This option is useful if you are wanting to share a wrapper&mdash;such as a header&mdash;across layouts on your site.  Select the wrapper you wish to mirror the content from in the select box to the right.',
				'options' => 'get_wrappers_select_options_for_mirroring()',
				'callback' => 'updateWrapperMirrorStatus(args.wrapper.id, value, input);'
			),

			'alias' => array(
				'type' => 'text',
				'name' => 'alias',
				'label' => 'Wrapper Alias',
				'default' => '',
				'tooltip' => 'Enter an easily recognizable name for the wrapper alias and it will be used throughout your site admin.  Aliases are used in the Design Editor, mirroring menu, and are a great way of keeping track of a specific wrapper.'
			),

			'css-classes' => array(
				'type' => 'text',
				'name' => 'css-classes',
				'label' => 'Custom CSS Class(es)',
				'default' => '',
				'tooltip' => 'Need more finite control?  Enter the custom CSS class selectors here and they will be added to the wrappers\'s class attribute. <strong>DO NOT</strong> put regular CSS in here.  Use the Live CSS editor for that.'
			)
		)
	);
	
	
	function modify_arguments($args = false) {
		
		/* Grid Settings Defaults */
			$this->inputs['setup']['column-width']['default'] = HeadwayWrappers::$default_column_width; 
			$this->inputs['setup']['gutter-width']['default'] = HeadwayWrappers::$default_gutter_width; 
		/* End Grid Settings Defaults */

		/* Margins */
			$wrapper_instance_id = $args['wrapper']['id'] . '-layout-' . $args['wrapper']['layout'];

			$this->inputs['setup']['wrapper-margin-top']['value'] = HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'margin-top', HeadwayWrappers::$default_wrapper_margin_top, 'structure'); 
			$this->inputs['setup']['wrapper-margin-bottom']['value'] = HeadwayElementsData::get_special_element_property('wrapper', 'instance', $wrapper_instance_id, 'margin-bottom', HeadwayWrappers::$default_wrapper_margin_bottom, 'structure'); 
		/* End Margins */
		
	}


	public function get_wrappers_select_options_for_mirroring() {
							
		$wrappers = HeadwayWrappers::get_all_wrappers();
		
		$options = array('' => '&ndash; Do Not Mirror &ndash;');
		
		//If there are no blocks, then just return the Do Not Mirror option.
		if ( empty($wrappers) || !is_array($wrappers) )
			return $options;
		
		foreach ( $wrappers as $wrapper_id => $wrapper_settings ) {
			
			/* If we can't get a name for the layout, then things probably aren't looking good.  Just skip this wrapper. */
			if ( !($layout_name = HeadwayLayout::get_name($wrapper_settings['layout'])) )
				continue;

			/* Check for mirroring here */
			if ( HeadwayWrappers::get_wrapper_mirror($wrapper_settings) )
				continue;

			$current_layout_suffix = ( $this->wrapper['layout'] == $wrapper_settings['layout'] ) ? ' (Warning: Same Layout)' : null;
			$wrapper_alias = headway_get('alias', $wrapper_settings) ? ' &ndash; ' . headway_get('alias', $wrapper_settings) : null;
			
			//Get alias if it exists, otherwise use the default name
			$options[$wrapper_id] = 'Wrapper #' . HeadwayWrappers::format_wrapper_id($wrapper_id) . $wrapper_alias . ' &ndash; ' . $layout_name . $current_layout_suffix;  
			
		}
		
		//Remove the current wrapper from the list
		unset($options[$this->wrapper['id']]);
		
		return $options;
		
	}
	
	
}