<?php
class DefaultsDesignEditorPanel extends HeadwayVisualEditorPanelAPI {
	
	public $id = 'defaults';
	public $name = 'Defaults';
	public $mode = 'design';
	
	function panel_content($args = false) {
		
		echo '
			<div class="design-editor-element-selector-container">';

				echo '<ul id="design-editor-default-elements" class="sub-tabs element-selector">';
				echo '</ul><!-- #design-editor-default-elements -->';
			
			echo '</div><!-- .design-editor-default-element-selector-container -->
			
			<div class="design-editor-options-container">
			
				<div class="design-editor-info" style="display: none;">
					<h4>Editing: <span></span> <strong>(Default Element)</strong></h4>
				</div><!-- .design-editor-info -->
				
				<div class="design-editor-options" style="display:none;"></div><!-- .design-editor-options -->
				
				<div class="design-editor-options-instructions sub-tab-notice">' . __('Please select a default element to the left.', 'headway') . '</div>
				
			</div><!-- .design-editor-options-container -->
		';

	}
	
	
}
headway_register_visual_editor_panel('DefaultsDesignEditorPanel');