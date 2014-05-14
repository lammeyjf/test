<?php
class HeadwayWrappers {


	public static $default_wrappers = array(
		'wrapper-default' => array(
			'fluid' => false,
			'fluid-grid' => false,
			'columns' => null,
			'column-width' => null,
			'gutter-width' => null
		)
	);

	public static $default_wrapper_id = 'wrapper-default';

	public static $default_columns = 24;

	public static $default_column_width = 20;

	public static $default_gutter_width = 20;

	public static $default_wrapper_margin_top = 30;

	public static $default_wrapper_margin_bottom = 30;


	public static $global_grid_column_width = null;

	public static $global_grid_gutter_width = null;


	public static $all_wrappers_cache = null;


	public static function init() {

		/* Set defaults */
			self::$default_columns = HeadwayOption::get('columns', false, self::$default_columns);
			self::$global_grid_column_width = HeadwayOption::get('column-width', false, self::$default_column_width);
			self::$global_grid_gutter_width = HeadwayOption::get('gutter-width', false, self::$default_gutter_width);

			self::$default_wrappers['wrapper-default']['use-independent-grid'] = false; 
			self::$default_wrappers['wrapper-default']['columns'] = self::$default_columns; 
			self::$default_wrappers['wrapper-default']['column-width'] = self::$default_column_width; 
			self::$default_wrappers['wrapper-default']['gutter-width'] = self::$default_gutter_width; 

		/* Setup hooks */
		add_action('headway_register_elements_instances', array(__CLASS__, 'register_wrapper_instances'), 11);
		add_action('headway_wrapper_options', array(__CLASS__, 'options_panel'), 10, 2);

	}


	public static function get_all_wrappers() {

		if ( !empty(self::$all_wrappers_cache) )
			return self::$all_wrappers_cache;

		$wrappers_by_layout = HeadwayOption::get_group('wrappers');

		if ( !$wrappers_by_layout || !is_array($wrappers_by_layout) )
			return null;

		$all_wrappers = array();

		foreach ( $wrappers_by_layout as $layout_id => $layout_wrappers )
			if ( is_array($layout_wrappers) )
				$all_wrappers = array_merge($all_wrappers, self::format_wrappers_array($layout_wrappers, $layout_id));

		self::$all_wrappers_cache = $all_wrappers;

		return $all_wrappers;

	}


	public static function get_layout_wrappers($layout_id, $include_design_editor_instances = false) {

		$all_wrappers = HeadwayOption::get_group('wrappers');

		if ( !$all_wrappers || !is_array($all_wrappers) )
			$all_wrappers = array();

		$wrappers = self::format_wrappers_array(headway_get($layout_id, $all_wrappers, self::$default_wrappers), $layout_id, $include_design_editor_instances);

		return $wrappers;

	}


		public static function format_wrappers_array($wrappers, $layout_id, $include_design_editor_instance = false) {

			/* Loop through and run headway_fix_data_type() for each layout */
			foreach ( $wrappers as $wrapper_id => $wrapper_settings ) {

				/* Use wrapper defaults, then merge in the actual wrapper settings and run fix_data_type on the wrapper settings that way booleans, etc are set correctly */
				$wrappers[$wrapper_id] = array_merge(self::$default_wrappers['wrapper-default'], array_map('headway_fix_data_type', $wrapper_settings));

				/* Add wrapper ID and layout ID to the wrapper settings */
				$wrappers[$wrapper_id]['id'] = $wrapper_id;
				$wrappers[$wrapper_id]['layout'] = $layout_id;

				/* Include Design Editor instance if set to do so */
					if ( $include_design_editor_instance ) {

						$wrappers[$wrapper_id]['styling'] = HeadwayElementsData::get_special_element_properties(array(
							'element' => 'wrapper', 
							'se_type' => 'instance', 
							'se_meta' => $wrapper_id . '-layout-' . $layout_id, 
							'element_group' => 'structure'
						));
						
					}

			}

			return $wrappers;

		}


	public static function get_wrapper($wrapper_id, $layout_id = null) {

		$all_wrappers = HeadwayWrappers::get_all_wrappers();
		$wrapper = headway_get('wrapper-' . HeadwayWrappers::format_wrapper_id($wrapper_id), $all_wrappers);

		/* No wrapper found.  Use default if layout ID is provided */
		if ( !$wrapper && $layout_id )
			$wrapper = self::get_default_wrapper_settings($layout_id, $wrapper_id);

		/* Add in wrapper ID */
		$wrapper['id'] = 'wrapper-' . HeadwayWrappers::format_wrapper_id($wrapper_id);

		return $wrapper;
	
	}


		public static function get_wrapper_setting($wrapper, $option_name, $default_value = null) {

			return headway_get($option_name, $wrapper, $default_value);

		}


		public static function get_default_wrapper_settings($layout_id, $wrapper_id) {

			return array_merge(self::$default_wrappers['wrapper-default'], array(
				'id' => 'wrapper-' . HeadwayWrappers::format_wrapper_id($wrapper_id), 
				'layout' => $layout_id
			));

		}


	public static function add_wrapper($layout_id, $wrapper_settings) {

		$existing_wrappers = self::get_layout_wrappers($layout_id);

		/* Delete the default wrapper */
		if ( isset($existing_wrappers['wrapper-default']) )
			unset($existing_wrappers['wrapper-default']);

		$last_wrapper_id = HeadwayOption::get('last-id', 'wrappers');
		$new_wrapper_id = $last_wrapper_id + 1;

		/* Prepare wrapper settings for new ID and clear out mirroring */
			if ( isset($wrapper_settings['layout']) )
				unset($wrapper_settings['layout']);

			if ( isset($wrapper_settings['id']) )
				unset($wrapper_settings['id']);

			if ( isset($wrapper_settings['mirror-wrapper']) )
				unset($wrapper_settings['mirror-wrapper']);

		/* Add wrapper */
			$existing_wrappers['wrapper-' . $new_wrapper_id] = $wrapper_settings;

		/* Save wrappers array with new wrapper to layout */
			HeadwayOption::set($layout_id, $existing_wrappers, 'wrappers');

		/* Save last wrapper ID back to DB */
			HeadwayOption::set('last-id', $new_wrapper_id, 'wrappers');

		return array(
			'id' => $new_wrapper_id,
			'wrapper' => $wrapper_settings
		);

	}


	public static function get_wrapper_mirror($wrapper_settings) {

		if ( empty($wrapper_settings['mirror-wrapper']) )
			return false;

		/* If wrapper mirror is same ID as wrapper then we have a problem and it's not a mirror */
		if ( $wrapper_settings['mirror-wrapper'] == $wrapper_settings['id'] )
			return false;

		/* It's only a potential mirror because we must first check that the wrapper wanting to be mirrored isn't mirroring a wrapper itself */
		$potential_wrapper_mirror = HeadwayWrappers::get_wrapper($wrapper_settings['mirror-wrapper']);

		if ( !empty($potential_wrapper_mirror['mirror-wrapper']) && HeadwayWrappers::get_wrapper($potential_wrapper_mirror['mirror-wrapper']) )
			return false;

		return $potential_wrapper_mirror;

	}


	public static function get_available_wrapper_id() {

		return HeadwayOption::get('last-id', 'wrappers', 1) + 1;

	}


	public static function format_wrapper_id($wrapper_id) {

		return str_replace('wrapper-', '', $wrapper_id);

	}


	public static function register_wrapper_instances() {

		$all_wrappers = HeadwayOption::get_group('wrappers');

		if ( !$all_wrappers )
			return false;

		foreach ( $all_wrappers as $layout_id => $layout_wrappers ) {

			/* Skip over the last-id option */
			if ( $layout_id == 'last-id' )
				continue;

			foreach ( $layout_wrappers as $layout_wrapper_id => $layout_wrapper_settings ) {

				/* Do NOT register the default wrapper instance */
				if ( $layout_wrapper_id == 'wrapper-default' )
					continue;

				/* Format the wrapper settings array */
				$layout_wrapper_settings['id'] = $layout_wrapper_id;

				/* Do not register instance for mirrored wrapper */
				if ( HeadwayWrappers::get_wrapper_mirror($layout_wrapper_settings) )
					continue;

				$wrapper_alias = headway_get('alias', $layout_wrapper_settings) ? ' &ndash; ' . headway_get('alias', $layout_wrapper_settings) : null;
				
				HeadwayElementAPI::register_element_instance(array(
					'group' => 'structure',
					'element' => 'wrapper',
					'id' => $layout_wrapper_id . '-layout-' . $layout_id,
					'name' => 'Wrapper #' . HeadwayWrappers::format_wrapper_id($layout_wrapper_id) . $wrapper_alias,
					'selector' => '#' . $layout_wrapper_id . ', div.wrapper-mirroring-' . HeadwayWrappers::format_wrapper_id($layout_wrapper_id),
					'layout' => $layout_id
				));

			}

		}

	}


	public static function get_grid_width($wrapper) {

		if ( !is_array($wrapper) )
			return false;

		/* If wrapper is mirrored then use settings from it for the grid */
		if ( $potential_wrapper_mirror = HeadwayWrappers::get_wrapper_mirror($wrapper) )
			$wrapper = $potential_wrapper_mirror;

		$column_width = headway_get('use-independent-grid', $wrapper) ? headway_get('column-width', $wrapper) : HeadwayOption::get('column-width', false, HeadwayWrappers::$default_column_width);
		$gutter_width = headway_get('use-independent-grid', $wrapper) ? headway_get('gutter-width', $wrapper) : HeadwayOption::get('gutter-width', false, HeadwayWrappers::$default_gutter_width);
		
		return ($column_width * headway_get('columns', $wrapper)) + ((headway_get('columns', $wrapper) - 1) * $gutter_width);
		
	}


	public static function options_panel($wrapper, $layout) {

		require_once HEADWAY_LIBRARY_DIR . '/display/wrapper-options.php';
							
		//Initiate options class
		$options = new HeadwayWrapperOptions($this);
		$options->display($wrapper, $layout);
				
	}


}