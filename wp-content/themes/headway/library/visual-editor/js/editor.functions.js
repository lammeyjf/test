(function($) {
/* IFRAME FUNCTIONS */
	$i = function(element) {

		if ( typeof Headway.iframe == 'undefined' || typeof Headway.iframe.contents() == 'undefined' )
			return $();

		return Headway.iframe.contents().find(element);

	}

	$iDocument = function() {

		return $(Headway.iframe.contents());

	}

	loadIframe = function(callback, url, isPreview) {

		if ( typeof url == 'undefined' || !url)
			var url = Headway.homeURL;

		/* Choose contents iframe or preview iframe depending on argument */
			if ( typeof isPreview == 'undefined' || !isPreview ) {
				var iframe = Headway.iframe;
				var isPreview = false;
			} else {
				var iframe = Headway.previewIframe;
				var isPreview = true;
			}

		/* Make the title talk */
		startTitleActivityIndicator();
		showIframeLoadingOverlay();

		/* Close Grid Wizard */
		closeBox('grid-wizard');

		/* Build the URL */
			if ( !isPreview ) {

				var iframeUri = new Uri(url);

				iframeUri
					.addQueryParam('ve-iframe', 'true')
					.addQueryParam('ve-layout', Headway.currentLayout)
					.addQueryParam('ve-iframe-mode', Headway.mode)
					.addQueryParam('rand', Math.floor(Math.random() * 100000001));

				iframeURL = iframeUri.toString();

			} else {

				var iframeURL = url;

			}

		/* Clear out existing iframe contents */
			iframe.contents().find('.ui-headway-grid').headwayGrid('destroy');

			iframe.contents().find('*')
				.unbind()
				.remove();

		iframe[0].src = iframeURL;
		waitForIframeLoad(callback, iframe, isPreview);

	}

	waitForIframeLoad = function(callback, iframe, isPreview) {

		if ( typeof iframe == 'undefined' )
			var iframe = Headway.iframe;

		/* Setup timeout */
			if ( typeof iframeTimeout == 'undefined' )
				iframeTimeout = setTimeout(iframeLoadTimeout, 40000);

		/* Check if iframe body has iframe-loaded class which is added via inline script in the footer of the iframe */
			if ( iframe.contents().find('body.iframe-loaded').length != 1 ) {

				return setTimeout(function() {
					waitForIframeLoad(callback, iframe, isPreview);
				}, 50);

			}

		/* Cancel out timeout callback */
			clearTimeout(iframeTimeout);

		/* Fire callback! */
		return iframeLoadCallback(callback, isPreview);

	}

		iframeLoadCallback = function(callback, isPreview) {

			/* Clear out hidden inputs only if NOT preview */
			if ( typeof isPreview == 'undefined' || !isPreview )
				clearUnsavedValues();
						
			/* Fire callback if it exists */
			if ( typeof callback === 'function' )
				callback();
			
			/* Fire default callback if NOT preview */
			if ( typeof isPreview == 'undefined' || !isPreview )
				defaultIframeLoad();

			stopIFrameLoadingIndicator();

			return true;

		}

		iframeLoadTimeout = function() {

			iframeTimeout = true;	
			
			stopTitleActivityIndicator();

			changeTitle('Visual Editor: Error!');	

			/* Hide all controls */
			$('#iframe-container, #menu, #panel, #layout-selector-offset').hide();			
									
			alert("ERROR: There was a problem while loading the visual editor.\n\nYour browser will automatically refresh to attempt loading again.");

			document.location.reload(true);

		}


	/* Default function to be called when iframe finishes loading. */
	defaultIframeLoad = function() {
		
		stopTitleActivityIndicator();
	
		changeTitle('Visual Editor: ' + Headway.currentLayoutName);
		$('div#current-layout strong span').text(Headway.currentLayoutName);
	
		/* Set up tooltips */
		setupTooltips();
		setupTooltips('iframe');
		/* End Tooltips */

		/* Stylesheets for more accurate live designing */
			/* Main Headway stylesheet, used primarily by design editor */
			stylesheet = new ITStylesheet({document: Headway.iframe.contents()[0], href: Headway.homeURL + '/?headway-trigger=compiler&file=general-design-editor'}, 'find');

			/* Catch-all adhoc stylesheet used for overriding */
			css = new ITStylesheet({document: Headway.iframe.contents()[0]}, 'load');
		/* End stylesheets */

		/* Hide iframe overlay if it exists */
			hideIframeOverlay(false);

		/* Add the template notice if it's layout mode and a template is active */
			if ( Headway.mode == 'grid' && Headway.currentLayoutTemplate ) {
				showIframeOverlay();
				$i('body').prepend('<div id="no-edit-notice"><div><h1>To edit this layout, remove the template from this layout.</h1></div></div>');
			}

		/* Add notice that layout cannot be edited in Design Mode if it is customized or has a layout */
			if ( Headway.mode == 'design' && (Headway.currentLayoutTemplate || !Headway.currentLayoutCustomized) ) {
				showIframeOverlay();
				$i('body').prepend('<div id="no-edit-notice"><div><h1>This layout is not customized and cannot be styled in the Design Editor.</h1><h2>Please choose another layout to style or switch to the Grid mode and add blocks to this layout.</h2></div></div>');
			}
			
		/* Disallow certain keys so user doesn't accidentally leave the VE */
		disableBadKeys();
		
		/* Bind visual editor key shortcuts */
		bindKeyShortcuts();
		
		/* Deactivate all links and buttons */
		if ( Headway.touch )
			Headway.iframe.contents().find('body').css('-webkit-touch-callout', 'none');

		Headway.iframe.contents().find('body').delegate('a, input[type="submit"], button', 'click', function(event) {

			if ( $(this).hasClass('allow-click') )
				return;

			event.preventDefault();
			
			return false;
			
		});
		
		/* Show the load message */
		if ( typeof headwayIframeLoadNotification !== 'undefined' ) {
			showNotification({
				id: 'iframe-load-notification',
				message: headwayIframeLoadNotification,
				overwriteExisting: true
			});
			
			delete headwayIframeLoadNotification;
		}
		
		/* Remove the tabs that are set to close on layout switch */
		removeLayoutSwitchPanels();
		
		/* Show the grid wizard if the current layout isn't customized and not using a tmeplate */
		var layoutNode = $('div#layout-selector span.layout[data-layout-id="' + Headway.currentLayout + '"]');
		var layoutLi = layoutNode.parent();
				
		if ( 
			!$i('.block').length
			&& !(Headway.currentLayoutCustomized && Headway.currentLayout.indexOf('template-') !== 0)
			&& !Headway.currentLayoutTemplate
			&& Headway.mode == 'grid' 
		) {
		
			hidePanel();
			
			openBox('grid-wizard');
			
		} else {

			closeBox('grid-wizard');
			
		}

		/* Update iframe height */
		updateIframeHeight();
		
		/* Clear out and disable iframe loading indicator */
		hideIframeLoadingOverlay();
		
	}


	updateIframeHeight = function(iframe) {

		if ( typeof iframe == 'undefined' )
			var iframe = Headway.iframe;

		iframe.css('minHeight', iframe.contents().find('body').height());

	}
	

	stopIFrameLoadingIndicator = function() {
		
		//http://www.shanison.com/2010/05/10/stop-the-browser-%E2%80%9Cthrobber-of-doom%E2%80%9D-while-loading-comet-forever-iframe/
		if ( /Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent) ) {
			
			var fake_iframe;

			if ( fake_iframe == null ){
				fake_iframe = document.createElement('iframe');
				fake_iframe.style.display = 'none';
			}

			document.body.appendChild(fake_iframe);
			document.body.removeChild(fake_iframe);
			
		}
	
	}
/* END IFRAME FUNCTIONS */


/* TOOLTIPS */
	setupTooltips = function(location) {
		
		if ( typeof location === 'undefined' )
			location = false;
			
		if ( Headway.disableTooltips == 1 ) {
			
			$('div.tooltip-button').hide();
			
			return false;
			
		}
		
		var tooltipOptions = {
			style: {
				classes: 'qtip-headway'
			},
			show: {
				delay: 10,
				event: 'mouseenter'
			},
			position: {
				my: 'bottom left',
				at: 'top center',
				viewport: $(window),
				effect: false
			},
			hide: {
				effect: false
			}
		}
		
		if ( location == 'iframe' ) {
			
			tooltipOptions.position.container = Headway.iframe.contents().find('body'); 
			tooltipOptions.position.viewport = $('#iframe-container'); 
						
			var tooltipElement = $i;
			
		} else {
			
			var tooltipElement = $;
			
		}

		tooltipElement('div.tooltip-button, .tooltip').qtip(tooltipOptions);
		
		tooltipElement('.tooltip-bottom-right').qtip($.extend(true, {}, tooltipOptions, { 
		   position: {
				my: 'bottom right',
				at: 'top center'
		   }
		}));
		
		tooltipElement('.tooltip-top-right').qtip($.extend(true, {}, tooltipOptions, { 
		   position: {
				my: 'top right',
				at: 'bottom center'
		   }
		}));
		
		tooltipElement('.tooltip-top-left').qtip($.extend(true, {}, tooltipOptions, { 
		   position: {
				my: 'top left',
				at: 'bottom center'
		   },
		   show: {
		   		delay: 750
		   }
		}));
		
		tooltipElement('.tooltip-left').qtip($.extend(true, {}, tooltipOptions, { 
		   position: {
				my: 'left center',
				at: 'right center'
		   }
		}));
		
		tooltipElement('.tooltip-right').qtip($.extend(true, {}, tooltipOptions, { 
		   position: {
				my: 'right center',
				at: 'left center'
		   }
		}));

		tooltipElement('.tooltip-top').qtip($.extend(true, {}, tooltipOptions, { 
		   position: {
				my: 'top center',
				at: 'bottom center'
		   }
		}));
		
		
		var iframeScrollTooltipReposition = function() {
			
			/* Flood Control */
			if ( $i('.qtip:visible').length === 0 || typeof iframeScrollTooltipRepositionFloodTimeout != 'undefined' )
				return;
			
			iframeScrollTooltipRepositionFloodTimeout = setTimeout(function() {
				
				$i('.qtip:visible').qtip('reposition');
				
				delete iframeScrollTooltipRepositionFloodTimeout;
				
			}, 400);
						
		}

		Headway.iframe.contents().unbind('scroll', iframeScrollTooltipReposition);		
		Headway.iframe.contents().bind('scroll', iframeScrollTooltipReposition);
		
	}
	

	repositionTooltips = function() {
		
		$i('.qtip:visible').qtip('reposition');
		
	}


	hideTooltipsIframeBlur = function() {

		/* Hide any tooltips */
		$i('.qtip-headway').hide();

	}
/* END TOOLTIPS */


/* LAYOUT FUNCTIONS */
	switchToLayout = function(layoutNode, reloadIframe, showSwitchNotification) {

		if ( typeof layoutNode == 'object' && !layoutNode.hasClass('layout') )
			layoutNode = layoutNode.find('> span.layout');
			
		if ( layoutNode.length !== 1 )
			return false;
				
		changeTitle('Visual Editor: Loading');
		startTitleActivityIndicator();
	
		var layout = layoutNode;
		var layoutID = layout.attr('data-layout-id');
		var layoutURL = Headway.mode == 'grid' ? Headway.homeURL : layout.attr('data-layout-url'); /* URL is used for the sake of better WP_Query integration with block content */
		var layoutName = layout.find('strong').text();
				
		//Flip classes around
		$('.layout-selected', 'div#layout-selector').removeClass('layout-selected');
		layout.parent('li').addClass('layout-selected');
		
		//Set global variables, these will be used in the next function to switch the iframe
		Headway.currentLayout = layoutID;
		Headway.currentLayoutName = layoutName;
		Headway.currentLayoutTemplate = false;
		Headway.currentLayoutCustomized = false;

		//Set global variable to tell designEditor.switchLayout that this layout was switched to and not initial load
		Headway.switchedToLayout = true;

		//Check if layout is customized
			Headway.currentLayoutCustomized = layout.parents('li.layout-item').first().hasClass('layout-item-customized') || layout.parents('#layout-selector-templates-container').length;

		//Check if the layout node has a template assigned to it.  
			var possibleTemplateID = layout.find('.status-template').data('template-id');
							
			if ( typeof possibleTemplateID != 'undefined' && possibleTemplateID != 'none' )
				Headway.currentLayoutTemplate = possibleTemplateID;


		/* Push new layout ID to the URL */
		window.history.pushState("", "", Headway.homeURL + "/?visual-editor=true&visual-editor-mode=" + Headway.mode + "&ve-layout=" + Headway.currentLayout);
		
		//Reload iframe and new layout right away
		if ( typeof reloadIframe == 'undefined' || reloadIframe == true ) {
			
			if ( typeof showSwitchNotification == 'undefined' || showSwitchNotification == true )
				headwayIframeLoadNotification = 'Switched to <em>' + Headway.currentLayoutName + '</em>';
			
			loadIframe(Headway.instance.iframeCallback, layoutURL);
			
		}
					
		return true;
		
	}
/* END LAYOUT FUNCTIONS */


/* SHARED INPUT FUNCTIONS */
	openImageUploader = function(callback) {
		
		if ( !boxExists('input-image') ) {
			
			/* iframe load event function */
			var iframeLoad = function(event){

				var iframe = $(event.target);

				var content = iframe.contents();
				var iframe_window = iframe[0].contentWindow; 

				/* CSS changes */
					var stylesheet = new ITStylesheet({document: content[0], href: Headway.homeURL + '/wp-includes/js/imgareaselect/imgareaselect.css'}, 'find');

					stylesheet.update_rule('p.howto', {display:'none'});
					stylesheet.update_rule('tr.post_title', {display:'none'});
					stylesheet.update_rule('tr.image_alt', {display:'none'});
					stylesheet.update_rule('tr.post_excerpt', {display:'none'});
					stylesheet.update_rule('tr.post_content', {display:'none'});
					stylesheet.update_rule('tr.align', {display:'none'});
					stylesheet.update_rule('tr.url button, tr.url p', {display:'none'});
					stylesheet.update_rule('tr.image-size', {display:'none'});
					stylesheet.update_rule('p.ml-submit', {display:'none !important'});

					stylesheet.update_rule('td.savesend input', {opacity:'0'});
					stylesheet.update_rule('input.urlfield', {opacity:'0'});
					stylesheet.update_rule('tr.url th.label span.alignleft', {opacity:'0'});
				/* End CSS changes */
				
				/* Function to bind to the submit button */
					var useImage = function(event, url) {
					
						if ( typeof url == 'undefined' )
							var url = $(this).parents('table').find('button.urlfile').data('link-url');				

						var filename = url.split('/')[url.split('/').length-1];

						callback(url, filename);
						
						closeBox('input-image', true);		

						event.preventDefault();
					
					}
				/* End function to bind to the submit button */

				/* Set up URL tab */
					if ( content.find('ul#sidemenu li#tab-type_url a.current').length === 1 ) {

						/* Remove all other rows */
							content.find('#src').parents('tr').siblings('tr').remove();

						/* Remove radio buttons */
							content.find('.media-types').hide();
							content.find('div.media-item').css({padding: '10px 10px 5px'});

						/* Add submit button */
							content.find('#src')
								.parents('tbody')
								.append('<tr class="submit"><td></td><td class="savesend-url"><input type="submit" value="Use Image" class="button image-input-fix" id="go_button" name="go_button" style="color: #bbb;" /></td></tr>');

							content.find('tr.submit input#go_button').bind('click', function(event) {
								useImage(event, content.find('#src').val());
							});

					}
				/* End URL tab setup */

				/* Handle all other tabs */
					var imageUploaderInputFix = function(){

						content.find('td.savesend input:not(.input-input-fix)')
							.css('opacity', 1)
							.addClass('image-input-fix')
							.addClass('button-primary')
							.val('Use Image')
							.unbind('click')
							.bind('click', useImage);

						content.find('input.urlfield:not(.image-input-fix)').css('opacity', 1).addClass('image-input-fix').attr('readonly', true);

						content.find('tr.url th.label span.alignleft:not(.image-input-fix)').css('opacity', 1).addClass('image-input-fix').text('Image URL');

					}
				
					/* Call fix function right away before the interval is started */
					imageUploaderInputFix();

					if ( typeof imageUploaderInputFixInterval !== 'undefined' ) {
						iframe_window.clearInterval(imageUploaderInputFixInterval);
					}		

					imageUploaderInputFixInterval = iframe_window.setInterval(imageUploaderInputFix, 1000);
				/* End all other tabs */

			}
			/* End iframe load event function */


			var iframePostID = Headway.currentLayout;

			if ( isNaN(Headway.currentLayout) )
				iframePostID = 0;
			
			var settings = {
				id: 'input-image',
				title: 'Select an image',
				description: 'Upload or select an image',
				src: Headway.adminURL + '/media-upload.php?type=image&amp;TB_iframe=true&amp;post_id=' + iframePostID,
				load: iframeLoad,
				width: 670,
				height: 500,
				center: true,
				draggable: false,
				deleteWhenClosed: true,
				blackOverlay: true
			};

			var box = createBox(settings);

		}

		openBox('input-image');
		
	}
/* END SHARED INPUT FUNCTIONS */


/* ANNOYANCE FIXER FUNCTIONS */
	prohibitVEClose = function () {	

		window.onbeforeunload = function(){
			return 'You have unsaved changes.  Are you sure you wish to leave the Visual Editor?';
		}
	
		allowVECloseSwitch = false;

	}


	allowVEClose = function() {

		window.onbeforeunload = function(){
			return null;
		}
	
		allowVECloseSwitch = true;

	}


	disableBadKeys = function() {

		var disableBadKeysCallback = function(event) {
			
			//8 = Backspace
			//13 = Enter
		
			var element = $(event.target); 
		
			if ( event.which === 8 && !element.is('input') && !element.is('textarea') && !element.hasClass('allow-backspace-key') && !element.parents('.wysiwyg-container').length ) {
				event.preventDefault();
				
				return false;
			}
		
			if ( event.which == 13 && !element.is('textarea') && !element.hasClass('allow-enter-key') && !element.parents('.wysiwyg-container').length ) {
				event.preventDefault();
				
				return false;
			}
		
		}
	
		//Disable backspace for normal frame but still keep backspace functionality in inputs.  Also disable enter.
		$(document).bind('keypress', disableBadKeysCallback);
		$(document).bind('keydown', disableBadKeysCallback);
	
		//Disable backspace and enter for iframe
		$i('html').bind('keypress', disableBadKeysCallback);
		$i('html').bind('keydown', disableBadKeysCallback);
		
	}
/* END ANNOYANCE FIXER FUNCTIONS */


/* KEY SHORTCUTS */
	bindKeyShortcuts = function() {

		/* Close Tour */
			var keyBindingEscCloseTour = function(event) {

				if ( !$('#qtip-tour').is(':visible') )
					return;

				$(document.body).qtip('hide');

			}

			$(document).bind('keyup', 'esc', keyBindingEscCloseTour);
			$i('html').bind('keyup', 'esc', keyBindingEscCloseTour);
								
		/* Bindings with modifier */
			/* Save */
				$(document).bind('keyup', 'ctrl+s', save);
				$i('html').bind('keyup', 'ctrl+s', save);

			/* Panel Toggle */
				$(document).bind('keyup', 'ctrl+p', togglePanel);
				$i('html').bind('keyup', 'ctrl+p', togglePanel);

			/* Layout Selector Toggle */
				$(document).bind('keyup', 'ctrl+l', toggleLayoutSelector);
				$i('html').bind('keyup', 'ctrl+l', toggleLayoutSelector);

			/* Live CSS Toggle */
				$(document).bind('keyup', 'ctrl+e', function() { if ( !boxOpen('live-css') ) { $('#tools-live-css').trigger('click'); } else { closeBox('live-css'); } });
				$i('html').bind('keyup', 'ctrl+e', function() { if ( !boxOpen('live-css') ) { $('#tools-live-css').trigger('click'); } else { closeBox('live-css'); } });

			/* Inspector Toggle */
				$(document).bind('keyup', 'ctrl+i', toggleInspector);
				$i('html').bind('keyup', 'ctrl+i', toggleInspector);

			/* Undo/Redo */
				// $(document).bind('keyup.ctrl_z', undo);
				// $i('html').bind('keyup.ctrl_z', undo);

				// $(document).bind('keyup.ctrl_y', redo);
				// $i('html').bind('keyup.ctrl_y', redo);
		/* End bindings with modifier */
		
	}
/* END KEY SHORTCUTS */


/* BLOCK FUNCTIONS */
	getBlockByID = function(id) {

		var id = id.toString().replace('block-', '');

		return $i('#block-' + id);

	}
	

	getBlock = function(element) {
		//If invalid selector, do not go any further
		if ( $(element).length === 0 )
			return $();
		
		//Find the actual block node
		if ( $(element).hasClass('block') ) {
			block = $(element);
		} else if ( $(element).parents('.block').length === 1 ) {
			block = $(element).parents('.block');
		} else {
			block = false;
		}
		
		return block;
	}


	getBlockID = function(element) {

		var block = getBlock(element);
		
		if ( !block ) {
			return false;
		}
		
		//Pull out ID
		return block.data('id');

	}


	getBlockWrapper = function(element) {

		var block = getBlock(element);

		return block.parents('.wrapper').first();

	}
	
	
	getBlockType = function(element) {
		var block = getBlock(element);
		
		if ( !block ) {
			return false;
		}
		
		var classes = block.attr('class').split(' ');
	    
		for(i = 0; i <= classes.length - 1; i++){
			if(classes[i].indexOf('block-type-') !== -1){
				var blockType = classes[i].replace('block-type-', '');
			}
		}	
		
		return blockType;	
	}
	
	
	getBlockTypeNice = function(type) {
		
		if ( typeof type != 'string' ) {
			return false;
		}
		
		return getBlockTypeObject(type).name;
		
	}
	
	
	getBlockTypeIcon = function(blockType, blockInfo) {
		
		if ( typeof blockInfo == 'undefined' )
			blockInfo = false;
			
		if ( typeof Headway.allBlockTypes[blockType] != 'object' )
			return null;
			
		if ( blockInfo === true )
			return Headway.blockTypeURLs[blockType] + '/icon-white.png';
			
		return Headway.blockTypeURLs[blockType] + '/icon.png';
		
	}
	
	
	getBlockTypeObject = function(blockType) {
		
		var blockTypes = Headway.allBlockTypes;
		
		if ( typeof blockTypes[blockType] === 'undefined' )
			return {'fixed-height': false};
		
		return blockTypes[blockType];
		
	}


	getBlockGridWidth = function(element) {
		
		var block = getBlock(element);
		
		if ( !block ) {
			return false;
		}
			    		
		return block.attr('data-width');
		
	}


		setBlockGridWidth = function(element, gridWidth) {

			var block = getBlock(element);

			if ( !block ) {
				return false;
			}

			var previousGridWidth = block.attr('data-width');

			/* Remove previous grid width */
			if ( previousGridWidth )
				block.removeClass('grid-width-' + previousGridWidth);

			/* Set new grid width */
				block.css('width', '');
				block.addClass('grid-width-' + gridWidth);
				
				block.attr('data-width', String(gridWidth).replace('grid-width-', ''));
			
			return block;

		}
	
	
	getBlockGridLeft = function(element) {
		
		var block = getBlock(element);
		
		if ( !block ) {
			return false;
		}
		
		return block.attr('data-grid-left');
		
	}


		setBlockGridLeft = function(element, gridLeft) {

			var block = getBlock(element);

			if ( !block ) {
				return false;
			}

			var previousGridLeft = getBlockGridLeft(block);

			/* Remove previous grid left */
				if ( previousGridLeft )
					block.removeClass('grid-left-' + previousGridLeft);

			/* Set new grid left */
				block.css('left', '');
				block.css('marginLeft', '');

				block.addClass('grid-left-' + gridLeft);

				block.attr('data-grid-left', String(gridLeft).replace('grid-left-', ''));
			
			return block;

		}

	
	getBlockDimensions = function(element) {
		
		var block = getBlock(element);
		
		if ( !block ) {
			return false;
		}
		
		return {
			width: getBlockGridWidth(block),
			height: block.attr('data-height')
		}
		
	}
	

		getBlockDimensionsPixels = function(element) {
			
			var block = getBlock(element);
			
			if ( !block ) {
				return false;
			}
			
			return {
				width: block.width(),
				height: block.height()
			}
			
		}

	
	getBlockPosition = function(element) {
		
		var block = getBlock(element);
		
		if ( !block ) {
			return false;
		}
		
		return {
			left: getBlockGridLeft(block),
			top: block.attr('data-grid-top')
		}
		
	}


		getBlockPositionPixels = function(element) {

			var block = getBlock(element);
			
			if ( !block ) {
				return false;
			}
			
			return {
				left: block.position().left,
				top: block.position().top
			}

		}
		
	
	getAvailableBlockID = function(async) {
		
		if ( typeof async == 'undefined' )
			var async = true;
		
		/* Get the ready block ID */
		var readyBlockID = Headway.availableBlockID;
		
		/* Retrieve the block ID that can be used. */
			/* Blacklist IDs in the grid already */
			var blockIDBlacklist = [readyBlockID];
		
			$i('.block').each(function() {
			
				blockIDBlacklist.push(getBlockID($(this)));
			
			});
										
			$.ajax(Headway.ajaxURL, {
				type: 'POST',
				async: async,
				data: {
					security: Headway.security,
					action: 'headway_visual_editor',
					method: 'get_available_block_id',
					block_id_blacklist: blockIDBlacklist
				},
				success: function(response) {

					if ( isNaN(response) )
						return;

					Headway.availableBlockID = response;

				}
			});
				
		/* Return the ID stored before. */
		return readyBlockID;
		
	}
	
	
	getAvailableBlockIDBatch = function(numberOfIDs) {

		/* Add any blocks in the layout to the blacklist since the PHP/AJAX won't know about unsaved blocks */
		var blockIDBlacklist = [];

		$i('.block').each(function() {

			blockIDBlacklist.push(getBlockID(this));

		});

		if ( typeof numberOfIDs == 'undefined' || isNaN(numberOfIDs) )
			numberOfIDs = 10;
		
		/* Do the request */
		var request = $.ajax(Headway.ajaxURL, {
			type: 'POST',
			async: false,
			data: {
				security: Headway.security,
				action: 'headway_visual_editor',
				method: 'get_available_block_id_batch',
				block_id_blacklist: blockIDBlacklist,
				number_of_ids: numberOfIDs
			}
		});
		
		return $.parseJSON(request.responseText.replace(/&quot;/g, '"'));

	}
	
	
	isBlockMirrored = function(element) {
		
		var block = getBlock(element);
		
		return block.hasClass('block-mirrored');
		
	}
	
	
	getBlockMirrorOrigin = function(element) {
		
		var block = getBlock(element);
		
		if ( !isBlockMirrored(block) )
			return false;
			
		return block.data('block-mirror');
		
	}


	getBlockMirrorLayoutName = function(element) {

		var block = getBlock(element);
		
		if ( !isBlockMirrored(block) )
			return false;
			
		return block.data('block-mirror-layout-name');

	}

	
	loadBlockContent = function(args) {

		var settings = {};
		
		var defaults = {
			blockElement: false,
			blockSettings: {},
			blockOrigin: false,
			blockDefault: false,
			callback: function(args){},
			callbackArgs: null
		};
		
		$.extend(settings, defaults, args);
				
		var blockContent = settings.blockElement.find('div.block-content');
		var blockType = getBlockType(settings.blockElement);

		if ( Headway.gridSafeMode == 1 )
			return blockContent.html('<div class="alert alert-red block-safe-mode"><p>Grid Safe mode enabled.  Block content not outputted.</p></div>');
		
		if ( Headway.mode == 'grid' && !getBlockTypeObject(blockType)['show-content-in-grid'] ) {

			if ( typeof settings.callback == 'function' )
				settings.callback(settings.callbackArgs);

			return blockContent.html('<p class="hide-content-in-grid-notice"><strong>Notice:</strong> <em>' + getBlockTypeNice(blockType) + '</em> blocks do not display in the Grid Mode.  Please switch to the Design mode to see the content in this block.</p>');

		}
			
		createCog(blockContent, true, true, Headway.iframe.contents(), 1);

		/* If grid mode then add a layer that makes sure the dragging still works as expected */
		if ( Headway.mode == 'grid' && !settings.blockElement.find('div.block-content-cover').length )
			settings.blockElement.append('<div class="block-content-cover"></div>');

		return $.ajax({
			url: Headway.ajaxURL,
			cache: false,
			type: 'POST',
			dataType: 'text',
			data: {
				security: Headway.security,
				action: 'headway_visual_editor',
				method: 'load_block_content',
				unsaved_block_settings: settings.blockSettings,
				block_origin: settings.blockOrigin,
				block_default: settings.blockDefault,
				layout: Headway.currentLayout,
				mode: Headway.mode
			}
		}).done(function(data) {

			if ( typeof settings.callback == 'function' )
				settings.callback(settings.callbackArgs);

			/* Remove script tags from Grid mode */
				if ( Headway.mode == 'grid' ) {

					var data = data.replace(/script/g, 'SCRIPTTOCHECK');

					var content = $($.parseHTML(data));
					
					content.find('SCRIPTTOCHECK').remove();

				} else {

					var content = $(data);

				}
			/* End removing script tags from grid mode */

			if ( typeof window.frames['content'].jQuery != 'undefined' && window.frames['content'].jQuery('#block-' + getBlockID(settings.blockElement)).html(content).length ) {

				refreshInspector();
				return window.frames['content'].jQuery('#block-' + getBlockID(settings.blockElement));

			}

			/* Re-initiate inspector to make sure the block elements are still editable */
			blockContent.html(content);
			refreshInspector();

			return blockContent;

		});
		
	}


	refreshBlockContent = function(blockID, callback, args) {

		if ( typeof blockID == 'undefined' || !blockID )
			return false;

		/* Setup throttledFunction */
			var throttledFunction = function() {

				var blockElement = $i('.block[data-id="' + blockID + '"]');
				var newBlockSettings = GLOBALunsavedValues['blocks'][blockID]['settings'];
				
				/* Update the block content */
				loadBlockContent({
					blockElement: blockElement,
					blockSettings: {
						settings: newBlockSettings,
						dimensions: getBlockDimensions(blockElement),
						position: getBlockPosition(blockElement)
					},
					blockOrigin: blockID,
					blockDefault: {
						type: getBlockType(blockElement),
						id: 0,
						layout: Headway.currentLayout
					},
					callback: callback,
					callbackArgs: args
				});

			}

		/* Flood Control */
			if ( typeof updateBlockContentFloodTimeoutAfter != 'undefined' )
				clearTimeout(updateBlockContentFloodTimeoutAfter);

			if ( typeof updateBlockContentFloodTimeout == 'undefined' ) {

				throttledFunction.call();

				updateBlockContentFloodTimeout = setTimeout(function() {
					
					delete updateBlockContentFloodTimeout;
					
				}, 500);

			} else {

				updateBlockContentFloodTimeoutAfter = setTimeout(function() {

					throttledFunction.call();

					delete updateBlockContentFloodTimeoutAfter;

				}, 600);
				
			}
			
	}


	setupBlockContextMenu = function(showDelete) {

		if ( typeof showDelete == 'undefined' )
			var showDelete = true;

		setupContextMenu({
			id: 'block',
			elements: '.block:visible',
			title: function(event) {

				var block = getBlock(event.currentTarget);

				var blockID = getBlockID(block);
				var blockType = getBlockType(block);	
				var blockTypeNice = blockType ? getBlockTypeNice(blockType) + ' ' : '';

				var blockTypeIconURL = getBlockTypeIcon(blockType, true);
				var blockTypeIconStyle = blockTypeIconURL ? ' style="background-image:url(' + blockTypeIconURL + ');"' : null;
			
				return '<span class="type type-' + blockType + '" ' + blockTypeIconStyle + '></span>' + blockTypeNice + 'Block #' + blockID;

			},
			contentsCallback: function(event) {

				var contextMenu = $(this);

				var block = getBlock(event.currentTarget);

				var blockID = getBlockID(block);
				var blockType = getBlockType(block);	
				var blockTypeNice = getBlockTypeNice(blockType);

				var contextMenuClickEvent = !Headway.touch ? 'click' : 'tap';

				/* Block options */
					$('<li class="context-menu-block-options"><span>Open Block Options</span></li>').appendTo(contextMenu).on(contextMenuClickEvent, function() {
						openBlockOptions(block);
					});

				/* Switch block type */
					$('<li class="context-menu-block-switch-type"><span>Switch Block Type</span></li>').appendTo(contextMenu).on(contextMenuClickEvent, function() {
						openBlockTypeSelector(block);
					});

				/* Delete block */
					if ( showDelete ) {

						$('<li class="context-menu-block-delete"><span>Delete Block</span></li>').appendTo(contextMenu).on(contextMenuClickEvent, function(event) {

							if ( !confirm('Are you sure you want to delete this block?') )
								return false;

							deleteBlock(block);

						});

					}

			}
		});

	}
	
		
		bindBlockDimensionsTooltip = function() {

			if ( Headway.touch )
				return false;
							
			$i('body').delegate('.block', 'mouseenter', function(event) {
					
				var self = this;	
				var firstSetup = typeof $(this).data('qtip') == 'undefined' ? true : false;

				if ( typeof Headway.disableBlockDimensions !== 'undefined' && Headway.disableBlockDimensions )
					return false;
					
				if ( firstSetup ) {

					addBlockDimensionsTooltip($(this));
					
					$(this).data('hoverWaitTimeout', setTimeout(function() {

						$(self).qtip('reposition');
						$(self).qtip('show');

						$i('#qtip-' + $(self).data('qtip').id).show();

					}, 300));
					
				}
							
			});
			
			$i('body').delegate('.block', 'mouseleave', function(event) {
				
				clearTimeout($(this).data('hoverWaitTimeout'));
							
			});

		}


		addBlockDimensionsTooltip = function(block) {

			if ( Headway.touch )
				return false;

			$(block).qtip({
				style: {
					classes: 'qtip-headway qtip-block-dimensions'
				},
				position: {
					my: 'top center',
					at: 'bottom center',
					container: Headway.iframe.contents().find('body'),
					viewport: $('#iframe-container'),
					effect: false
				},
				show: {
					delay: 300,
					solo: true,
					effect: false
				},
				hide: {
					delay: 25,
					effect: false
				},
				content: {
					text: blockDimensionsTooltipContent
				}
			});

			return $(block).qtip('api');
						
		}


			blockDimensionsTooltipContent = function(api) {

				var block = getBlock(this);
				var blockID = getBlockID(block);

				var blockWidth = getBlockDimensionsPixels(block).width;	
				var blockHeight = getBlockDimensionsPixels(block).height;					
				var blockType = getBlockType(block);
				
				/* Block Info (only if existing block) */
					if ( typeof blockType != 'undefined' ) {

						var blockTypeNice = getBlockTypeNice(blockType);
						var blockTypeIconURL = getBlockTypeIcon(blockType, true);
						var blockTypeIconStyle = blockTypeIconURL ? ' style="background-image:url(' + blockTypeIconURL + ');"' : null;

						var blockAlias = block.data('alias') ? ': ' + block.data('alias') : '';

						var blockMirrored = isBlockMirrored(block) ? '<span class="block-info-mirroring">Mirroring #' + getBlockMirrorOrigin(block) + ' from ' + getBlockMirrorLayoutName(block) + '</span>' : '';
						var mainBlockInfoClass = isBlockMirrored(block) ? 'main-block-info main-block-info-mirrored' : 'main-block-info';
	
						var blockInfo = '<div class="block-info">' +
								'<span class="block-info-type" ' + blockTypeIconStyle + '></span>' +
								'<span class="' + mainBlockInfoClass + '">' +
									blockTypeNice + ' #' + blockID + blockAlias + 
								'</span>' + 
								blockMirrored + 
							'</div>';

					} else {

						var blockInfo = '';

					}

				/* Block Dimensions */
					if ( getBlockTypeObject(blockType)['fixed-height'] ) {
					
						var blockHeight = blockHeight;
						var heightText = 'Height';
					
					} else {
					
						var blockHeight = Headway.mode == 'grid' ? blockHeight : block.css('minHeight').replace('px', '');
						var heightText = 'Min. Height';
					
					}
				
					var height = '<span class="block-height"><strong>' + heightText + ':</strong> ' + blockHeight + '<small>px</small></span>';
					var width = '<span class="block-width"><strong>Width:</strong> ' + blockWidth + '<small>px</small></span>';

					//Show different width info if it's responsive
					if ( $('#input-enable-responsive-grid label.checkbox-checked').length == 1 || (Headway.mode != 'grid' && Headway.responsiveGrid) )
						var width = '<span class="block-width"><strong>Max Width:</strong> <small>~</small>' + blockWidth + '<small>px</small></span>';

					var fluidMessage = !getBlockTypeObject(blockType)['fixed-height'] ? '<span class="block-fluid-height-message">Height will auto-expand</span>' : '';

				/* Output */
				return blockInfo + width + ' <span class="block-dimensions-separator">&#9747;</span> ' + height + fluidMessage + '<span class="right-click-message">Right-click to open block options</span>' ;

			}


	openBlockOptions = function(block, subTab) {

		if ( typeof block.target != 'undefined' || !block )
			var block = getBlock(this);

		if ( typeof subTab == 'undefined' )
			var subTab = null;

		if ( !block || block.hasClass('block-type-unknown') )
			return false;

		var blockID = getBlockID(block);		    
		var blockType = getBlockType(block);		
		var blockTypeName = getBlockTypeNice(blockType);
	
		var readyTabs = function() {
			
			var tab = $('div#block-' + blockID + '-tab');
			
			/* Ready tab, sliders, and inputs */
			tab.tabs();
			bindPanelInputs('div#block-' + blockID + '-tab');
			
			/* Refresh tooltips */
			setupTooltips();
			
			/* Call the open callback for the box panel */
			var callback = eval(tab.find('ul.sub-tabs').attr('data-open-js-callback'));
			if ( typeof callback == 'function' ) {
				callback({
					block: block,
					blockID: blockID,
					blockType: blockType
				});
			}

			/* Show and hide elements based on toggle options */
			handleInputTogglesInContainer(tab.find('div.sub-tabs-content'));

			/* If subTab is defined, switch to that subTab */
			if ( subTab )
				selectTab(subTab, $('div#block-' + blockID + '-tab'));
			
			/* If it's a mirrored block, then hide the other tabs */
			if ( $('div#block-' + blockID + '-tab').find('select#input-' + blockID + '-mirror-block').val() != '' ) {
				
				$('div#block-' + blockID + '-tab ul.sub-tabs li:not(#sub-tab-config)').hide();
				selectTab('sub-tab-config', $('div#block-' + blockID + '-tab'));
				
			}
			
		}						
		
		var blockIDForTab = isNaN(blockID) ? ': ' + blockID : ' #' + blockID;

		var blockTypeIconURL = getBlockTypeIcon(blockType, true);
		var blockTypeIconStyle = blockTypeIconURL ? 'background-image:url(' + blockTypeIconURL + ');' : null;

		addPanelTab('block-' + blockID, '<span class="block-type-icon" style="' + blockTypeIconStyle + '"></span>' + blockTypeName + ' Block' + blockIDForTab, {
			url: Headway.ajaxURL, 
			data: {
				security: Headway.security,
				action: 'headway_visual_editor',
				method: 'load_block_options',
				block_type: blockType,
				block_id: blockID,
				unsaved_block_options: getUnsavedBlockOptionValues(blockID),
				layout: Headway.currentLayout
			}, 
			callback: readyTabs}, true, true, 'block-type-' + blockType);

		$('div#panel').tabs('option', 'active', $('#panel-top').find('a[href="#block-' + blockID + '-tab"]').parent().index('[aria-controls]'));

	}


		reloadBlockOptions = function(blockID, subTab) {

			if ( typeof subTab == 'undefined' || !subTab )
				var subTab = $('div#block-' + blockID + '-tab ul.sub-tabs .ui-state-active a').attr('href').replace('#', '');

			removePanelTab('block-' + blockID);
			
			return openBlockOptions(getBlockByID(blockID), subTab);

		}


		getUnsavedBlockOptionValues = function(blockID) {
					
			if ( 
				typeof GLOBALunsavedValues == 'object' && 
				typeof GLOBALunsavedValues['blocks'] == 'object' &&
				typeof GLOBALunsavedValues['blocks'][blockID] == 'object' &&
				typeof GLOBALunsavedValues['blocks'][blockID]['settings'] == 'object' 
			)
				var unsavedBlockSettings = GLOBALunsavedValues['blocks'][blockID]['settings'];
				
			return (typeof unsavedBlockSettings == 'object' && Object.keys(unsavedBlockSettings).length > 0) ? unsavedBlockSettings : null;
			
		}
		

	openBlockTypeSelector = function(block) {

		var blockID = getBlockID(block);

		/* Create blank panel */
			removePanelTab('block-' + blockID);
			addPanelTab('block-' + blockID, 'Select Block Type', '', true, true);

			var tab = $('#block-' + blockID + '-tab');

		/* Clone block type selector in and bind it */
			var blockTypeSelector = $('.block-type-selector-original').clone()
				.removeClass('block-type-selector-original')
				.appendTo(tab)
				.show();

			blockTypeSelector.find('div.block-type').addClass('tooltip');
			setupTooltips();

			blockTypeSelector.find('div.block-type').bind('click', function(event) {	

				var blockType = $(this).attr('id').replace('block-type-', '');

				/* If new block then create it */
					if ( block.hasClass('blank-block') ) {
						
						block.parents('.wrapper').headwayGrid('setupBlankBlock', blockType);
					
				/* Otherwise we're switching an existing block's type */
					} else if ( confirm('Are you sure you wish to switch block types?  All settings for this block will be lost.') ) {
						
						var switchedBlockTypeBlockID = switchBlockType(block, blockType);

						blockID = switchedBlockTypeBlockID;
						
					}

				/* Open options now */
				removePanelTab('block-' + blockID);
				openBlockOptions(getBlockByID(blockID));

			});

		/* Bind unfocus events */
			if ( block.hasClass('blank-block') ) {

				$('.wrapper').bind('mousedown', {block: block}, hideBlankBlockTypeSelector);

				$(document).bind('keyup.esc', {block: block}, hideBlankBlockTypeSelector);
				$i('html').bind('keyup.esc', {block: block}, hideBlankBlockTypeSelector);

				/* Make sure that when closing the block type selector with the tab close button on a blank block that the blank block is also removed. */
				$('ul#panel-top li a[href="#block-' + blockID + '-tab"]').siblings('span.close').bind('mouseup', {block: block}, hideBlankBlockTypeSelector);

			}
		
		/* Select the tab */
			$('div#panel').tabs('option', 'active', $('#panel-top').find('a[href="#block-' + blockID + '-tab"]').parent().index('[aria-controls]'));

		return;
		
	}

	
		hideBlankBlockTypeSelector = function(event) {

			var block = event.data.block;

			/* If blank block then unbind things and delete it.  Make sure that the block isn't being clicked inside of. */
				if ( block.hasClass('blank-block') && $(event.target).parents('.block').first().get(0) != $(block).get(0) ) {

					removePanelTab('block-' + getBlockID(block));

					block.remove();

					$('.wrapper').unbind('mousedown', hideBlankBlockTypeSelector);

					$(document).unbind('keyup.esc', hideBlankBlockTypeSelector);
					$i('html').unbind('keyup.esc', hideBlankBlockTypeSelector);

				}

			return true;
			
		}


		switchBlockType = function(block, blockType, loadContent) {
			
			var blockTypeIconURL = getBlockTypeIcon(blockType, true);
			
			var oldType = getBlockType(block);
			var blockID = getBlockID(block);
			
			block.removeClass('block-type-' + oldType);
			block.addClass('block-type-' + blockType);
								
			if ( typeof loadContent == 'undefined' || loadContent ) {

				loadBlockContent({
					blockElement: block,
					blockOrigin: {
						type: blockType,
						id: 0,
						layout: Headway.currentLayout
					},
					blockSettings: {
						dimensions: getBlockDimensions(block),
						position: getBlockPosition(block)
					},
				});

			}			

			//Set the fluid/fixed height class so the fluid height message is shown correctly
			if ( getBlockTypeObject(blockType)['fixed-height'] === true ) {
				
				block.removeClass('block-fluid-height');
				block.addClass('block-fixed-height');

				if ( block.css('min-height').replace('px', '') != '0' ) {

					block.css({
						height: block.css('min-height')
					});

				}
				
			} else {
				
				block.removeClass('block-fixed-height');
				block.addClass('block-fluid-height');

				if ( block.css('height').replace('px', '') != 'auto' ) {

					block.css({
						height: block.css('height')
					});

				}
				
			}
			
			//Set the hide-content-in-grid depending on the block type
			if ( !getBlockTypeObject(blockType)['show-content-in-grid'] ) {
				
				block.addClass('hide-content-in-grid');
				
			} else {
				
				block.removeClass('hide-content-in-grid');
				
			}

			//Remove block type unknown class
			block.removeClass('block-type-unknown');
			
			//Prepare for hiddens
			var newBlockID = getAvailableBlockID();
			var oldBlockID = blockID;
			
			//Delete the old block optiosn tab if it exists
			removePanelTab('block-' + oldBlockID);
			
			//Add hiddens to delete old block and add new block in its place
			dataDeleteBlock(oldBlockID);
			dataAddBlock(newBlockID, blockType);
			dataSetBlockPosition(newBlockID, getBlockPosition(block));
			dataSetBlockDimensions(newBlockID, getBlockDimensions(block));
			dataSetBlockWrapper(newBlockID, getBlockWrapper(block).attr('id'));
			
			//Update the ID on the block
			block
				.attr('id', 'block-' + newBlockID)
				.attr('data-id', newBlockID)
				.data('id', newBlockID);

			//Update mirroring status
			updateBlockMirrorStatus(false, newBlockID, '', false);
			
			//Allow saving now that the type has been switched
			allowSaving();
			
			return newBlockID;
			
		}


	blockIntersectCheck = function(originBlock, container) {

		if ( typeof container == 'undefined' || !container )
			var container = block.parents('.grid-container').first();
		
		var intersectors = blockIntersectCheckCallback(originBlock, container.find('.block'));

		//If there are two elements in the intersection array (the original one will be included since we're doing a general '.block' search), then we throw an error
		if ( intersectors.length > 1 ) {	
			
			intersectors.addClass('block-error');

			var output = false;
			
		} else {
			
			//Set up variable for next loop
			var blockErrorCount = 0;

			//Since there could still be errors after this one if fixed, we must loop through all other blocks that have errors
			container.find('.block-error').each(function(){
				var intersectors = blockIntersectCheckCallback(this, container.find('.block'));

				if ( intersectors.length === 1 || !intersectors ) {
					$(this).removeClass('block-error');
				} else {
					blockErrorCount++;
				}
			});

			//If there aren't any touching blocks, then we can save.  Otherwise, we cannot.
			var output = ( blockErrorCount === 0 ) ? true : false;
			
		}

		/* If there are overlapping blocks, then show a red notice */
		if ( !output ) {

			Headway.overlappingBlocks = true;

			showErrorNotification({
				id: 'overlapping-blocks',
				message: 'There are <strong>overlapping blocks</strong>.<br />Please separate them before saving.',
				closeTimer: false
			});

		} else {

			Headway.overlappingBlocks = false;
			hideNotification('overlapping-blocks');

		}

		return output;
	
	}


		blockIntersectCheckCallback = function(targetSelector, intersectorsSelector) {
			
			if ( targetSelector == false || intersectorsSelector == false || !$(targetSelector).is(':visible') ) {
				return false;
			}
			
		    var intersectors = [];
		    var xTolerance = 5; /* Tolerance for when gutter width is very little */

		    var $target = $(targetSelector);
		    var tAxis = $target.offset();
		    var t_x = [tAxis.left, tAxis.left + $target.outerWidth()];
		    var t_y = [tAxis.top, tAxis.top + $target.outerHeight()];

		    $(intersectorsSelector).each(function() {

		          var $this = $(this);

		          if ( !$this.is(':visible') )
		          	return;

		          var thisPos = $this.offset();
		          var i_x = [thisPos.left, thisPos.left + $this.outerWidth()]
		          var i_y = [thisPos.top, thisPos.top + $this.outerHeight()];

		          if ( (t_x[0] + xTolerance) < i_x[1] && (t_x[1] - xTolerance) > i_x[0] &&
		               t_y[0] < i_y[1] && (t_y[1]) > i_y[0]) {
		              intersectors.push(this);
		          }

		    });
		
		    return $(intersectors);
		
		}


	deleteBlock = function(element) {

		if ( typeof element != 'object' )
			var element = $i('.block[data-id="' + element + '"]');
	
		var deleteBlockID = getBlockID(element);
		var deleteBlock = getBlock(element);
		var deleteBlockContainer = deleteBlock.parents('.grid-container');
		
		logHistory({
			description: 'Deleted block #' + deleteBlockID,
			action: function() {

				//Get the container for the block intersect check

				//Remove the block!
				deleteBlock.hide();
				
				//Remove block options tab from panel
				removePanelTab('block-' + deleteBlockID);
				
				//Add the hidden input flag
				dataDeleteBlock(deleteBlockID);
				
				//Set block to false for the intersect check
				blockIntersectCheck(false, deleteBlockContainer);

			},
			actionReverse: function() {

				deleteBlock.show();
				
				blockIntersectCheck(deleteBlock, deleteBlockContainer);

			}
		});
		
		allowSaving();	
		
	}

	exportBlockSettingsButtonCallback = function(args) {

		var params = {
			'security': Headway.security,
			'action': 'headway_visual_editor',
			'method': 'export_block_settings',
			'block-id': args.blockID
		}

		var exportURL = Headway.ajaxURL + '?' + $.param(params);

		return window.open(exportURL);

	}

	initiateBlockSettingsImport = function(args) {

		var input = args.input;
		var blockID = args.blockID;
		var fileInput = $(input).parents('.ui-tabs-panel').first().find('input[name="block-import-settings-file"]');

		var importOptions = $(input).parents('.ui-tabs-panel').first().find('input[name="block-import-settings-include-options"]').val().toBool();
		var importDesign = $(input).parents('.ui-tabs-panel').first().find('input[name="block-import-settings-include-design"]').val().toBool();

		if ( !fileInput.val() )
			return alert('You must select a block settings export file before importing.');

		if ( !importOptions && !importDesign )
			return alert('You must import at least the options or design when importing block settings.');

		var blockSettingsFile = fileInput.get(0).files[0];

		if ( blockSettingsFile && typeof blockSettingsFile.name != 'undefined' && typeof blockSettingsFile.type != 'undefined' ) {

			var blockSettingsReader = new FileReader();

			blockSettingsReader.onload = function(e) { 

				var contents = e.target.result;
				var blockSettingsImportArray = JSON.parse(contents);

				/* Check to be sure that the JSON file is a block settings export file */
					if ( blockSettingsImportArray['data-type'] != 'block-settings' )
						return alert('Cannot load block settings.  Please insure that the block settings are a proper Headway block settings export.');

				/* Make sure block type matches */
					if ( getBlockType(getBlockByID(blockID)) != blockSettingsImportArray['type'] )
						return alert('Block type mismatch.  Be sure that the block settings export is the same type of block type that you\'re importing to.');

				/* Handle the fun stuff */
					if ( typeof blockSettingsImportArray['image-definitions'] != 'undefined' && Object.keys(blockSettingsImportArray['image-definitions']).length ) {

						showNotification({
							id: 'importing-images',
							message: 'Currently importing images.',
							closeTimer: 10000
						});

						$.post(Headway.ajaxURL, {
							security: Headway.security,
							action: 'headway_visual_editor',
							method: 'import_images',
							importFile: blockSettingsImportArray
						}, function(response) {
								
							var blockSettings = response;

							/* If there's an error when sideloading images, then hault import. */
							if ( typeof blockSettings['error'] != 'undefined' )
								return alert('Error while importing images for block: ' + blockSettings['error']);
								
							importBlockSettingsAJAXCallback(blockID, blockSettings, importOptions, importDesign);

						});

					} else {

						importBlockSettingsAJAXCallback(blockID, blockSettingsImportArray, importOptions, importDesign);

					}

			}; /* end blockSettingsReader.onload */

			blockSettingsReader.readAsText(blockSettingsFile);

		} else {

			alert('Cannot load block settings.  Please insure that the block settings are a proper Headway block settings export.');

		}

	}


		importBlockSettingsAJAXCallback = function(blockID, block, importOptions, importDesign) {

			/* Import block options */
				if ( importOptions ) {

					/* Delete existing block and re-add it so it has fresh settings */
					var blockID = switchBlockType(getBlockByID(blockID), getBlockType(getBlockByID(blockID)));

					/* Import block settings */
					importBlockSettings(block['settings'], blockID);

					/* Reload block settings */
					removePanelTab('block-' + blockID);
					openBlockOptions(getBlockByID(blockID));

				}

			/* Import block design */
				if ( importDesign && typeof block['styling'] != 'undefined' && typeof block['id'] != 'undefined' ) {

					dataPrepareDesignEditor();

					$.each(block['styling'], function(instanceID, instanceInfo) {

						/* Replace the block ID instance ID of the correct block ID */
						var oldBlockID = block['id'];
						var newBlockID = blockID;

						var instanceID = instanceID.replace('block-' + oldBlockID, 'block-' + newBlockID);

						$.each(instanceInfo.properties, function(property, value) {

							dataSetDesignEditorProperty({
								group: "blocks", 
								element: instanceInfo.element, 
								property: property, 
								value: (value !== null ? value.toString() : null), 
								specialElementType: "instance", 
								specialElementMeta: instanceID
							});

						});

					});

					showNotification({
						id: 'block-design-imported-' + blockID,
						message: 'Block design successfully imported for ' + getBlockTypeNice(getBlockType(getBlockByID(blockID))) + ' Block #' + blockID,
						closeTimer: 6000
					});

				}

			/* All done, allow saving */
				allowSaving();

		}

		importBlockSettings = function(importBlockSettings, blockID) {

			/* Send the block settings data to the unsaved data */
				dataPrepareBlock(blockID);

				GLOBALunsavedValues['blocks'][blockID]['settings'] = importBlockSettings;
			
			/* Force reload block content */
				refreshBlockContent(blockID);

			/* Show notification */
				showNotification({
					id: 'block-settings-imported-' + blockID,
					message: 'Block settings successfully imported for ' + getBlockTypeNice(getBlockType(getBlockByID(blockID))) + ' Block #' + blockID,
					closeTimer: 6000
				});

		}
/* END BLOCK FUNCTIONS */


/* WRAPPER FUNCTIONS */
	getWrapperID = function(element) {

		return element.attr('id').replace('wrapper-', '');

	}

	openWrapperOptions = function(wrapperID) {

		var wrapperID = 'wrapper-' + wrapperID;
	
		var readyTabs = function() {
			
			var tab = $('div#' + wrapperID + '-tab');
			
			/* Ready tab, sliders, and inputs */
			tab.tabs();
			bindPanelInputs('div#' + wrapperID + '-tab');

			/* Show and hide elements based on toggle options */
			handleInputTogglesInContainer(tab.find('div.sub-tabs-content'));
			
			/* Refresh tooltips */
			setupTooltips();

			/* Update the Grid Width Input */
				updateGridWidthInput($('div#' + wrapperID + '-tab'));

			/* If it's a mirrored wrapper, then hide the other tabs */
				if ( $('div#' + wrapperID + '-tab').find('select[name="mirror-wrapper"]').val() ) {
					
					$('div#' + wrapperID + '-tab ul.sub-tabs li:not(#sub-tab-config)').hide();
					selectTab('sub-tab-config', $('div#' + wrapperID + '-tab'));
					
				}
			
		}						
		
		var wrapperIDForTab = wrapperID.replace('wrapper-', '');

		addPanelTab(wrapperID, 'Wrapper #' + wrapperIDForTab, {
			url: Headway.ajaxURL, 
			data: {
				security: Headway.security,
				action: 'headway_visual_editor',
				method: 'load_wrapper_options',
				wrapper_id: wrapperID.replace('wrapper-', ''),
				unsaved_wrapper_options: getUnsavedWrapperOptionValues(wrapperID),
				layout: Headway.currentLayout
			}, 
			callback: readyTabs}, true, true, 'wrapper-options');

		$('div#panel').tabs('option', 'active', $('#panel-top').find('a[href="#' + wrapperID + '-tab"]').parent().index('[aria-controls]'));

	}


		getUnsavedWrapperOptionValues = function(wrapperID) {

			if ( 
				typeof GLOBALunsavedValues == 'object' && 
				typeof GLOBALunsavedValues['wrappers'] == 'object' &&
				typeof GLOBALunsavedValues['wrappers'][wrapperID] == 'object'
			)
				var unsavedWrapperSettings = GLOBALunsavedValues['wrappers'][wrapperID];
				
			return (typeof unsavedWrapperSettings == 'object' && Object.keys(unsavedWrapperSettings).length > 0) ? unsavedWrapperSettings : null;
			
		}


	getWrapperMirror = function(wrapperID) {

		return $i('#whitewrap').data('wrappers')['wrapper-' + wrapperID.replace('wrapper-', '')]['mirror-wrapper'];

	}


	updateWrapperMirrorStatus = function(wrapperID, mirroredWrapperID, input) {

		var wrapperID = wrapperID.replace('wrapper-', '');
		var mirroredWrapperID = mirroredWrapperID.replace('wrapper-', '');

		var wrapper = $i('#wrapper-' + wrapperID);

		populateWrapperMirrorNotice($i('#wrapper-' + wrapperID));

		/* Update data-mirrored-wrapper and toggle the wrapper-mirrored class */
			if ( mirroredWrapperID ) {

				wrapper.addClass('wrapper-mirrored');
				wrapper.headwayGrid('disable');

				/* Hide wrapper options */
				input.parents('.panel').find('ul.sub-tabs li:not(#sub-tab-config)').hide();

		/* Wrapper is not mirrored, remove class and set data-mirrored-wrapper to null */
			} else {

				wrapper.removeClass('wrapper-mirrored');
				wrapper.headwayGrid('enable');

				/* Show wrapper options */
				input.parents('.panel').find('ul.sub-tabs li:not(#sub-tab-config)').show();

			}

		/* Recalculate wrapper height */
			wrapper.data('ui-headwayGrid').updateGridContainerHeight();
			wrapper.data('ui-headwayGrid').resetGridCalculations();
			wrapper.data('ui-headwayGrid').alignAllBlocksWithGuides();

	}
/* END WRAPPER FUNCTIONS */


/* NOTIFICATIONS */
	showNotification = function(args) {

		var args = $.extend({}, {
			id: null,
			message: null,
			error: false,
			closeTimer: 3000,
			closable: false,
			closeOnEscKey: false,
			closeCallback: function() {},
			closeConfirmMessage: null,
			fadeInDuration: 350,
			timerFadeOutDuration: 1500,
			closeFadeOutDuration: 350,
			doNotShowAgain: false,
			overwriteExisting: false,
			opacity: 1,
			pulsate: true
		}, args);				
		
		/* If doNotShowAgain is true and the cookie exists, don't show the notification */
			if ( args.doNotShowAgain && $.cookie('headway-hide-notification-' + args.id) )
				return;

		/* If notification already exists, delete it. */
			if ( $('#notification-' + args.id).length ) {

				if ( !args.overwriteExisting )
					return $('#notification-' + args.id).fadeIn(args.fadeInDuration);
				
				hideNotification(args.id);	

			}
		
		/* Set up notification */
			var notification = $('<div class="notification"><p>' + args.message + '</p></div>');
			
			/* Add attributes */
				/* ID */
					notification.attr('id', 'notification-' + args.id);

				/* Classes */
					if ( args.error )
						notification.addClass('notification-error');

					if ( args.pulsate )
						notification.addClass('notification-pulsate');

					if ( args.closable )
						notification.addClass('notification-closable');

				/* Styling */
					notification
						.css('opacity', args.notification)
						.hide();
			/* End attributes */

			/* Send these args to the notification's data that way callbacks, etc can be used when hide is called */
				notification.data('notification-args', args);
		/* Set up close button and bind it */
			if ( args.closable ) {

				var notificationCloseButton = $('<span class="close">Close</span>');

				var notificationClose = function() {

					if ( args.closeConfirmMessage && !confirm(args.closeConfirmMessage) )
						return false;

					hideNotification(args.id);

					$(document).unbind('.notification_' + args.id);
					$i('html').unbind('.notification_' + args.id);

				}

				notificationCloseButton.appendTo(notification);
				notificationCloseButton.on('click', notificationClose);

				if ( args.closeOnEscKey ) {

					$(document).bind('keyup.notification_' + args.id, notificationClose);
					$i('html').bind('keyup.notification_' + args.id, notificationClose);

				}

			}
		/* End setting up close button */

		/* If there's a close timer, set the timeout up */				
			if ( args.closeTimer ) {

				setTimeout(function() {
					notification.fadeOut(args.timerFadeOutDuration, function() {
						$(this).remove();
					});
				}, args.closeTimer);

			}

		/* Move notification into notification center and make it visible */
			notification
				.appendTo('#notification-center')
				.fadeIn(350);
		
		/* All done, return the notification object */
		return notification;
		
	}


	showErrorNotification = function(args) {

		var args = $.extend({}, {
			error: true,
			closeTimer: 6000
		}, args);

		return showNotification(args);

	}


	hideNotification = function(id, fade) {

		var notification = $('#notification-' + id);

		if ( !notification || !notification.length )
			return false;

		var args = notification.data('notification-args');

		if ( typeof args.closeCallback == 'function' )
			args.closeCallback.apply(notification);

		/* Fade or not */
			if ( typeof fade == 'undefined' || fade ) {

				notification.fadeOut(args.closeFadeOutDuration, function() {

					$(this).remove();

					if ( args.doNotShowAgain )
						$.cookie('headway-hide-notification-' + args.id, true);

				});

			} else {

				notification.remove();

				if ( args.doNotShowAgain )
					$.cookie('headway-hide-notification-' + args.id, true);

			}

		return notification;
		
	}
/* END NOTIFICATIONS */


/* LOADING FUNCTIONS */
	/* COG FUNCTIONS */
		createCog = function(element, deprecatedAnimate, append, context, opacity) {
			
			if ( $(element).length === 0 || $(element).find('.cog-container:visible').length )
				return false;
			
			var append = typeof append == 'undefined' ? false : append;

			var cogString = '<div class="cog-container"><div class="cog-bottom-left"></div><div class="cog-top-right"></div></div>';
							
			if ( append ) {
				
				element.append(cogString);
							
			} else {
				
				element.html(cogString);
				
			}
			
			if ( typeof opacity != 'undefined' )
				element.find('.cog-container').css({opacity: opacity});
				
			return true;
			
		}
	/* END COG FUNCTIONS */


	/* TITLE FUNCTIONS */
		/* Simple title change function */
		changeTitle = function(title) {

			return $('title').text(title);

		}


		startTitleActivityIndicator = function() {
			
			//If the title activity indicator has already been started, don't try to again.
			if ( typeof titleActivityIndicatorInstance === 'number' )
				return false;

			titleActivityIndicatorInstance = window.setInterval(titleActivityIndicator, 500);
			titleActivityIndicatorSavedTitle = $('title').text();

			return true;

		}


		stopTitleActivityIndicator = function() {

			if ( typeof titleActivityIndicatorInstance !== 'number' ) {

				return false;

			}

			window.clearInterval(titleActivityIndicatorInstance);

			changeTitle(titleActivityIndicatorSavedTitle);

			delete titleActivityIndicatorCounter;
			delete titleActivityIndicatorSavedTitle;
			delete titleActivityIndicatorInstance;

			return true;

		}


		/* Title indicator callback function */
		titleActivityIndicator = function() {

			/* Set up variables */
			if ( typeof titleActivityIndicatorCounter == 'undefined' ) {
				titleActivityIndicatorCounter = 0;
				titleActivityIndicatorCounterPos = true;
			}	


			/* Increase/decrease periods */
			if ( titleActivityIndicatorCounterPos === true ) {
				++titleActivityIndicatorCounter;
			} else {
				--titleActivityIndicatorCounter;
			}

			/* Flippy da switch */
			if ( titleActivityIndicatorCounter === 3) {
				titleActivityIndicatorCounterPos = false;
			} else if ( titleActivityIndicatorCounter === 0) {
				titleActivityIndicatorCounterPos = true;
			}

			var title = titleActivityIndicatorSavedTitle + '.'.repeatStr(titleActivityIndicatorCounter);

			changeTitle(title);

		}
	/* END TITLE FUNCTIONS */
/* END LOADING FUNCTIONS */


/* BOX FUNCTIONS */
	createBox = function(args) {
		var settings = {};
		
		var defaults = {
			id: null,
			title: null,
			description: null,
			content: null,
			src: null,
			load: null,
			width: 500,
			height: 300,
			center: true,
			closable: true,
			resizable: false,
			draggable: true,
			deleteWhenClosed: false,
			blackOverlay: false,
			blackOverlayOpacity: .6,
			blackOverlayIframe: false
		};
		
		$.extend(settings, defaults, args);
				
		/* Create box */
			var box = $('<div class="box" id="box-' + settings.id + '"><div class="box-top"></div><div class="box-content-bg"><div class="box-content"></div></div></div>');
			
			box.attr('black_overlay', settings.blackOverlay);
			box.attr('black_overlay_opacity', settings.blackOverlayOpacity);
			box.attr('black_overlay_iframe', settings.blackOverlayIframe);
			box.attr('load_with_ajax', false);
				
		/* Move box into document */
			box.appendTo('div#boxes');
					
		/* Inject everything */
			/* If regular content and not iframe, just put it in */
			if ( typeof settings.src !== 'string' ) {
								
				box.find('.box-content').html(settings.content);
			
			/* Else use iframe */	
			} else {
				
				box.find('.box-content').html('<iframe src="' + settings.src + '" style="width: ' + settings.width + 'px; height: ' + parseInt(settings.height - 50) + 'px;"></iframe>');
								
				if ( typeof settings.load === 'function' ) {
					
					box.find('.box-content iframe').bind('load', settings.load);
					
				}
				
			}
		
			box.find('.box-top').append('<strong>' + settings.title + '</strong>');
			
			if ( typeof settings.description === 'string' ) {
				box.find('.box-top').append('<span>' + settings.description + '</span>');
			}
		
		/* Setup box */
			setupBox(settings.id, settings);
					
		return box;
	}
	
	
	setupBox = function(id, args) {
		
		var settings = {};
		
		var defaults = {
			width: 600,
			height: 300,
			center: true,
			closable: true,
			deleteWhenClosed: false,
			draggable: false,
			resizable: false
		};
				
		$.extend(settings, defaults, args);		
				
		var box = $('div#box-' + id);
				
		/* Handle draggable */
		if ( settings.draggable ) {
			
			box.draggable({
				handle: box.find('.box-top'),
				start: showIframeOverlay,
				stop: hideIframeOverlay
			});
			
			box.find('.box-top').css('cursor', 'move');
			
		}
		
		/* Make box closable */
		if ( settings.closable ) {
			
			/* If close button doesn't exist, create it. */
			box.find('.box-top').append('<span class="box-close">X</span>');
			
			box.find('.box-close').bind('click', function(){
				closeBox(id, settings.deleteWhenClosed);
			});
			
		}
		
		/* Make box resizable */
		if ( settings.resizable ) {
			
			/* If close button doesn't exist, create it. */
			box.resizable({
				start: showIframeOverlay,
				stop: hideIframeOverlay,
				handles: 'n, e, s, w, ne, se, sw, nw',
				minWidth: settings.minWidth,
				minHeight: settings.minHeight
			});
			
		}
		
		/* Set box dimensions */
		box.css({
			width: settings.width,
			height: settings.height
		});

		/* Center Box */
		if ( settings.center ) {
			
			var marginLeft = -(box.width() / 2);
			var marginTop = -(box.height() / 2);
			
			box.css({
				top: '50%',
				left: '50%',
				marginLeft: marginLeft,
				marginTop: marginTop,
			});
			
		}
		
	}
	
	
	showIframeOverlay = function() {
		
		var overlay = $('div#iframe-overlay');		
		overlay.show();
		
	}
	
	
	hideIframeOverlay = function(delay) {

		if ( typeof delay != 'undefined' && delay == false )
			return $('div#iframe-overlay').hide();
		
		/* Add a timeout for intense draggers */
		setTimeout(function(){
			$('div#iframe-overlay').hide();
		}, 250);
		
	}


	showIframeLoadingOverlay = function() {

		/* Restrict scrolling */
		$('div#iframe-container').css('overflow', 'hidden');

		/* Position loading overlay */
		$('div#iframe-loading-overlay').css({
			top: $('div#iframe-container').scrollTop()
		});

		/* Only show if not already visible */
		if ( !$('div#iframe-loading-overlay').is(':visible') ) {
			createCog($('div#iframe-loading-overlay'), true);
			$('div#iframe-loading-overlay').show();
		}
		
		return $('div#iframe-loading-overlay');

	}


	hideIframeLoadingOverlay = function() {

		$('div#iframe-container').css('overflow', 'auto');
		$('div#iframe-loading-overlay').hide().html('');

	}
	
	
	setupStaticBoxes = function() {
				
		$('div.box').each(function() {
		
			/* Fetch settings */
			var draggable = $(this).attr('draggable').toBool();
			var closable = $(this).attr('closable').toBool();
			var resizable = $(this).attr('resizable').toBool();
			var center = $(this).attr('center').toBool();
			var width = $(this).attr('width');
			var height = $(this).attr('height');
			var minWidth = $(this).attr('min_width');
			var minHeight = $(this).attr('min_height');			
						
			var id = $(this).attr('id').replace('box-', '');
																		
			setupBox(id, {
				draggable: draggable,
				closable: closable,
				resizable: resizable,
				center: center,
				width: width,
				height: height,
				minWidth: minWidth,
				minHeight: minHeight
			});
			
			/* Remove settings attributes */
			$(this).attr('draggable', null);
			$(this).attr('closable', null);
			$(this).attr('resizable', null);
			$(this).attr('center', null);
			$(this).attr('width', null);
			$(this).attr('height', null);
			$(this).attr('min_width', null);
			$(this).attr('min_height', null);
			
		});
		
	}
	
	
	openBox = function(id) {
		
		var id = id.replace('box-', '');
		var box = $('div#box-' + id);
		
		if ( box.length === 0 )
			return false;
		
		var blackOverlay = box.attr('black_overlay').toBool();
		var blackOverlayOpacity = box.attr('black_overlay_opacity');
		var blackOverlayIframe = box.attr('black_overlay_iframe').toBool();
		var loadWithAjax = box.attr('load_with_ajax').toBool();
		
		if ( blackOverlay && !boxOpen(id) ) {

			var overlay = $('<div class="black-overlay"></div>')
				.hide()
				.attr('id', 'black-overlay-box-' + id)
				.appendTo('body');

			if ( blackOverlayIframe === true )
				overlay.css('zIndex', 4);

			if ( !isNaN(blackOverlayOpacity) )
				overlay.css('background', 'rgba(0, 0, 0, ' + blackOverlayOpacity + ')');

			overlay.show();

		}
			
		if ( loadWithAjax && !box.data('currently-ajax-loading') ) {

			/* Remove all data such as jQuery UI widgets.  jQuery UI upgrade to 1.10 required this */
			box.find('*').removeData();
			box.find('.box-content *').remove();
			
			/* Add the loading cog */
			createCog(box.find('.box-content'), true);

			/* Add loading flag */
			box.data('currently-ajax-loading', true);
						
			box.find('.box-content').load(Headway.ajaxURL, {
				security: Headway.security,
				action: 'headway_visual_editor',
				method: 'load_box_ajax_content',
				box_id: id,
				layout: Headway.currentLayout
			}, function() {
									
				var loadWithAjaxCallback = eval(box.attr('load_with_ajax_callback'));
								
				loadWithAjaxCallback.call();

				/* Remove loading flag */
				box.removeData('currently-ajax-loading');

			});
			
		}
			
		return box.show();
		
	}
	
	
	closeBox = function(id, deleteWhenClosed) {
		
		var id = id.replace('box-', '');
		var box = $('div#box-' + id);
		
		box.hide();

		if ( typeof deleteWhenClosed != 'undefined' && deleteWhenClosed == true )
			box.remove();
					
		$('div#black-overlay-box-' + id).remove();
		
		return true;
		
	}
	
	
	boxOpen = function(id) {
		
		return $('div#box-' + id).is(':visible');
		
	}
	
	
	boxExists = function(id) {
		
		if ( $('div#box-' + id).length === 1 ) {
			
			return true;
			
		} else {
			
			return false;
			
		}
		
	}


	toggleBox = function(id) {

		if ( !boxOpen(id) ) {
							
			openBox(id);
			
		} else {
							
			closeBox(id);
			
		}

	}
/* END BOX FUNCTIONS */


/* LAYOUT SELECTOR FUNCTIONS */
	loadLayoutSelector = function() {

		createCog($('#layout-selector-pages'));
		createCog($('#layout-selector-templates'));

		/* Pages */
			$.ajax(Headway.ajaxURL, {
				type: 'POST',
				async: true,
				data: {
					action: 'headway_visual_editor',
					method: 'get_layout_selector_pages',
					security: Headway.security,
					currentLayout: Headway.currentLayout,
					mode: Headway.mode
				},
				success: function(data, textStatus) {
					
					/* Inject HTML */
					$('#layout-selector-pages').html(data);

					/* Hide revert button if there is only one customized layout. */
					layoutSelectorRevertCheck();
					
				}
			});

		/* Templates */
			$.ajax(Headway.ajaxURL, {
				type: 'POST',
				async: true,
				data: {
					action: 'headway_visual_editor',
					method: 'get_layout_selector_templates',
					security: Headway.security,
					currentLayout: Headway.currentLayout,
					mode: Headway.mode
				},
				success: function(data, textStatus) {
					
					/* Inject HTML */
					$('#layout-selector-templates').html(data);

					/* Hide revert button if there is only one customized layout. */
					layoutSelectorRevertCheck();
					
				}
			});

	}

	layoutSelectorRevertCheck = function() {
		
		if ( $('.layout-item-customized').length > 1 ) {
			$('div#layout-selector-pages').removeClass('layout-selector-disallow-revert');
		} else {
			$('div#layout-selector-pages').addClass('layout-selector-disallow-revert');
		}
		
	}

	showLayoutSelector = function() {

		$('div#layout-selector-offset')
			.removeClass('layout-selector-hidden')
			.addClass('layout-selector-open');
						
		$('body').removeClass('layout-selector-hidden');
		
		$('span#layout-selector-toggle').text('Hide Layout Selector');
		
		return $.cookie('hide-layout-selector', false);

	}

	hideLayoutSelector = function() {

		$('div#layout-selector-offset')
			.removeClass('layout-selector-open')
			.addClass('layout-selector-hidden');
			
		$('body').addClass('layout-selector-hidden');
		
		$('span#layout-selector-toggle').text('Show Layout Selector');


		
		return $.cookie('hide-layout-selector', true);

	}

	toggleLayoutSelector = function() {
		
		if ( $('div#layout-selector-offset').hasClass('layout-selector-open') ) {
			hideLayoutSelector();
		} else {
			showLayoutSelector();
		}

		/* If Grid mode then we need to recalculate CSS for wrappers */
		if ( Headway.mode == 'grid' ) {

			$i('.wrapper:visible').each(function() {

				if ( $(this).data('ui-headwayGrid') )
					$(this).headwayGrid('updateGridCSS');

			});

		}

	}
/* END LAYOUT SELECTOR FUNCTIONS */


/* PANEL FUNCTIONS */
	/* Tab Functions */
	$('ul#panel-top').delegate('span.close', 'click', function(){
				
		var tab = $(this).siblings('a').attr('href').replace('#', '').replace('-tab', '');
				
		return removePanelTab(tab);
		
	});


	/* TABS FUNCTIONS */
		selectTab = function(tab, context) {

			var tabs = context.find('.ui-tabs-nav');
			var tabLink = tabs.find('li[aria-controls="' + tab + '"] a').length ? tabs.find('li[aria-controls="' + tab + '"] a') : tabs.find('li[aria-controls="' + tab + '-content"] a');

			return tabLink.trigger('click');

		}
	/* END TABS FUNCTION */
	
	
	addPanelTab = function(name, title, content, closable, closeOnLayoutSwitch, panelClass) {
		
		/* If the tab name already exists, don't try making it */
		if ( $('ul#panel-top li a[href="#' + name + '-tab"]').length !== 0 )
			return false;
		
		/* Set up default variables */
		if ( typeof closable == 'undefined' ) {
			var closable = false;
		}
		
		if ( typeof closeOnLayoutSwitch == 'undefined' ) {
			var closeOnLayoutSwitch = false;
		}
		
		if ( typeof panelClass == 'undefined' ) {
			var panelClass = false;
		}
		
		/* Add the tab */
		var tab = $('<li><a href="#' + name + '-tab">' + title + '</a></li>').appendTo('div#panel #panel-top');
		var panel = $('<div id="' + name + '-tab"></div>').appendTo('div#panel');
		var tabLink = tab.find('a');
		
		$('div#panel').tabs('refresh');
		$(tabLink).bind('click', showPanel);
		
		showPanel();
		
		/* Add the panel class to the panel */
		panel.addClass('panel');
		
		/* If the content is static, just throw it in.  Otherwise get the content with AJAX */
		if ( typeof content == 'string' ) {
			
			panel.html(content);
			
		} else {
			
			var loadURL = content.url; 
			var loadData = content.data || false;
			
			var loadCallback = function() {
				
				if ( typeof content.callback == 'function' )
					content.callback.call();
			
				addPanelScrolling();
				
			};
			
			createCog(panel, true);
						
			$('div#panel div#' +  name + '-tab').load(loadURL, loadData, loadCallback);
			
		}
		
		if ( panelClass )
			panel.addClass('panel-' + panelClass);

		/* Add delete to tab link if the tab is closable */
		if ( closable ) {
					
			tabLink.parent().append('<span class="close">X</span>');
			
		}
		
		/* If the panel is set to close on layout switch, add a class to the tab itself so we can target it down the road */
		tabLink.parent().addClass('tab-close-on-layout-switch');
				
		return tab;
		
	}
	
	
	removePanelTab = function(name) {

		var name = name.replace('-tab', '');
		
		/* If tab doesn't exist, don't try to delete any tabs */
		if ( $('#' + name + '-tab').length === 0 ) {
			return false;
		}

		$('#panel').find('#' + name + '-tab').remove();
		$('#panel-top').find('a[href="#' + name + '-tab"]').parent().remove();
		
		return $('div#panel').tabs('refresh');
		
	}
	
	
	removeLayoutSwitchPanels = function() {
		
		$('li.tab-close-on-layout-switch').each(function(){
			var id = $(this).find('a').attr('href').replace('#', '');
			
			removePanelTab(id);
		});
		
	}


	/* Toggle visibility of visual editor panel */
	togglePanel = function() {

		if ( $('div#panel').hasClass('panel-hidden') )
			return showPanel();

		return hidePanel();

	}
	
	
	hidePanel = function() {
		
		//If the panel is already hidden, don't go through any trouble.
		if ( $('div#panel').hasClass('panel-hidden') )
			return false;
									
		var panelCSS = {bottom: -$('div#panel').height()};
		var iframeCSS = {bottom: $('ul#panel-top').outerHeight()};
		var layoutSelectorCSS = {paddingBottom: $('ul#panel-top').outerHeight() + $('div#layout-selector-tabs').height()};

			$('div#panel').css(panelCSS).addClass('panel-hidden');
			$('div#iframe-container').css(iframeCSS);
			$('div#layout-selector-offset').css(layoutSelectorCSS);

			setTimeout(repositionTooltips, 400);

		$('body').addClass('panel-hidden');

		/* Add class to button */
		$('ul#panel-top li#minimize span').addClass('active');
		
		/* De-select the selected block while the panel is hidden */
		$i('.block-selected').removeClass('block-selected block-hover');

		$.cookie('hide-panel', true);
		
		return true;
		
	}
	
	
	showPanel = function() {
				
		//If the panel is already visible, don't go through any trouble.
		if ( !$('div#panel').hasClass('panel-hidden') )
			return false;

		var panelCSS = {bottom: 0};
		var iframeCSS = {bottom: $('div#panel').outerHeight()};
		var layoutSelectorCSS = {paddingBottom: $('div#panel').outerHeight() + $('div#layout-selector-tabs').height()};
					
			$('div#panel').css(panelCSS).removeClass('panel-hidden');
			$('div#iframe-container').css(iframeCSS);
			$('div#layout-selector-offset').css(layoutSelectorCSS);

			setTimeout(repositionTooltips, 400);

		$('body').removeClass('panel-hidden');

		/* Remove class from button */
		$('ul#panel-top li#minimize span').removeClass('active');
		
		/* Re-select the the block if a block optiosn panel tab is open. */
		$i('#' + $('ul#panel-top > li.ui-state-active a').attr('href').replace('#', '').replace('-tab', '')).addClass('block-selected block-hover');
		
		$.cookie('hide-panel', false);
		
		return true;
		
	}

	
	/* Scrolling */
	addPanelScrolling = function() {
		
		$('ul.sub-tabs').scrollbarPaper();
		$('div.sub-tabs-content-container').scrollbarPaper();
		
	}
/* END PANEL FUNCTIONS */


/* COMPLEX INPUTS ACROSS ALL MODES */
	updateBlockMirrorStatus = function(input, block, value, updateTooltips) {
		
		/* If there is no input provided, then create an empty jQuery so no errors show up */
		if ( typeof input == 'undefined' || input == false )
			input = $();
			
		if ( typeof updateTooltips == 'undefined' )
			updateTooltips = true;

		if ( typeof block != 'object' )
			var block = getBlock($i('.block[data-id="' + block + '"]'));
		
		if ( value == '' ) { 
										
			input.parents(".panel").find("ul.sub-tabs li:not(#sub-tab-config)").show();

			/* Change ID attribute to the block's real ID */
			block.attr('id', 'block-' + block.data('id'));

			/* Get rid of data-block-mirror */
			block.data('block-mirror', false);

			/* Remove mirrored class */
			block.removeClass('block-mirrored');
			
		} else { 
			
			input.parents(".panel").find("ul.sub-tabs li:not(#sub-tab-config)").hide();

			/* Update ID attribute to the mirrored block ID */
			block.attr('id', 'block-' + value);

			/* Update data-block-mirror */
			block.data('block-mirror', value);

			/* Add class */
			block.addClass('block-mirrored');
			
		}
		
	}
/* END COMPLEX INPUTS */


/* SAVE FUNCTIONS */
	save = function() {
		
		/* If saving isn't allowed, don't try to save. */
		if ( typeof isSavingAllowed === 'undefined' || isSavingAllowed === false ) {
			return false;
		}
		
		/* If currently saving, do not do it again. */
		if ( typeof currentlySaving !== 'undefined' && currentlySaving === true ) {
			return false;
		}
	
		currentlySaving = true;
		
		savedTitle = $('title').text();
		saveButton = $('span#save-button');
	
		saveButton
			.text('Saving...')
			.addClass('active')
			.css('cursor', 'wait');
		
		/* Change the title */
		changeTitle('Visual Editor: Saving');
		startTitleActivityIndicator();
			
		/* Build and serialize options */
		var optionsSerialized = $.param(GLOBALunsavedValues);

		/* Do the stuff */
		$.post(Headway.ajaxURL, {
			security: Headway.security,
			action: 'headway_visual_editor',
			method: 'save_options',
			options: optionsSerialized,
			layout: Headway.currentLayout,
			mode: Headway.mode
		}, function(response) {
			
			delete currentlySaving;

			/* If the AJAX response is '0' then show a log in alert */
			if ( response === '0' ) {
								
				saveButton.stop(true);
			
				saveButton.text('Save');
				saveButton.removeClass('active');

				saveButton.css('cursor', 'pointer');
							
				return showErrorNotification({
					id: 'error-wordpress-authentication',
					message: '<strong>Notice!</strong><br /><br />Your WordPress authentication has expired and you must log in before you can save.<br /><br /><a href="' + Headway.adminURL + '" target="_blank">Click Here to log in</a>, then switch back to the window/tab the Visual Editor is in.',
					closeTimer: false,
					closable: true
				});
				
				/* If it's not a successful save, revert the save button to normal and display an alert. */
			} else if ( response !== 'success' ) {
								
				saveButton.stop(true);
			
				saveButton.text('Save');
				saveButton.removeClass('active');

				saveButton.css('cursor', 'pointer');
							
				return showErrorNotification({
					id: 'error-invalid-save-response',
					message: 'Error: Could not save!  Please try again.',
					closable: true
				});
				
			/* Successful Save */
			} else {

				/* Hide any previous save errors */
					hideNotification('error-wordpress-authentication');
					hideNotification('error-invalid-save-response');
					
				saveButton.animate({boxShadow: '0 0 0 #00ffde'}, 350);
				
				setTimeout(function() {

					saveButton.css('boxShadow', '');
					saveButton.stop(true);

					saveButton.text('Save');
					saveButton.removeClass('active');

					saveButton.css('cursor', 'pointer');

					/* Clear out hidden inputs */
					clearUnsavedValues();

					/* Set the current layout to customized after save */
					$('li.layout-selected').addClass('layout-item-customized');
					
					layoutSelectorRevertCheck();

					/* Fade back to inactive save button. */
					disallowSaving();				

					/* Reset the title and show the saving complete notification */
					setTimeout(function() {

						stopTitleActivityIndicator();
						changeTitle(savedTitle);

						showNotification({
							id: 'saving-complete',
							message: 'Saving Complete!',
							closeTimer: 3500
						});

					}, 150);

				}, 350);

				allowVEClose(); //Do this here in case we have some speedy folks who want to close VE ultra-early after a save.
				
			}

		});
	
	}


	clearUnsavedValues = function() {

		delete GLOBALunsavedValues;
		
	}


	allowSaving = function() {
						
		/* If it's the layout mode and there no blocks on the page, then do not allow saving.  Also do not allow saving if there are overlapping blocks */
			if ( (Headway.mode == 'grid' && $i('.block').length === 0) || (typeof Headway.overlappingBlocks != 'undefined' && Headway.overlappingBlocks) )
				return disallowSaving();

		/* If saving is already allowed, don't do anything else	*/
			if ( typeof isSavingAllowed !== 'undefined' && isSavingAllowed === true )
				return;
				
		/* Put animation in timeout so the animation actually happens instead of a jump to the end.  Still haven't figured out why this happens. */
			setTimeout(function(){
				$('span#save-button').stop(true).show().animate({opacity: 1}, 350);
				$('span#preview-button').stop(true).show().animate({opacity: 1}, 350);
			}, 1);
		
		isSavingAllowed = true;
		
		/* Set reminder when trying to leave that there are changes. */
		prohibitVEClose();
		
		return true;
		
	}
	
	
	disallowSaving = function() {
		
		isSavingAllowed = false;
		
		setTimeout(function(){
			
			$('span#save-button').stop(true).animate({opacity: 0}, 350, function() {
				$(this).hide();
			});

			$('span#preview-button').stop(true).animate({opacity: 0}, 350, function() {
				$(this).hide();
			});
			
		}, 1);
		
		/* User can safely leave VE now--changes are saved.  As long as there are no overlapping blocks */
		if ( typeof Headway.overlappingBlocks == 'undefined' || !Headway.overlappingBlocks )
			allowVEClose();

		return true;
		
	}
/* END SAVE BUTTON FUNCTIONS */


/* DATA HANDLING FUNCTIONS */
	dataHandleInput = function(input, value, additionalCallbackArgs) {

		var input = $(input);

		/* Make sure input exists */
			if ( !input.length )
				return false;

		/* Build variables */				
			if ( typeof value == 'undefined' )
				var value = input.val();
			
			var optionID = input.attr('name').toLowerCase();
			var optionGroup = input.attr('data-group').toLowerCase();
			
			var callback = eval(input.attr('data-callback'));
			var dataHandlerOverrideCallback = eval(input.attr('data-data-handler-callback')) || null;

		/* Set up arguments */
			var panelArgs = input.parents('.sub-tabs-content-container').first().data('panel-args') || {};
			var callbackArgs = $.extend({}, {
				input: input,
				value: value
			}, panelArgs);

			/* Add in additionalCallbackArgs which is used for things like image uploader input */
			if ( typeof additionalCallbackArgs == 'object' )
				callbackArgs = $.extend({}, callbackArgs, additionalCallbackArgs);

		/* Allow saving */
			allowSaving();
			
		/* Handle repeater inputs */
			if ( !input.hasClass('repeater-group-input') && input.parents('.repeater-group').length ) {

				updateRepeaterValues(input.parents('.repeater'));

				if ( typeof callback == 'function' )
					callback(callbackArgs);	

				return input.parents('.repeater-group');				

			}

		/* If no save flag is present then stop here */
			if ( input.attr('data-no-save') ) {

				if ( typeof callback == 'function' )
					callback(callbackArgs);	

				return input;

			}

		/* Route to the proper place to save the data */
			/* Data Handler Override */
				if ( typeof dataHandlerOverrideCallback == 'function' ) {

					dataHandlerOverrideCallback(callbackArgs);

	 		/* Block Option */
				} else if ( typeof panelArgs.block != 'undefined' && panelArgs.block ) {

					var blockID = panelArgs.blockID;
					
					dataSetBlockOption(blockID, optionID, value);
					refreshBlockContent(blockID, callback, callbackArgs);

					return input;

			/* Wrapper Option */
				} else if ( typeof panelArgs.wrapper != 'undefined' && panelArgs.wrapper ) {

					dataSetWrapperOption(panelArgs.wrapper.id, optionID, value);

			/* Regular Option */
				} else {

					dataSetOption(optionGroup, optionID, value);

				}

		/* Fire callback as long as it's not block setting (it would've returned above so this won't execute if it's a block setting... callback needs to fire after block content is loaded via AJAX) */
		if ( typeof callback == 'function' )
			callback(callbackArgs);	

		/* Done */
		return input;
		
	}


	/* REGULAR OPTIONS DATA */
		dataSetOption = function(group, option, value) {

			dataPrepareOptionGroup(group);

			GLOBALunsavedValues['options'][group][option] = value;

			allowSaving();

			return GLOBALunsavedValues['options'][group];

		}


		dataPrepareOptionGroup = function(group) {

			if ( typeof GLOBALunsavedValues != 'object' )
				GLOBALunsavedValues = {};

			if ( typeof GLOBALunsavedValues['options'] != 'object' )
				GLOBALunsavedValues['options'] = {};

			if ( typeof GLOBALunsavedValues['options'][group] != 'object' )
				GLOBALunsavedValues['options'][group] = {};

			return GLOBALunsavedValues['options'][group];

		}
	/* END REGULAR OPTIONS DATA */

	
	/* BLOCK SAVING FUNCTIONS */
		dataSetBlockOption = function(blockID, option, value) {

			dataPrepareBlock(blockID);

			GLOBALunsavedValues['blocks'][blockID]['settings'][option] = value;

			return GLOBALunsavedValues['blocks'][blockID];

		}


		dataSetBlockPosition = function(blockID, position) {
			
			if ( typeof blockID === 'string' && blockID.indexOf('block-') !== -1 )
				var blockID = blockID.replace('block-', '');

			var position = position.left + ',' + position.top;

			dataPrepareBlock(blockID);

			GLOBALunsavedValues['blocks'][blockID]['position'] = position;

			return GLOBALunsavedValues['blocks'][blockID];
			
		}
		
		
		dataSetBlockDimensions = function(blockID, dimensions) {
			
			if ( typeof blockID === 'string' && blockID.indexOf('block-') !== -1 )
				var blockID = blockID.replace('block-', '');
			
			var dimensions = dimensions.width + ',' + dimensions.height;

			dataPrepareBlock(blockID);

			GLOBALunsavedValues['blocks'][blockID]['dimensions'] = dimensions;

			return GLOBALunsavedValues['blocks'][blockID];
			
		}
		

		dataSetBlockWrapper = function(blockID, newWrapperID) {

			dataPrepareBlock(blockID);

			GLOBALunsavedValues['blocks'][blockID]['wrapper'] = newWrapperID;

			return GLOBALunsavedValues['blocks'][blockID];

		}

		
		dataDeleteBlock = function(blockID) {
			
			if ( typeof blockID === 'string' && blockID.indexOf('block-') !== -1 )
				var blockID = blockID.replace('block-', '');

			dataPrepareBlock(blockID);

			GLOBALunsavedValues['blocks'][blockID]['delete'] = true;
			
			delete GLOBALunsavedValues['blocks'][blockID]['new'];
			delete GLOBALunsavedValues['blocks'][blockID]['position'];
			delete GLOBALunsavedValues['blocks'][blockID]['dimensions'];

			return GLOBALunsavedValues['blocks'][blockID];
			
		}
		
		
		dataAddBlock = function(blockID, type) {
			
			if ( typeof blockID === 'string' && blockID.indexOf('block-') !== -1 )
				var blockID = blockID.replace('block-', '');

			dataPrepareBlock(blockID);

			GLOBALunsavedValues['blocks'][blockID]['new'] = type;

			delete GLOBALunsavedValues['blocks'][blockID]['delete'];		

			return GLOBALunsavedValues['blocks'][blockID];
			
		}


		dataPrepareBlock = function(blockID) {

			if ( typeof GLOBALunsavedValues != 'object' )
				GLOBALunsavedValues = {};

			if ( typeof GLOBALunsavedValues['blocks'] != 'object' )
				GLOBALunsavedValues['blocks'] = {};

			if ( typeof GLOBALunsavedValues['blocks'][blockID] != 'object' )
				GLOBALunsavedValues['blocks'][blockID] = {};

			if ( typeof GLOBALunsavedValues['blocks'][blockID]['settings'] != 'object' )
				GLOBALunsavedValues['blocks'][blockID]['settings'] = {};

			return GLOBALunsavedValues['blocks'][blockID];

		}
	/* END BLOCK HANDLING FUNCTIONS */


	/* WRAPPER DATA */
		dataSetWrapperOption = function(wrapperID, option, value) {

			dataPrepareWrappers();

			if ( typeof GLOBALunsavedValues['wrappers']['wrapper-' + wrapperID.replace('wrapper-', '')] == 'undefined' )
				return false;

			GLOBALunsavedValues['wrappers']['wrapper-' + wrapperID.replace('wrapper-', '')][option] = value;

			allowSaving();

			return GLOBALunsavedValues['wrappers']['wrapper-' + wrapperID.replace('wrapper-', '')];

		}


		dataAddWrapper = function(wrapperID, settings) {

			dataPrepareWrappers();

			GLOBALunsavedValues['wrappers']['wrapper-' + wrapperID] = jQuery.extend({}, {
				'columns': Headway.defaultGridColumnCount,
				'column-width': Headway.globalGridColumnWidth,
				'gutter-width': Headway.globalGridGutterWidth
			}, settings);

			GLOBALunsavedValues['wrappers']['last-id'] = wrapperID;

			return dataSortWrappers();

		}


		dataDeleteWrapper = function(wrapperID) {

			dataPrepareWrappers();

			if ( typeof GLOBALunsavedValues['wrappers']['wrapper-' + wrapperID] != 'undefined' )
				delete GLOBALunsavedValues['wrappers']['wrapper-' + wrapperID];

			return dataSortWrappers();

		}


		dataSetWrapperWidth = function(wrapperID, fixedOrFluid) {

			var isFluid = fixedOrFluid == 'fluid' ? true : false;

			return dataSetWrapperOption(wrapperID, 'fluid', isFluid);

		}


		dataSetWrapperGridWidth = function(wrapperID, fixedOrFluid) {

			var isFluid = fixedOrFluid == 'fluid' ? true : false;

			return dataSetWrapperOption(wrapperID, 'fluid-grid', isFluid);

		}


		dataPrepareWrappers = function() {

			if ( typeof GLOBALunsavedValues != 'object' )
				GLOBALunsavedValues = {};

			if ( typeof GLOBALunsavedValues['wrappers'] == 'undefined' )
				GLOBALunsavedValues['wrappers'] = $i('#whitewrap').data('wrappers');

		}


		dataSortWrappers = function() {

			dataPrepareWrappers();

			/* Preserve wrapper last ID if present */
				if ( typeof GLOBALunsavedValues['wrappers']['last-id'] != 'undefined' )
					var wrapperLastID = GLOBALunsavedValues['wrappers']['last-id'];

			/* Sort the wrappers option appropriate based on the real wrapper order */
				var sortedWrappers = {};

				$i('.wrapper').each(function() {

					var wrapperID = $(this).attr('id');

					sortedWrappers[wrapperID] = GLOBALunsavedValues['wrappers'][wrapperID];

				});

			/* Set the unsaved value to the sorted option */
				GLOBALunsavedValues['wrappers'] = jQuery.extend(true, {}, sortedWrappers);

			/* If wrapper last ID was present then put it back in */
				if ( typeof wrapperLastID != 'undefined' )
					GLOBALunsavedValues['wrappers']['last-id'] = wrapperLastID;

			/* Sync values back to whitewrap data */
				$i('#whitewrap').data('wrappers', GLOBALunsavedValues['wrappers']);

			allowSaving();

			return GLOBALunsavedValues['wrappers'];

		}
	/* END WRAPPER DATA */


	/* DESIGN EDITOR DATA */
		dataHandleDesignEditorInput = function(args) {

			var hiddenInput = $(args.hiddenInput);
			var value = args.value;

			if ( !hiddenInput.length )
				return false;
			
			/* If it's an uncustomized property and the user somehow tabs to the input, DO NOT send the stuff to the DB. */
				if ( hiddenInput.parents('li.uncustomized-property').length == 1 )
					return false;
				
			/* Get all vars */
				var group = hiddenInput.data('element-group');
				var element = hiddenInput.attr('element').toLowerCase();
				var property = hiddenInput.attr('property').toLowerCase();
				var selector = hiddenInput.attr('element_selector') || false;
				var specialElementType = hiddenInput.attr('special_element_type').toLowerCase() || false;
				var specialElementMeta = hiddenInput.attr('special_element_meta').toLowerCase() || false;
			
			/* Set the data for saving */
				dataSetDesignEditorProperty({
					group: group,
					element: element,
					property: property,
					value: value,
					specialElementType: specialElementType,
					specialElementMeta: specialElementMeta
				});

			/* Change null string to null */
				if ( value === 'null' )
					value = null;

			/* Update hidden input value */
				hiddenInput.val(value);

			/* Call developer-defined callback */
				var callback = eval(hiddenInput.attr('callback'));

				args['selector'] = selector;
				args['property'] = property;
				args['element'] = $i(selector);

				callback(args);

			/* Update yellow dots */
				/* Element selector node */	
					$('.design-editor-element-selector-container').find('li#element-' + element)
						.addClass('customized-element')
						.attr('title', 'You have customized a property in this property group.');

					/* Customized parent */
					if ( $('#design-editor-main-elements').find('.ui-state-active').length && $('#design-editor-sub-elements').find('.ui-state-active').length )
						$('#design-editor-main-elements').find('.ui-state-active').addClass('has-customized-children');

				/* Property box */
					hiddenInput.parents('.design-editor-box').first()
						.addClass('design-editor-box-customized');

					hiddenInput.parents('.design-editor-box').first().find('.design-editor-box-title')
						.attr('title', 'You have customized a property in this property group.');

			/* If value is null, then it's an uncustomization. Remove CSS */	
				if ( value == null && selector && property )
					return stylesheet.delete_rule_property(selector, property);

		}

		dataSetDesignEditorProperty = function(args) {

			/* Set up variables */
				var group = args.group.toLowerCase();
				var element = args.element.toLowerCase();
				var property = args.property.toLowerCase();
				var value = args.value;
				var specialElementType = args.specialElementType || false;
				var specialElementMeta = args.specialElementMeta || false;

			/* Queue for saving */
				dataPrepareDesignEditor();

				if ( typeof GLOBALunsavedValues['design-editor'][element] != 'object' )
					GLOBALunsavedValues['design-editor'][element] = {
						group: group
					};

				if ( specialElementType == false || specialElementMeta == false ) {

					if ( typeof GLOBALunsavedValues['design-editor'][element]['properties'] != 'object' )
						GLOBALunsavedValues['design-editor'][element]['properties'] = {};

					GLOBALunsavedValues['design-editor'][element]['properties'][property] = value;

				} else {

					if ( typeof GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType] != 'object' )
						GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType] = {};

					if ( typeof GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType][specialElementMeta] != 'object' )
						GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType][specialElementMeta] = {};

					GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType][specialElementMeta][property] = value;

				}

			/* Allow saving */
				allowSaving();

			return true;

		}

		dataPrepareDesignEditor = function() {

			if ( typeof GLOBALunsavedValues != 'object' )
				GLOBALunsavedValues = {};

			if ( typeof GLOBALunsavedValues['design-editor'] != 'object' )
				GLOBALunsavedValues['design-editor'] = {};

			return GLOBALunsavedValues['design-editor'];

		}
	/* END DESIGN EDITOR DATA */
/* END DATA HANDLING FUNCTIONS */


/* CONTEXT MENU FUNCTIONALITY */
	setupContextMenu = function(args) {

		if ( typeof args != 'object' )
			return false;

		var args = $.extend(true, {}, { 
		   isIframeElement: true
		}, args);

		/* 
			### Argument Example setup### 

			{
				id: 'inspector',
				elements: '.wrapper',
				title: function(event) { //Can be string or function
					return 'Example Wrapper';
				},
				contentsCallback: function(contextMenu, event) { },
				onItemClick: function(contextMenu, originalRightClickEvent) { },
				onBeforeShow: function(event) { },
				onHide: function(contextMenu) { },
				isIframeElement: true
			}
		*/

		/* Unbind any existing of the same context menu */
		deactivateContextMenu(args.id);

		/* Bind the right click on the element(s) */
			var contextMenuOpenEvent = !Headway.touch ? 'contextmenu.contextMenu' + args.id : 'taphold.contextMenu' + args.id;

			/* Get to binding! */
			if ( args.isIframeElement ) {

				$iDocument().on(contextMenuOpenEvent, args.elements, function(event) {
					contextMenuCreator(args, event, true);
				});

			} else {

				$(document).on(contextMenuOpenEvent, args.elements, function(event) {
					contextMenuCreator(args, event, false);
				});

			}

		/* Bind click on anything else to close */
			var clickToClose = function(event) {

				if ( (event.which !== 0 && event.which !== 1) || $(event.originalEvent.target).parents('#context-menu-' + args.id).length )
					return;

				var contextMenu = $('#context-menu-' + args.id);

				if ( typeof args.onHide == 'function' )
					args.onHide.apply(contextMenu);

				contextMenu.remove();

			}

			/* Bind mouseup to close context menu normally and tap for touch support */
				var contextMenuCloseEvent = !Headway.touch ? 'click' : 'touchstart';

				$('body').on(contextMenuCloseEvent + '.contextMenu' + args.id, clickToClose);
				$i('body').on(contextMenuCloseEvent + '.contextMenu' + args.id, clickToClose);
		/* End binding click on anything to close */

	}


		deactivateContextMenu = function(id) {

			$(document).off('.contextMenu' + id);
			$iDocument().off('.contextMenu' + id);

			$('body').off('.contextMenu' + id);
			$i('body').off('.contextMenu' + id);

			return true;

		}


		contextMenuCreator = function(args, event, iframe) {

			event.stopPropagation(); /* Keep other context menus from opening */

			if ( typeof args != 'object' )
				return false;

			/* Hide any other context menus */
				$('.context-menu').remove();

			/* Create context menu */
				var contextMenuTitle = typeof args.title == 'function' ? args.title.apply(undefined, [event]) : args.title;
				var contextMenu = $('<ul id="context-menu-' + args.id + '" class="context-menu"><h3>' + contextMenuTitle + '</h3></ul>');

			/* Trigger onShow callback */
				if ( typeof args.onShow == 'function' )
					args.onShow.apply(contextMenu, [event]);

			/* Fire contentsCallback to insert items */
				args.contentsCallback.apply(contextMenu, [event]);

			/* Bind click of items */
				var originalRightClickEvent = event;

				var contextMenuItemClick = function(event) {

					if ( typeof args.onItemClick == 'function' )
						args.onItemClick.apply(this, [contextMenu, originalRightClickEvent]);

					if ( typeof args.onHide == 'function' )
						args.onHide.apply(contextMenu);

					contextMenu.remove();

				};

				var contextMenuClickEvent = !Headway.touch ? 'click' : 'tap';
				contextMenu.delegate('span:not(.group-title)', contextMenuClickEvent, contextMenuItemClick);

			/* Context menu positioning */
				var contextMenuX = event.originalEvent.pageX + $('#iframe-container').offset().left;
				var contextMenuY = event.originalEvent.pageY + $('#iframe-container').offset().top - $('div#iframe-container').scrollTop();

				contextMenu.css({
					left: contextMenuX,
					top: contextMenuY
				});

			/* Delegate hover event on context menu sub menus for the lovely window right bleeding */
				contextMenu.delegate('li:has(ul) span', 'hover', function() {

					var childMenu = $(this).siblings('ul');
					var childMenuOffset = childMenu.offset();

					if ( !childMenuOffset || ((childMenu.offset().left + childMenu.outerWidth()) < $('iframe.content').width()) )
						return;

					childMenu.css('right', childMenu.css('left'));
					childMenu.css('left', 'auto');			

					childMenu.css('width', '190px');			

					childMenu.css('zIndex', '999999');			

				});

			/* Add context menu to iframe */
				contextMenu.appendTo($('body'));

			/* Context Menu overflow */
				/* X overflow */
					if ( (contextMenuX + contextMenu.outerWidth()) > $(window).width() ) {

						var overflow = $(window).width() - (contextMenuX + contextMenu.outerWidth());
						contextMenu.css('left', contextMenuX + overflow - 20);

					}

				/* Y overflow */
					if ( (contextMenuY + contextMenu.outerHeight()) > $(window).height() ) {

						var overflow = $(window).height() - (contextMenuY + contextMenu.outerHeight());
						contextMenu.css('top', contextMenuY + overflow - 20);

					}
			/* End Context Menu Overflow */

			/* Prevent regular context menu from opening */
				event.preventDefault();
				return false;

		}
/* END CONTEXT MENU FUNCTIONALITY */


/* UNDO/REDO FUNCTIONALITY */
	logHistory = function(args) {

		if ( typeof Headway.history == 'undefined' )
			Headway.history = [];

		/*
		 args = {
		 	description: '',
			action: function(){},
			actionReverse: function(){}
		 }
		*/

		Headway.history.push(args);
		Headway.historyStep = Headway.history.length - 1;

		Headway.history[Headway.historyStep].action.call();

		return true;

	}


	undo = function(event) {

		event.preventDefault();

		if ( typeof Headway.history == 'undefined' || typeof Headway.history[Headway.historyStep] == 'undefined' )
			return false;

		Headway.history[Headway.historyStep].actionReverse.call();

		Headway.historyStep = Headway.historyStep - 1;

		return true;

	}


	redo = function(event) {

		event.preventDefault();

		if ( typeof Headway.history == 'undefined' || typeof Headway.history[Headway.historyStep + 1] == 'undefined' )
			return false;

		Headway.history[Headway.historyStep + 1].action.call();

		Headway.historyStep = Headway.historyStep + 1;

		/* CLEAR HISTORY IF REDOING AFTER AN UNDO */
			if ( Headway.historyStep < Headway.history.length - 1 )
				clearHistory();

		return true;

	}


	clearHistory = function() {

		delete Headway.history;
		delete Headway.historyStep;

		return true;

	}
	/* MAYBE BUILD A HISTORY PANEL */
/* END UNDO/REDO FUNCTIONALITY */


/* MISCELLANEOUS FUNCTIONS */
	/* Reversing jQuery results */
	jQuery.fn.reverse = [].reverse;

	/* Simple rounding function */
	Number.prototype.toNearest = function(num){
		return Math.round(this/num)*num;
	}

	/* Add precision to Math.round */
	Math._round = Math.round;

	Math.round = function(number, precision) {

		precision = Math.abs(parseInt(precision)) || 0;

		var coefficient = Math.pow(10, precision);

		return Math._round(number * coefficient) / coefficient;

	}

	
	
	/* Nifty little function to repeat a string n times */
	String.prototype.repeatStr = function(n) {
		if ( n <= 0 ) {
			return '';
		}

	    return Array.prototype.join.call({length:n+1}, this);
	};
	
	
	/* Function to capitalize every word in string */
	String.prototype.capitalize = function(){
		return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
	}
	
	
	/* Change integer 1 and integer 0 to boolean values */
	Number.prototype.toBool = function(){
	
		if ( this === 1 ) {
			
			return true;
			
		} else if ( this === 0  ) {
			
			return false;
			
		} else {
			
			return null;
			
		}
		
	}
	
	
	/* Change string 1, 0, true, and false to boolean values */
	String.prototype.toBool = function(){
		
		/* I'm still confused about this, but this changes the weird object of letters into an array of words */
		var string = this.split(/\b/g);
		
		if ( string[0] === '1' || string[0] === 'true' ) {
			
			return true;
			
		} else if ( string[0] === '0' || string[0] === 'false' ) {
			
			return false;
			
		} else {
			
			return null;
			
		}
		
	}

	/* Escape HTMl */
	String.prototype.escapeHTML = function() {

		return this
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');

	}

	/* Custom Mouse Widget for drag handling on any element */
		$.widget('ui.custommouse', $.ui.mouse, {
			options: {
				mouseStart: function(e) {},
				mouseDrag: function(e) {},
				mouseStop: function(e) {},
				mouseCapture: function(e) { return true; }
			},
			// Forward events to custom handlers
			_mouseStart: function(e) { return this.options.mouseStart(e); },
			_mouseDrag: function(e) { return this.options.mouseDrag(e); },
			_mouseStop: function(e) { return this.options.mouseStop(e); },
			_mouseCapture: function(e) { return this.options.mouseCapture(e); },

			// Bookkeeping, inspired by Draggable
			widgetEventPrefix: 'custommouse',

			_init: function() {
				return this._mouseInit();
			},

			_create: function() {
				return this.element.addClass('ui-custommouse');
			},

			_destroy: function() {
				this._mouseDestroy();
				return this.element.removeClass('ui-custommouse');
			}
		});
/* END MISCELLANEOUS FUNCTIONS */
})(jQuery);