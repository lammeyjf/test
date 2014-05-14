<?php
class EditorPanel extends HeadwayVisualEditorPanelAPI {
	
	
	public $id = 'editor';
	public $name = 'Editor';
	public $mode = 'design';

	
	function panel_content($args = false) {
		
		echo '
			<div class="design-editor-element-selector-container">';

				echo '<ul id="design-editor-main-elements" class="sub-tabs element-selector">';

				echo '</ul><!-- #design-editor-main-elements -->';
				
				echo '<ul id="design-editor-sub-elements" class="sub-tabs element-selector element-selector-hidden">';
											
				echo '</ul><!-- #design-editor-sub-elements -->';

			echo '</div><!-- .design-editor-element-selector-container -->
			
			<div class="design-editor-options-container">
			
				<div class="design-editor-info" style="display: none;">
					<h4>Editing: <span></span> <strong></strong> <code class="tooltip" title="">{}</code></h4>
					
					<div class="design-editor-info-right">
						<div class="select-container instances">
							<select class="instances">
							</select>
						</div><!-- .select-container -->
						
						<div class="select-container states">
							<select class="states">
							</select>
						</div><!-- .select-container -->
						
						<span class="button button-small design-editor-info-button customize-element-for-layout">Customize For Current Layout</span>
						<span class="button button-small design-editor-info-button customize-for-regular-element">Customize Regular Element</span>
					</div>
				</div><!-- .design-editor-info -->
				
				<div class="design-editor-options" style="display:none;"></div><!-- .design-editor-options -->
				
				<div class="design-editor-options-instructions sub-tab-notice">' . __('Please select an element to the left.', 'headway') . '</div>
				
			</div><!-- .design-editor-options-container -->
		';

	}

	
}
headway_register_visual_editor_panel('EditorPanel');