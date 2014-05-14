(function($) {
	
visualEditorModeGrid = function() {	
		
	
	this.init = function() {
				
		this.bindPreviewButton();
		this.bindGridWizard();

	}	
		
				
	this.iframeCallback = function() {

		/* Load block content */
		$i('.block:not(.hide-content-in-grid)').each(function() {

			loadBlockContent({
				blockElement: $(this),
				blockOrigin: getBlockID($(this))
			});

		});
		
		/* Initialize Grid Stylesheet */
		gridStylesheet = new ITStylesheet({document: Headway.iframe.contents()[0], href: '/?headway-trigger=compiler&file=ve-iframe-grid-dynamic'}, 'find');
		
		/* Reset preview button if necessary */
		if ( $('span#preview-button').hasClass('preview-active') )
			$('span#preview-button').trigger('click');
				
		addEdgeInsertWrapperButtons();

		addWrapperButtons($i('div.wrapper'));
		bindWrapperButtons();

		setupWrapperSortables();
		setupWrapperResizable();
		setupWrapperContextMenu();

		assignDefaultWrapperID();

		/* If this is a new layout and there are no blocks, then set the Grid Container on the (only) wrapper to 500px */
			if ( $i('.grid-container').length === 1 && !$i('.block').length ) {
				$i('.grid-container').height(500);
			}

		/* Initiate Headway Grid */
		$i('div.wrapper').headwayGrid();

			/* Disable Grid on mirrored wrappers */
			$i('div.wrapper-mirrored').headwayGrid('disable');

		/* Update Default Grid Width Input */
			updateGridWidthInput('#sub-tab-grid-content');

		setupBlockContextMenu();
		bindBlockDimensionsTooltip();

	}
	
	
	this.bindPreviewButton = function() {
		
		/* Preview Button */
		$('span#preview-button').bind('click', function() {

			if ( !$(this).hasClass('preview-active') ) {

				iframeURL = Headway.homeURL 
					+ '?ve-iframe=true&ve-layout=' 
					+ Headway.currentLayout 
					+ '&ve-preview=true'
					+ '&unsaved=' + encodeURIComponent($.param(GLOBALunsavedValues))
					+ '&rand=' + Math.floor(Math.random()*100000001);

				/* Show loading indicator */
					$(this).text('Loading...');

					showIframeLoadingOverlay();

				/* Load preview */
					loadIframe(function() {

						Headway.iframe.fadeOut(300);
						$('iframe#preview').fadeIn(300);

						hideIframeLoadingOverlay();
						$('span#preview-button').addClass('preview-active').text('Show Grid');

						updateIframeHeight(Headway.previewIframe);

					}, iframeURL, $('iframe#preview'), false);

			} else {

				$('iframe#preview').fadeOut(300);
				Headway.iframe.fadeIn(300);

				$(this).removeClass('preview-active').text('Preview');

			}

		});
		
	}
	

	this.bindGridWizard = function() {
		
		/* Presets */
			var gridWizardPresets = {
				'right-sidebar': [
					{
						top: 0,
						left: 0,
						width: 24,
						height: 130,
						type: 'header'
					},
				
					{
						top: 140,
						left: 0,
						width: 24,
						height: 40,
						type: 'navigation'
					},
				
					{
						top: 190,
						left: 0,
						width: 18,
						height: 320,
						type: 'content'
					},
				
					{
						top: 190,
						left: 18,
						width: 6,
						height: 270,
						type: 'widget-area',
						mirroringOrigin: 'sidebar-1'
					},
				
					{
						top: 520,
						left: 0,
						width: 24,
						height: 70,
						type: 'footer'
					},
				],
			
				'left-sidebar': [
					{
						top: 0,
						left: 0,
						width: 24,
						height: 130,
						type: 'header'
					},
				
					{
						top: 140,
						left: 0,
						width: 24,
						height: 40,
						type: 'navigation'
					},
				
					{
						top: 190,
						left: 0,
						width: 6,
						height: 270,
						type: 'widget-area',
						mirroringOrigin: 'sidebar-1'
					},
				
					{
						top: 190,
						left: 6,
						width: 18,
						height: 320,
						type: 'content'
					},
				
					{
						top: 520,
						left: 0,
						width: 24,
						height: 70,
						type: 'footer'
					}
				],
			
				'two-right': [
					{
						top: 0,
						left: 0,
						width: 24,
						height: 130,
						type: 'header'
					},
				
					{
						top: 140,
						left: 0,
						width: 24,
						height: 40,
						type: 'navigation'
					},
				
					{
						top: 190,
						left: 0,
						width: 16,
						height: 320,
						type: 'content'
					},
				
					{
						top: 190,
						left: 16,
						width: 4,
						height: 270,
						type: 'widget-area',
						mirroringOrigin: 'sidebar-1'
					},
				
					{
						top: 190,
						left: 20,
						width: 4,
						height: 270,
						type: 'widget-area',
						mirroringOrigin: 'sidebar-2'
					},
				
					{
						top: 520,
						left: 0,
						width: 24,
						height: 70,
						type: 'footer'
					}
				],
			
				'two-both': [
					{
						top: 0,
						left: 0,
						width: 24,
						height: 130,
						type: 'header'
					},
				
					{
						top: 140,
						left: 0,
						width: 24,
						height: 40,
						type: 'navigation'
					},
				
					{
						top: 190,
						left: 0,
						width: 4,
						height: 270,
						type: 'widget-area',
						mirroringOrigin: 'sidebar-1'
					},
				
					{
						top: 190,
						left: 4,
						width: 16,
						height: 320,
						type: 'content'
					},
				
					{
						top: 190,
						left: 20,
						width: 4,
						height: 270,
						type: 'widget-area',
						mirroringOrigin: 'sidebar-2'
					},
				
					{
						top: 520,
						left: 0,
						width: 24,
						height: 70,
						type: 'footer'
					}
				],
			
				'all-content': [
					{
						top: 0,
						left: 0,
						width: 24,
						height: 130,
						type: 'header'
					},
				
					{
						top: 140,
						left: 0,
						width: 24,
						height: 40,
						type: 'navigation'
					},
				
					{
						top: 190,
						left: 0,
						width: 24,
						height: 320,
						type: 'content'
					},
				
					{
						top: 520,
						left: 0,
						width: 24,
						height: 70,
						type: 'footer'
					}
				]
			}


			$('div#boxes').delegate('div#box-grid-wizard span.layout-preset', 'mousedown', function() {
			
				$('div#box-grid-wizard span.layout-preset-selected').removeClass('layout-preset-selected');
				$(this).addClass('layout-preset-selected');
			
			});


			$('div#boxes').delegate('span#grid-wizard-button-preset-next', 'click', function() {
			
				/* Populate the step 2 panel with the proper select boxes */
				var selectedPreset = $('div#box-grid-wizard span.layout-preset-selected').attr('id').replace('layout-', '');
								
				switch ( selectedPreset ) {
					
					case 'right-sidebar':
					
						$('div#grid-wizard-presets-mirroring-select-sidebar-1').show();
						$('div#grid-wizard-presets-mirroring-select-sidebar-2').hide();
						
						$('div#grid-wizard-presets-mirroring-select-sidebar-1 h5').text('Right Sidebar');
						
					break;
					
					
					case 'left-sidebar':
					
						$('div#grid-wizard-presets-mirroring-select-sidebar-1').show();
						$('div#grid-wizard-presets-mirroring-select-sidebar-2').hide();
						
						$('div#grid-wizard-presets-mirroring-select-sidebar-1 h5').text('Left Sidebar');
					
					break;
					
					
					case 'two-right':
					
						$('div#grid-wizard-presets-mirroring-select-sidebar-1').show();
						$('div#grid-wizard-presets-mirroring-select-sidebar-2').show();
						
						$('div#grid-wizard-presets-mirroring-select-sidebar-1 h5').text('Left Sidebar');
						$('div#grid-wizard-presets-mirroring-select-sidebar-2 h5').text('Right Sidebar');
					
					break;
					
					
					case 'two-both':
					
						$('div#grid-wizard-presets-mirroring-select-sidebar-1').show();
						$('div#grid-wizard-presets-mirroring-select-sidebar-2').show();
						
						$('div#grid-wizard-presets-mirroring-select-sidebar-1 h5').text('Left Sidebar');
						$('div#grid-wizard-presets-mirroring-select-sidebar-2 h5').text('Right Sidebar');
					
					break;
					
					
					case 'all-content':
					
						$('div#grid-wizard-presets-mirroring-select-sidebar-1').hide();
						$('div#grid-wizard-presets-mirroring-select-sidebar-2').hide();
					
					break;
					
				}
				
			
				/* Change the buttons around */
				$(this).hide(); //Next button
				
				$('span#grid-wizard-button-preset-previous').show();
				$('span#grid-wizard-button-preset-use-preset').show(); 
				
				
				/* Change the content that's being displayed */
				$('div#grid-wizard-presets-step-1').hide();
				$('div#grid-wizard-presets-step-2').show();
				
			});
			
			
			$('div#boxes').delegate('span#grid-wizard-button-preset-previous', 'click', function() {
			
				/* Change the buttons around */
				$(this).hide(); //Previous button
				$('span#grid-wizard-button-preset-use-preset').hide();
				
				$('span#grid-wizard-button-preset-next').show();
				
				
				/* Change the content that's being displayed */
				$('div#grid-wizard-presets-step-2').hide();
				$('div#grid-wizard-presets-step-1').show();
				
			});
			

			$('div#boxes').delegate('span#grid-wizard-button-preset-use-preset', 'click', function() {
			
				var selectedPreset = $('div#box-grid-wizard span.layout-preset-selected').attr('id').replace('layout-', '');
			
				//Delete any blocks that are on the grid already
				$i('.block').each(function() {
				
					deleteBlock(this);
				
				});
			
				//Put the new blocks on the layout
				var blockIDBatch = getAvailableBlockIDBatch(gridWizardPresets[selectedPreset].length);
						
				$.each(gridWizardPresets[selectedPreset], function() {
								
					var addBlockArgs = $.extend({}, this, {
						id: blockIDBatch[0]
					});
					
					delete addBlockArgs.mirroringOrigin;
		
					/* Handle Mirroring */
					var mirroringOrigin = (typeof this.mirroringOrigin != 'undefined') ? this.mirroringOrigin : this.type;
					var mirroringSelectVal = $('div#grid-wizard-presets-mirroring-select-' + mirroringOrigin + ' select').val();
																				
					if ( mirroringSelectVal !== '' ) {
						
						addBlockArgs.settings = {}
						addBlockArgs.settings['mirror-block'] = mirroringSelectVal;
											
					}

					/* Add the block to the grid */
					$i('.ui-headway-grid').first().data('ui-headwayGrid').addBlock(addBlockArgs);
					
					/* Remove the ID that was just used from the patch */
					blockIDBatch.splice(0, 1);
				
				});
				
				/* Force the available block ID to be refreshed */
				getAvailableBlockID();
			
				return closeBox('grid-wizard');
			
			});
		/* End Presets */


		/* Layout Cloning */
			$('div#boxes').delegate('span#grid-wizard-button-clone-page', 'click', function() {
				
				var layoutToClone = $('select#grid-wizard-pages-to-clone').val();
				
				if ( layoutToClone === '' )
					return alert('Please select a page to clone.');
					
				if ( $(this).hasClass('button-depressed') )
					return;
					
				$(this).text('Cloning...').addClass('button-depressed').css('cursor', 'default');
			
				var request = $.ajax(Headway.ajaxURL, {
					type: 'POST',
					async: true,
					data: {
						action: 'headway_visual_editor',
						method: 'get_layout_blocks_in_json',
						security: Headway.security,
						layout: layoutToClone
					},
					success: function(data, textStatus) {
						
						if ( textStatus == false )
							return false;

						//Delete any wrappers and blocks that are on the grid already
						$i('.wrapper').each(function() {
							deleteWrapper(getWrapperID($(this)), true);
						});

						var wrappers = data.wrappers;
						var blocks = data.blocks;
						var numberOfBlocks = Object.keys(blocks).length;
						var blockIDBatch = getAvailableBlockIDBatch(numberOfBlocks);

						var wrapperIDTranslations = {};

						$.each(wrappers, function(id, settings) {

							/* Pluck wrapper styling out that way it doesn't get sent to the database */
							var wrapperStyling = settings['styling'];

							delete settings['styling'];
							var newWrapper = addWrapper('bottom', settings, true);

							/* Add old and new ID to wrapperIDTranslations that way blocks being added can be added to the correct wrapper */
							var newWrapperID = getWrapperID(newWrapper);
							wrapperIDTranslations[id.replace('wrapper-', '')] = newWrapperID;

							/* Add in styling */
								$.each(wrapperStyling, function(property, value) {

									dataSetDesignEditorProperty({
										group: "structure", 
										element: "wrapper", 
										property: property, 
										value: (value !== null ? value.toString() : null), 
										specialElementType: "instance", 
										specialElementMeta: "wrapper-" + newWrapperID + "-layout-" + Headway.currentLayout
									});

									/* If margin or padding, add it in now for visible feedback */
										if ( property.indexOf('margin') === 0 ) {

											var whichMargin = property.replace('margin-', '').capitalize();
											newWrapper.css('margin' + whichMargin, value + 'px');

										} else if ( property.indexOf('padding') === 0 ) {

											var whichPadding = property.replace('padding-', '').capitalize();
											newWrapper.css('padding' + whichPadding, value + 'px');

										}

								});

						});

						$.each(blocks, function() {
														
							var blockToMirror = this.settings['mirror-block'] ? this.settings['mirror-block'] : this.id;

							var addBlockArgs = {
								id: blockIDBatch[0],
								type: this.type,
								top: this.position.top,
								left: this.position.left,
								width: this.dimensions.width,
								height: this.dimensions.height,
								settings: $.extend({}, this.settings, {'mirror-block': blockToMirror})
							};	

							var blockWrapper = (typeof this.wrapper != 'undefined' && this.wrapper) ? this.wrapper : 'default';

							/* If there's a wrapper ID translation, use it.  Otherwise we'll put the block in the last wrapper */
								if ( typeof wrapperIDTranslations[blockWrapper.replace('wrapper-', '')] != 'undefined' ) {

									var destinationWrapperID = '#wrapper-' + wrapperIDTranslations[blockWrapper.replace('wrapper-', '')];
									var destinationWrapper = $i('.ui-headway-grid').filter(destinationWrapperID).first();

								} else {

									var destinationWrapper = $i('.ui-headway-grid').last();

								}

							/* Add block to wrapper */
							var newBlock = destinationWrapper.data('ui-headwayGrid').addBlock(addBlockArgs);
							var newBlockID = getBlockID(newBlock);
							var oldBlockID = this.id;

							//Remove the ID that was just used from the patch
							blockIDBatch.splice(0, 1);

							/* Queue styling for saving */
								if ( typeof this.styling != 'undefined' && this.styling ) {

									$.each(this.styling, function(blockInstanceID, blockInstanceInfo) {

										/* Replace the block ID instance ID of the correct block ID */
										var blockInstanceID = blockInstanceID.replace('block-' + oldBlockID, 'block-' + newBlockID);

										$.each(blockInstanceInfo.properties, function(property, value) {

											dataSetDesignEditorProperty({
												group: "blocks", 
												element: blockInstanceInfo.element, 
												property: property, 
												value: (value !== null ? value.toString() : null), 
												specialElementType: "instance", 
												specialElementMeta: blockInstanceID
											});

										});
									
									});

								}

						});

						//Force the available block ID to be refreshed
						getAvailableBlockID();
						
						return closeBox('grid-wizard');
						
					}
				});
								
			});
		/* End Layout Cloning */
		
		
		/* Template Assigning */
			$('div#boxes').delegate('span#grid-wizard-button-assign-template', 'click', function() {
				
				var templateToAssign = $('select#grid-wizard-assign-template').val().replace('template-' , '');
				
				if ( templateToAssign === '' )
					return alert('Please select a template to assign.');
				
				//Do the AJAX request to assign the template
				$.post(Headway.ajaxURL, {
					action: 'headway_visual_editor',
					method: 'assign_template',
					security: Headway.security,
					template: templateToAssign,
					layout: Headway.currentLayout
				}, function(response) {

					if ( typeof response === 'undefined' || response == 'failure' ) {
						showErrorNotification({
							id: 'error-could-not-assign-template',
							message: 'Error: Could not assign template.'
						});

						return false;
					}

					$('div#layout-selector li.layout-selected').removeClass('layout-item-customized');
					$('div#layout-selector li.layout-selected').addClass('layout-item-template-used');

					$('div#layout-selector li.layout-selected span.status-template').text(response);

					//Reload iframe

						showIframeLoadingOverlay();

						//Change title to loading
						changeTitle('Visual Editor: Assigning Template');
						startTitleActivityIndicator();

						Headway.currentLayoutTemplate = 'template-' + templateToAssign;

						//Reload iframe and new layout
						headwayIframeLoadNotification = 'Template assigned successfully!';

						loadIframe(Headway.instance.iframeCallback);

					//End reload iframe

				});

				layoutSelectorRevertCheck();

				return closeBox('grid-wizard');
				
			});
		/* End Template Assigning */

		
		/* Empty Grid */
			$('div#boxes').delegate('span.grid-wizard-use-empty-grid', 'click', function() {
			
				//Empty the grid out
				$i('.block').each(function() {
				
					deleteBlock(this);
				
				});
			
				closeBox('grid-wizard');
			
			});
		/* End Empty Grid */


		/* Layout Import/Export */
			/* Layout Import */
				initiateLayoutImport = function(input) {

					var layoutChooser = input;

					if ( !layoutChooser.val() )
						return alert('You must select a Headway layout file before importing.');

					var layoutFile = layoutChooser.get(0).files[0];

					if ( layoutFile && typeof layoutFile.name != 'undefined' && typeof layoutFile.type != 'undefined' ) {

						var layoutReader = new FileReader();

						layoutReader.onload = function(e) { 

							var contents = e.target.result;
							var layout = JSON.parse(contents);

							/* Check to be sure that the JSON file is a layout */
								if ( layout['data-type'] != 'layout' )
									return alert('Cannot load layout file.  Please insure that the selected file is a valid Headway layout export.');

							if ( typeof layout['image-definitions'] != 'undefined' && Object.keys(layout['image-definitions']).length ) {

								showNotification({
									id: 'importing-images',
									message: 'Currently importing images.',
									closeTimer: 10000
								});

								$.post(Headway.ajaxURL, {
									action: 'headway_visual_editor',
									method: 'import_images',
									security: Headway.security,
									importFile: layout
								}, function(response) {

									var layout = response;

									/* If there's an error when sideloading images, then hault import. */
									if ( typeof layout['error'] != 'undefined' )
										return alert('Error while importing images for layout: ' + layout['error']);

									importLayout(layout);

								});

							} else {

								importLayout(layout);

							}

						}

						layoutReader.readAsText(layoutFile);

					} else {

						alert('Cannot load layout file.  Please insure that the selected file is a valid Headway layout export.');

					}

				}


				importLayout = function(layout) {

					/* Import all blocks */
						/* Delete any blocks that are on the grid already */
						$i('.block').each(function() {

							deleteBlock(this);

						});

						var blocks = layout['blocks'];
						var numberOfBlocks = Object.keys(blocks).length;
						var blockIDBatch = getAvailableBlockIDBatch(numberOfBlocks);

						$.each(blocks, function() {
														
							var addBlockArgs = {
								id: blockIDBatch[0],
								type: this.type,
								top: this.position.top,
								left: this.position.left,
								width: this.dimensions.width,
								height: this.dimensions.height,
								settings: this.settings
							};	

							$i('.ui-headway-grid').first().data('ui-headwayGrid').addBlock(addBlockArgs);

							/* Remove the ID that was just used from the patch */
							blockIDBatch.splice(0, 1);

						});

						/* Force the available block ID to be refreshed */
						getAvailableBlockID();

					/* Finish Up */
						showNotification({
							id: 'layout-successfully-imported',
							message: 'Layout successfully imported.<br /><br />Remember to save if you wish to keep the layout.',
							closeTimer: false,
							closable: true
						});

						closeBox('grid-wizard');

						allowSaving();

					return true;

				}


				$('div#boxes').delegate('#grid-wizard-import-select-file', 'click', function() {
				
					$(this).siblings('input[type="file"]').trigger('click');
				
				});


					$('div#boxes').delegate('#grid-wizard-import input[type="file"]', 'change', function(event) {
							
						if ( event.target.files[0].name.split('.').slice(-1)[0] != 'json' ) {

							$(this).val(null);
							return alert('Invalid layout file.  Please be sure that the layout is a valid JSON formatted file.');

						}

						initiateLayoutImport($(this));
						
					});

			/* Layout Export */
				$('div#boxes').delegate('#grid-wizard-export-download-file', 'click', function() {
					
					var params = {
						'action': 'headway_visual_editor',
						'security': Headway.security,
						'method': 'export_layout',
						'layout': Headway.currentLayout
					}

					var exportURL = Headway.ajaxURL + '?' + $.param(params);

					return window.open(exportURL);
				
					closeBox('grid-wizard');
				
				});
		/* End Import/Export */


	}
	

}


/* WRAPPER OPTION INPUT CALLBACKS */
	/* Grid Settings */
		wrapperOptionCallbackIndependentGrid = function(input, value) {

			var wrapper = $i("#" + input.parents("[data-panel-args]").data("panel-args").wrapper.id);

			if ( typeof wrapper == 'undefined' || !wrapper.length )
				return false;

			/* Find wrapper and Headway Grid UI widget */
				var wrapperGridObject = wrapper.data('ui-headwayGrid');

			/* Update wrapper object and the guides */
				wrapperGridObject.options.useIndependentGrid = value;

			/* Finalize: Update the Wrapper/Grid CSS and reset draggable/resizable, etc */
				wrapperGridObject.updateGridCSS();

		}


		wrapperOptionCallbackColumnCount = function(input, value) {

			var wrapper = $i("#" + input.parents("[data-panel-args]").data("panel-args").wrapper.id);

			if ( typeof wrapper == 'undefined' || !wrapper.length )
				return false;

			/* Throw error saying column count can't be changed if there are blocks in the grid */
				if ( wrapper.find('.block:visible').length ) {

					alert("This wrapper must be empty of blocks before you can change the number of columns.\n\nEither drag the blocks to another wrapper or delete them if they are no longer needed.");

					return false;

				}

			/* Find wrapper and Headway Grid UI widget */
				var wrapperGridObject = wrapper.data('ui-headwayGrid');

			/* Update wrapper object and the guides */
				wrapperGridObject.options.columns = value;

				wrapperGridObject.addColumnGuides();

			/* Finalize: Update the Wrapper/Grid CSS and reset draggable/resizable, etc */
				wrapperGridObject.updateGridCSS();

		}
		

		wrapperOptionCallbackColumnWidth = function(input, value) {

			var wrapper = $i("#" + input.parents("[data-panel-args]").data("panel-args").wrapper.id);

			if ( typeof wrapper == 'undefined' || !wrapper.length )
				return false;

			/* Find wrapper and Headway Grid UI widget */
				var wrapperGridObject = wrapper.data('ui-headwayGrid');

			/* Update wrapper object and the guides */
				wrapperGridObject.options.columnWidth = value;

			/* Finalize: Update the Wrapper/Grid CSS and reset draggable/resizable, etc */
				wrapperGridObject.updateGridCSS();

		}


		wrapperOptionCallbackGutterWidth = function(input, value) {

			var wrapper = $i("#" + input.parents("[data-panel-args]").data("panel-args").wrapper.id);

			if ( typeof wrapper == 'undefined' || !wrapper.length )
				return false;

			/* Find wrapper and Headway Grid UI widget */
				var wrapperGridObject = wrapper.data('ui-headwayGrid');

			/* Update wrapper object and the guides */
				wrapperGridObject.options.gutterWidth = value;

			/* Finalize: Update the Wrapper/Grid CSS and reset draggable/resizable, etc */
				wrapperGridObject.updateGridCSS();
		}


	/* Wrapper Margin Inputs */
		wrapperOptionCallbackMarginTop = function(input, value) {

			var wrapper = $i("#" + input.parents("[data-panel-args]").data("panel-args").wrapper.id);

			if ( typeof wrapper == 'undefined' || !wrapper.length )
				return false;

			wrapper.css({marginTop: value});

			/* Visible feedback of margin */
			wrapperMarginFeedbackCreator(wrapper, 'top');

		}

		wrapperOptionCallbackMarginBottom = function(input, value) {

			var wrapper = $i("#" + input.parents("[data-panel-args]").data("panel-args").wrapper.id);

			if ( typeof wrapper == 'undefined' || !wrapper.length )
				return false;

			wrapper.css({
				marginBottom: value
			});

			/* Visible feedback of margin */
			wrapperMarginFeedbackCreator(wrapper, 'bottom');

		}

		wrapperMarginFeedbackCreator = function(wrapper, topOrBottom) {

			/* Remove any existing margin feedback element */
				if ( wrapper.find('.wrapper-margin-feedback').length ) {

					clearTimeout(wrapper.find('.wrapper-margin-feedback').data('fadeout-timeout'));
					wrapper.find('.wrapper-margin-feedback').remove();

				}

			/* Create margin feedback element */
				var wrapperMarginFeedback = $('<div class="wrapper-margin-feedback"></div>').prependTo(wrapper);

			/* Style it */
				var value = parseInt(wrapper.css('margin' + topOrBottom.capitalize()).replace('px', ''));

				var feedbackCSS = {
					position: 'absolute',
					width: wrapper.outerWidth(),
					left: 0,
					height: value,
					backgroundColor: 'rgba(255, 127, 0, .35)'
				};

				/* Determine where feedback helper will go based on topOrBottom (whether it's marginTop or marginBottom) */
					feedbackCSS[topOrBottom] = '-' + value + 'px';

				/* Send CSS to margin feedback helper */
					wrapperMarginFeedback.css(feedbackCSS);

			/* Set a timer to fade it out and remove it */
				wrapperMarginFeedback.data('fadeout-timeout', setTimeout(function() {

					wrapperMarginFeedback.fadeOut(200);

				}, 400));

			return wrapperMarginFeedback;

		}

	/* Default Wrapper Options */
		updateGridWidthInput = function(context) {

			var columns = $(context).find('input[name="columns"]').val();
			var columnWidth = $(context).find('input[name="column-width"]').val();
			var gutterWidth = $(context).find('input[name="gutter-width"]').val();

			var gridWidth = (columnWidth * columns) + ((columns - 1) * gutterWidth);

			return $(context).find('input[name="grid-width"]').val(gridWidth);

		}
/* END WRAPPER OPTION INPUT CALLBACKS */


/* GRID HANDLING */
	updateGridCSS = function(wrapperCSSSelector, columns, columnWidth, gutterWidth, gridWidthInputContext) {

		/* Calculate Grid Width */
			var gridWidth = (columnWidth * columns) + ((columns - 1) * gutterWidth);

		/* Calculate percentages for column widths and margins */		
			var ratioColumnWidth = (columnWidth * columns) / gridWidth;
			var ratioGutterWidth = (gutterWidth * columns) /gridWidth;

			var singlePercentageColumnWidth = (100 / columns) * ratioColumnWidth;
			var singlePercentageGutterWidth = (100 / columns) * ratioGutterWidth;

		/* Define round precision in one place so it can be changed if necessary */
			var roundPrecision = 9;

		/* Wrapper CSS Prefix that way these changes don't modify other wrappers */
			var wrapperCSSPrefix = wrapperCSSSelector + ' ';

		/* Send calculated percentages to CSS */
			/* Grid Guides */
				gridStylesheet.update_rule(wrapperCSSPrefix + '.grid-guides .grid-guide', {margin: '0 0 0 ' + Math.round(singlePercentageGutterWidth, roundPrecision) + '%'});

			/* Grid Width/Grid Left Classes */
				for ( i = 1; i <= columns; i++ ) {

					gridStylesheet.update_rule(wrapperCSSPrefix + '.grid-width-' + i, {width: Math.round((singlePercentageColumnWidth * i + ((i - 1) * singlePercentageGutterWidth)), roundPrecision) + '%'});
					gridStylesheet.update_rule(wrapperCSSPrefix + '.grid-left-' + i, {left: '0 0 0 ' + Math.round(((singlePercentageColumnWidth + singlePercentageGutterWidth) * i), roundPrecision) + '%'});
					
				}

			/* Grid Container */
				gridStylesheet.update_rule(wrapperCSSPrefix + 'div.grid-container', {width: (gridWidth + 1) + 'px'});

			/* Wrapper */
				gridStylesheet.update_rule(wrapperCSSSelector + '.wrapper-fixed', {width: (gridWidth) + 'px'});

		/* Update Grid Width Read-Only Input If Present */
			if ( typeof gridWidthInputContext != 'undefined' && gridWidthInputContext.length )
				updateGridWidthInput(gridWidthInputContext);

	}


/* END GRID HANDLING */



/* WRAPPER HANDLING */
	setupWrapperSortables = function() {

		/* Wrapper Sorting */
		$i('#whitewrap').sortable({
			items: 'div.wrapper',
			handle: 'div.wrapper-drag-handle',
			axis: 'y',
			tolerance: 'pointer',
			placeholder: 'wrapper-sortable-placeholder',
			start: function(event, ui) {

				/* Store previous heights of wrappers that way they can be added back after sorting */
				$i('.wrapper').each(function() {
					$(this).data('current-height', $(this).height());
				});

				/* Shorten grid container and hide overflow */
				$i('.wrapper-fixed').css({
					height: '100px'
				});

					$i('.wrapper-fluid').css({
						height: '130px'
					});

				$i('.wrapper .grid-container').css({
					height: '100px',
					overflow: 'hidden'
				});

				/* Center fixed wrappers with absolute positioning because sortables doesn't like margin: 0 auto; */
				if ( $(ui.item).hasClass('wrapper-fixed-grid') ) {

					$(ui.item).css({
						left: '50%',
						marginLeft: '-' + ($(ui.item).outerWidth() / 2) + 'px'
					});

				}
			
				/* Update placeholder size */
				ui.placeholder.css({
					width: ui.item.outerWidth(),
					height: ui.item.outerHeight(),
					marginTop: ui.item.css('marginTop'),
					marginBottom: ui.item.css('marginBottom')
				});

				/* Set iframe scroll height to 500px above placeholder */
				$('#iframe-container').scrollTop(ui.placeholder.offset().top - 300);

				/* Refresh sortable since heights changed */
				$(this).sortable('refreshPositions');

			},
			stop: function(event, ui) {
				
				/* Un-absolute-center fixed wrappers */
				$i('.wrapper').css({
					marginLeft: '',
					left: ''
				});

				/* Reset wrapper heights */
				$i('.wrapper').each(function() {

					$(this).height($(this).data('current-height'));

					$(this).removeData('current-height');

				});

				/* Remove overflow: hidden from wrappers and grid containers */
				$i('.wrapper, .wrapper .grid-container').css({
					overflow: ''
				});

				/* Reset grid container heights */
				$i('.wrapper').each(function() {
					$(this).headwayGrid('updateGridContainerHeight');
				});
				
				dataSortWrappers();

			}
		});

	}

	setupWrapperResizable = function(wrappers) {

		if ( typeof wrappers == 'undefined' )
			var wrappers = $i('.wrapper');

		wrappers.each(function() {

			var wrapperMinHeight = parseInt($(this).css('minHeight').replace('px', '')) ;

			$(this).resizable({
				handles: 'n, s',
				minHeight: wrapperMinHeight,
				start: function(event, ui) {

					if ( $(event.toElement).hasClass('ui-resizable-n') ) {
						$(this).data('resizing-position', 'n');
					} else {
						$(this).data('resizing-position', 's');
					}

					/* Set minHeight depending on the location and height of the lowest block */
					if ( $(this).find('.block').length ) {

						var bottomToUse = 0;
						var topToUse = null;

						$(this).find('.block:visible').each(function() {

							var blockTop = $(this).position().top;
							var blockBottom = $(this).outerHeight() + blockTop;

							if ( blockBottom > bottomToUse )
								bottomToUse = blockBottom;

							if ( blockTop < topToUse || topToUse === null )
								topToUse = blockTop;

							/* Store the block's original block top */
							$(this).data('resize-original-block-top', $(this).position().top);

						});

						/* If the wrapper is being resized from the top, then we can subtract the topToUse (the highest block position) from the min height that way wrapper height can be reduced from the top */
						if ( $(this).data('resizing-position') == 'n' ) {
							var minHeight = bottomToUse - topToUse;
						} else {
							var minHeight = bottomToUse;
						}

					} else {

						var minHeight = wrapperMinHeight;

					}

					$(this).resizable('option', 'minHeight', minHeight);

				},
				resize: function(event, ui) {

					var heightChange = ui.originalSize.height - ui.size.height;
					var wrapperHeight = ui.size.height;

					$(this).find('.grid-container').height(wrapperHeight);

					/* Cancel out top and height added to wrapper since the grid container height will dictate the wrapper height */
					$(this).css({
						top: '',
						height: ''
					});

					if ( $(this).data('resizing-position') == 'n' ) {

						/* Insure that the resulting on any of the block tops isn't negative.  If so, stop ALL block top changing */
							var negativeTop = false;

							$(this).find('.block').each(function() {

								if ( $(this).data('resize-original-block-top') - heightChange < 0 ) {

									negativeTop = true;
									return false;

								}

							});

						/* Change block tops if the test is passed */
							if ( !negativeTop ) {

								$(this).find('.block').each(function() {

									$(this).css({
										top: $(this).data('resize-original-block-top') - heightChange
									});

								});

							}

					}

					/* Update iframe height */
					updateIframeHeight();

				},
				stop: function() {

					$(this).data('resizing-position', null);

				}
			});

		});

	}	

		stopWrapperResizable = function(wrapper) {

			if ( !wrapper.length || !wrapper.resizable )
				return false;

			wrapper.resizable('destroy');

			setupWrapperResizable(wrapper);

		}

	addEdgeInsertWrapperButtons = function() {

		var buttons = '\
			<div class="add-wrapper-button-fluid-container">\
				<div class="add-wrapper-button-fluid">\
					<span>Add <strong>Fluid</strong> Wrapper</span>\
				</div>\
				<div class="add-wrapper-fluid-popup">\
					<span class="add-wrapper-fluid-fixed-grid">Fluid Wrapper with <strong>Fixed-Width</strong> Grid</span>\
					<span class="add-wrapper-fluid-fluid-grid">Fluid Wrapper with <strong>Fluid-Width</strong> Grid</span>\
				</div>\
			</div>\
			\
			<div class="add-wrapper-button-fixed">\
				<span>Add <strong>Fixed</strong> Wrapper</span>\
			</div>\
		';

		$('<div class="add-wrapper-buttons add-wrapper-buttons-top">' + buttons + '</div>')
			.data('position', 'top')
			.prependTo($i('body'));

		$('<div class="add-wrapper-buttons add-wrapper-buttons-bottom">' + buttons + '</div>')
			.data('position', 'bottom')
			.appendTo($i('body'));

	}

	setupWrapperContextMenu = function() {

		setupContextMenu({
			id: 'wrapper',
			elements: '.wrapper',
			title: function(event) {

				var wrapper = $(event.currentTarget);
				var wrapperID = getWrapperID(wrapper);

				return 'Wrapper #' + wrapperID;

			},
			contentsCallback: function(event) {

				var contextMenu = $(this);
				var wrapper = $(event.currentTarget);
				var wrapperID = getWrapperID(wrapper);

				/* Wrapper options */
					$('<li><span>Open Wrapper Options</span></li>').appendTo(contextMenu).on('click', function() {

						openWrapperOptions(wrapperID);

					});

				/* Wrapper type changing */
				if ( wrapper.hasClass('wrapper-fluid') ) {

					$('<li><span>Change Wrapper to Fixed</span></li>').appendTo(contextMenu).find('span').on('click', function() {

						wrapper.removeClass('wrapper-fluid');
						wrapper.removeClass('wrapper-fluid-grid');

						wrapper.addClass('wrapper-fixed');
						wrapper.addClass('wrapper-fixed-grid');

						dataSetWrapperWidth(getWrapperID(wrapper), 'fixed');
						dataSetWrapperGridWidth(getWrapperID(wrapper), 'fixed');

						wrapper.data('ui-headwayGrid').resetGridCalculations();
						wrapper.data('ui-headwayGrid').alignAllBlocksWithGuides();
						wrapper.data('ui-headwayGrid').updateGridContainerHeight();

					});

					if ( wrapper.hasClass('wrapper-fixed-grid') ) {

						$('<li><span>Change Grid to Fluid</span></li>').appendTo(contextMenu).find('span').on('click', function() {

							wrapper.removeClass('wrapper-fixed-grid');
							wrapper.addClass('wrapper-fluid-grid');

							dataSetWrapperWidth(getWrapperID(wrapper), 'fluid');
							dataSetWrapperGridWidth(getWrapperID(wrapper), 'fluid');

							wrapper.data('ui-headwayGrid').resetGridCalculations();
							wrapper.data('ui-headwayGrid').alignAllBlocksWithGuides();
							wrapper.data('ui-headwayGrid').updateGridContainerHeight();

						});

					} else if ( wrapper.hasClass('wrapper-fluid-grid') ) {

						$('<li><span>Change Grid to Fixed</span></li>').appendTo(contextMenu).find('span').on('click', function() {

							wrapper.removeClass('wrapper-fluid-grid');
							wrapper.addClass('wrapper-fixed-grid');

							dataSetWrapperWidth(getWrapperID(wrapper), 'fluid');
							dataSetWrapperGridWidth(getWrapperID(wrapper), 'fixed');

							wrapper.data('ui-headwayGrid').resetGridCalculations();
							wrapper.data('ui-headwayGrid').alignAllBlocksWithGuides();
							wrapper.data('ui-headwayGrid').updateGridContainerHeight();

						});

					}

				} else if ( wrapper.hasClass('wrapper-fixed') ) {

					$('<li><span>Change Wrapper to Fluid</span></li>').appendTo(contextMenu).on('click', function() {

						wrapper.removeClass('wrapper-fixed');

						wrapper.addClass('wrapper-fluid');
						wrapper.addClass('wrapper-fixed-grid');

						dataSetWrapperWidth(getWrapperID(wrapper), 'fluid');
						dataSetWrapperGridWidth(getWrapperID(wrapper), 'fixed');

						wrapper.data('ui-headwayGrid').resetGridCalculations();
						wrapper.data('ui-headwayGrid').alignAllBlocksWithGuides();
						wrapper.data('ui-headwayGrid').updateGridContainerHeight();

					});

				}

				/* Delete wrapper.  Do not allow it to be deleted if it's the last one. */
				if ( $i('.wrapper:visible').length >= 2 ) {

					$('<li><span>Delete Wrapper</span></li>').appendTo(contextMenu).on('click', function() {

						deleteWrapper(wrapperID);

					});

				}

			}
		});

	}

	bindWrapperButtons = function() {

		/* Add Wrapper Buttons */
			$i('body').delegate('.add-wrapper-button-fixed', 'click', function() {

				return addWrapper($(this).parents('.add-wrapper-buttons').data('position'), {
					'fluid': false
				});

			});

			$i('body').delegate('.add-wrapper-fluid-fixed-grid', 'click', function() {

				return addWrapper($(this).parents('.add-wrapper-buttons').data('position'), {
					'fluid': true
				});
			});

			$i('body').delegate('.add-wrapper-fluid-fluid-grid', 'click', function() {

				return addWrapper($(this).parents('.add-wrapper-buttons').data('position'), {
					'fluid': true,
					'fluid-grid': true
				});

			});

		/* Wrapper Buttons */
			$i('body').delegate('.wrapper-buttons .wrapper-options', 'click', function() {

				return openWrapperOptions(getWrapperID($(this).parents('.wrapper').first()));

			});

			bindWrapperMarginButtons($i('.wrapper-buttons .wrapper-margin-handle'));


	}

		addWrapper = function(position, wrapperSettings, suppressNotice) {

			if ( typeof wrapperSettings.id != 'undefined' )
				delete wrapperSettings.id;

			var wrapperSettings = $.extend({}, {
				'fluid': false,
				'fluid-grid': false,
				'use-independent-grid': false
			}, wrapperSettings);

			/* Generate the wrapper */
				var wrapperID =  getAvailableWrapperID();
				var wrapper = $('<div id="wrapper-' + wrapperID + '" class="wrapper"><div class="grid-container"></div></div>');

				/* Add wrapper mirror notice/overlay */
					wrapper.prepend('<div class="wrapper-mirror-overlay"></div>');
					
					wrapper.find('.grid-container').append('\
						<div class="wrapper-mirror-notice">\
							<div>\
							<h2>Wrapper Mirrored</h2>\
							<p>This wrapper is mirroring the blocks from Wrapper #<span class="wrapper-mirror-notice-id"></span> <span class="wrapper-mirror-notice-alias"></span></p>\
							<small>Mirroring can be disabled via Wrapper Options in the right-click menu</small>\
							</div>\
						</div><!-- .wrapper-mirror-notice -->\
					');

				/* Add wrapper buttons */
					addWrapperButtons(wrapper);

				/* Classes */
					if ( wrapperSettings['fluid'] ) {
						wrapper.addClass('wrapper-fluid');
					} else {
						wrapper.addClass('wrapper-fixed');
					}

					if ( wrapperSettings['fluid-grid'] ) {
						wrapper.addClass('wrapper-fluid-grid');
					} else {
						wrapper.addClass('wrapper-fixed-grid');
					}
			/* End wrapper generation */


			/* Position the wrapper and place it into the document */
				switch ( position ) {

					case 'top':
						wrapper.prependTo($i('#whitewrap'));
					break;

					case 'bottom':
						wrapper.appendTo($i('#whitewrap'));
					break;

				} 

			/* Top/Bottom Margins for Fluid Wrappers */
				/* This will change the margin top on fluid wrappers that touch the top to 0 and margin bottoms to 0 on fluid wrappers that are the last wrapper  */
					if ( wrapperSettings['fluid'] ) {

						wrapper.css('margin' + position.capitalize(), 0);

						dataSetDesignEditorProperty({
							group: 'structure', 
							element: 'wrapper', 
							property: 'margin-' + position, 
							value: 0, 
							specialElementType: 'instance', 
							specialElementMeta: 'wrapper-' + wrapperID + '-layout-' + Headway.currentLayout
						});

					}

			/* Add the hidden flag so it saves*/
				dataAddWrapper(wrapperID, wrapperSettings);

				allowSaving();

			/* Set height on Grid to 100px */
				wrapper.find('.grid-container').height(100);

			/* Initiate Headway Grid on new wrapper */
				wrapper.headwayGrid();
				setupWrapperResizable(wrapper);

				bindWrapperMarginButtons(wrapper.find('.wrapper-margin-handle'));

			/* Show notification */
				var wrapperType = wrapperSettings['fluid'] ? 'Fluid' : 'Fixed';

				if ( typeof suppressNotice == 'undefined' || !suppressNotice )
					showNotification({
						id: 'wrapper-created-' + wrapperID,
						message: wrapperType + ' wrapper created.',
						closable: true,
						closeTimer: 5000
					});
					
			/* Refresh tooltips */
				setupTooltips('iframe');

			return wrapper;

		}

		deleteWrapper = function(wrapperID, force) {

			var wrapper = $i('#wrapper-' + wrapperID);

			if ( wrapper.length && (force || confirm('Are you sure you want to remove this wrapper?  All blocks inside the wrapper will be deleted as well.')) ) {

				dataDeleteWrapper(wrapperID);

				wrapper.find('.block').each(function() {
					deleteBlock($(this));
				});

				return wrapper.remove();;

			} else {

				return false;

			}

		}

		addWrapperButtons = function(wrappers) {

			wrappers.each(function() {

				/* Don't add the buttons again */
				if ( $(this).find('.wrapper-buttons').length )
					return;

				var wrapperButtons = $i('#wrapper-buttons-template').first()
					.clone()
					.attr('id', '')
					.addClass('wrapper-buttons');

				return wrapperButtons.prependTo($(this));

			});

		}

		bindWrapperMarginButtons = function(elements) {

			var tooltipContentCallback = function(api) {

				var handle = $(api.target);

				var wrapper = handle.parents('.wrapper').first();
				var marginPosition = handle.hasClass('wrapper-top-margin-handle') ? 'Top' : 'Bottom';

				var currentMargin = '<span style="opacity: .8;">' + marginPosition + ' Margin:</span> ' + wrapper.css('margin' + marginPosition);
				var tooltipHelp = !handle.data('dragging') ? 'Drag to change wrapper\'s <strong>' + marginPosition.toLowerCase() + ' margin</strong><br />' : '';

				return tooltipHelp + currentMargin;

			}

			elements.qtip({
				content: {
					text: tooltipContentCallback
				},
				style: {
					classes: 'qtip-headway'
				},
				show: {
					delay: 10,
					event: 'mouseenter'
				},
				position: {
					my: 'right center',
					at: 'left center',
					container: Headway.iframe.contents().find('body'),
					viewport: $('#iframe-container'),
					effect: false
				}
			})

			elements.custommouse({
				mouseStart: function(e) {

					this.handle = $(e.currentTarget).hasClass('wrapper-margin-handle') ? $(e.currentTarget) : $(e.currentTarget).parents('.wrapper-margin-handle').first();
					this.dragStart = { left: e.pageX, top: e.pageY };
					this.marginToChange = this.handle.hasClass('wrapper-top-margin-handle') ? 'marginTop' : 'marginBottom';

					this.wrapper = $(e.currentTarget).parents('.wrapper').first();
					this.originalWrapperMargin = parseInt(this.wrapper.css(this.marginToChange).replace('px', ''));

					/* Disable sibling tooltips */
					this.handle.siblings('.wrapper-handle, .wrapper-options').qtip('disable');
					this.handle.siblings('.wrapper-handle, .wrapper-options').qtip('hide');

					/* Add wrapper drag class to keep buttons from hiding */
					this.wrapper.addClass('wrapper-handle-in-use');

				},

				mouseDrag: function(e) {

					/* Get amount that mouse has dragged */
					var yValue = e.pageY - this.dragStart.top;

					/* Calculate amount to change margin by.  We'll use intervals of 2 that way it's not so touchy when dragging */
					var interval = 2;
					var marginChange = Math.round(yValue / interval);

					var newMargin = this.originalWrapperMargin + marginChange;

					/* Do not apply margin if newMargin is negative */
					if ( newMargin < 0 )
						return false;

					/* Make sure tooltip is showing and set dragging flag that way it doesn't show the drag to change margin part */
						this.handle.data('dragging', true);
						this.handle.qtip('show');
						this.handle.qtip('reposition');
						this.handle.qtip('option', 'content.text', tooltipContentCallback);

					/* Apply the margin */
					this.wrapper.css(this.marginToChange, newMargin);

					/* Send value to DB */
					dataSetDesignEditorProperty({
						group: "structure", 
						element: "wrapper", 
						property: "margin-" + this.marginToChange.replace('margin', '').toLowerCase(), 
						value: newMargin.toString(), 
						specialElementType: "instance", 
						specialElementMeta: "wrapper-" + getWrapperID(this.wrapper) + "-layout-" + Headway.currentLayout
					});

				},

				mouseStop: function(e) {

					/* Change tooltip flag back */
						this.handle.data('dragging', false);

					/* Insure tooltip is hidden */
						var qtipAPI = this.handle.qtip('api');

						qtipAPI.hide();
						$i('#qtip-' + qtipAPI.id).hide();

					/* Re-enable sibling tooltips */
					this.handle.siblings('.wrapper-handle, .wrapper-options').qtip('enable');

					/* Remove wrapper drag class to make buttons hide again */
					this.wrapper.removeClass('wrapper-handle-in-use');

				}
			});

		}

	populateWrapperMirrorNotice = function(wrapper) {

		var wrapperMirrorID = getWrapperMirror(getWrapperID(wrapper));

		if ( !wrapperMirrorID )
			return;

		wrapper.find('.wrapper-mirror-notice-id').text(wrapperMirrorID.replace('wrapper-', ''));

		/* Hide the layout of the wrapper being mirrored.  Todo: don't do this. */
		wrapper.find('.wrapper-mirror-notice-layout').hide();

	}

	getAvailableWrapperID = function() {

		var availableWrapperID = Headway.availableWrapperID;

		/* Raise Headway.availableWrapperID up by one for the next request */
		Headway.availableWrapperID++;

		return availableWrapperID;

	}

	assignDefaultWrapperID = function() {

		if ( $i('#wrapper-default').length ) {

			var wrapperID = getAvailableWrapperID();
			var defaultWrapper = $i('#wrapper-default');

			/* Change the actual element ID */
			defaultWrapper.attr('id', 'wrapper-' + wrapperID);

			/* Create a hidden that way the new wrapper is saved to the DB */
			dataAddWrapper(wrapperID, {
				'fluid': false,
				'fluid-grid': false
			});

			/* Change all of the blocks inside of the default wrapper to use the new wrapper ID */
			defaultWrapper.find('.block').each(function() {

				dataSetBlockWrapper(getBlockID($(this)), 'wrapper-' + wrapperID);

			});

		}

	}
/* END WRAPPER HANDLING */
})(jQuery);