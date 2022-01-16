(function($) {
	'use strict';
	
	$(document).ready(function() {
	
		/*-----------------------------------------------------------------------------------*/
		/*  Top Search Button
		/*-----------------------------------------------------------------------------------*/ 
		$('.top-search').click(function() {
			$('.topSearchForm').slideToggle();
			$(this).toggleClass('active');
			return false;
		});
		
		/*-----------------------------------------------------------------------------------*/
		/*  If menu has submenu
		/*-----------------------------------------------------------------------------------*/ 
		$('.main-navigation').find('li').each(function(){
			if(jQuery(this).children('ul').length > 0){
				jQuery(this).append('<span class="indicator"></span>');
			}
		});
		
		/*-----------------------------------------------------------------------------------*/
		/*  Detect Mobile Browser
		/*-----------------------------------------------------------------------------------*/
			var mobileDetect = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	
		/*-----------------------------------------------------------------------------------*/
		/*  Menu Effect
		/*-----------------------------------------------------------------------------------*/ 
			var hoverTimeout;
			$('.main-navigation ul > li.menu-item-has-children, .main-navigation ul > li.page_item_has_children').hover(function() {
				var $self = $(this);
				hoverTimeout = setTimeout(function() {
					$self.find('> ul.sub-menu, > ul.children').slideDown(400);
				}, 300);
			}, function() {
				clearTimeout(hoverTimeout);
				$(this).find('> ul.sub-menu, > ul.children').slideUp(200);
			});
		
		/*-----------------------------------------------------------------------------------*/
		/*  Sidebar for mobile
		/*-----------------------------------------------------------------------------------*/ 
		$('.sidebar-toggle').click(function() {
			$('#secondary aside').slideToggle();
			$(this).toggleClass('active');
			return false;
		});
		
		/*-----------------------------------------------------------------------------------*/
		/*  Detect Mobile Browser
		/*-----------------------------------------------------------------------------------*/ 
		if ( !mobileDetect ) {
			/*-----------------------------------------------------------------------------------*/
			/*  Scroll To Top
			/*-----------------------------------------------------------------------------------*/ 
				$(window).scroll(function(){
					if ($(this).scrollTop() > 800) {
						$('#toTop').fadeIn();
					} 
					else {
						$('#toTop').fadeOut();
					}
				}); 
				$('#toTop').click(function(){
					$('html, body').animate({ scrollTop: 0 }, 1000);
					return false;
				});
				
			/*-----------------------------------------------------------------------------------*/
			/*  Sticky Sidebar
			/*-----------------------------------------------------------------------------------*/ 
				$('.site-content, .site-header').theiaStickySidebar({
					additionalMarginTop: 50
				});
			
		} // End detect mobile browser
	
	});
	
})(jQuery);