(function($) {

visualEditorModeDesign = function() {


	$('#toggle-inspector').bind('click', toggleInspector);
	
	
	this.init = function() {
		
		designEditor = new designEditorTabEditor();
		defaultsTabInstance = new designEditorTabDefaults();
		
		designEditorBindPropertyInputs();

		/* Load scripts */
			/* Load editor.fonts.js */
				$.getScript(Headway.headwayURL + '/library/visual-editor/js/editor.fonts.js');

			/* Load Google API */
				$.getScript('//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js');

			/* Load Codemirror */
				$.getScript(Headway.headwayURL + '/library/media/js/codemirror/codemirror.js', function() {
					$.getScript(Headway.headwayURL + '/library/media/js/codemirror/languages/css.js');
				});

		/* Set iframe height to refresh periodically */
		setInterval(updateIframeHeight, 5000);

	}
	
	
	this.iframeCallback = function() {
		
		bindBlockDimensionsTooltip();
		addInspector();

		/* Reset editor for layout switch */
		designEditor.switchLayout();
		
	}

	
}


/* DESIGN EDITOR ELEMENT LOADING */
	designEditorRequestElements = function(forceReload) {

		if ( Headway.elementsRequest && (!forceReload || typeof forceReload == 'undefined') )
			return Headway.elementsRequest;

		/* Get the elements and set up bindings */
		Headway.elementsRequest = $.post(Headway.ajaxURL, {
			security: Headway.security,
			action: 'headway_visual_editor',
			method: 'get_design_editor_elements',
			layout: Headway.currentLayout
		}, function(elements) {

			Headway.elements = elements;

		}, 'json');

		return Headway.elementsRequest;

	}
/* END DESIGN EDITOR ELEMENT LOADING */


/* DESIGN EDITOR TABS */
	designEditorTabEditor = function() {
	
		this.context = 'div#editor-tab';
	
		this._init = function() {

			createCog($('#design-editor-main-elements'));

			$.when(designEditorRequestElements()).then($.proxy(this.setupElementSelector, this));
		
			this.setupBoxes();
			this.bindDesignEditorInfo();
		
		}
	
		this.setupBoxes = function() {
								
			designEditorBindPropertyBoxToggle(this.context);
		
		}
	
		this.setupElementSelector = function() {

			/* Load in elements */
				$('#design-editor-main-elements').empty();
				$('#design-editor-sub-elements').empty();
				$('#design-editor-default-elements').empty();

				$.each(Headway.elements, function(groupID, mainElements) {

					if ( groupID == 'default-elements' )
						return;

					var groupName = mainElements[Object.keys(mainElements)[0]].groupName;
					var groupNode = $('<li id="element-group-' + groupID + '" class="element-group">\
							<span>' + groupName + '</span>\
						</li>').appendTo('#design-editor-main-elements');

					$.each(mainElements, function(mainElementID, mainElementSettings) {

						var elementDescription = mainElementSettings['description'] ? '<small class="description">' + mainElementSettings['description'] + '</small>' : '';

						var mainElementNode = $('<li id="element-' + mainElementID + '" class="main-element">\
							<span>' + mainElementSettings['name'] + '</span>\
							' + elementDescription + '\
						</li>')
						.data({group: groupID})
						.appendTo('#design-editor-main-elements');

						if ( mainElementSettings['indent-in-selector'] )
							mainElementNode.find('span').prepend('<small class="indent">&ndash;</small>');

						/* Customized flag */
						if ( mainElementSettings['customized'] ) {
							mainElementNode.addClass('customized-element');
							mainElementNode.attr('title', 'You have customized this element.');
						}

						$.each(mainElementSettings['children'], function(childElementID, childElementSettings) {

							mainElementNode.addClass('has-children');

							var elementDescription = childElementSettings['description'] ? '<small class="description">' + childElementSettings['description'] + '</small>' : '';
							
							var subElementNode = $('<li id="element-' + childElementID + '" class="sub-element parent-element-' + mainElementID + '">\
								<span>' + childElementSettings['name'] + '</span>\
								' + elementDescription + '\
							</li>')
							.data({
								group: groupID,
								parent: mainElementID
							})
							.appendTo('#design-editor-sub-elements');

							if ( childElementSettings['indent-in-selector'] )
								subElementNode.find('span').prepend('<small class="indent">&ndash;</small>');

							/* Customized flag */
							if ( childElementSettings['customized'] ) {
								mainElementNode.addClass('has-customized-children');
								subElementNode.addClass('customized-element');
								subElementNode.attr('title', 'You have customized this element.');
							}

						});

					});

				});
			/* End loading in elements */

				
			/* Setup properties box */
				$('div.design-editor-options', this.context).masonry({
					itemSelector:'div.design-editor-box',
					columnWidth: 245,
					gutter: 10,
					isInitLayout: false,
					transitionDuration: 0
				});

				$('div.design-editor-options-container', this.context).scrollbarPaper();
			/* End properties boxes */

			/* Bind the element clicks */
				$('div#editor-tab').delegate('.design-editor-element-selector-container li span', 'click', function(event, args) {
					
					var link = $(this).parent();
					var loadInputs = (typeof args == 'object' && typeof args.loadInputs != 'undefined' && !args.loadInputs) ? false : true;

					if ( link.hasClass('element-group') )
						return;

					designEditor.processElementClick(link, loadInputs);				

					link.siblings('.ui-state-active').removeClass('ui-state-active');
					link.addClass('ui-state-active');

				});
			/* End binding */

			/* Add scrollbars to groups, main elements, and sub elements */
			$('ul.element-selector', this.context).scrollbarPaper();
		
		}

		this.processElementClick = function(link, loadInputs) {

			/* Set up variables */
			var elementType = link.hasClass('main-element') ? 'main' : 'sub';
			var elementName = getElementNodeName(link); /* Element Name */
			var element = link.attr('id').replace(/^element\-/ig, '');

			/* Remove selected element class from any element to insure that retrieving the selected element doesn't come up with something wrong */
			$('ul.element-selector li', designEditor.context).removeClass('ui-state-active');

			/* If it is a main element has children, display them.  Otherwise hide them */
			if ( link.hasClass('has-children') && elementType == 'main' ) {

				/* If we're selecting a new main element, display the new sub elements */
				if ( $('ul#design-editor-sub-elements', designEditor.context).data('main_element') !== element ) {

					/* Hide all sub elements except for those that are sub elements of the main element */
					$('ul#design-editor-sub-elements li', designEditor.context).hide();
					$('ul#design-editor-sub-elements li.parent-element-' + element, designEditor.context).show();

					$('ul#design-editor-sub-elements', designEditor.context)
						.show()
						.data('main_element', element)
						.scrollbarPaper();

				}

			/* There are no children, hide them. */
			} else if ( elementType == 'main' ) {

				/* Hide sub elements panel and scrollbar */
				$('ul#design-editor-sub-elements', this.context).hide().data('main_element', false);
				$('div#scrollbarpaper-design-editor-sub-elements', this.context).hide();

			/* If sub element is selected then make sure the parent is correctly selected */
			} else if ( elementType == 'sub' ) {

				var mainElement = $('ul#design-editor-sub-elements', designEditor.context).data('main_element');
					
				$('ul#design-editor-main-elements li#element-' + mainElement).addClass('ui-state-active');

			}

			/* Reset regular element/element for layout buttons */
				$('div.design-editor-info span.customize-for-regular-element', designEditor.context).hide();
				$('div.design-editor-info span.customize-element-for-layout', designEditor.context).show();

			/* LOAD INPUTS */
				if ( typeof loadInputs == 'undefined' || loadInputs ) {

					this.loadElementInstances(element);
					this.loadElementStates(element);
					this.getElementInheritLocation(element);

					designEditorShowCog(this.context);

					$.when(
						this.loadElementInputs(element)
					).then(function() {
						designEditorShowContent(this.context);
					});

				}
			/* END LOAD INPUTS */

		}

			this.loadElementInputs = function(element) {

				return $.post(Headway.ajaxURL, {
					security: Headway.security,
					action: 'headway_visual_editor',
					method: 'get_element_inputs',
					unsavedValues: designEditorGetUnsavedValues(element),
					element: designEditorGetElementObject(element)
				}).success(function(inputs) {
				
					var options = $('div.design-editor-options', designEditor.context);

					options.html(inputs);

					var selector = $(options.find('input[element]').get(0)).attr('element_selector');

					inspectorSelectElement(selector);

					/* Add the selector to the info bar */
					setElementInfoSelector(selector);

					/* If there are 4 or less property groups, then open them */
					if ( $('div.design-editor-options .design-editor-box', designEditor.context).length <= 4 )
						$('div.design-editor-options .design-editor-box', designEditor.context).removeClass('design-editor-box-minimized');
												
					/* Set the flags */
					$('div.design-editor-options', designEditor.context).data({
						'element': element, 
						'specialElementType': false, 
						'specialElementMeta': false
					});

					/* Load web fonts */
					$('div.design-editor-options', designEditor.context).find('.property-font-family-select').each(function() {
						webFontQuickLoad($(this).find('span.font-name').data('webfont-value'));
					});

					/* Focus the iframe to allow immediate nudging control */
					Headway.iframe.focus();

				});

			}

			this.loadElementInstances = function(element) {

				/* Element selector node */
				var elementSelectorNode = $('li#element-' + element);

				var instances = designEditorGetElementObject(element, false).instances;

				if ( !instances || !Object.keys(instances).length ) {

					$('div.design-editor-info .instances', designEditor.context).hide();

				} else {

					$('div.design-editor-info .instances', designEditor.context).show();

					var instancesStr = '';

					$.each(instances, function(id, instance) {

						/* Build instance name for select */
							var instanceName = instance.name;

							if ( typeof instance['layout-name'] != 'undefined' && instance['layout-name'] )
								instanceName = instanceName + ' &ndash; ' + instance['layout-name'];

							if ( typeof instance['state-of'] != 'undefined' && instance['state-of'] )
								instanceName = '  -- ' + instance['state-name'];

							if ( typeof instance['state-of'] != 'undefined' && instance['state-of'] )
								instanceName = '  -- ' + instance['state-name'];

							/* Customized flag */
							if ( typeof instance['customized'] != 'undefined' && instance['customized'] )
								instanceName = instanceName + ' (Customized)';

						/* Output option to select */
						instancesStr += '<option value="' + id + '" data-instance-name="' + instance.name + '">' + instanceName + '</option>';

					});

					var instanceOptions = '<option value="">&mdash; Instances &mdash;</option>' + instancesStr;
					$('div.design-editor-info select.instances', designEditor.context).html(instanceOptions);

				}

				return true;

			}

			this.loadElementStates = function(element, instance) {

				/* Element selector node */
				var elementSelectorNode = $('li#element-' + element);

				var states = designEditorGetElementObject(element).states;

				if ( !states || !Object.keys(states).length ) {

					$('div.design-editor-info .states', designEditor.context).hide();

				} else {

					$('div.design-editor-info .states', designEditor.context).show();

					var statesStr = '';

					$.each(states, function(stateID, stateInfo){
						statesStr += '<option value="' + stateID + '">' + stateInfo.name + '</option>';
					});

					var blankOptionName = 'States';

					var statesOptions = '<option value="">&mdash; ' + blankOptionName + ' &mdash;</option>' + statesStr;
					$('div.design-editor-info select.states', designEditor.context).html(statesOptions);

				}

				return true;

			}

			this.getElementInheritLocation = function(element) {

				/* Element selector node */
				var elementSelectorNode = $('li#element-' + element);

				/* Add element name to info box */		
				setSelectedElementName(getElementNodeName(elementSelectorNode));			
			
				/* Reset layout element button */
				$('span.customize-element-for-layout').text('Customize For Current Layout');
			
				/* Show and fill inherit location if it exists and hide it if not */
				var inheritLocation = elementSelectorNode.data('inherit-location');

				if ( typeof inheritLocation != 'undefined' && inheritLocation.length ) {

					$('div.design-editor-info h4 strong', designEditor.context)
						.text('(Inheriting From ' + sanitizeElementName(inheritLocation) + ')')
						.show();
				
				} else {
				
					$('div.design-editor-info h4 strong', designEditor.context).hide();
				
				}

			}
	
		this.bindDesignEditorInfo = function() {
				
			/* Customize for layout button */
			$('span.customize-element-for-layout', this.context).bind('click', this.customizeForCurrentLayout);
		
			/* Customize for regular element button */
			$('span.customize-for-regular-element', this.context).bind('click', this.customizeRegularElement);
		
			/* Instances select */
			$('select.instances', this.context).bind('change', this.selectInstance);
		
			/* States select */
			$('select.states', this.context).bind('change', this.selectState);
		
		}

			this.customizeForCurrentLayout = function(event) {

				var options = $('div.design-editor-options', designEditor.context);
				
				var currentElement = designEditor.getCurrentElement();
				var currentElementID = currentElement.attr('id').replace(/^element\-/ig, '');
				var currentElementName = getElementNodeName(currentElement); /* Element Name */
								
				/* Hide everything and show the cog */
				designEditorShowCog(designEditor.context);
				
				/* Change which element is being edited and the inheritance */
				setSelectedElementName(currentElementName, '<em> on ' + Headway.currentLayoutName + ' Layout</em>');
				$('div.design-editor-info h4 strong', designEditor.context)
					.html('(Inheriting From ' + sanitizeElementName(currentElementName) + ')')
					.show();
				
				/* Hide current button, states, instances, and show the button to return to the regular element */
				$(this).hide();
				
				$('div.design-editor-info .instances', designEditor.context).hide();
				$('div.design-editor-info .states', designEditor.context).hide();
				
				$('div.design-editor-info span.customize-for-regular-element', designEditor.context).show();
				
				/* Get the properties */
				$.post(Headway.ajaxURL, {
					security: Headway.security,
					action: 'headway_visual_editor',
					method: 'get_element_inputs',
					specialElementType: 'layout',
					specialElementMeta: Headway.currentLayout,
					unsavedValues: designEditorGetUnsavedValues(currentElementID, 'layout', Headway.currentLayout),
					element: designEditorGetElementObject(currentElementID)
				}).success(function(inputs) {

					$('div.design-editor-options', designEditor.context).html(inputs);

					/* Update visible selector */
					var selector = options.find('input[element]').first().attr('element_selector');
					setElementInfoSelector(selector);

					/* Load web fonts */
					$('div.design-editor-options', designEditor.context).find('.property-font-family-select').each(function() {
						webFontQuickLoad($(this).find('span.font-name').data('webfont-value'));
					});

					designEditorShowContent(designEditor.context);

				});
				
				/* Set the flags */
				$('div.design-editor-options', designEditor.context).data({'element': currentElementID, 'specialElementType': 'layout', 'specialElementMeta': Headway.currentLayout});

			}

			this.customizeRegularElement = function(event) {

				var currentElement = designEditor.getCurrentElement();
				var currentElementID = currentElement.attr('id').replace(/^element\-/ig, '');
				var currentElementName = getElementNodeName(currentElement); /* Element Name */
								
				currentElement.find('span').trigger('click');
				
				/* Hide the current button and bring back the layout-specific element button */
				$('div.design-editor-info span.customize-for-regular-element', designEditor.context).hide();
				$('div.design-editor-info span.customize-element-for-layout', designEditor.context).show();

			}

			this.selectInstance = function(instanceID) {

				var options = $('div.design-editor-options', designEditor.context);
				
				var currentElement = designEditor.getCurrentElement();
				var currentElementID = currentElement.attr('id').replace(/^element\-/ig, '');
				var currentElementName = getElementNodeName(currentElement);

				if ( typeof instanceID != 'string' )
					var instanceID = $(this).val();

				if ( !instanceID ) {
					return designEditor.customizeRegularElement();
				}
				
				/* Hide everything and show the cog */
				designEditorShowCog(designEditor.context);
				
				/* Hide layout-specific button, and show the button to return to the regular element */		
				$('div.design-editor-info .states', designEditor.context).hide();
				$('div.design-editor-info span.customize-element-for-layout', designEditor.context).hide();
				$('div.design-editor-info span.customize-for-regular-element', designEditor.context).show();
				
				/* Load instances */
				designEditor.loadElementInstances(currentElementID);

				/* Get the properties */
				$.post(Headway.ajaxURL, {
					security: Headway.security,
					action: 'headway_visual_editor',
					method: 'get_element_inputs',
					specialElementType: 'instance',
					specialElementMeta: instanceID,
					unsavedValues: designEditorGetUnsavedValues(currentElementID, 'instance', instanceID),
					element: designEditorGetElementObject(currentElementID, true, instanceID)
				}).success(function(inputs) {

					$('div.design-editor-options', designEditor.context).html(inputs);

					/* Highlight the selected instance */
					var selector = $(options.find('input[element]').get(0)).attr('element_selector');

					inspectorSelectElement(selector);

					/* Add the selector to the info bar */
					setElementInfoSelector(selector);

					/* If there are 4 or less property groups, then open them */
					if ( $('div.design-editor-options .design-editor-box', designEditor.context).length <= 4 )
						$('div.design-editor-options .design-editor-box', designEditor.context).removeClass('design-editor-box-minimized');

					/* Change the important select value */
					$('select.instances').val(instanceID);

					/* Change which element is being edited and the inheritance */
					var instanceName = $('select.instances', designEditor.context).find(':selected').data('instance-name');

					setSelectedElementName(instanceName);
					$('div.design-editor-info h4 strong', designEditor.context)
						.html('(Inheriting From ' + sanitizeElementName(currentElementName) + ')')
						.show();

					/* Load web fonts */
					$('div.design-editor-options', designEditor.context).find('.property-font-family-select').each(function() {
						webFontQuickLoad($(this).find('span.font-name').data('webfont-value'));
					});

					designEditorShowContent(designEditor.context);

					/* Set the flags */
					$('div.design-editor-options', designEditor.context).data({
						'element': currentElementID, 
						'specialElementType': 'instance', 
						'specialElementMeta': instanceID, 
						'instanceName': instanceName
					});

				});

			}

			this.selectState = function(stateID) {

				var options = $('div.design-editor-options', designEditor.context);
				
				var currentElement = designEditor.getCurrentElement();
				var currentElementID = currentElement.attr('id').replace(/^element\-/ig, '');
				var currentElementName = getElementNodeName(currentElement); /* Element Name */
				
				if ( typeof stateID != 'string' )
					var stateID = $(this).val();
				
				if ( !stateID )
					return false;

				/* Hide everything and show the cog */
				designEditorShowCog(designEditor.context);

				/* Hide instances, layout-specific button, and show the button to return to the regular element */	
				$('div.design-editor-info .instances', designEditor.context).hide();
				$('div.design-editor-info span.customize-element-for-layout', designEditor.context).hide();
				$('div.design-editor-info span.customize-for-regular-element', designEditor.context).show();

				/* Load states */
				designEditor.loadElementStates(currentElementID);
								
				/* Get the properties */
				$.post(Headway.ajaxURL, {
					security: Headway.security,
					action: 'headway_visual_editor',
					method: 'get_element_inputs',
					specialElementType: 'state',
					specialElementMeta: stateID,
					unsavedValues: designEditorGetUnsavedValues(currentElementID, 'state', stateID),
					element: designEditorGetElementObject(currentElementID)
				}).success(function(inputs) {

					$('div.design-editor-options', designEditor.context).html(inputs);

					/* Highlight the selected state as long as it's not a pseudo-selector */
					var selector = $(options.find('input[element]').get(0)).attr('element_selector');
					inspectorSelectElement(selector);

					/* Add the selector to the info bar */
					setElementInfoSelector(selector);

					/* If there are 4 or less property groups, then open them */
					if ( $('div.design-editor-options .design-editor-box', designEditor.context).length <= 4 )
						$('div.design-editor-options .design-editor-box', designEditor.context).removeClass('design-editor-box-minimized');

					/* Change the important select value */
					$('select.states').val(stateID);

					/* Change which element is being edited and the inheritance */
					var stateName = $('select.states', designEditor.context).find(':selected').text();

					setSelectedElementName(currentElementName, ' &ndash; ' + stateName);
					$('div.design-editor-info h4 strong', designEditor.context)
						.html('(Inheriting From ' + sanitizeElementName(currentElementName) + ')')
						.show();

					/* Set the flags */
					$('div.design-editor-options', designEditor.context).data({
						'element': currentElementID, 
						'specialElementType': 'state', 
						'specialElementMeta': stateID
					});

					/* Load web fonts */
					$('div.design-editor-options', designEditor.context).find('.property-font-family-select').each(function() {
						webFontQuickLoad($(this).find('span.font-name').data('webfont-value'));
					});

					designEditorShowContent(designEditor.context);

				});


			}
	
		this.getCurrentElement = function() {
		
			/* Check against sub elements then main elements. */
			if ( $('ul#design-editor-sub-elements li.ui-state-active', this.context).length === 1 ) {
			
				return $('ul#design-editor-sub-elements li.ui-state-active', this.context);
			
			} else if ( $('ul#design-editor-main-elements li.ui-state-active', this.context).length === 1 ) {
			
				return $('ul#design-editor-main-elements li.ui-state-active', this.context);
			
			} else {
			
				return null;
			
			}
		
		}
	
		this.switchLayout = function() {

			/* Make sure this doesn't fire on initial load */
			if ( typeof Headway.switchedToLayout == 'undefined' || !Headway.switchedToLayout )
				return;

			$.when(designEditorRequestElements(true)).then(function() {
				designEditor.setupElementSelector.apply(this);
				defaultsTabInstance.setupElementSelector.apply(this);

				$('div.design-editor-options-instructions').show();
				$('div.design-editor-options').hide();
				$('ul#design-editor-sub-elements').hide();
				$('div.design-editor-info').hide();
			});
		
		}
	
		this._init();
	
	}

	designEditorTabDefaults = function() {
	
		this.context = 'div#defaults-tab';
	
		this._init = function() {
		
			this.setupBoxes();
			$.when(designEditorRequestElements()).then($.proxy(this.setupElementSelector, this));
		
		}
	
		this.setupBoxes = function() {
								
			designEditorBindPropertyBoxToggle(this.context);
		
		}
	
		this.setupElementSelector = function() {
		
			var self = this;

			/* Put in default elements */
				$.each(Headway.elements, function(groupID, defaultElements) {

					if ( groupID != 'default-elements' )
						return;

					$.each(defaultElements, function(defaultElementID, defaultElementSettings) {

						var defaultElementNode = $('<li id="element-' + defaultElementID + '" class="default-element">\
							<span>' + defaultElementSettings['name'] + '</span>\
						</li>')
						.data({group: groupID})
						.appendTo('#design-editor-default-elements');

						/* Customized flag */
						if ( defaultElementSettings['customized'] ) {
							defaultElementNode.addClass('customized-element');
							defaultElementNode.attr('title', 'You have customized this element.');
						}

					});

				});
			/* End putting in default elements */
		
			/* Setup properties box */
			$('div.design-editor-options', this.context).masonry({
				itemSelector:'div.design-editor-box',
				columnWidth: 245,
				gutter: 10,
				isInitLayout: false,
				transitionDuration: 0
			});

			$('div.design-editor-options-container', this.context).scrollbarPaper();
			/* End properties */

			/* Bind the element clicks */
			$('div#defaults-tab').delegate('.design-editor-element-selector-container li span', 'click', function(event) {

				var link = $(this).parent();

				self.processDefaultElementClick(link);				

				link.siblings('.ui-state-active').removeClass('ui-state-active');
				link.addClass('ui-state-active');

			});
			/* End binding */

			/* Add scrollbars to groups, main elements, and sub elements */
			$('ul.element-selector', this.context).scrollbarPaper();
		
		}
	
		this.processDefaultElementClick = function(link) {
		
			var self = this;

			/* Set up variables */
			var elementType = link.hasClass('main-element') ? 'main' : 'sub';
			var elementName = getElementNodeName(link); /* Element Name */
			var element = link.attr('id').replace(/^element\-/ig, '');

			/* LOAD INPUTS, INSTANCES, AND STATES */
				designEditorShowCog(this.context);

				$.when(

					/* Inputs */
					$.post(Headway.ajaxURL, {
						security: Headway.security,
						action: 'headway_visual_editor',
						method: 'get_element_inputs',
						unsavedValues: designEditorGetUnsavedValues(element, 'default'),
						element: designEditorGetElementObject(element)
					}).success(function(inputs) {

						$('div.design-editor-options', self.context).html(inputs);

						/* If there are 4 or less property groups, then open them */
						if ( $('div.design-editor-options .design-editor-box', self.context).length <= 4 )
							$('div.design-editor-options .design-editor-box', self.context).removeClass('design-editor-box-minimized');

						/* Load web fonts */
						$('div.design-editor-options .design-editor-box', self.context).find('.property-font-family-select').each(function() {
							webFontQuickLoad($(this).find('span.font-name').data('webfont-value'));
						});

					})
				
				/* Everything is done, we can hide cog and show options now */
				).then(function() {

					/* Add element name to info box */		
					setSelectedElementName(elementName, null, self.context);			

					/* Show everything and hide cog */
					designEditorShowContent(self.context);

				});			
			/* END LOAD INPUTS */

		}
	
		this._init();
	
	}
/* END DESIGN EDITOR TABS */


/* CONTENT TOGGLING */
	designEditorShowCog = function(context) {
					
		$('div.design-editor-options-instructions', context).hide();
		$('div.design-editor-options', context).hide();
		$('div.design-editor-info', context).hide();
		
		createCog($('div.design-editor-options-container', context), true, true);
		
	}

	designEditorShowContent = function(context) {
		
		refreshInfoButtons = typeof refreshInfoButtons == 'undefined' ? false : true;
	
		/* Show info/options and hide cog/instructions */
		$('div.design-editor-info', context).show();
		$('div.design-editor-options', context).show();
	
		$('div.design-editor-options-instructions', context).hide();
		$('div.design-editor-options-container', context).find('.cog-container').remove();

		/* Run Masonry after everything is visible */
		$('div.design-editor-options', context).masonry('reloadItems');
		$('div.design-editor-options', context).masonry('layout');
		
		/* Refresh Tooltips */
		setupTooltips();
	
	}

	designEditorShowInstructions = function(context) {
	
		$('div.design-editor-options-container div.cog-container', context).remove();
		$('div.design-editor-options', context).hide();
		$('div.design-editor-info', context).hide();

		$('div.design-editor-options-instructions', context).show();
	
	}
/* END CONTENT TOGGLING */


/* DESIGN EDITOR OPTIONS/INPUTS */
	designEditorGetElementObject = function(element, excludeInstances, instanceToKeep) {

		var elementNode = $('ul.element-selector').find('#element-' + element);
		var elementGroup = elementNode.data('group');
		var elementParent = elementNode.data('parent');

		if ( typeof excludeInstances == 'undefined' )
			var excludeInstances = true;

		if ( elementParent ) {

			var element = jQuery.extend(true, {}, Headway.elements[elementGroup][elementParent]['children'][element]);

		} else {

			var element = jQuery.extend(true, {}, Headway.elements[elementGroup][element]);

		}

		/* Delete children since it can be huge */
		delete element.children;

		/* Delete instances if set to do so */
		if ( excludeInstances ) {

			if ( typeof instanceToKeep != 'undefined' && instanceToKeep ) {

				$.each(element.instances, function(instanceID, instanceOptions) {

					if ( instanceID != instanceToKeep )
						delete element.instances[instanceID];

				});

			} else {

				delete element.instances;

			}

		}
		
		return element;

	}

	designEditorGetUnsavedValues = function(element, specialElementType, specialElementMeta) {
		
		if ( typeof specialElementType == 'undefined' )
			var specialElementType = false;
		
		if ( typeof specialElementMeta == 'undefined' )
			var specialElementMeta = false;

		if ( 
			typeof GLOBALunsavedValues == 'undefined' ||
			typeof GLOBALunsavedValues['design-editor'] == 'undefined' || 
			typeof GLOBALunsavedValues['design-editor'][element] == 'undefined'
		)
			return null;
		
		if ( !specialElementType || !specialElementMeta ) {

			if ( typeof GLOBALunsavedValues['design-editor'][element]['properties'] == 'undefined' )
				return null;

			var properties = GLOBALunsavedValues['design-editor'][element]['properties'];

		} else {

			if ( typeof GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType] == 'undefined' )
				return null;

			if ( typeof GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType][specialElementMeta] == 'undefined' )
				return null;

			var properties = GLOBALunsavedValues['design-editor'][element]['special-element-' + specialElementType][specialElementMeta];

		}
		
		return Object.keys(properties).length > 0 ? properties : null;
		
	}

	designEditorBindPropertyBoxToggle = function(context) {
		
		$('div.design-editor-options', context).delegate('span.design-editor-box-toggle, span.design-editor-box-title', 'click', function(){

			var box = $(this).parents('div.design-editor-box');

			box.toggleClass('design-editor-box-minimized');

			$('div.design-editor-options', context).masonry('reloadItems');
			$('div.design-editor-options', context).masonry('layout');

		});

	}

	designEditorBindPropertyInputs = function() {

		/* Customize Buttons */
		$('div#panel').delegate('div.customize-property', 'click', function() {

			var property = $(this).parents('li').first();

			if ( property.parents('.design-editor-box').hasClass('locked') )
			    var property = $(this).parents('.design-editor-box-content').find('> li.lockable');

			property.each(function() {

				$(this).find('.customize-property').fadeOut(150);
		    	$(this).removeClass('uncustomized-property');
		    	$(this).removeClass('uncustomized-property-by-user');
		    	$(this).addClass('customized-property-by-user');
		    	$(this).attr('title', 'You have customized this property.');

		    	var hidden = $(this).find('input.property-hidden-input');

		    	/* When clicking on Customize on a property that uses a select, sometimes the first option in the select is what you want.  
		    	This will fill the hidden input with it */
		    	var siblingInput = hidden.parent().find('select, input:not(.property-hidden-input)').first();

		    	if ( !hidden.val() && siblingInput.length )
		    		hidden.val(siblingInput.val());

		    	dataHandleDesignEditorInput({hiddenInput: hidden, value: hidden.val()});

		    });
						
		});
		
		/* Uncustomize Button */
		$('div#panel').delegate('span.uncustomize-property', 'click', function() {
			
			if ( !confirm('Are you sure you wish to uncustomize this property?  The value will be reset.') )
				return false;

			var property = $(this).parents('li').first();

			if ( property.parents('.design-editor-box').hasClass('locked') )
			    var property = $(this).parents('.design-editor-box-content').find('> li.lockable');

			property.each(function() {

				var hidden = $(this).find('input.property-hidden-input');

		    	$(this).find('div.customize-property').fadeIn(150);
		
				dataHandleDesignEditorInput({hiddenInput: hidden, value: null});

				$(this).addClass('uncustomized-property', 150);
				$(this).addClass('uncustomized-property-by-user', 150);
				$(this).removeClass('customized-property-by-user');
				$(this).attr('title', 'You have set this property to inherit.');
				
		    });
										
		});

		/* Fonts */
		$('div#panel').delegate('.design-editor-property-font-family span.open-font-browser', 'click', function() {
			/* Using anonymous function because fontBrowserOpen won't be defined yet since it's loaded via $.getScript() */
			if ( typeof fontBrowserOpen == 'function' )
				fontBrowserOpen.apply(this);
		});

		/* Live CSS Open */
		$('div#panel').delegate('div.design-editor-info code', 'click', function() {

			var liveCSSValue = ( typeof liveCSSEditor == 'undefined' || !liveCSSEditor ) ? $('textarea#live-css').val() : liveCSSEditor.getValue();

			var linesBefore = liveCSSValue ? "\n\n" : '';
			$('textarea#live-css').val(liveCSSValue + linesBefore + $(this).data('selector') + " {\n\n}");

			/* Open Live CSS Editor */
			$('#tools-live-css').trigger('click');

			/* Move the cursor to the new selector */
			if ( Headway.disableCodeMirror != true ) {

				liveCSSEditor.setValue($('textarea#live-css').val());

				var lastLine = liveCSSEditor.lineCount() - 1;
				liveCSSEditor.setCursor(lastLine - 1);
				liveCSSEditor.focus();

			}
			
		});

		/* Lock Sides */
		$('div#panel').delegate('span.design-editor-lock-sides', 'click', function() {

		    if ( $(this).hasClass('locked') ) {

		        $(this)
		    		.attr('data-locked', false)
		    		.removeClass('locked')
		    		.attr('title', 'Unlock sides')
		    		.parent().removeClass('locked');

		    } else {

		        $(this)
		    		.attr('data-locked', true)
		    		.addClass('locked')
		    		.attr('title', 'Lock sides')
		    		.parent().addClass('locked');

		    }

		});

		$('div#panel').delegate('.design-editor-box.locked ul li .property input', 'keyup blur', function() {

		    if ( $(this).parents('.design-editor-box').hasClass('locked') ) {

		    	$(this).parents('.design-editor-box').find('.lockable')
		    		.removeClass('uncustomized-property');

			    $(this).parents('.design-editor-box').find('.lockable .property input:not([type="hidden"])')
			    	.not($(this))
			    	.val($(this).val())
			    	.trigger('change');

			}

		});
		
		/* Select */
		$('div#panel').delegate('div.property-select select', 'change', designEditorInputSelect);
		
		/* Integer */
		$('div#panel').delegate('div.property-integer input', 'focus', designEditorInputIntegerFocus);
		
		$('div#panel').delegate('div.property-integer input', 'keyup blur change', designEditorInputIntegerChange);
				
		/* Image Uploaders */
		$('div#panel').delegate('div.property-image span.button', 'click', designEditorInputImageUpload);

		$('div#panel').delegate('div.property-image span.delete-image', 'click', designEditorInputImageUploadDelete);

		/* Color Inputs */
		$('div#panel').delegate('div.property-color div.colorpicker-box', 'click', designEditorInputColor);

	}
/* END DESIGN EDITOR INPUTS */


/* INPUT FUNCTIONALITY */
	/* Select */
	designEditorInputSelect = function(event) {
		
		var hidden = $(this).parent().siblings('input.property-hidden-input');
		
		dataHandleDesignEditorInput({hiddenInput: hidden, value: $(this).val()});
		
	}


	/* Integer */
	designEditorInputIntegerFocus = function(event) {

		if ( typeof originalValues !== 'undefined' ) {
			delete originalValues;
		}
		
		originalValues = new Object;
		
		var hidden = $(this).siblings('input.property-hidden-input');
		var id = hidden.attr('selector') + '-' + hidden.attr('property');
		
		originalValues[id] = $(this).val();
		
	}
	
	designEditorInputIntegerChange = function(event) {

		var hidden = $(this).siblings('input.property-hidden-input');
		var value = $(this).val();

		if ( event.type == 'keyup' && value == '-' )
			return;
		
		/* Validate the value and make sure it's a number */
		if ( isNaN(value) ) {
			
			/* Take the nasties out to make sure it's a number */
			value = value.replace(/[^0-9]*/ig, '');
			
			/* If the value is an empty string, then revert back to the original value */
			if ( value === '' ) {
				
				var id = hidden.attr('selector') + '-' + hidden.attr('property');
				var value = originalValues[id];
										
			}
			
			/* Set the value of the input to the sanitized value */
			$(this).val(value);
			
		}
		
		/* Remove leading zeroes */
		if ( value.length > 1 && value[0] == 0 ) {
			
			value = value.replace(/^[0]+/g, '');
			
			/* Set the value of the input to the sanitized value */
			$(this).val(value);
			
		}

		dataHandleDesignEditorInput({hiddenInput: hidden, value: $(this).val()});
		
	}

	/* Image Uploaders */
	designEditorInputImageUpload = function(event) {
		
		var self = this;
		
		openImageUploader(function(url, filename) {
			
			var hidden = $(self).siblings('input');

			$(self).siblings('.image-input-controls-container').find('span.src').text(filename);
			$(self).siblings('.image-input-controls-container').show();

			dataHandleDesignEditorInput({hiddenInput: hidden, value: url});
			
		});
		
	}
	
	designEditorInputImageUploadDelete = function(event) {
		
		if ( !confirm('Are you sure you wish to remove this image?') ) {
			return false;
		}

		$(this).parent('.image-input-controls-container').hide();
		$(this).hide();
		
		var hidden = $(this).parent().siblings('input');

		dataHandleDesignEditorInput({hiddenInput: hidden, value: 'none'});
		
	}
	
	/* Color Inputs */
	designEditorInputColor = function(event) {
		
		/* Keep the design editor options container from scrolling */
		$('div.design-editor-options-container').css('overflow-y', 'hidden');

		/* Set up variables */
		var input = $(this).parent().siblings('input');
		var inputVal = input.val();

		if ( inputVal == 'transparent' )
			inputVal = '00FFFFFF';

		var colorpickerHandleVal = function(color, inst) {

			var colorValue = '#' + color.hex;

			/* If alpha ISN'T 100% then use RGBa */
			if ( color.a != 100 )
				var colorValue = color.rgba;

			dataHandleDesignEditorInput({hiddenInput: input, value: colorValue});			

		}

		$(this).colorpicker({
			realtime: true,
			alpha: true,
			alphaHex: true,
			allowNull: false,
			showAnim: false,
			swatches: (typeof Headway.colorpickerSwatches == 'object' && Headway.colorpickerSwatches.length) ? Headway.colorpickerSwatches : true,
			color: inputVal,
			beforeShow: function(input, inst) {

				/* Add iframe overlay */
				showIframeOverlay();

			},
			onClose: function(color, inst) {

				colorpickerHandleVal(color, inst);

				/* Hide iframe overlay */
				hideIframeOverlay();

				/* Allow design editor options container to scroll again */
				$('div.design-editor-options-container').css('overflow-y', 'auto');

			},
			onSelect: function(color, inst) {

				colorpickerHandleVal(color, inst);

			},
			onAddSwatch: function(color, swatches) {

				dataSetOption('general', 'colorpicker-swatches', swatches);

			},
			onDeleteSwatch: function(color, swatches) {

				dataSetOption('general', 'colorpicker-swatches', swatches);

			}
		});

		$.colorpicker._showColorpicker($(this));

		setupTooltips();
		
	}
/* END INPUT FUNCTIONALITY */


/* COMPLEX JS CALLBACKS */
	propertyInputCallbackFontFamily = function(params) {

		var selector = params.selector;
		var value = params.value;
		var element = params.element;
		var cssValue = params.stack ? params.stack : params.value;

		/* Uncustomization */
			if ( !value ) {

				stylesheet.delete_rule_property(selector, 'font-family');
				return;

			}

		/* Non web fonts */
			if ( !value.match(/\|/g) ) {

				stylesheet.update_rule(selector, {"font-family": cssValue});
				return;

			}

		/* Web Fonts */
			var fontFragments = value.split('|');
			var args = {};

			/* Handle variants */
			var variants = '';

			if ( typeof fontFragments[2] != 'undefined' && fontFragments[2] )
				variants = ':' + fontFragments[2];

			args[fontFragments[0]] = {
				families: [fontFragments[1] + variants]
			};

			stylesheet.update_rule(selector, {"font-family": cssValue});

			if ( typeof $('iframe#content').get(0).contentWindow.WebFont == 'object' )
				$('iframe#content').get(0).contentWindow.WebFont.load(args);
		/* End Web Font handling */
		
	}

	propertyInputCallbackBackgroundImage = function(params) {

		var selector = params.selector;
		var value = params.value;
		var element = params.element;
		
		if ( value != 'none' ) {
			stylesheet.update_rule(selector, {"background-image": 'url(' + value + ')'});
		} else if ( value == 'none' ) {
			stylesheet.update_rule(selector, {"background-image": 'none'});
		}
		
	}

	propertyInputCallbackFontStyling = function(params) {

		var selector = params.selector;
		var value = params.value;
		var element = params.element;
		
		if ( value === 'normal' ) {
			
			stylesheet.update_rule(selector, {
				'font-style': 'normal',
				'font-weight': 'normal'
			});
			
		} else if ( value === 'bold' ) {
			
			stylesheet.update_rule(selector, {
				'font-style': 'normal',
				'font-weight': 'bold'
			});
			
		} else if ( value === 'italic' ) {
			
			stylesheet.update_rule(selector, {
				'font-style': 'italic',
				'font-weight': 'normal'
			});
			
		} else if ( value === 'bold-italic' ) {
			
			stylesheet.update_rule(selector, {
				'font-style': 'italic',
				'font-weight': 'bold'
			});
			
		} else if ( value === null ) {

			stylesheet.delete_rule_property(selector, 'font-style');
			stylesheet.delete_rule_property(selector, 'font-weight');

		}
		
	}

	propertyInputCallbackCapitalization = function(params) {

		var selector = params.selector;
		var value = params.value;
		var element = params.element;
		
		if ( value === 'none' ) {
			
			stylesheet.update_rule(selector, {
				'text-transform': 'none',
				'font-variant': 'normal'
			});
			
		} else if ( value === 'small-caps' ) {
			
			stylesheet.update_rule(selector, {
				'text-transform': 'none',
				'font-variant': 'small-caps'
			});
			
		} else {
			
			stylesheet.update_rule(selector, {
				'text-transform': value,
				'font-variant': 'normal'
			});
			
		}
		
	}

	propertyInputCallbackShadow = function(params) {
	
		var selector = params.selector;
		var value = params.value;
		var element = params.element;
		var property = params.property;

		var shadowType = ( property.indexOf('box-shadow') === 0 ) ? 'box-shadow' : 'text-shadow';
											
		var currentShadow = $i(selector).css(shadowType) || false;
								
		//If the current shadow isn't set, then create an empty template to work off of.
		if ( currentShadow == false || currentShadow == 'none' )
			currentShadow = 'rgba(0, 0, 0, 0) 0 0 0';
		
		//Remove all spaces inside rgba, rgb, and hsb colors and also remove all px
		var shadowFragments = currentShadow.replace(/, /g, ',').replace(/px/g, '').split(' ');
		
		var shadowColor = $('input[property="' + shadowType + '-color' + '"][element_selector="' + selector + '"]').val() || shadowFragments[0];
		var shadowHOffset = $('input[property="' + shadowType + '-horizontal-offset' + '"][element_selector="' + selector + '"]').val() || shadowFragments[1];
		var shadowVOffset = $('input[property="' + shadowType + '-vertical-offset' + '"][element_selector="' + selector + '"]').val() || shadowFragments[2];
		var shadowBlur = $('input[property="' + shadowType + '-blur' + '"][element_selector="' + selector + '"]').val() || shadowFragments[3];
		var shadowInset = $('input[property="' + shadowType + '-position' + '"][element_selector="' + selector + '"]').val() || shadowFragments[4];
		
		switch ( property ) {
			
			case shadowType + '-horizontal-offset':
				shadowHOffset = value || 0;
			break;
			
			case shadowType + '-vertical-offset':
				shadowVOffset = value || 0;
			break;
			
			case shadowType + '-blur':
				shadowBlur = value || 0;
			break;
			
			case shadowType + '-inset':
				shadowInset = value;
			break;
			
			case shadowType + '-color':
				shadowColor = value;
			break;
			
		}

		if ( !shadowColor )
			return stylesheet.delete_rule_property(selector, shadowType);
		
		/* Handle inset */
		if ( shadowInset == 'inset' ) {
			shadowInset = ' inset';
		} else {
			shadowInset = '';
		}

		var shadow = shadowColor + ' ' + shadowHOffset + 'px ' + shadowVOffset + 'px ' + shadowBlur + 'px' + shadowInset;
					
		var properties = {};
		
		//Use this syntax so the shadow type can feed from variable.
		properties[shadowType] = shadow;
					
		stylesheet.update_rule(selector, properties);
		
	}
/* END COMPLEX JS CALLBACKS */


/* INSPECTOR */
	/* INSPECTOR INIT */
		addInspector = function(refresh) {

			if ( typeof Headway.elements == 'undefined' )
				return $.when(designEditorRequestElements()).then(addInspector);

			$.each(Headway.elements, function(groupID, mainElements) {

				$.each(mainElements, function(mainElementID, mainElementSettings) {

					addInspectorProcessElement(mainElementSettings);

					$.each(mainElementSettings['children'], function(childElementID, childElementSettings) {

						addInspectorProcessElement(childElementSettings);

					});

				});

			});

			/* Build element hover tooltip */
			if ( typeof refresh == 'undefined' || refresh !== true ) {

				$i('body').qtip({
					id: 'inspector-tooltip',
					style: {
						classes: 'qtip-headway'
					},
					position: {
						target: [-9999, -9999],
						my: 'center',
						at: 'center',
						container: $i('body'),
						effect: false,
						adjust: {
							x: 35,
							y: 35
						}
					},
					content: {
						text: 'Hover over an element.'
					},
					show: {
						event: false,
						ready: true
					},
					hide: false,
					events: {
						render: function(event, api) {
							
							delete inspectorElement;
							delete inspectorTooltip;
							delete inspectorElementOptions;

							inspectorTooltip = api;

							if ( !$('#toggle-inspector').hasClass('inspector-disabled') ) {
								enableInspector();
							} else {
								disableInspector();
							}

						}
					}
				});

			}

		}

			refreshInspector = function() {
				return addInspector(true);
			}

			addInspectorProcessElement = function(value) {

				if ( value['group'] == 'default-elements' )
					return;

				if ( !$i(value['selector']).length )
					return;

				$i(value['selector']).data({
					inspectorElementOptions: value
				});

				$i(value['selector']).addClass('inspector-element');

				/* Instances */
				$.each(value['instances'], function(instanceID, instanceValue) {

					if ( !$i(instanceValue['selector']).length )
						return;

					/* Simply change selector, add ID and name for instances */
					var instanceOptions = jQuery.extend(true, {}, value);
					instanceOptions['parentName'] = value['name'];
					instanceOptions['instance'] = instanceValue['id'];
					instanceOptions['name'] = instanceValue['name'];
					instanceOptions['selector'] = instanceValue['selector'];
					instanceOptions['instances'] = {};

					/* Filter instances to only be states of this instance */
					$.each(value['instances'], function(index, instance) {

						if ( instance['state-of'] == instanceID )
							instanceOptions['instances'][index] = instance;

					});

					/* Split the selector that way we can filter out :hover and :active */
					$.each(instanceOptions['selector'].split(','), function(index, selector) {

						/* Do not add elements with pseudo selectors to the inspector */
						if ( selector.indexOf(':') != -1 )
							return;

						$i(selector).data({
							inspectorElementOptions: instanceOptions
						});

						$i(selector).addClass('inspector-element');

					});

				});

			}

		enableInspector = function() {

			if ( Headway.mode != 'design' || !Headway.designEditorSupport )
				return false;

			Headway.inspectorDisabled = false;
			Headway.disableBlockDimensions = true;

			$i('body').addClass('disable-block-hover').removeClass('inspector-disabled');

			$i('.block[data-hasqtip]').each(function() {
				var api = $(this).qtip('api');

				if ( api.rendered )
					api.disable();
			});

			inspectorTooltip.show();

			var inspectorMouseMoveEvent = !Headway.touch ? 'mousemove' : 'tap';
			$i('body').bind(inspectorMouseMoveEvent, inspectorMouseMove);

			setupInspectorContextMenu();
			deactivateContextMenu('block');

			/* For some reason the iframe doesn't always focus correctly so both of these bindings are needed */
			Headway.iframe.contents().bind('keydown', inspectorNudging);
			Headway.iframe.bind('keydown', inspectorNudging);

			/* Focus iframe on mouseover */
			Headway.iframe.bind('mouseover', function() {
				Headway.iframe.focus();
			});

			showNotification({
				id: 'inspector',
				message: '<strong>Right-click</strong> highlighted elements to style them.<br /><br />Once an element is selected, you may nudge it using your arrow keys.<br /><br />The faded orange and purple are the margins and padding.  These colors are only visible when the inspector is active.',
				closeConfirmMessage: 'Please be sure you understand how the Design Editor inspector works before hiding this message.',
				closeTimer: false,
				closable: true,
				doNotShowAgain: true,
				pulsate: false
			});

			updateInspectorVisibleBoxModal();

			$('#toggle-inspector').text('Disable Inspector').removeClass('inspector-disabled').addClass('mode-button-depressed');

		}

		disableInspector = function() {

			if ( Headway.mode != 'design' || !Headway.designEditorSupport )
				return false;

			Headway.inspectorDisabled = true;

			delete Headway.disableBlockDimensions;
			delete inspectorElement;

			$i('.inspector-element-hover').removeClass('inspector-element-hover');
			$i('body').removeClass('disable-block-hover').addClass('inspector-disabled'); 
			$i('.block').qtip('enable');

			inspectorTooltip.hide();
			hideNotification('inspector');

			$i('body').unbind('mousemove', inspectorMouseMove);

			deactivateContextMenu('inspector');
			setupBlockContextMenu(false);

			Headway.iframe.contents().unbind('keydown', inspectorNudging);
			Headway.iframe.unbind('keydown', inspectorNudging);

			removeInspectorVisibleBoxModal();

			$('#toggle-inspector').text('Enable Inspector').addClass('inspector-disabled').removeClass('mode-button-depressed');

		}

		toggleInspector = function() {

			if ( Headway.mode != 'design' || !Headway.designEditorSupport )
				return false;

			if ( $('#toggle-inspector').hasClass('inspector-disabled') )
				return enableInspector();

			disableInspector();

		}
	/* END INSPECTOR INIT */
	
	/* INSPECTOR ELEMENT HIGHLIGHTING */
		inspectorSelectElement = function(selector) {

			/* Unhighlight previous elements */
			$i('.inspector-element-selected').each(function() {

				$(this).removeClass('inspector-element-selected');

				removeInspectorVisibleBoxModal($(this));

			});

			/* Mark the new selected elements */
			$i(selector).addClass('inspector-element-selected');

			updateInspectorVisibleBoxModal();
			
		}
	/* END INSPECTOR ELEMENT HIGHLIGHTING */

	/* INSPECTOR BOX MODAL HIGHLIGHTING */
		removeInspectorVisibleBoxModal = function(selector) {

			if ( typeof selector == 'undefined' )
				var selector = $i('.inspector-element-selected');

			if ( !$(selector).data('previousBoxShadow') )
				return false;

			$(selector).data('previousBoxShadow', null);

			/* Clear style attribute box shadow and rely on previous CSS */
			return $(selector).css('boxShadow', '');

		}

		updateInspectorVisibleBoxModal = function() {

			if ( typeof Headway.inspectorDisabled != 'undefined' && Headway.inspectorDisabled )
				return;

			/* Show padding/margin with box shadow */
			$i('.inspector-element-selected').each(function() {

				/* Remove any previous margin/padding shadows */
				removeInspectorVisibleBoxModal($(this));

				var self = this;
				var previousBoxShadow = $(this).css('box-shadow');
				var boxShadow = previousBoxShadow != 'none' ? previousBoxShadow.split(',') : [];

				$(this).data('previousBoxShadow', previousBoxShadow);

				$.each([
					'paddingTop',
					'paddingRight',
					'paddingBottom',
					'paddingLeft',
					'marginTop',
					'marginRight',
					'marginBottom',
					'marginLeft'
				], function(index, cssProperty) {

					var cssValue = $(self).css(cssProperty).replace('px', '');

					if ( cssValue == 'auto' )
						return;

					var color = cssProperty.indexOf('padding') !== -1 ? 'rgba(0, 0, 255, .15)' : 'rgba(255, 127, 0, .15)';
					var negative = '';
					var inset = '';

					if ( 
						cssProperty == 'paddingRight' ||
						cssProperty == 'paddingBottom' ||
						cssProperty == 'marginLeft' ||
						cssProperty == 'marginTop'
					) 
						negative = '-';

					var value = negative + cssValue + 'px';

					if ( cssProperty.toLowerCase().indexOf('left') !== -1 || cssProperty.toLowerCase().indexOf('right') !== -1 )
						var xyValue = value + ' 0';
					else 
						var xyValue = '0 ' + value;

					if ( cssProperty.indexOf('padding') !== -1 )
						inset = 'inset ';

					boxShadow.push(inset + xyValue + ' 0 0 ' + color);

				});

				$(this).css({
					boxShadow: boxShadow.join(',')
				});

			});

		}
	/* END INSPECTOR BOX MODAL HIGHLIGHTING */

	/* INSPECTOR TOOLTIP */
		inspectorMouseMove = function(event) {

			if ( Headway.inspectorDisabled )
				return;

			var targetInspectorElement = $(event.target);

			if ( !targetInspectorElement.hasClass('inspector-element') )
				targetInspectorElement = targetInspectorElement.parents('.inspector-element').first();

			/* Only change tooltip content if the hovered element isn't the existing inspector element */
			if ( typeof inspectorElement == 'undefined' || !targetInspectorElement.is(inspectorElement) ) {

				inspectorElement = $(event.target);

				if ( !inspectorElement.hasClass('inspector-element') )
					inspectorElement = inspectorElement.parents('.inspector-element').first();

				var inspectorElementOptions = inspectorElement.data('inspectorElementOptions');

				if ( typeof inspectorElementOptions != 'object' )
					return;

				$i('.inspector-element-hover').removeClass('inspector-element-hover');
				$i(inspectorElementOptions['selector']).addClass('inspector-element-hover');

				var tooltipText = inspectorElementOptions['groupName'] + ' &rsaquo; ';

				if ( inspectorElementOptions['parentName'] )
					tooltipText += inspectorElementOptions['parentName'] + ' &rsaquo; ';

				tooltipText += '<strong>' + inspectorElementOptions['name'] + '</strong>';
				tooltipText += '<span class="right-click-message">Right-click to edit</span>';

				inspectorTooltip.set('content.text', tooltipText);

			}

			inspectorTooltip.show();

			var tooltipWidth = $i('#ui-tooltip-inspector-tooltip').width();
			var viewportOverflow = $i('body').width() - event.pageX - tooltipWidth + 15;

			var tooltipX = viewportOverflow > 0 ? event.pageX : event.pageX + viewportOverflow;  

			inspectorTooltip.set('position.target', [tooltipX, event.pageY]);

		}
	/* END INSPECTOR TOOLTIP */

	/* INSPECTOR CONTEXT MENU */
		setupInspectorContextMenu = function() {

			return setupContextMenu({
				id: 'inspector',
				elements: 'body',
				title: function(event) {
					return inspectorElement.data('inspectorElementOptions').name;
				},
				onShow: inspectorContextMenuOnShow,
				onHide: function() {

					/* Reactivate inspector tooltip */
					inspectorTooltip.show();
					Headway.inspectorDisabled = false;

				},
				onItemClick: inspectorContextMenuItemClick,
				contentsCallback: inspectorContextMenuContents
			});

		}

		inspectorContextMenuOnShow = function(event) {

			/* Add element options object to the context menu */
				$(this).data('element-options', inspectorElement.data('inspectorElementOptions'));

			/* Disable inspector tooltip */
				inspectorTooltip.hide();
				Headway.inspectorDisabled = true;

		}

		inspectorContextMenuItemClick = function(contextMenu, originalRightClickEvent) {

			if ( $(this).hasClass('group-title') )
				return;

			/* Block Options Click */
			if ( $(this).parents('li').first().hasClass('inspector-context-menu-block-options') ) {

				openBlockOptions(getBlock($(inspectorElement)));

			/* DE Click */
			} else {

				var inspectorElementOptions = contextMenu.data('element-options');
				var instanceID = $(this).parents('li').first().data('instance-id');
				var stateID = $(this).parents('li').first().data('state-id');

				/* Open panel and switch to editor panel */
				selectTab('editor-tab', $('div#panel'));
				showPanel();

				/* Remove the highlight on the previously selected elements */
				$('.design-editor-element-selector-container .ui-state-active').removeClass('ui-state-active');

				/* Handle Top Level Elements */
					if ( typeof inspectorElementOptions['parent'] == 'undefined' || !inspectorElementOptions['parent'] ) {

						var loadElementInputs = ( typeof instanceID == 'undefined' && typeof stateID == 'undefined' ) ? true : false;

						$('ul#design-editor-main-elements li#element-' + inspectorElementOptions['id']).addClass('ui-state-active');
						$('ul#design-editor-main-elements li#element-' + inspectorElementOptions['id']).find('span').trigger('click', {
							loadInputs: loadElementInputs
						});
	
				/* Handle Sub Elements */
					} else {

						$('ul#design-editor-main-elements li#element-' + inspectorElementOptions['parent']).addClass('ui-state-active');

						$('ul#design-editor-sub-elements').show();
						$('ul#design-editor-sub-elements li').hide();
						$('ul#design-editor-sub-elements li.parent-element-' + inspectorElementOptions['parent']).show();
						$('ul#design-editor-sub-elements').data('main_element', inspectorElementOptions['parent']);
						$('ul#design-editor-sub-elements').scrollbarPaper();

						/* Open sub element inputs */
						var loadSubElementInputs = ( typeof instanceID == 'undefined' && typeof stateID == 'undefined' ) ? true : false;

						$('ul#design-editor-sub-elements li#element-' + inspectorElementOptions['id']).addClass('ui-state-active');
						$('ul#design-editor-sub-elements li#element-' + inspectorElementOptions['id']).find('span').trigger('click', {
							loadInputs: loadSubElementInputs
						});

					}

				/* Instances */
					if ( typeof instanceID != 'undefined' ) {

						designEditor.selectInstance(instanceID);

					}
				/* States */
					else if ( typeof stateID != 'undefined' ) {

						designEditor.selectState(stateID);

					}

				/* Layout-specific customizations */
					if ( $(this).parents('li').first().hasClass('inspector-context-menu-edit-for-layout') ) {

						$('span.customize-element-for-layout').trigger('click');

					}

			}

		}

		inspectorContextMenuContents = function(event) {

			var contextMenu = $(this);
			var inspectorElementOptions = contextMenu.data('element-options');

			/* Set instance variable */
				var isInstance = (typeof inspectorElementOptions.instance != 'undefined' && inspectorElementOptions.instance);

			/* Add options to context menu */
				/* Regular Element Group */
					var regularElementGroup = contextMenu;

					if ( isInstance ) {

						contextMenu.append('<li class="inspector-context-menu-edit-instance" data-instance-id="' + inspectorElementOptions.instance + '"><span>Edit This Instance</span></li>');

						var regularElementGroup = $('<li><span class="group-title">Regular Element<small>' + inspectorElementOptions.parentName + '</small></span><ul></ul></li>').appendTo(contextMenu);
						regularElementGroup = regularElementGroup.find('ul').first();

					}

					/* Regular Element */
						regularElementGroup.append('<li class="inspector-context-menu-edit-normal"><span>Edit</span></li>');
						regularElementGroup.append('<li class="inspector-context-menu-edit-for-layout"><span>Edit For This Layout</span></li>');

					/* Regular Element States */
						if ( Object.keys(inspectorElementOptions.states).length ) {

							var statesMenu = $('<li class="inspector-context-menu-states"><span class="group-title">States</span><ul></ul></li>').appendTo(regularElementGroup);

							$.each(inspectorElementOptions.states, function(stateID, stateInfo) {
								statesMenu.find('ul').append('<li data-state-id="' + stateID + '"><span>Edit ' + stateInfo.name + '</span></li>');
							});

						}
				/* End Regular Element */

				/* Instances */
					if ( Object.keys(inspectorElementOptions.instances).length ) {

						if ( typeof inspectorElementOptions.instance == 'undefined' || !inspectorElementOptions.instance ) {
							var instancesMenu = $('<li class="inspector-context-menu-instances"><span class="group-title">Instances</span><ul></ul></li>').appendTo(contextMenu);
						} else {
							var instancesMenu = false;
						}

						$.each(inspectorElementOptions.instances, function(instanceID, instance) {

							/* Handle instance states that will be in the actual instances menu */
								if ( instance['state-of'] == inspectorElementOptions.instance ) {

									if ( !contextMenu.find('> li.inspector-context-menu-instance-states').length )
										$('<li class="inspector-context-menu-instance-states"><span class="group-title">Instance States</span><ul></ul></li>')
											.insertAfter(contextMenu.find('li.inspector-context-menu-edit-instance'));

									contextMenu.find('> li.inspector-context-menu-instance-states ul').append('<li data-instance-id="' + instanceID + '"><span>Edit ' + instance['state-name'] + '</span></li>');

								}

						});

						/* If the instances menu is empty somehow (one instance and that instance is selected), then delete it */
						if ( instancesMenu && !instancesMenu.find('ul li').length )
							instancesMenu.remove();

					}

				/* Block Options */
					if ( getBlock(inspectorElement) ) {

						var block = getBlock(inspectorElement);
						var blockID = getBlockID(block);
						var blockType = getBlockTypeNice(getBlockType(block));

						var blockOptionsNode = $('<li class="inspector-context-menu-block-options"><span>Open Block Options</span></li>').appendTo(contextMenu);

					}
				/* End block options */

		}
	/* END INSPECTOR CONTEXT MENU */

	/* INSPECTOR NUDGING */	
		inspectorNudging = function(event) {

			var key = event.keyCode;

			if ( key < 37 || key > 40 || !$i('.inspector-element-selected').length || $i('.inspector-element-selected').is('body') )
				return;

			var interval = event.shiftKey ? 5 : 1;

			/* Get the selector that way the stylesheet object can be used */
			var methodInput = $('.design-editor-box-nudging .design-editor-property-position select', '#editor-tab');
			var methodInputHidden = methodInput.parents('.design-editor-property-position').find('input[type="hidden"]');
			
			var selector = methodInputHidden.attr('element_selector');

			/* Set the 3 nudging properties to customized */
			$('.design-editor-box-nudging .uncustomized-property .customize-property span', '#editor-tab').trigger('click');

			/* Set the nudging method to whatever the position property is of the element as long as it's not static */
			if ( $i('.inspector-element-selected').css('position') != 'static' ) {

				var positionMethod = $i('.inspector-element-selected').css('position');

				$i('.inspector-element-selected').css({
					position: positionMethod	
				});

				methodInput.val(positionMethod).trigger('change');

			} else {

				var positionMethod = 'relative';

				$i('.inspector-element-selected').css({
					position: positionMethod	
				});

				methodInput.val(positionMethod).trigger('change');

			}

			switch ( key ) {

				/* Left */
				case 37:

					var previousLeft = parseInt($i('.inspector-element-selected').css('left'));

					if ( isNaN(previousLeft) )
						var previousLeft = 0;

					stylesheet.update_rule(selector, {"left": (previousLeft - interval) + 'px'});

					var currentLeft = $i('.inspector-element-selected').css('left').replace('px', '');
					$('.design-editor-box-nudging .design-editor-property-left input[type="text"]', '#editor-tab').val(currentLeft).trigger('change');

				break;

				/* Up */
				case 38:

					var previousTop = parseInt($i('.inspector-element-selected').css('top'));

					if ( isNaN(previousTop) )
						previousTop = 0;

					stylesheet.update_rule(selector, {"top": (previousTop - interval) + 'px'});

					var currentTop = $i('.inspector-element-selected').css('top').replace('px', '');
					$('.design-editor-box-nudging .design-editor-property-top input[type="text"]', '#editor-tab').val(currentTop).trigger('change');

				break;

				/* Right */
				case 39:

					var previousLeft = parseInt($i('.inspector-element-selected').css('left'));

					if ( isNaN(previousLeft) )
						var previousLeft = 0;

					stylesheet.update_rule(selector, {"left": (previousLeft + interval) + 'px'});

					var currentLeft = $i('.inspector-element-selected').css('left').replace('px', '');
					$('.design-editor-box-nudging .design-editor-property-left input[type="text"]', '#editor-tab').val(currentLeft).trigger('change');

				break;

				/* Down */
				case 40:

					var previousTop = parseInt($i('.inspector-element-selected').css('top'));

					if ( isNaN(previousTop) )
						previousTop = 0;

					stylesheet.update_rule(selector, {"top": (previousTop + interval) + 'px'});

					var currentTop = $i('.inspector-element-selected').css('top').replace('px', '');
					$('.design-editor-box-nudging .design-editor-property-top input[type="text"]', '#editor-tab').val(currentTop).trigger('change');

				break;

			}

			/* Prevent scrolling */
			event.preventDefault();
			return false;

		}
	/* END INSPECTOR NUDGING */
/* END INSPECTOR */


/* ELEMENT INFO */
	setElementInfoSelector = function(selector) {

		var sanitizedSelector = selector.replace(/\\/g, '');

		$('div.design-editor-info code', designEditor.context).attr('title', sanitizedSelector + '<br /><em>Click to Style in Live CSS Editor</em>');		
		$('div.design-editor-info code', designEditor.context).data('selector', sanitizedSelector);

	}

	getElementNodeName = function(node) {

		var clonedNode = node.clone();

		/* Remove indents from the cloned node */
		clonedNode.find('.indent').remove();

		return clonedNode.find('span').text();

	}


	setSelectedElementName = function(elementName, suffix, context) {

		if ( typeof suffix == 'undefined' || !suffix )
			var suffix = '';

		if ( typeof context == 'undefined' )
			var context = designEditor.context;

		return $('div.design-editor-info h4 span', context).html(sanitizeElementName(elementName) + suffix);

	}


	sanitizeElementName = function(elementName) {

		return $.trim(elementName.escapeHTML());

	}
/* END ELEMENT INFO */


/* SKINS */
	initiateSkinImport = function(input) {

		var skinChooser = input;

		if ( !skinChooser.val() )
			return alert('You must select a skin before importing a skin.');

		var skinFile = skinChooser.get(0).files[0];

		if ( skinFile && typeof skinFile.name != 'undefined' && typeof skinFile.type != 'undefined' ) {

			var skinReader = new FileReader();

			skinReader.onload = function(e) { 

				var contents = e.target.result;
				var skin = JSON.parse(contents);

				/* Check to be sure that the JSON file is a layout */
					if ( skin['data-type'] != 'skin' )
						return alert('Cannot load skin.  Please insure that the file is a valid Headway Skin.');

				if ( typeof skin['image-definitions'] != 'undefined' && Object.keys(skin['image-definitions']).length ) {

					showNotification({
						id: 'importing-images',
						message: 'Currently importing images.',
						closeTimer: 10000
					});

					$.post(Headway.ajaxURL, {
						security: Headway.security,
						action: 'headway_visual_editor',
						method: 'import_images',
						importFile: skin
					}, function(response) {
							
						var skin = response;

						/* If there's an error when sideloading images, then hault import. */
						if ( typeof skin['error'] != 'undefined' )
							return alert('Error while importing images for skin: ' + skin['error']);
							
						importSkin(skin);

					});

				} else {

					importSkin(skin);

				}

			}

			skinReader.readAsText(skinFile);

		} else {

			alert('Cannot load skin.  Please insure that the file is a valid Headway Skin.');

		}

	}


	importSkin = function(skin) {

		if ( $('#input-general-skin-import-live-css').val() == 'true' )
			overwriteSkinLiveCSS(skin['live-css']);

		importSkinElementData(skin['element-data']);

		showNotification({
			id: 'skin-imported',
			message: skin['name'] + ' skin successfully imported.<br /><br />Remember to save if you wish to apply the skin.',
			closeTimer: false,
			closable: true
		});

		/* Handle skin templates */
			if ( skin['templates'] && Object.keys(skin['templates']).length && $('#input-general-skin-import-layout-templates').val() == 'true' ) {

				dataPrepareDesignEditor();

				GLOBALunsavedValues['design-editor']['skin-import-templates'] = skin['templates'];

				showNotification({
					id: 'skin-imported-contains-templates',
					message: skin['name'] + ' skin contains templates.  You must <strong>save and refresh</strong> before they are available for use.',
					closeTimer: false,
					closabe: true
				});

			}

		allowSaving();

		return true;

	}


	importSkinElementData = function(data) {

		/* Send the skin data to the unsaved data */
			dataPrepareDesignEditor();

			/* Set skin-import as true that way we know to delete previous design editor data */
			GLOBALunsavedValues['design-editor']['skin-import'] = true;

			$.each(data, function(element, elementData) {

				GLOBALunsavedValues['design-editor'][element] = elementData;

			});
		/* End sending skin data to unsaved data */

		/* Change iframe general CSS to remove all existing design settings */
			/* Hide whitewrap and fade it back in later to avoid the FOUT */
				$i('#whitewrap').hide();

			/* Remove design editor CSS so adhoc can take over */
				$i('link[href^="' + Headway.homeURL + '/?headway-trigger=compiler&file=general-design-editor"]')
					.remove();

			/* Remove existing adhoc and then re-add it to be sure it's clean */
				$(css.stylesheet_node)
					.remove();

				css = new ITStylesheet({document: Headway.iframe.contents()[0]}, 'load');
				stylesheet = css;
		/* End changing iframe general CSS */

		/* Update iframe stylesheet with values */
			var processProperty = function(selector, property, propertyValue) {

				/* Uncustomized properties */
					if ( propertyValue == null || propertyValue == 'null' ) {

						stylesheet.delete_rule_property(selector, property);
						return;

					}

				/* Call developer-defined callback */
					if ( typeof Headway.designEditorProperties[property] == 'undefined' || typeof Headway.designEditorProperties[property]['js-callback'] == 'undefined' )
						return;

					if ( property.indexOf('color') !== -1 && propertyValue != 'transparent' && propertyValue.indexOf('#') !== 0 )
						var propertyValue = '#' + propertyValue;

					var callback = eval('(function(params){' + Headway.designEditorProperties[property]['js-callback'] + '});');

					callback({
						selector: selector,
						property: property,
						value: propertyValue,
						element: $i(selector)
					});

			}

			$.each(data, function(element, elementData) {

				var elementNode = $('.design-editor-element-selector-container #element-' + element);

				if ( !elementNode.length )
					return;

				var elementSelector = designEditorGetElementObject(element).selector;

				if ( !elementSelector )
					return;

				/* Handle CSS for regular elements */
					if ( typeof elementData['properties'] == 'object') {

						$.each(elementData['properties'], function(property, propertyValue) {
							processProperty(elementSelector, property, propertyValue);
						});

					}
				/* End handling CSS for regular elements */

				/* Handle CSS for states */
					if ( typeof elementData['special-element-state'] == 'object' ) {

						$.each(elementData['special-element-state'], function(stateID, stateProperties) {

							var stateSelector = designEditorGetElementObject(element).states[stateID.toLowerCase()]['selector'];

							$.each(stateProperties, function(property, propertyValue) {
								processProperty(stateSelector, property, propertyValue);
							});

						});

					}
				/* End handling CSS for states */

			});
		/* End updating iframe stylesheet with values */

		/* Fade whitewrap back in to avoid FOUT */
			setTimeout(function() {
				$i('#whitewrap').fadeIn(150);
			}, 200);

	}


	overwriteSkinLiveCSS = function(skinCSS) {

		$('textarea#live-css').val(skinCSS);
		dataHandleInput($('textarea#live-css'), skinCSS);

		if ( typeof liveCSSEditor != 'undefined' )
			liveCSSEditor.setValue(skinCSS);

		$i('style#live-css-holder').html(skinCSS);

	}


	exportSkinButtonCallback = function(input) {

		var params = {
			'security': Headway.security,
			'action': 'headway_visual_editor',
			'method': 'export_skin',
			'skin-name': $('#input-general-skin-export-name').val(),
			'include-live-css': $('#input-general-skin-export-live-css').val() == 'true' ? 'true' : 'false',
			'included-templates': $('#input-general-skin-export-templates').val()
		}

		var exportURL = Headway.ajaxURL + '?' + $.param(params);

		return window.open(exportURL);

	}

/* END SKINS */

})(jQuery);