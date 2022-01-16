(function ($, undefined) {

	// unknown reason for load this method
	//function loadScript() {
	//	if (typeof(YT) == 'undefined' || typeof(YT.Player) == 'undefined') {
	//		var tag = document.createElement('script');
	//		//tag.src = "https://www.youtube.com/iframe_api";
	//		tag.src = "//www.youtube.com/iframe_api";
	//		var firstScriptTag = document.getElementsByTagName('script')[0];
	//		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	//	}
	//}
	//loadScript();

	jQuery('[data-video-source]').attr('rel','video');

	var init = false;

    function Gallery(selector, autoInit) {

        autoInit = autoInit || false;
        var $deferred = jQuery.Deferred(),
			self = this;
        this.loadedFonts = [];

        this.$container  = $(selector);
        if(window.sggIsMobile) {
            this.$container.attr('data-is-mobile', window.sggIsMobile[0]);
        }
        this.$container.addClass('fitvidsignore');
        this.$elements   = this.$container.find('figure.grid-gallery-caption').fadeIn();
        this.initialMargin = this.$elements.first().css('margin-bottom');
        this.$navigation = this.$container.find('nav.grid-gallery-nav');

        this.selectedCategory="";

        this.$qsData = null;
        this.$qsDuration = '750';
        this.$qsEnable = false;
        this.areaPosition = this.$container.data('area-position');	// I think we wil need this in future

        this.pagination = {
            currentPage: 1,
            limit: 0,
            total: this.$elements.length,
            pages: 1,
            $wrapper: this.$container.find('.grid-gallery-pagination-wrap')
        };

        this.loadingText = this.$container.data('show-more-loading-text');

        this.popupTranslates = this.$container.data('popup-i18n-words');
		if(this.$container.data('exif-as-popup') == 1) {
			this.popupTitleAttribute = 'data-exif-text';
		} else {
			this.popupTitleAttribute = this.$container.data('popup-image-text');
		}
        this.popupMaxHeight = '90%';
        this.popupMaxWidth = '90%';
        this.popup_opened_image = false;
        this.popupImageDimension = function(){};
        this.resizeColorbox = function(){};

        this.socialSharing = this.$container.data('social-sharing');
        this.socialSharingWrapperClass = 'supsystic-grid-gallery-image-sharing';
        this.socialSharingImageOperators = {
            'pinterest': 'media',
        };
        this.socialButtonsUrl = window.location.href.replace(window.location.hash,'');
        this.socialButtonsUrl = this.removePopUpHashFromUrl(this.socialButtonsUrl);
        if(this.socialButtonsUrl.indexOf('#') + 1 == this.socialButtonsUrl.length){
            this.socialButtonsUrl = this.socialButtonsUrl.substr(0,this.socialButtonsUrl.length-1);
        }

		this.disablePopupHistory = !!this.$container.data('popup-disable-history');

        if (this.isFluidHeight()) {
            this.$elements.addClass('wookmarked');
        }

        $(document).trigger("GalleryExtend", this);

        if (autoInit) {
			// Interval check for init gallery when container becomes visible.
			// This need to properly load gallery from tabs, accordions or any other hidden containers.
			self.$container.data('isVisible', setInterval(function() {
				if (self.$container.is(':visible') || self.$container.hasClass('hidden-item')) {
					clearInterval(self.$container.data('isVisible'));
					self.init();
				}
			}, 500));
        }

		//Add init flag
        this.$container.addClass('initialized');
        return $deferred.resolve();
    }

    Gallery.prototype.isFluidHeight = (function () {
        return this.$container.is('.grid-gallery-fluid-height');
    });

    Gallery.prototype.isImageOverlay = (function () {
        return this.$container.find('.crop').is('.image-overlay');
    });

    Gallery.prototype.isMouseShadowShow = (function () {
        return this.$container.find('.grid-gallery-caption').is('.shadow-show');
    });

    Gallery.prototype.initQuicksand = (function () {
        if(this.$container.data('quicksand') == 'enabled' && this.$container.data('caption-builder-icons') !== 1)  {
            this.$qsEnable = true;
            this.$qsDuration = this.$container.data('quicksand-duration');
            this.$qsHolder = this.$container.find('.grid-gallery-photos:first');
            this.$qsData = this.$container.find('.grid-gallery-photos > a');
        }
    });

    Gallery.prototype.showCaption = (function () {
		var isExifCaption = this.$container.data('exif-as-caption');
        this.$container.find('.grid-gallery-figcaption-wrap').each(function() {
            if ($.trim($(this).html()) === '' && !$(this).find('img').length && $(this).has('.hi-icon').length === 0) {
                $(this).closest('figcaption').remove();
            }
        });

        this.$container.find('.gg-image-caption').each(function() {
			var $this = $(this)
			,	captionHtmlEntry = '';
			if(isExifCaption == 1) {
				var $objExist = $this.find('object');
				if($objExist.length) {
					captionHtmlEntry = $this.find('object').html().replace(/<a(.*?)>(.*?)<\/a>/gi,"<object type='none'>$&</object>");
				} else {
					captionHtmlEntry = $this.html();
				}

			} else {
				captionHtmlEntry = $this.text().replace(/<a(.*?)>(.*?)<\/a>/gi,"<object type='none'>$&</object>");
			}
			$this.html(captionHtmlEntry);
            $this.find('a').on('click', function(event) {
                event.stopPropagation();
            });
        });

        $(document).on('click', '.sliphover-container object a', function(event) {
             event.stopPropagation();
        });
    });

    Gallery.prototype.initWookmark = (function () {

        var self = this,
			horizontalScroll = this.$container.data('horizontal-scroll'),
			isMobile = parseInt($anyGallery.attr('data-is-mobile')),
            width = this.$container.data('width'),
            offset = 0,
            outerOffset = 0,
            spacing,
            windowWidth = $(window).width(),
            isFixedColumn = this.$container.data('gridType') == 3;
		// if responsive mode = 'one by one' and mobile -> run this method
		if (horizontalScroll && horizontalScroll.enabled) {
			if(horizontalScroll.responsiveMode == 1 && isMobile) {} else {
				return;
			}
		}
		// not for Mosaic Gallery
		if(this.$container.data('gridType') == 4) {
			return;
		}

        if (this.$container.data('offset')) {
            offset = this.$container.data('offset');
        }

        if (this.$container.data('padding')) {
            outerOffset = parseInt(this.$container.data('padding'));
        }

        if (String(width).indexOf('%') > -1) {
            var imagesPerRow = Math.floor(100 / parseInt(width));

            spacing = (offset * (imagesPerRow - 1)) + outerOffset * 2;
            width = (this.$container.width() - spacing) / 100 * parseInt(width);

            $.each(this.$container.find('img'), function() {
                aspectRatio = $(this).width() / $(this).height();
                $(this).width(width);
                $(this).height(width / aspectRatio);
            });
        }

        if(isFixedColumn) {
            var defaultWidth = parseInt(width),
                defaultHeight = parseInt(this.$container.data('height')),
                koefWidthHeigth = defaultWidth > 0 && defaultHeight > 0 ? defaultHeight/defaultWidth : 1;
        }

        function resizeColumns() {
            var columnsNumber = self.getResponsiveColumnsNumber();

            spacing = (offset * (columnsNumber - 1)) + outerOffset * 2;
            width = Math.floor((self.$container.width() - spacing) / 100 * (100 / columnsNumber));

            $.each(self.$elements, function(index, el) {

                var $el = $(el),
                    $img = $el.find('img');
                if($img.length && !$el.hasClass('initialized')) {
                    var imageOriginalSize = self.getOriginalImageSizes($img.get(0)),
                        elWidth = imageOriginalSize.width,
                        elHeight = imageOriginalSize.height,
                        aspectRatio = elWidth / elHeight,
                        height = width / aspectRatio;

                    if(isFixedColumn && $img.attr('data-gg-remote-image') == 1) {
                        height = width * koefWidthHeigth;
                    }

                    $el.css({
                        width: width,
                        height: height,
                    });
                    if(!$img.hasClass('ggLazyImg')) {
                        $img.removeClass('ggNotInitImg');
                        self.polaroidCaptionCalculate($el);
                        if($el.hasClass('initialized')) {
                            setTimeout(function() {
                                $el.trigger('refreshWookmark');
                            }, 350);
                        }
                    }
                }
            });
            self.$container.find('.grid-gallery-photos').removeAttr('data-min-height');
            return width;
        }


        if (this.$container.data('columns-number')) {

            self.$container.find('figure:not(.initialized) img').css({
                maxWidth: '100%',
                width: '100%',
                height: 'auto'
            });

            resizeColumns();
        }

        if (this.$container.data('width') !== 'auto' && !this.$qsEnable) {


            this.wookmark = this.$elements.filter(':visible').wookmark({
                autoResize:     true,
                container:      this.$container.find('.grid-gallery-photos'),
                direction:      this.areaPosition == 'right' ? 'right' : 'left',
                fillEmptySpace: false,
                flexibleWidth:  !this.$container.data('columns-number'),
                itemWidth:      width,
                offset:         offset,
                align:          this.areaPosition,
                outerOffset:    outerOffset,
                onLayoutChanged: function() {
                    setTimeout(function() {
                        self.$container.trigger('wookmark.changed');
                    }, 50);
                },
                onResize: function() {
                    if ($(window).width() != windowWidth) { // Fix touchscreen resize event issue see #544
                        windowWidth = $(window).width();

                        clearTimeout(self.$container.data('resize.timer'));
                        self.$container.data('resize.timer', setTimeout(function() {

                            var overflow = self.$container.css('overflow');

                            self.$container.removeData('resize.timer');
                            self.$container.css('overflow', 'hidden');

                            if (self.$container.data('columns-number')) {
                                self.$elements.wookmark({
                                    container: self.$container.find('.grid-gallery-photos'),
                                    itemWidth: resizeColumns(),
                                    offset: offset,
                                });
                            }

                            self.$elements.last().one('transitionend webkitTransitionEnd oTransitionEnd', function() {
                                self.$elements.filter(':visible').trigger('refreshWookmark');
                            });
                            self.$elements.filter(':visible').trigger('refreshWookmark');
                            self.$container.css('overflow', overflow);
                        }, 250));
                    }
                }
            }).css({
                'margin': '0',
                'transition': 'all 0.4s linear',
            });
        }

        this.$container.find('.grid-gallery-photos').css('text-align', this.$container.data('area-position'));
		var minheight = this.$container.find('.grid-gallery-photos').data('min-height');
		this.$container.find('.grid-gallery-photos').css({
			'min-height': minheight,
		});
        this.$container.filter(':visible').find('.grid-gallery-photos > *').filter(':visible').css({
            'float': 'none',
            'display': 'inline-block',
            'vertical-align': 'top'
        });
    });

    Gallery.prototype.initControll = (function (){
        $(document).on('click', "#cboxRight", function() {
            $.colorbox.prev();
        });
        $(document).on('click', "#cboxLeft", function() {
            $.colorbox.next();
        });
    });

    Gallery.prototype.getPopupDimensions = (function(width, height){
        var width = $(window).width() < width ? '90%' : width;
        var height = $(window).height() < height ? '90%' : height;


        if(width == '90%') { width = parseFloat(($(window).width() * parseFloat(width) / 100)); }
        if(height == '90%') { height = parseFloat(($(window).height() * parseFloat(height) / 100));}

        return {
            width: width,
            height: height
        };
    });

    /**
     * Get popup title depending on gallery settings
     * @return string title for popup image
     */
    Gallery.prototype.getPopupTitle = (function($element){

        var title,
            $img;

        if ($element.hasClass('hi-icon')) {
            $img = $element.closest('.grid-gallery-caption').find('img')
        } else {
            $img = $element.find('img');
        }

        title = $img.attr(this.popupTitleAttribute);

        if (!title) {
            title = $img.attr('title');
        }

        return title;
    });

    Gallery.prototype.initPopup = (function() {
        var popupType = this.popupType = this.$container.data('popup-type'),
            popupMaxWidth = this.popupMaxWidth,
            popupMaxHeight = this.popupMaxHeight,
            sW = this.$container.data('popup-widthsize'),
            sH = this.$container.data('popup-heightsize'),
            popupOverlayTransper = this.$container.data('popup-transparency'),
            popupBackground = this.$container.data('popup-background'),
            slidePlay = this.$container.data('popup-slideshow') === true,
            slidePlayAuto = slidePlay && this.$container.data('popup-slideshow-auto') === true,
            popupHoverStop = slidePlay && this.$container.data('popup-hoverstop') === true,
            slideshowSpeed = this.$container.data('popup-slideshow-speed'),
			popupPlacementType = this.$container.data('popup-placement-type'),
			isLazyLoad = this.$container.data('lazyload-enable') == '1',
            self = this;

        function generateOverlayColor(selector, background, opacity, optype) {
            var style = selector + '{',
                rgb = self.hex2rgb(background);
            opacity = (100 - opacity) / 100;

            if (background) {
                color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', '+ opacity + ')';
                style += 'background-image:none!important; background-color:' + color + '!important;';
            } else {
                if(optype){
                    style += 'opacity:' + opacity + '!important;';
                } else {
                    rgb = self.hex2rgb(self.rgb2hex($(selector).css('backgroundColor')));
                    color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', '+ opacity + ')';
                    style += 'background-image:none!important; background-color:' + color + '!important;';
                }
            }
            style += '}';
            $('<style type="text/css"> ' + style + '</style>').appendTo("head");
        }

        if(!!sW && sW !== 'auto'){
            popupMaxWidth = sW;
        }else{
            sW = '90%'
        }
        if(!!sH && sH !== 'auto'){
            popupMaxHeight = sH;
        }else{
            sH = '90%';
        }

        var getImageDimension = function(){
            return self.getPopupDimensions(sW,sH);
        };

        var getColorboxImageDimension = function(){
            var response = self.getPopupDimensions(sW,sH);
            if($(self.popup_opened_image).children('figure').attr('data-linked-images')
                ||
                $(self.popup_opened_image).hasClass('linked-element')
            ){
                response.width-=120;
            }
            return response;
        };

        var delayResize = (function(){
            var timer = 0;
            return function(callback, ms){
                clearTimeout (timer);
                timer = setTimeout(callback, ms);
            };
        })();

        this.resizeColorbox = function(){
            if(self.popup_opened_image === false) return;
            var dimensions = getColorboxImageDimension();
            if(self.popup_opened_image.attr && self.popup_opened_image.attr('rel') == 'video' && (dimensions.width >= 0.9*window.innerWidth)) {
                return;
            }

            $(self.popup_opened_image).data('colorbox').maxWidth = dimensions.width;
            $(self.popup_opened_image).data('colorbox').maxHeight = dimensions.height;

            $(document).trigger("beforeResizeColorBoxResponsive", this);
            delayResize(function(){
                $.colorbox.resizeResponsive(self.popup_opened_image);
            }, 500);
        };

        //Responsive popup if width or height > window.width
        popupMaxWidth = $(window).width() < popupMaxWidth ? '90%' : popupMaxWidth;
        popupMaxHeight = $(window).height() < popupMaxHeight ? '90%' : popupMaxHeight;

        this.popupMaxWidth = popupMaxWidth;
        this.popupMaxHeight = popupMaxHeight;
        this.popupImageDimension = getImageDimension;

        if (popupType && popupType !== 'disable') {
            this.$container.parentsUntil('body').each(function() {
                var events = $._data(this, "events"),
                    el = this;

                if (events && events.click) {
                    $.each(events.click, function(index, ev) {
                       if (ev.selector && self.$container.has($(ev.selector)).length) {
                            $(el).off('click', ev.selector);
                       }
                    });
                }
            });
        }

		var hideLongTooltipTitles = this.$container.data('hide-long-tltp-title');

        //===========|Popup gallery scripts|===========//
        if(popupType == 'colorbox') {
            var $this = this.$container;
			// simple selector
			var colorBoxItemSelector = '.grid-gallery-photos > .gg-colorbox:visible,'
				// mosaic selector
				+ ' .grid-gallery-photos .gg-mosaic-wrapper .gg-colorbox,'
				// icon selector
				+ ' .hi-icon.gg-colorbox:visible';
            // for popup "Display only first image"
            if($this.hasClass('one-photo') || $this.hasClass('hidden-item')) {
                colorBoxItemSelector = '.grid-gallery-photos > .gg-colorbox, .hi-icon.gg-colorbox';
            }

            if(this.initColorbox) {
				this.$container.find(colorBoxItemSelector).colorbox.remove('#'+this.$container.attr('id'));
            } else {

				if(hideLongTooltipTitles == 0) {
					var $colorboxtooltip = $('<div id="sggCboxTooltip">');
					$(document).on({
						mouseenter: function () {
							$colorboxtooltip.addClass('active');
						},
						mouseleave: function () {
							setTimeout(function() {
								$colorboxtooltip.removeClass('active');
							}, 400);
						}
					}, '#colorbox.' + $this.data('popup-theme') + ' #cboxTitle');

					$(document).one('cbox_complete', function(event){
						if (!$('#sggCboxTooltip').length) {
							$("#cboxWrapper").append($colorboxtooltip);
						}
					});

					$(document).on('cbox_complete', function(event) {
						$colorboxtooltip.html($("#cboxTitle").html());
                        if($('#colorbox').width() < 300) {
                            $('#colorbox').filter('.theme_1').find('#cboxSlideshow').css('bottom', '30px');
                        }
					});
				}
			}

            this.initColorbox = true;
            var colorBoxConfig = {
				fadeOut: this.$container.data('popup-fadeOut'),
				fixed:  true,
				maxHeight: getImageDimension().height,
				maxWidth: getImageDimension().width,
				scalePhotos: true,
				scrolling: false,
				returnFocus: false,
				slideshow: slidePlay && this.$container.data('popup-slideshow-speed'),
				slideshowAuto: slidePlayAuto,
				slideshowSpeed: slideshowSpeed,
				rel: this.$container.attr('id'),
				slideshowStart: self.popupTranslates.start_slideshow,
				slideshowStop: self.popupTranslates.stop_slideshow,
				current: self.popupTranslates.image + " {current} " + self.popupTranslates.of + " {total}",
				previous: self.popupTranslates.previous,
				next: self.popupTranslates.next,
				close: self.popupTranslates.close,
                'isDisableRightClick': this.$container.attr('data-disable-right-click') == 'true',
				title: function() {
					return self.getPopupTitle($(this));
				},
				speed: 350,
				transition: 'elastic',
				onComplete: function(e) {
					self.changePopUpHash($(e.el).attr('id') || $(e.el).attr('data-id'));
					self.addSocialShareToPopUp($(e.el), $('#cboxContent'), 'popup');
					self.$container.find('.grid-gallery-photos > .gg-colorbox, .hi-icon.gg-colorbox')
						.colorbox.resize();
					$("#cboxLoadedContent").append("<div id='cboxRight'></div><div id='cboxLeft'></div>");
				},
				onLoad: function(e){
					if(self.popup_opened_image == e.el) return;
					self.popup_opened_image = e.el;
                    var dimensions = getColorboxImageDimension();
                    $(self.popup_opened_image).data('colorbox').maxWidth = dimensions.width;
                    $(self.popup_opened_image).data('colorbox').maxHeight = dimensions.height;
				},
				onOpen: function(e) {
					//Enable/Disable stop slideshow on mouse hover
					if(popupHoverStop){
						var timeoutId = 0;
						$('#cboxContent').hover(function(){
							clearTimeout(timeoutId);
							$('.cboxSlideshow_on #cboxSlideshow').click();
						},function(){
							if(slidePlayAuto) {
								clearTimeout(timeoutId);
								timeoutId = setTimeout(function(){
									$('.cboxSlideshow_off #cboxSlideshow').click();
								},slideshowSpeed);
							}
						})
					}
				},
				onClosed: function(){
					self.popup_opened_image = false;
					self.clearPopUpHash();
				}
			};

			if(popupPlacementType == 1 || popupPlacementType == 2) {
				colorBoxConfig['maxWidth'] = '100%';
				colorBoxConfig['imgPlaceType'] = popupPlacementType;
			}
            this.$container.find(colorBoxItemSelector).off('click').colorbox(colorBoxConfig);



            $(window).resize(function(){
                self.resizeColorbox();
            });

            $('#cboxOverlay').removeClass().addClass($this.data('popup-theme')+'-overlay');
            $('#colorbox').removeClass().addClass($this.data('popup-theme'));


            generateOverlayColor('#cboxOverlay', popupBackground, popupOverlayTransper, true);
        }

        if(popupType == 'pretty-photo') {
			// simple selector
			var prettyPhotoItemSelector = '.grid-gallery-photos > a[data-rel^="prettyPhoto"]:visible,'
				+ ' .grid-gallery-photos .gg-mosaic-wrapper a[data-rel^="prettyPhoto"],'	// mosaic selector
				+ ' .grid-gallery-photos .hi-icon-wrap > a[data-rel^="prettyPhoto"]:visible';		// icon selector
			// for popup "Display only first image"
			if(this.$container.hasClass('one-photo') || this.$container.hasClass('hidden-item')) {
				prettyPhotoItemSelector = '.grid-gallery-photos > a[data-rel^="prettyPhoto"],'
					+ ' .grid-gallery-photos .gg-mosaic-wrapper a[data-rel^="prettyPhoto"],'	// mosaic selector
					+ ' .grid-gallery-photos .hi-icon-wrap > a[data-rel^="prettyPhoto"]';		// icon selector
			}

            if(!this.$prettyPhoto) {
				if(hideLongTooltipTitles == 0) {
					var $prettyPhotoTooltip = $('<div id="sggPrettyPhototooltip">');
					$(document).on({
						mouseenter: function () {
							$prettyPhotoTooltip.addClass('active');
						},
						mouseleave: function () {
							setTimeout(function () {
								$prettyPhotoTooltip.removeClass('active');
							}, 400);
						}
					}, '.pp_content_container .pp_description');
				}

                if(this.$container.attr('data-show-buttonlink-in-popup') == 1 && window.prettyPhotoDetailLink) {
                   this.loadButtonsFontFamily(this.$container.attr('data-buttonlink-font'), null);
                }

				this.$prettyPhoto = this.$container
					.find(prettyPhotoItemSelector)
                    .off('click')
                    .ggPrettyPhoto({
                        hook: 'data-rel',
                        theme: 'light_square',
                        allow_resize: true,
                        allow_expand: true,
                        deeplinking: false,
                        slideshow:  slidePlay && this.$container.data('popup-slideshow-speed'),
                        autoplay_slideshow: slidePlayAuto,
                        social_tools: '',
                        default_width: popupMaxWidth,
                        default_height: popupMaxHeight,
                        getImageDimensions : getImageDimension,
						'is_lazy_load': isLazyLoad,
						'ppTranslates': self.popupTranslates,
                        'isDisableRightClick': this.$container.attr('data-disable-right-click') == 'true',
						'isShowRotateBtn': this.$container.attr('data-show-rotate-btn-in-popup') == 1,
                        'isShowAttributes': this.$container.attr('data-show-attributes-in-popup') == 1,
                        'attributesPosition': this.$container.attr('data-attributes-position'),
                        'attributesWidth': this.$container.attr('data-attributes-width'),
                        'isShowButtonLink': this.$container.attr('data-show-buttonlink-in-popup') == 1,
                        'buttonLinkStyle': this.$container.attr('data-buttonlink-style'),
						'isShowLinkBtn': this.$container.attr('data-show-link-btn-in-popup') == 1,
						'isShowHovThumbnail': this.$container.attr('data-show-thumb-hov-in-popup') == 1,
						'galleryId': this.$container.attr('data-gg-id'),
						'getTitle': function() {},
						'setImageTitleForPrepare': function($element) {
							var imgTile = self.getPopupTitle($element);
							return imgTile;
						},
						'popup_border_type': this.$container.attr('data-popup-border-type'),
						'popup_border_color': this.$container.attr('data-popup-border-color'),
						'popup_border_width': this.$container.attr('data-popup-border-width'),
						'popup_border_enable': this.$container.attr('data-popup-border-enable') == 'on',
                        changepicturecallback: function(element){
                            self.changePopUpHash(element.attr('id') || element.attr('data-id'));
                            self.popup_opened_image = element;
                            $('.pp_description').html(self.getPopupTitle(element)).show();
                            //add social share buttons if enabled
                            self.addSocialShareToPopUp(element,$('.pp_hoverContainer'),'popup');
                            if(!slidePlay){
                                $('.pp_play').hide();
                            }
							// change detail link url
							if(self.$container.attr('data-show-link-btn-in-popup') == 1 && window.prettyPhotoDetailLink) {
								window.prettyPhotoDetailLink(element);
							}
                            if(self.$container.attr('data-show-attributes-in-popup') == 1 && window.prettyPhotoAttributes)
                            {
                                window.prettyPhotoAttributes(element, self.$container);
                            }

                            //Enable/Disable stop slideshow on mouse hover
                            if(popupHoverStop){
                                $('.pp_hoverContainer').hover(function(){
                                    $('.pp_nav .pp_pause').click();
                                },function(){
                                    if(slidePlayAuto) {
                                    	$('.pp_nav .pp_play').click();
                                    }
                                })
                            }
                            var $_desc = $('.pp_description'),
                                desc_height = parseInt($_desc.height()),
                                desc_line_height = parseInt($_desc.css('font-size'));
                            if(desc_line_height < desc_height){
                                $('.pp_content').height($('.pp_fade').outerHeight(true) + $('.pp_details').outerHeight(true));
                            }

							if(hideLongTooltipTitles == 0) {
								if (!$('#sggPrettyPhototooltip').length) {
									$(".pp_content_container .pp_content").append($prettyPhotoTooltip);
								}
								$prettyPhotoTooltip.html($(".pp_content_container .pp_description").html());
							}
                        },
                        callback: function(){
                            self.popup_opened_image = false;
                            self.clearPopUpHash();
                        }
                    });
                $(window).resize(function(){
					if(!self.popup_opened_image || !self.$prettyPhoto) return;
                    //if(self.$prettyPhoto[0].closest('div') != self.popup_opened_image[0].closest('div')) return;
					self.$prettyPhoto.open(self.popup_opened_image);
                });
            } else {
				this.$prettyPhoto.refresh(this.$container.find(prettyPhotoItemSelector));
            }

            generateOverlayColor('.pp_overlay', popupBackground, popupOverlayTransper, true);
        }

        if(popupType == 'photobox') {
			var photoBoxItemSelector = 'a.pbox:visible'
			,	photoBoxConfig = null;
            // for popup "Display only first image"
            if(this.$container.hasClass('one-photo') || this.$container.hasClass('hidden-item') || this.$container.data('gridType') == '4') {
                photoBoxItemSelector = 'a.pbox';
            }

            if (this.initPhotobox) {
                this.$container.find('.grid-gallery-photos').photobox('destroy');
            }
            this.initPhotobox = true;
			photoBoxConfig = {
				autoplay: slidePlayAuto,
                'isDisableRightClick': this.$container.attr('data-disable-right-click') == 'true',
				thumb: function(link) {
					if(self.$container.data('caption-buider') == '1' && self.$container.data('caption-builder-icons') == 1) {
						return link.closest('.grid-gallery-caption').find('img')[0];
					} else if(self.$container.data('icons')) {
						return link.closest('.grid-gallery-caption').find('img')[0];
					}
					return null;
				},
				getTitle: function(el){
					var nameTitle = self.getPopupTitle($(el));
					return nameTitle;
				},
				beforeShow: function(element){
					self.changePopUpHash($(element).attr('id') || $(element).attr('data-id'));
					self.addSocialShareToPopUp($(element),$('#pbCaption'),'photobox',true);
				},
				afterClose: function(){
					self.clearPopUpHash();
				}
			};
			if(isLazyLoad) {
				photoBoxConfig['thumbAttr'] = 'data-gg-real-image-href';
			}

			this.$container.find('.grid-gallery-photos').off('click').photobox(photoBoxItemSelector, photoBoxConfig);

            //Hide autoplay button when slideshow = false
            if(!this.$container.data('popup-slideshow')){
                $("#pbAutoplayBtn").hide();
            }

            //Enable/Disable stop slideshow on mouse hover
            if(popupHoverStop){
                $('.pbWrapper img').hover(function(){
                    $('#pbOverlay .playing').click();
                },function(){
                	if(slidePlayAuto) {
                    	$('#pbOverlay .play').click();
                    }
                })
            }

            generateOverlayColor('#pbOverlay', popupBackground, popupOverlayTransper);
        }
        //===========|Popup gallery scripts|===========//
    });

    Gallery.prototype.preventImages = (function() {
        var popupType = this.$container.data('popup-type');

        if (popupType == 'disable') {
            this.$container.find('a.gg-link').off('click');
            this.$container.find('a.gg-link:not([data-type=link])').addClass('disabled');
            this.$container.on('click', 'a.gg-link', function(event) {
                if ($(this).data('type') !== 'link') {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        }
    });

    Gallery.prototype.getResponsiveColumnsNumber = function() {
        var columnsData = this.$container.data('responsive-colums'),
            settings = [],
            columnsNumber = parseInt(this.$container.data('columns-number'));

        for (var key in columnsData) {
            settings.push(columnsData[key]);
        }

        settings.sort(function(a, b) {
            a.width = Number(a.width);
            b.width = Number(b.width);
            if (a.width > b.width) {
                return 1;
            } else if (a.width < b.width) {
                return -1;
            } else {
                return 0;
            }
        });

        for (var i = 0,
                 len = settings.length,
                 windowWidth = $(window).width(),
                 minBreakpoint = 0; i < len; i++) {
            if (windowWidth > minBreakpoint && windowWidth <= settings[i].width) {
                columnsNumber = Number(settings[i].columns);
                break;
            }
            minBreakpoint = settings[i].width;
        };

        return columnsNumber;
    };

    Gallery.prototype.initRowsMode = function() {
        var columnsNumber = parseInt(this.$container.data('columns-number'));

        if (this.$container.data('horizontal-scroll')) {
            return;
        }

        if (typeof this.$container.data('responsive-colums') == 'object') {
            columnsNumber = this.getResponsiveColumnsNumber();
        }

        if (columnsNumber) {
            var containerWidth = parseInt(this.$container.width()),
                spacing = parseInt(this.$container.data('offset')),
                scaleHeight = parseInt(this.$container.data('width')) / parseInt(this.$container.data('height')),
                elementWidth = null,
                elementHeight = null;

            elementWidth = Math.floor((this.$container.width() - (columnsNumber - 1) * spacing) / columnsNumber);
            elementHeight = Math.floor(elementWidth / scaleHeight);

            this.$elements.each(function() {
                var $this = $(this);
                if (!$this.find('.post-feed-crop').length) {
                        $this.css('width', elementWidth);
                    if (!isNaN(elementHeight)) {
                        $this.css('height', elementHeight);
                    } else {
                        $this.css('height', 'auto');
                    }
                } else {
                    $this.find('figcaption').css('width', elementWidth);
                }
            });

            this.$elements.find('.crop').css({
                width: 'auto',
                height: 'auto'
            });
        }
    };

    Gallery.prototype.setImagesHeight = (function () {
        var $images = this.$container.find('img');

        if ($images != undefined && $images.length > 0) {
            $images.each(function () {
                var $image = $(this),
                    $wrapper = $image.parent();

                if ($image.height() < $wrapper.height()) {
                    $wrapper.css('height', $image.height());
                }
            });
        }
    });

    Gallery.prototype.setOverlayTransparency = (function () {
        this.$elements.find('figcaption, [class*="caption-with-icons"]').each(function () {
            var $caption = $(this),
                alpha    = (10 - parseInt($caption.data('alpha'), 10)) / 10,
                rgb      = $caption.css('background-color'),
                rgba     = rgb.replace(')', ', ' + alpha + ')').replace('rgb', 'rgba');


            $caption.css('background', rgba);
        });
    });

    Gallery.prototype.setIconsPosition = (function () {
		var self = this;
        this.$elements.each(function () {
            var $element = $(this),
				isCaptionBuilderUsed = self.$container.data('caption-buider'),
                $wrapper = $element.find('div.hi-icon-wrap'),
                $icons   = $element.find('a.hi-icon');

            $icons.each(function () {
                var $icon   = $(this),
                    marginData = {},
                    marginY = ($element.height() / 2) - ($icon.height() / 2) - 10,
                    marginX = $wrapper.data('margin');

                if(marginX && !isCaptionBuilderUsed) {
                    marginData['margin-left'] = marginX;
                    marginData['margin-right'] = marginX;
                }
                if(marginY && !isCaptionBuilderUsed) {
                    marginData['margin-top'] = Math.abs(marginY);
                }
                $icon.css(marginData);
            });
        });
    });

    Gallery.prototype.initCategories = (function () {
        var $defaultElement = this.$navigation.find('a[data-tag="__all__"]'),
            $elements = this.$navigation.find('a'),
            $defaultBackground = $elements.first().css('background-color');

        function shadeColor(color, percent) {
            var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
            return "#" + (0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
        }

        bg = shadeColor('#' + this.rgb2hex($elements.first().css('borderTopColor')), 0.3);

        this.$navigation.find('a').on('click', $.proxy(function (event) {
            event.preventDefault();

            var $category   = $(event.currentTarget),
                requested   = String($category.data('tag')),
                _defaultTag = '__all__',
                currentGallery = this.$navigation.parent().attr('id');

            $elements.css('background-color', $defaultBackground);
            $category.css('background-color', bg);

            if (requested == _defaultTag) {

                this.$elements.each(function () {
                    if ($(this).parent().attr('rel')) {
                        $(this).parent().attr('rel', 'prettyPhoto['+currentGallery+']');
                    }
                }).fadeIn();

                this.correctMargin();
                this.initWookmark();

                if (!this.isFluidHeight() && this.$qsEnable) {
                    this.callQuicksand(this.$qsHolder, this.$qsData, this.$qsDuration);
                }
                return false;
            }

            if (!this.isFluidHeight() && this.$qsEnable) {
                var $filteredData = this.$qsData.filter(function () {
                    var tags = $(this).children().data('tags');
                    if (typeof tags !== 'undefined') {
                        tags = tags.split('|');
                    }
                    return ($.inArray(requested, tags) > -1);
                });
                this.callQuicksand(this.$qsHolder, $filteredData, this.$qsDuration);
            } else {
                $hidden = $();
                $visible = $();
                this.$elements.each(function () {
                    var $element = $(this),
                        tags     = $element.data('tags');

                    if (typeof tags != 'string') {
                        tags = String(tags);
                    }

                    if (tags != undefined) {
                        tags = tags.split('|');
                    }
                    if ($.inArray(requested, tags) > -1) {
                        if ($element.parent().attr('rel')) {
                            $element.parent().attr('rel', 'prettyPhoto['+currentGallery+'-'+requested+']');
                        }
                        $visible.push(this);
                    } else {
                        $hidden.push(this);
                    }
                });

                $.when($hidden.fadeOut()).done($.proxy(function(){
                    $visible.fadeIn().css({'height':''});
                    this.correctMargin();
                    this.initWookmark();
                }, this));
            }

        }, this));

        var firstTag = $elements.first().data('tag');
        this.$container.find('a[data-tag="'+ firstTag+ '"]').trigger('click');
    });

    Gallery.prototype.callQuicksand = function($holder, $filteredData, duration) {
        self = this;

        $filteredData.find('figure.grid-gallery-caption').css('margin', this.initialMargin).parent().css('clear', 'none');

        $holder.quicksand($filteredData, {
                duration: Number(duration),
                easing: 'swing',
                attribute: 'href',
            }, function() {
                $holder.css({
                    width: 'auto',
                    height: 'auto'
                }).append('<div class="grid-gallery-clearfix"></div>');
                self.initPopup();
                self.correctMargin();
				if(self.$container.data('lazyload-enable') == '1') {
					// images area removed and filled new images
					self.initLazyLoad();
				}
            }
        );
    };

    Gallery.prototype.hidePopupCaptions = function() {
        //never show alternative text for popup theme 6 on top of popup
        $('<style type="text/css">.ppt{ display:none!important; }</style>').appendTo("head");
        if (this.$container.data('popup-captions') == 'hide') {
            $('<style type="text/css">#cboxTitle, #cboxCurrent, .pbCaptionText, .ppt, .pp_description { display:none!important; }</style>').appendTo("head");
        }
    };

    Gallery.prototype.hidePaginationControls = (function () {
        return false;
    });

    Gallery.prototype.setImageOverlay = (function() {
        if(this.isImageOverlay()) {
            this.$container.find('.grid-gallery-caption').each(function () {
                var image = $(this).find('img');
                var crop = $(this).find('.image-overlay');
                image.css('opacity', '0.2');
                crop.css('background-color', '#424242');
                $(this).on('mouseenter', function () {
                        image.css('opacity', '1.0');
                        crop.css('background-color', 'inherit');
                    }
                );
                $(this).on('mouseleave', function () {
                    image.css('opacity', '0.2');
                    crop.css('background-color', '#424242');
                });
            });
        }
    });

    Gallery.prototype.setMouseShadow = (function() {
        var shadow = null,
            $selector = null,
            $captions = this.$container.find('.grid-gallery-caption'),
            self = this,
            showOver = function(event) {
                if (event.type === 'mouseenter') {
                    $(this).css('box-shadow', self.mouseOverBoxShadow);
                } else {
                    $(this).css('box-shadow', 'none');
                }
            },
            hideOver = function(event) {
                if (event.type === 'mouseenter') {
                    $(this).css('box-shadow', 'none');
                } else {
                    $(this).css('box-shadow', self.mouseOverBoxShadow);
                }
            };
        // only first Init elem has correct value
        if(!self.mouseOverBoxShadow) {
			self.mouseOverBoxShadow = $captions.filter(':first').css('box-shadow');
        }

        if ($captions.is('.shadow-show')) {
            $captions.css('box-shadow', 'none');
            $captions.off('hover').on('hover', showOver);
        } else if ($captions.is('.shadow-hide')) {
            $captions.off('hover').on('hover', hideOver);
        }
    });

    Gallery.prototype.initPagination = (function () {
        var perPage = parseInt(this.$container.find('.grid-gallery-photos').data('per-page'), 10),
            buffer  = [],
            page    = 1,
            offset  = 0
        self    = this;

        if (isNaN(perPage)) {
            this.$elements.fadeIn();
            return false;
        }

        if(this.$container.data('gridType') == 4 && this.$container.data('show-mosaic-all-img') != 1) {
            this.$elements.fadeIn();
            this.pagination.wrapper.hide();
            return false;
        }

        var showCurrentPage = (function (gallery) {
            gallery.$elements.removeClass('current-page').hide(350);

            $.each(buffer[gallery.pagination.currentPage], function () {
                $(this).addClass('current-page').css({height:gallery.$container.data('height'),width:gallery.$container.data('width')}).show(function () {
                    gallery.setIconsPosition();
                    self.correctMargin();
                });
            });
            /*
             if (!gallery.isFluidHeight()) {
             $('.current-page .crop').css('height', function () {
             var height = null;
             $('.crop img').each(function () {
             if($(this).height() && !height) {
             height = $(this).height();
             }
             });
             return height;
             });
             }
             */
        });

        this.pagination.limit = perPage;

        this.$elements.each($.proxy(function (index, el) {
            var currentIndex = index + 1;

            if ((currentIndex - offset) <= this.pagination.limit) {
                if (!$.isArray(buffer[page])) {
                    buffer[page] = [];
                }

                buffer[page].push(el);
            } else {
                offset += this.pagination.limit;
                page   += 1;

                buffer[page] = [el];
            }
        }, this)).hide();

        this.pagination.pages = Math.ceil(this.pagination.total / this.pagination.limit);

        var element=this.pagination.$wrapper.find('a.grid-gallery-page[data-page="1"]');
        element.css('font-size','19pt');

        this.pagination.$wrapper.find('a.grid-gallery-page').on('click', $.proxy(function (e) {
            e.preventDefault();

            var element = $(e.currentTarget);
            var galery = Gallery.prototype;
            this.pagination.$wrapper.find('a.grid-gallery-page').each(function() {
                $(this).css('font-size','inherit');
            });
            galery.selectedCategory = element.data('page');
            element.css('font-size','19pt');

            var $anchor       = $(e.currentTarget),
                requestedPage = $anchor.data('page');

            this.pagination.currentPage = requestedPage;

            showCurrentPage(this);

            return false;
        }, this));

        showCurrentPage(this);
    });

    Gallery.prototype.hex=function(x) {
        return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
    };

    Gallery.prototype.rgb2hex = function(rgb) {
        if(rgb) {
            rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(0\.\d+))?\)$/);
            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }
    };

    Gallery.prototype.hex2rgb = function(hex) {

        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    Gallery.prototype.importFontFamily = (function(familyName) {
        var styleId = 'sggFontFamilyStyle',
            $style = $('#' + styleId);
        if (!$style.length) {
            $style = $('<style/>', { id: styleId });
            $('head').append($style);
        }
        familyName = familyName.replace(/\s+/g, '+').replace(/"/g, '');

        var obj = document.getElementById(styleId),
            sheet = obj.sheet || obj.styleSheet;
        if(this.loadedFonts.indexOf(familyName) === -1) {
            if(sheet.insertRule) {
                sheet.insertRule('@import url("//fonts.googleapis.com/css?family=' + familyName + '"); ', 0);
            } else if(sheet.addImport) {
                sheet.addImport('//fonts.googleapis.com/css?family=' + familyName);
            }
            this.loadedFonts.push(familyName);
        }
    });


    Gallery.prototype.loadFontFamily = (function () {
        font = this.$container.data('caption-font-family');
        if(window && window.sggStandartFontsList && $.inArray(font.replace(/\"/g, ''), window.sggStandartFontsList) != -1) {
            return false;
        }
        if (font && font !== 'Default') {
            this.importFontFamily(font);
        }
    });

    Gallery.prototype.initCaptionCalculations = (function () {
        var self = this;

        this.$container.find('.grid-gallery-caption').each(function () {
            wrap = $(this).find('div.grid-gallery-figcaption-wrap');
            figcaption = $(this).find('figcaption');

            wrap.css({
                'display': 'table-cell',
                'text-align': figcaption.css('text-align')
            });

            wrap.wrap($('<div>', {
                css: {
                    display:'table',
                    height:'100%',
                    width:'100%'
                }
            }));
        });
    });

    Gallery.prototype.checkDirection = function($element, e) {
        var w = $element.width(),
            h = $element.height(),
            x = ( e.pageX - $element.offset().left - ( w / 2 )) * ( w > h ? ( h / w ) : 1 ),
            y = ( e.pageY - $element.offset().top - ( h / 2 )) * ( h > w ? ( w / h ) : 1 );

        return Math.round(( ( ( Math.atan2(y, x) * (180 / Math.PI) ) + 180 ) / 90 ) + 3) % 4;
    };

    Gallery.prototype.generateOverlayCaptionColor = (function (overlayColor, alpha) {
        if(typeof(overlayColor) == 'string'){
            overlayColor = overlayColor.split(')');

            if(overlayColor.length > 0) {
                overlayColor = overlayColor[0].split('(');

                if(overlayColor.length > 1) {
                    var chanels = overlayColor[1].split(',');

                    if(chanels.length == 4) {   // it is already rgba (fix for IE)
                        overlayColor[0] = overlayColor[0].replace('a', '');
                        chanels.splice(-1,1);
                        overlayColor[1] = chanels.join(',');
                    }
                    return overlayColor[0] + 'a(' + overlayColor[1] + ', ' + (1 - alpha/10) + ')';
                }
            }
        }
        return overlayColor;
    });

    Gallery.prototype.initCaptionEffects = (function () {
        var self = this,
            allwaysShowCaptionOnMobile = this.$container.data('caption-mobile'),
            disableCaptionOnMobile = this.$container.data('caption-disabled-on-mobile'),
            isMobile = !!parseInt(this.$container.data('is-mobile'));

        if(isMobile && navigator && navigator.userAgent && navigator.userAgent.indexOf("Safari") > -1) {
            var $3dCubeCaptions = this.$container.find('.grid-gallery-caption[data-grid-gallery-type="3d-cube"]');
            $3dCubeCaptions.attr('data-grid-gallery-type', 'revolving-door-bottom');
            $3dCubeCaptions.data('grid-gallery-type', 'revolving-door-bottom');
        }

        $.each(this.$elements, function(index, el) {
            var $el = $(el),
                overlayColor = $el.find('figcaption').css('backgroundColor'),
                alpha = parseInt($el.find('figcaption').data('alpha'));

            if (isMobile && allwaysShowCaptionOnMobile){
                $el.attr('data-grid-gallery-type', 'none');
            }

            if ($el.data('grid-gallery-type') == 'cube') {
                $el.on('mouseenter mouseleave', function(e) {
                    var $figcaption = $(this).find('figcaption'),
                        direction = self.checkDirection($(this), e),
                        classHelper = null;

                    switch (direction) {
                        case 0:
                            classHelper = 'cube-' + (e.type == 'mouseenter' ? 'in' : 'out') + '-top';
                            break;
                        case 1:
                            classHelper = 'cube-' + (e.type == 'mouseenter' ? 'in' : 'out') + '-right';
                            break;
                        case 2:
                            classHelper = 'cube-' + (e.type == 'mouseenter' ? 'in' : 'out') + '-bottom';
                            break;
                        case 3:
                            classHelper = 'cube-' + (e.type == 'mouseenter' ? 'in' : 'out') + '-left';
                            break;
                    }

                    $figcaption.removeClass().addClass(classHelper);
                });
            }

            if ($el.data('grid-gallery-type') == 'direction-aware') {
                var color = $el.find('figcaption').css('color'),
                    isCaptionBuilderUsed = self.$container.data('caption-buider'),
					classStr = '',
					addAttr = '',
                    align = $el.find('figcaption').css('text-align');

				if(isCaptionBuilderUsed == 1) {
                    $el.attr('data-caption', '<div style="padding:0px; height: ' + $el.height() + 'px; font-family:' +
                        self.$container.data('caption-font-family') + '; font-size:' + self.$container.data('caption-text-size') +'">' +
                        ($el.find('figcaption').html() || '') + '</div>');
				} else {
					var $ggImgCaption = $el.find('.gg-image-caption');
					if($ggImgCaption.hasClass('ggRtlClass')) {
						classStr = 'ggRtlClass';
						addAttr = 'dir="rtl"';
					}
					$el.attr('data-caption', '<div class="' + classStr + '" ' + addAttr + ' style="padding:20px;font-family:' +
						self.$container.data('caption-font-family') + '; font-size:' + self.$container.data('caption-text-size') +';">' +
						($ggImgCaption.html() || '') + '</div>');
                }

                $el.sliphover({
                    target: $el,
                    backgroundColor: self.generateOverlayCaptionColor(overlayColor, alpha),
                    fontColor: color,
                    textAlign: align,
                    caption: 'data-caption'
                });

            }

            if ($el.data('grid-gallery-type') == '3d-cube'){
				if(!$el.find('.box-3d-cube-scene').length){
					var cubeWidth = $el.width(),
						cubeHeight = $el.height();
					// $el.addClass('box-3d-cube-scene');
					$el.children('div').addClass('front').addClass('face');
					$el.children('figcaption').addClass('back').addClass('face');
					$el.html('<div class="box-3d-cube-scene"><div class="box-3d-cube">' + $el.html() + '</div></div>');
					// $el.html("<div class='box-3d-cube-scene'><div class='box-3d-cube'><div class='front face'><img src='http://placehold.it/"+cubeWidth+"x"+cubeHeight+"/' alt=''></div><div class='back face'><div>This is back</div></div></div></div>");
					self.changeImageHeightFor3dCubeEffect($el, cubeWidth, cubeHeight);
				}
            }

            if ($el.data('grid-gallery-type') == 'polaroid') {
                self.polaroidCaptionCalculate($el);
            } else {
                var topRow = $el.find('.gg-caption-row.top'),
                   centerRow = $el.find('.gg-caption-row.center');
                if(centerRow.length == 1 && topRow.length == 1) {
                    centerRow.css({'top': topRow.height(), 'transform': 'initial'});
                }
            }
        });

        $(document).on('click', '.sliphover-container', function(event) {
            event.preventDefault();
            $(this).data('relatedElement').get(0).click();
        });


        if(isMobile && !disableCaptionOnMobile) {
            this.$container.find('.grid-gallery-caption').each(function() {
                var caption = this,
                    $caption = $(caption),
                    hammer = new Hammer_gg(this),
					captionIsMobile = self.$container.attr('data-caption-mobile'),
					preventClick = false;

				$caption.on('click', function(event) {
					if (preventClick) {
						event.preventDefault();
						event.stopPropagation();
					}
				});

                hammer.on("tap panstart", function(event) {

                    if (event.type === 'panstart') {
                        self.$container.find('.grid-gallery-caption').removeClass('hovered');
                    }

                    if (event.type === 'tap') {
						preventClick = false;
                        if (!$caption.hasClass('hovered')) {
                            self.$container.find('.grid-gallery-caption').not(caption).removeClass('hovered');
							$(caption).addClass('hovered');
							if(captionIsMobile == 'false') {
								preventClick = true;
							}
						}

                    }
                });
            });
        }

        if (isMobile && disableCaptionOnMobile) {
			this.$container.find('.grid-gallery-caption figcaption').hide();
		}

    });

    Gallery.prototype.polaroidCaptionCalculate = (function ($el) {
        if ($el.data('grid-gallery-type') != 'polaroid' || $(this).find('.post-feed-crop').length || $el.hasClass('initialized')) return;
        var $img = $el.find('img');

        if($img.hasClass('ggLazyImg') || $img.hasClass('ggNotInitImg')) return;
        if($el.closest('.gg-mw-row').hasClass('sggDisplNone')) return;

        $el.addClass('initialized');
        $img.finish();
        var width = $el.width(),
            gridType = this.$container.data('gridType'),
            frameWidth = parseInt(this.$container.data('polaroid-frame-width'), 10) || 20,
            captionHeight = this.$container.data('polaroid-caption-height'),
            clearHeight = captionHeight ? parseInt(captionHeight.toString().match(/\d.?\d*.?\d*/)[0]) : 0,
            overlayColor = $el.find('figcaption').css('backgroundColor'),
            alpha = parseInt($el.find('figcaption').data('alpha')),
            $figcaption = $el.find('figcaption'),
            scaleRatio = $img.width() / $img.height();
        if(gridType == 2) {
            var imageHeight = $img.height() - frameWidth * 2,
                imageWidth = imageHeight * scaleRatio;
        } else {
            var imageWidth = $img.width() - frameWidth * 2,
                imageHeight = imageWidth / scaleRatio;
        }
        var figcaptionHeight = !isNaN(clearHeight) && clearHeight != 0 ? (captionHeight.toString().indexOf('%') > 0 ? (imageHeight * clearHeight / 100) : clearHeight) : 0,
            figureFullHeight = imageHeight + frameWidth * 2 + figcaptionHeight;

        $img.css({
            'width': imageWidth + 'px',
            'height': imageHeight + 'px',
            'margin': frameWidth + 'px auto 0',
        });
        $el.find('.gg-caption-table').css('height', '1px');

        $el.find('.crop').css({
            'height': imageHeight + frameWidth + 'px'
        });
        if(gridType == 0) {
            $el.find('.crop').css('overflow', 'visible');
        } else if(gridType == 2) {
            $el.css({
                'height': figureFullHeight + 'px',
                'width': imageWidth + frameWidth * 2 + 'px',
            });
        } else if(gridType == 3) {
            $el.css({
                'height': figureFullHeight + 'px',
            });
        }

        $el.css({
            'background': overlayColor
        });
        $el.css({
            'width': $el.width(),
            'background': this.generateOverlayCaptionColor(overlayColor, alpha)
        });

        $figcaption.css({
            'background': 'none',
            'transition': 'none',
        });
        if(figcaptionHeight) {
            figcaptionHeight += 'px';
            $figcaption.css('height', figcaptionHeight);
            $el.find('.gg-caption-row').css({'max-height': figcaptionHeight ? figcaptionHeight : '100%', 'height': 'auto'});
            $el.find('.gg-caption-cell').css('height', '100%');
            if(gridType == 3) {
                $figcaption.css('margin-top', frameWidth + 'px');
            }
        } else {
            $figcaption.css('padding', frameWidth + 'px');
        }

        if ($figcaption.find('.grid-gallery-figcaption-wrap').text().length === 0) {
            $figcaption
               .find('.grid-gallery-figcaption-wrap')
               .append('<span></span>');
        }

        if (this.$container.data('polaroid-animation')) {
            $el.addClass('polaroid-animation');
        }

        if (this.$container.data('polaroid-scattering')) {
            $el.css({
                'transform': 'rotate(' + (-3 + Math.random() * (10 - 3)) + 'deg)'
            });
            $el.addClass('polaroid-scattering');
        }
        var slimScroll = $el.closest('div.slimScrollDiv');
        if(slimScroll.length) {
            var scrollHeight = figureFullHeight + 20 + 'px';
            slimScroll.css('height', scrollHeight);
            slimScroll.find('.grid-gallery-photos').css('height', scrollHeight);
        }
    });

	Gallery.prototype.changeImageHeightFor3dCubeEffect = (function($figure, cubeWidth, cubeHeight) {
		// check params
		if(!$figure) {
			return;
		}
		// call this function from PRO script
		if(!$figure.length) {
			if('figure' in $figure && 'width' in $figure && 'height' in $figure) {
				cubeWidth = $figure.width;
				cubeHeight = $figure.height;
				$figure = $figure.figure;
			} else {
				return;
			}
		}

		if(!cubeWidth) {
			cubeWidth = $figure.width();
		}
		if(!cubeHeight) {
			cubeHeight = $figure.height();
		}

		var perspective = Math.max(cubeHeight,cubeWidth) * 2 + 'px'
		,	transformOrigin = '50% 50% -' + Math.round(cubeHeight/2) + 'px';

		$figure.find('.box-3d-cube-scene').css({
			'perspective': perspective,
			'-webkit-perspective': perspective
		});
		$figure.find('.box-3d-cube').css({
			'transform-origin': transformOrigin,
			'-ms-transform-origin': transformOrigin,
			'-webkit-transform-origin': transformOrigin,
		});
		$figure.find('.box-3d-cube, .box-3d-cube .face').css({
			width: cubeWidth + 'px',
			height: cubeHeight + 'px',
		});
	});

    Gallery.prototype.correctMargin = (function () {
		if(this.$container.data('area-position') == 'right') {
			return;
		}
		if(this.$container.data('gridType') == 4) {
			return;
		}
		// if responsive mode = 'one by one' and mobile -> run this method
		var horizontalScroll = this.$container.data('horizontal-scroll')
		,	isMobile = parseInt($anyGallery.attr('data-is-mobile'))
		if(horizontalScroll && horizontalScroll.responsiveMode == 1 && isMobile) {} else {
			return;
		}
		if(!this.isFluidHeight()) {

            if (this.$qsEnable) {
                this.$elements = this.$container.find('figure.grid-gallery-caption');
            };

            var prevElement = null
                ,	totalElements = this.$elements.filter(':visible').length
                ,   rowWidth = 0
                ,   maxRowWidth = this.$container.width()
                ,   initialMargin = this.initialMargin;

            this.$elements.css('margin', this.initialMargin);
            this.$elements.parent().css('clear', 'none');

            this.$elements.filter(':visible').each(function(index){

                if (rowWidth + $(this).outerWidth() > maxRowWidth) {
                    $(prevElement).css('margin-right', 0);
                    $(this).css('margin-right', this.initialMargin);
                    $(this).parent().css('clear', 'left');
                    rowWidth = $(this).outerWidth() + parseInt(initialMargin);
                } else if (rowWidth + $(this).outerWidth() == maxRowWidth) {
                    $(this).css('margin-right', 0);
                    rowWidth = 0;
                } else {
                    rowWidth += $(this).outerWidth() + parseInt(initialMargin);
                }

                if(index == totalElements - 1) {
                    $(this).css('margin-right', 0);
                }

                prevElement = this;

            });
        }
    });

    Gallery.prototype.hideTitleTooltip = (function () {
        if(this.$container.data('hide-tooltip') == true) {
            title = '';
            this.$container.find('a, img, div:not(.grid-gallery-photos)').on('mouseenter', function() {
                title = $(this).attr('title');
                $(this).attr({'title':' '});
            }).mouseout(function() {
                $(this).attr({'title':title});
            });
        };
    });

    Gallery.prototype.correctFullscreen = (function () {
        var windowWidth = $(window).width();
        this.$elements.each(function() {
            var coef = parseInt(windowWidth / $(this).width())
                , resultWidth = Math.round(windowWidth / coef);
            $(this).width(resultWidth);
        });
    });

    Gallery.prototype.correctFullScreenWidthGallery = (function(){
        var windowWidth = $(window).width(),
            $parentContainer = this.$container.parent(),
            containerOffset = $parentContainer.offset(),
            containerOffsetLeft = containerOffset.left + parseFloat($parentContainer.css('padding-left'));

        this.$container.find('.grid-gallery-photos').css({
            width: windowWidth
        });

        var cssDirection = this.$container.css('direction');

        if ('ltr' == cssDirection) {
            this.$container.css({
                width: windowWidth,
                left: '-' + containerOffsetLeft + 'px',
				//'max-width': '100%'
            });
            this.$container.find('.grid-gallery-nav').css('width', windowWidth + 'px');
        } else {
            this.$container.css({
                width: windowWidth //, 'max-width': '100%'
            }).offset(function(i, coords) {
                return {'top' : coords.top, 'left' : 0};
            });
        }
    });

    Gallery.prototype.getOriginalImageSizes = function (img) {

        var tempImage = new Image(),
            width,
            height;

        if ('naturalWidth' in tempImage && 'naturalHeight' in tempImage) {
            width = img.naturalWidth;
            height = img.naturalHeight;
        } else {
            tempImage.src = img.src;
            width = tempImage.width;
            height = tempImage.height;
        }

        return {
            width: width,
            height: height,
        };
    };

    Gallery.prototype.initHorizontalMode = (function () {

		var horizontalScroll = this.$container.data('horizontal-scroll')
		,	height = this.$container.data('height')
		,	width = this.$container.data('width')
		,	offset = this.$container.data('offset')
		,	isMobile = parseInt($anyGallery.attr('data-is-mobile'))
		,	mouseWheelStep = 100
		,	touchStep = 100
		,	responsiveMode = 0
		,	tmpValue = 0
		,	self = this;

		if(this.$container.data('gridType') == 4) {
			return;
		}
        if (!horizontalScroll) {
            return;
        }
		if(horizontalScroll) {
			// if responsive mode = 'one by one' and mobile -> need to disable "responsive mode"
			if(horizontalScroll.responsiveMode == 1 && isMobile) {
				return;
			}
			if(horizontalScroll.mouseWheelStep) {
				tmpValue = parseInt(horizontalScroll.mouseWheelStep);
				if(!isNaN(tmpValue)) {
					mouseWheelStep = tmpValue;
				}
			}
			if(horizontalScroll.touchStep) {
				tmpValue = parseInt(horizontalScroll.touchStep);
				if(!isNaN(tmpValue)) {
					touchStep = tmpValue;
				}
			}
		}

        //Calculate max-height and margin
        if (!height) {
            var elementsHeight = this.$container.find('.grid-gallery-caption>a').map(function() {
                    return $(this).height();
                }).get(),
                height = Math.max.apply(null, elementsHeight);
        } else {
            if(offset && offset > 0){
                height = height + offset*2;
            }
        }

        if (width === 'auto') {
            this.$elements.each(function(index, el) {
                var $figure = $(el),
                    $image = $figure.find('img');
                    sizes = self.getOriginalImageSizes($image.get(0));
                    $image.css('max-width', 'none');
                if(!$image.hasClass('ggLazyImg'))
                    $figure.width(Math.floor((height / sizes.height) * sizes.width));
            });
        }

        //Fixed IE9 scroll bug
        var isIE9OrBelow = function() {
            return /MSIE\s/.test(navigator.userAgent) && parseFloat(navigator.appVersion.split("MSIE")[1]) < 10;
        }

        if(isIE9OrBelow()){
            this.$container.find('.grid-gallery-photos > *').css('display','table-cell');
        } else {
            this.$container.find('.grid-gallery-photos > *').css('display','inline-block');
        }

        this.$container.find('.grid-gallery-photos > *').css({
            margin:0,
            padding:0,
            float: 'none',
            animate: true,
            'vertical-align': 'middle',
            clear: 'right',
            //'margin-right': '-5px',
            'border': 'none',
            'max-width': 'none',
        });

        this.$container.find('.grid-gallery-photos').css({
            'font-size': 0,
        });

        this.$container.find('.grid-gallery-photos .grid-gallery-caption').css({
            float: 'none',
            'margin-left': 0,
        });

        // https://github.com/lanre-ade/jQuery-slimScroll
        height = height + 7; //This is scrollbar height;
        var slimScroll = this.$container.find('.grid-gallery-photos').slimScroll({
            height: height,
            width: 'auto',
            railVisible: true,
            alwaysVisible: true,
            allowPageScroll: true,
            axis: 'x',
            animate: true,
            color: horizontalScroll.color || '#000',
            opacity:(100 - horizontalScroll.transparency) * 0.01,
			'wheelStep': mouseWheelStep,
			'touchScrollStep': touchStep,
			'isMobile': isMobile,
			'ggSlimscrollHandler': function() {
				self.lazyLoadTriggerHandler();
			},
        });

        // Load more height fix
        if (slimScroll.height() < height) {
            slimScroll.height(height);
            slimScroll.parent().height(height);
        }

    });

    Gallery.prototype.initHorizontalGalleryType = (function () {
        if (this.$container.data('height') && String(this.$container.data('height')).indexOf('%') > -1) {
            var height = this.$elements.first().height();
            this.$elements.find('img').css({
                'max-height': height,
                'min-height': height,
            });
        }
        var self = this;
        setTimeout(function() {
            self.resizeHorizontalElements();
        }, 50);
    });

    Gallery.prototype.hidePreloader = function() {
        var preloadEnab = this.$container.attr('data-preloader'),
            preloader = this.$container.find('.gallery-loading'),
            galleryPhotos = this.$container.find('.grid-gallery-photos');

        preloader.hide();
        if(preloadEnab !== '' && preloadEnab === 'true') {
			setTimeout(function() {
				galleryPhotos.show().fadeTo("slow", 1, function() {
					galleryPhotos.css('opacity', '1');
				});
			}, 0);
        } else {
            galleryPhotos.show().fadeTo('fast', 1, function() {
                galleryPhotos.css('opacity','1');
            });
        }
    };

    Gallery.prototype.showGalleryParts = function(){
        this.$container.children('.hidden-item').removeClass('hidden-item');
    };

    Gallery.prototype.$getImagesFigureContainer = function(){
        return this.$container.find('figure.grid-gallery-caption');
    };

    Gallery.prototype.initSocialSharing = function(){
        if(!this.socialSharing || !this.socialSharing.enabled){
            return;
        }
        this.initGallerySocialSharing();
        this.initImageSocialSharing();
    };

    Gallery.prototype.initEvent = function($elements){
        $elements.find('.supsystic-social-sharing a.social-sharing-button').on('click',function (e) {
	        if( !e ) e = window.event;
        	e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            $(document).trigger('ssSocialClick', this);
            if (e.currentTarget.href.slice(-1) !== '#') {
                window.open(e.currentTarget.href, 'mw' + e.timeStamp, 'left=20,top=20,width=500,height=500,toolbar=1,resizable=0');
            }

	        var button = $(this)
	        ,   figureWrapper = button.closest('.grid-gallery')
	        ,   socialHtmlWrapper = figureWrapper.find('#social-share-html')
	        // ,   socialHtmlWrapper = figureWrapper.find('.supsystic-social-sharing')
	        ,   popupWrapper = socialHtmlWrapper.find('.supsystic-social-sharing-popup');

            if(button.hasClass('trigger-popup')){
            	if(socialHtmlWrapper.css('display') === 'none'){
		            socialHtmlWrapper.find('a').css('display', 'none');
		            socialHtmlWrapper.css('display','block');
		            popupWrapper.css('display','block');
	            }else{
		            socialHtmlWrapper.css('display','none');
		            popupWrapper.css('display','none');
	            }
            }
            if(button.closest('#pp_full_res').length){
	            var buttonOverlayWrapper = button.closest('#pp_full_res')
	            ,   buttonPopupWrapper = buttonOverlayWrapper.find('.supsystic-social-sharing-popup');
	            if(buttonPopupWrapper.css('display') === 'none'){
		            buttonPopupWrapper.css('display','block');
	            }else{
		            buttonPopupWrapper.css('display','none');
	            }
            }
	        $(document).on('click', function (e) {
		        if( !e ) e = window.event;
		        if (!$(e.target).is(".supsystic-social-sharing-popup")) {
			        socialHtmlWrapper.css('display','none');
			        popupWrapper.css('display','none');
			        socialHtmlWrapper.find('a').css('display', 'block');
		        }
	        });
        });
    };

    Gallery.prototype.getSocialButtons = function(wrapper_class, url, img_id, img_src, title, noCounter) {
        title = title || '';

		var html = this.$container.find('#social-share-html').html();

        if (html !== undefined && html.length){
            html = html.replace(/{url}/g, url).replace(/{title}/g, title);
            if(noCounter) {
                // cut counter div
                html = html.replace(/<div class="counter-wrap.*?>.*?<\/div>/g, '');
            }
        }

        return $('<div>', {
            class: wrapper_class,
            'data-img-thumbnail': img_src,
            'data-img-id': img_id,
            'data-img-title': title,
        }).html(html);
    };

    Gallery.prototype.getSocialButtonsByImage = function(wrapper_class, $element, popup) {

        var $img = $element.find('img'),
            imgSrc = $element.attr('href'),
            title = $element.attr('title'),
            $captionContainer = $element.find('.gg-image-caption'),
            url = location.href,
			imageId = null;

		if($element.attr('data-type') == 'link' || $element.attr('data-video-source') == 'youtube') {
			if($img.length) {
				if($img.attr('data-gg-real-image-href')) {
					imgSrc = $img.attr('data-gg-real-image-href');
				} else {
					imgSrc = $img.attr('src');
				}
			}
		}

		if($element && $element.attr('id') && $element.attr('id').split('-').pop()) {
			imageId = $element.attr('id').split('-').pop();
		}

        if ($captionContainer.length) {
            var caption = $.trim(
                $captionContainer.clone().html($captionContainer.html()
                    .replace(/<br\s*[\/]?>/gi, ' '))
                    .text()
                    .replace(/\s+/, ' ')
            );

            if (caption.length) {
                title = caption;
            }
        }

        if (imgSrc && imgSrc.indexOf('http') !== 0) {
            imgSrc = 'http:' + imgSrc;
        }

        function updateQueryStringParameter(uri, key, value) {
            var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
            var separator = uri.indexOf('?') !== -1 ? "&" : "?";
            if (uri.match(re)) {
                return uri.replace(re, '$1' + key + "=" + value + '$2');
            } else {
                return uri + separator + key + "=" + value;
            }
        }

        if (popup) {
            url = url.replace('#!', '?');
        }
		if(imageId) {
			url = updateQueryStringParameter(url, '_gallery', $element.attr('id'));
			url = encodeURIComponent(updateQueryStringParameter(url, 'shared-image', imageId));
		}

        return this.getSocialButtons(wrapper_class, url, $element.attr('id'), imgSrc, title, true);
    };

    Gallery.prototype.initGallerySocialSharing = function() {

        var gallerySharing = this.socialSharing.gallerySharing;

        if (!parseInt(gallerySharing.enabled)) {
            return;
        }

        var $socialButtons = this.getSocialButtons(
                '',
                this.socialButtonsUrl,
                '',
                '',
                this.$container.data('title')
            );


        if (gallerySharing.position == 'top' || gallerySharing.position == 'all') {
			var buttons = this.$container.find('.gallery-sharing-top')
                .html($socialButtons.html())
                .find('.supsystic-social-sharing');
            window.initSupsysticSocialSharing(buttons);
        }

        if (gallerySharing.position == 'bottom' || gallerySharing.position == 'all'){
			var buttons = this.$container.find('.gallery-sharing-bottom')
                .html($socialButtons.html())
                .find('.supsystic-social-sharing');
            window.initSupsysticSocialSharing(buttons);
        }

		this.initEvent(this.$container.find('.gallery-sharing-top,.gallery-sharing-bottom'));
    };

    //init social share for all images in gallery
    Gallery.prototype.initImageSocialSharing = function(){

        var imageSharing = this.socialSharing.imageSharing;

        if(!parseInt(imageSharing.enabled)){
            return;
        }

        var $images = this.$getImagesFigureContainer(),
            socialButtonsClass = 'supsystic-grid-gallery-image-sharing ' + imageSharing.wrapperClass,
            self = this,
            iconsEnabled = this.$container.data('icons');


        $images.each(function() {
            var $this = $(this),
                $el;

            if (!iconsEnabled) {
                $el = $this.parent();
            } else {
                $el = $this.find('a.hi-icon');
            }

            $this.append(
                self.getSocialButtonsByImage(socialButtonsClass, $el)
            );
        });

        this.correctImageSocialButtons($images.children("." + this.socialSharingWrapperClass));
        this.initEvent($images.children("." + this.socialSharingWrapperClass));
    };

    Gallery.prototype.correctImageSocialButtons = function($imageSharing){

        if(!$imageSharing.length){
            return;
        }
        var $example = $imageSharing.eq(0),
            correctCss = {};

        if($example.hasClass('vertical')){
            var buttonWidth = $example.find('.social-sharing-button').eq(0).outerWidth();
            correctCss.width = buttonWidth;
            $example.width(buttonWidth);
        }

        var width = $example.width();
        var height = $example.height();

        if($example.hasClass('center')){
            $.extend(correctCss,{'margin-left': '-' + (width/2) + 'px'})
        }
        if($example.hasClass('middle')){
            $.extend(correctCss,{'margin-top': '-' + (height/2) + 'px'})
        }

        $imageSharing.find('.social-sharing-button.print').on('click',function(){
            var image_url = $(this).closest('.supsystic-grid-gallery-image-sharing').data('img-url');
            window.open(image_url).print();
        });

        $imageSharing.find('.social-sharing-button.mail').on('click',function(){
            var $infoElement = $(this).closest('.supsystic-grid-gallery-image-sharing'),
                image_id = $infoElement.data('img-id'),
                image_title = $infoElement.data('img-title');
            var url = window.location.href.replace(window.location.hash,'') + '#' + image_id + '/';

            var src = 'mailto:adresse@example.com?subject=' + encodeURIComponent(document.title) + ',' + image_title + '&body=' + url;
            var iframe = $('<iframe id="mailtoFrame" src="' + src + '" width="1" height="1" border="0" frameborder="0"></iframe>');

            $('body').append(iframe);
            window.setTimeout(function(){
                iframe.remove();
            }, 500);
        });

        var self = this;
        $imageSharing.each(function(){

            $(this).css(correctCss);

            var thumbnail = $(this).data('img-thumbnail');

            if (thumbnail) {

                for(var sharingClass in self.socialSharingImageOperators){
                    var $button = $(this).find('.social-sharing-button.'+sharingClass);
                    if($button.length){
                        var img_url = $(this).data('img-url'),
                            img_id = $(this).data('img-id'),
							shareUrlObj = self.urlToObject($button.attr('href')),
							newHref = '';

						// set gallery image for share link
						shareUrlObj.params[self.socialSharingImageOperators[sharingClass]] = thumbnail;
						newHref = self.objectToUrl(shareUrlObj);

						if(img_url) {
							newHref = newHref.replace(
								img_url,
								self.addPopUpHashToUrl(self.socialButtonsUrl, img_id)
							);
						}

						$button.attr('href', newHref);
                    }
                }
            }
        });

    };

	Gallery.prototype.urlToObject = (function(strUrl) {
		if(!strUrl) {
			return null;
		}
		var posQ = strUrl.indexOf('?');
		if(posQ == -1) {
			return null;
		}
		var strQueryParams = strUrl.substr(posQ + 1)
		,	result = {
			'url': strUrl.substr(0, posQ),
			'params': {},
		}
		;
		strQueryParams.split("&").forEach(function(part) {
			var item = part.split("=");
			if(item.length >=2) {
				result.params[item[0]] = decodeURIComponent(item[1]);
			}
		});
		return result;
	});

	Gallery.prototype.objectToUrl = (function(specObj) {
		if(!specObj) {
			return null;
		}

		var resUrl = '';
		if(specObj.url) {
			resUrl = specObj.url;
		}
		if(specObj.params) {

			var paramParts = []
			,	paramKeys = Object.keys(specObj.params)
			,	indX = 0
			;
			for(indX = 0; indX < paramKeys.length; indX++) {
				paramParts.push(encodeURIComponent(paramKeys[indX]) + '=' + encodeURIComponent(specObj.params[paramKeys[indX]]));
			}
			resUrl = resUrl + '?' + paramParts.join('&');
		}
		return resUrl;
	});

    Gallery.prototype.addSocialShareToPopUp = function($element, $wrapper, addClass, fixed) {

        if(!this.socialSharing.enabled || !parseInt(this.socialSharing.popupSharing.enabled)){
            return;
        }

        var buttonsClass = 'supsystic-grid-gallery-image-sharing ' + addClass;

        if (!fixed) {
            buttonsClass +=' ' + this.socialSharing.popupSharing.wrapperClass;
        }

        var attachId = $element.attr('data-attachment-id');
        var attachObject = jQuery('body').find('.gg-link[data-attachment-id="'+attachId+'"]');
        var attachHtml = attachObject.find('.supsystic-social-sharing').html();
        $wrapper.find('.supsystic-grid-gallery-image-sharing').remove();
        $wrapper.prepend(this.getSocialButtonsByImage(buttonsClass, $element, true));
        $wrapper.find('.supsystic-social-sharing').html(attachHtml);

		// remove "Show all networks" button
		$wrapper.find('.supsystic-social-sharing .trigger-popup').remove();

        this.correctImageSocialButtons($wrapper.find('.supsystic-grid-gallery-image-sharing'));

        this.initEvent($wrapper.children("." + this.socialSharingWrapperClass));
    };

    Gallery.prototype.removePopUpHashFromUrl = function(url){
        var match = url.match(/gg-\d+-\d+/);
        return url.replace(url[url.indexOf(match)-1] + match,"");
    };

    Gallery.prototype.addPopUpHashToUrl = function(url, hash){
		if(!hash || !hash.length) {
            return url;
        }
        var prefix = '?';
        if(url.indexOf(prefix) != -1) prefix = '&';
        return url + prefix + hash;
    };

    Gallery.prototype.openHashPopUp = function(){
        var getElementId = function() {

            var search = window.location.search;
            if (search.match(/gg-\d+-\d+/)) {
                return search.match(/gg-\d+-\d+/);
            }

            var hash = window.location.hash;
            if (hash.match(/gg-\d+-\d+/)) {
                return hash.match(/gg-\d+-\d+/);
            }
        };

        var elementId = getElementId(),
			$element = this.$container.find('#' + elementId + ', [data-id="' + elementId + '"]').first();

        if($element.length){
			$element.click();
			var $figure;

			if ($element.hasClass('hi-icon')) {
				$figure = $element.closest('figure.grid-gallery-caption');
			} else {
				$figure = $element.children('figure');
			}

			if($figure.length) {
				$('html, body').animate({
					scrollTop: $figure.offset().top
				}, 100);
			}
        }
    };

	Gallery.prototype.updateQueryParams = function (url, params) {
		for (var param in params) {

			var re = new RegExp("[\\?&]" + param + "=([^&#]*)"),
				match = re.exec(url),
				delimiter,
				value = params[param];


			if (match === null) {

				var hasQuestionMark = /\?/.test(url);
				delimiter = hasQuestionMark ? "&" : "?";

				if (value) {
					url = url + delimiter + param + "=" + value;
				}

			} else {
				delimiter = match[0].charAt(0);

				if (value) {
					url = url.replace(re, delimiter + param + "=" + value);
				} else {
					url = url.replace(re, '');
					if (delimiter === '?' && url.length) {
						url = '?' + url.substr(1);
					}
				}
			}
		}

		return url;
	};

    Gallery.prototype.changePopUpHash = function(hash){

        var galleryId = this.$container.attr('data-gg-id')
        ,   galleryOpenPopupHashRegex = new RegExp('gg-' + galleryId + '(?:-(\\d+))*')
        ,   regexFoundGalleryImageId = galleryOpenPopupHashRegex.exec(hash)
		,   changedUrlDisabled = this.$container.attr('data-popup-disable-changed-url');

		if(changedUrlDisabled !== 'true') {
			// if image id not exits
			if (!regexFoundGalleryImageId || regexFoundGalleryImageId.length < 2 || !regexFoundGalleryImageId[1]) {
				return;
			}
			this.popupIsOpened = true;

			if (this.ignoreStateChange) {
				this.ignoreStateChange = false;
				return;
			}
			var queryParams = this.updateQueryParams(window.location.search, {'_gallery': hash}),
				stateUrl = window.location.pathname + queryParams;

			this.historyStateChange = true;

			if (!this.popupIsInit) {

				if (queryParams === document.location.search) {

					History.replaceState({
						type: 'sc-gallery',
						hash: hash,
						state: 'close'
					}, document.title, window.location.pathname + this.updateQueryParams(window.location.search, {'_gallery': null}));

					History.pushState({
						type: 'sc-gallery',
						hash: hash,
						state: 'init'
					}, document.title, stateUrl);

				} else {

					History.replaceState({
						type: 'sc-gallery',
						hash: hash,
						state: 'init'
					}, document.title, stateUrl);
				}

				this.popupIsInit = true;

			} else {

				if (this.disablePopupHistory) {
					History.replaceState({
						type: 'sc-gallery',
						hash: hash,
						state: 'change'
					}, document.title, stateUrl);
				} else {
					History.pushState({
						type: 'sc-gallery',
						hash: hash,
						state: 'change'
					}, document.title, stateUrl);
				}
			}

			this.historyStateChange = false;
		}
	};

    Gallery.prototype.clearPopUpHash = function() {
		this.historyStateChange = true;

		if (this.disablePopupHistory) {
			History.replaceState({
				type: 'sc-gallery',
				hash: '',
				state: 'close'
			}, document.title, window.location.pathname + this.updateQueryParams(window.location.search, {'_gallery': null}));
		} else {
			History.pushState({
				type: 'sc-gallery',
				hash: '',
				state: 'close'
			}, document.title, window.location.pathname + this.updateQueryParams(window.location.search, {'_gallery': null}));
		}

		this.historyStateChange = false;
		this.popupIsOpened = false;
	};

	Gallery.prototype.getRealImgSizeInBrowser = (function(arguments) {
		if(!arguments && !arguments.length) {
			return null;
		}
		if(arguments.length > 1) {
			returnType = arguments[1];
		}
		if(arguments.length) {
			$image = arguments[0];
		}

		var returnData = null
		,	boundRect = null;
		if($image && $image.length && $image[0].getBoundingClientRect) {
			boundRect = $image[0].getBoundingClientRect();
		}

		if(returnType == 'h') {
			if(boundRect && boundRect.height) {
				returnData = boundRect.height;
			} else {
				returnData = parseFloat($image.css('height'));
			}
		} else if(returnType == 'w') {
			if(boundRect && boundRect.width) {
				returnData = boundRect.width;
			} else {
				returnData = parseFloat($image.css('width'));
			}
		}

		return returnData;
	});

	Gallery.prototype.lazyLoadTriggerHandler = (function() {
		$(document).trigger('scroll');
	});
	Gallery.prototype.lazyLoadDistanceRefresh = (function(waitTime) {
		var self = this,
            galleryType = this.$container.data('gridType');

        if(typeof(waitTime) == 'undefined') {
            waitTime = 400;
        }

		// need run function once at every load
		if(self.ggLazyTimeOut) {
			clearTimeout(self.ggLazyTimeOut);
		}
		self.ggLazyTimeOut = setTimeout(function() {
            setTimeout(function() {
                $.each(self.$elements, function(index, el) {
                    var $el = $(el);
                    if ($el.data('grid-gallery-type') == 'polaroid'){
                        self.polaroidCaptionCalculate($el);
                    }
                });
            }, waitTime + 50);

			switch(galleryType) {
				case 4:
					$(document).trigger('ggMosaicResizedEvent');
					break;
				case 0:
                    if(typeof(self.setCaptionOnHoverImage) == 'function') {
                        self.setCaptionOnHoverImage();
                    }
					// if hidden images  not showing
					setTimeout(function() {
						self.lazyLoadTriggerHandler();
                        setTimeout(function() {
                            if(self.wookmark) {
                                self.wookmark.trigger('refreshWookmark');
                            }
                        }, 50);
					}, waitTime + 60);//450); // animation transition time
					break;
				case 1:
                    if(typeof(self.setCaptionOnHoverImage) == 'function') {
                        self.setCaptionOnHoverImage();
                    }
                    $.each(self.$elements, function(index, el) {
                        var $el = $(el);
                        if ($el.data('grid-gallery-type') == '3d-cube'){
                            self.changeImageHeightFor3dCubeEffect($el, $el.width(), ($el.find('img').length ? $el.find('img').height() : $el.height()));
                        }
                    });
				case 2:
				case 3:
				default:
					//self.initWookmark();
					// if hidden images  not showing
					setTimeout(function() {
						self.lazyLoadTriggerHandler();
						self.initWookmark();
					}, waitTime + 50);//450); // animation transition time
					break;
			}
		}, 100);
	});

	Gallery.prototype.initLazyLoad = (function() {
		var self = this
		,	hoverImgSrc = this.$container.data('image-on-hover');
		/*if(hoverImgSrc && hoverImgSrc.length) {
			// lazy load not work for image on hover
			return;
		}*/
        var showMoreCategory = this.$container.find('.showMoreCategory'),
            effect = this.$container.data('lazyload-effect'),
            duration = this.$container.data('lazyload-effect-duration');

        if(typeof(effect) == 'undefined') {
            effect = 'show';
            duration = 400;
        }
        var waitTime = effect == 'fadeIn' ? 200 : duration;

		self.ggLazyTimeOut = null;
		this.$container.find('.ggLazyImg').ggLazyLoad({
			'data_attribute': 'gg-real-image-href',
			'threshold': 50,
            'effect': effect,
            'effectspeed': duration,
            'skip_invisible': (showMoreCategory.length > 0),
			'load': function(event) {
				var image = $(this);
				self.lazyLoadDistanceRefresh(waitTime);
				if(self.$container.data('gridType') != 0) {
                    image.closest('div .crop').css('height', '');
                }
				image.closest('figure').css('height', 'auto');
				if(self.$container.data('gridType') == 2 && self.$elements) {
					setTimeout(function() {
						self.resizeElementHeight(image, image.closest('figure'));
					}, waitTime + 20);//460); // animation transition time + 20ms
				}
			},
		});
	});

    Gallery.prototype.init = (function () {

			this.$container.imagesLoaded().done($.proxy(function () {
            var self = this;
            this.setImagesHeight();
            $(document).trigger("GalleryBeforeInit", this);

            this.hidePreloader();
            this.showCaption();
            this.initRowsMode();
            this.initHorizontalGalleryType();
            this.initQuicksand();

            if(this.$container.attr('data-fullscreen') == 'true') {
                this.correctFullScreenWidthGallery();
                $(window).resize(function() {
                    self.correctFullScreenWidthGallery();
                });
            }

            this.initHorizontalMode();
            this.setOverlayTransparency();
            this.initCaptionCalculations();
            this.initCaptionEffects();
            this.hideTitleTooltip();
            this.initPagination();

            this.initPopup();

            this.setMouseShadow();
            this.setImageOverlay();

            this.loadFontFamily();
            this.hidePopupCaptions();
            this.preventImages();
            this.initWookmark();
            this.initCategories();
            this.setIconsPosition();

            this.correctMargin();
            this.initControll();
            this.showGalleryParts();
			this.initLazyLoad();

            this.initSocialSharing();


            // iOS Safari fix
            setTimeout(function() {
                if (self.wookmark) {
                    self.wookmark.trigger('refreshWookmark');
                }
            }, 500);

            $(document).trigger("GalleryAfterInit", this);

            setTimeout(function(){
                self.openHashPopUp();
            },500);

            // this.openHashPopUp();

            var galleryId = this.$container.attr('data-gg-id'),
				openByLinkRegexp = new RegExp('#gg-open-' + galleryId + '(\\-([\\d]+))*$');

			History.Adapter.bind(window, 'statechange', function(event) {
				var state = History.getState();

				// self.historyStateChange if true means manual update state and we need skip this event
				if (!self.historyStateChange) {

					if ((state.data.type !== 'sc-gallery' && self.popupIsOpened) ||
						(state.data.type === 'sc-gallery' && (state.data.state === 'close' || state.data.state ===  'hashchange') && self.popupIsOpened)
					) {

						if (self.popupType == 'pretty-photo') {
							this.$prettyPhoto && this.$prettyPhoto.close();
						}

						if (self.popupType == 'colorbox') {
							$.colorbox && $.colorbox.close();
						}

						if (self.popupType == 'photobox') {
							window._photobox && window._photobox.close();
						}

					}

					// On history open image
					if (state.data.type === 'sc-gallery' && state.data.hash && state.data.state !== 'close') {

						self.ignoreStateChange = true;

						var $el = self.$container.find('#' + state.data.hash + ', [data-id="' + state.data.hash + '"]').first();

						if (self.popupIsOpened) {

							if (self.popupType == 'pretty-photo' && this.$prettyPhoto) {
								var href = $el.attr('href'),
									index = this.$prettyPhoto.getImagesList().indexOf(href);
								this.$prettyPhoto.changePage(index);
							}

							if (self.popupType == 'colorbox') {
								$.colorbox.resizeResponsive($el);
							}

							if (self.popupType == 'photobox') {
								var images = window._photobox.getImages(),
									href = $el.attr('href');

								for (var i = 0; i < images.length; i++) {
									if (images[i][0] == href || images[i][0] == 'http:' + href || images[i][0] == 'https:' + href) {
										window._photobox.changeImage(i);
									}
								}
							}

						} else {
							$el.trigger('click');
						}

					}

				}

			});

			//check url and show popups
			//options "Open by link in popup"
			function checkUrl(){
				var hash = window.location.hash,
					matches = openByLinkRegexp.exec(hash);

				if (matches) {
					History.replaceState({
						type: 'sc-gallery',
						hash: '',
						state: 'hashchange'
					}, document.title, window.location.pathname);

					var position = matches[2] ? 'eq(' + (matches[2] - 1) + ')' : 'first';
					self.$container.find('.gg-link:' + position + ', .hi-icon:' + position).trigger('click');
				}
			}

            $(window).on('hashchange', function(event) {
				checkUrl();
            });

			$(document).ready(function () {
				checkUrl();
			});



        }, this));

        $(window).on('resize', $.proxy(function () {
            this.correctMargin();
            this.resizeHorizontalElements();
            this.initHorizontalMode();
        }, this));
    });

	Gallery.prototype.resizeHorizontalElements = (function () {
		var self = this;
		if(this.$container.data('gridType') == 2 && this.$elements) {
			this.$elements.each(function(){
				var element = $(this),
					image = element.find('img');
				if(image) {
					self.resizeElementHeight(image, element);
				}
			});
		}
	});

	Gallery.prototype.resizeElementHeight = (function (image, element) {
		var imageHeight = parseInt(image.css('height'));
		if(!isNaN(imageHeight) && !element.hasClass('initialized')) {
			element.css('height', Math.floor(imageHeight - 1) + 'px');
		}
        if(!image.hasClass('ggLazyImg')) {
            image.removeClass('ggNotInitImg');
            this.polaroidCaptionCalculate(element);
        }
	});

    window.initGridGallery = (function (el, autoInit) {
        var makeSelector = (function (el) {
            return '#' + el.id;
        });
        return new Gallery(makeSelector(el), autoInit);
    });

    window.contentLoaded = (function() {


        var $galleries = $(".grid-gallery:not('.initialized')"),
            $promise = new $.Deferred().resolve();

        if ($galleries.length > 0) {

            $.each($galleries, (function(i, el) {
                $promise = $promise.then(function() {
                    return new Gallery(el, true);
                });
            }));
        }

        $('.crop').css('display', 'block');

    });

    if (!init) {
		var hammer = new Hammer_gg(document)
		,	$anyGallery = $(".grid-gallery:first")
		,	isMobile = parseInt($anyGallery.attr('data-is-mobile'))
		;
		// only if mobile, because "mouse dragg" include for this event
		if(!isNaN(isMobile) && isMobile) {
			// On swipe click next prev button in active popup
			hammer.on('swipeleft swiperight', function(event) {
				if (event.type == 'swipeleft') {
					$("#colorbox:visible #cboxNext, .pp_pic_holder a.pp_arrow_next, #cboxOverlay:visible #pbNextBtn").click();
				} else {
					$("#colorbox:visible #cboxPrevious, .pp_pic_holder a.pp_arrow_previous, #cboxOverlay:visible #pbPrevBtn").click();
				}
			});
		}
		init = true;
	}

    $(document).ready(function () {
        contentLoaded();
    }).ajaxComplete(function() {
        contentLoaded();
    });

    if ( jQuery('body').hasClass('oceanwp-theme') ) {
		function oceanwpFixedFooter () {
			$("#main").css("min-height", "0px");
		};
		jQuery(window).resize(function() {
			oceanwpFixedFooter();
		});
		jQuery(document).ready(function () {
			setTimeout(function(){
				oceanwpFixedFooter();
			},3000);
		});
	}

	// added Gallery initialization by trigger
	$(document).on('ggFirInitialize', function() {
		contentLoaded();
	});

    //if a customer enter an e-mail for image link in gallery he'll get a mailto: link
    $('a.gg-link').each(function(){
        var gLink =  $(this).attr('href');
        var reg= /[0-9a-z_]+@[0-9a-z_]+\.[a-z]{2,5}/i;
		if(gLink) {
			var isEmail = gLink.match(reg);
			if(isEmail) {
				$(this).attr('href','mailto:' + isEmail[0]);
			}
		}
    });

    jQuery(document).ready(function(){
       setTimeout(function(){
          jQuery('body').find('.supsystic-social-sharing').each(function( key, value ){
                var summary = 0;
                jQuery(this).find('.social-sharing-button').each(function( key2, value2 ){
                   if (jQuery(this).parent().hasClass('supsystic-social-sharing-popup')) return;
                   var networks = jQuery(this).attr('data-networks');
                   networks = jQuery.parseJSON(networks);
                   var attachId = jQuery('.supsystic-social-sharing').eq(key).closest('[data-attachment-id]').attr('data-attachment-id');
                   if (typeof attachId != 'undefined') {
                      var nid = jQuery(this).attr('data-nid');
                      var counter = networks[attachId][nid];
                      if (parseInt(counter) && !isNaN(counter)) {
                        summary = summary + parseInt(counter);
                      }
                      var counterWrapper = '';
                      if (jQuery(this).hasClass('counter-standard')) {
                        jQuery(this).find('.counter-wrap.standard').remove('');
                        counterWrapper = '<div class="counter-wrap standard"><span class="counter">'+counter+'</span></div>';
                      }
                     if (jQuery(this).hasClass('counter-arrowed')) {
                        jQuery(this).find('.counter-wrap.arrowed').remove('');
                        counterWrapper = '<div class="counter-wrap arrowed"><span class="counter">'+counter+'</span></div>';
                      }
                      if (jQuery(this).hasClass('counter-white-arrowed')) {
                        jQuery(this).find('.counter-wrap.white-arrowed').remove('');
                        counterWrapper = '<div class="counter-wrap white-arrowed"><span class="counter">'+counter+'</span></div>';
                      }
                      var attachId = jQuery(this).append(counterWrapper);
                   }
                });
                summary = '<span>Shares</span> <span>'+summary+'</span>';
                jQuery(this).closest('a').find('.supsystic-social-sharing-total-counter.counter-wrap').html(summary);
          });
       }, 1000);
    });
}(jQuery));
