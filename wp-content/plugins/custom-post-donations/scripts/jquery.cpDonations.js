(function($) {
	$.fn.cpdonation = function() {
		return this.each(function() {
			// Donation widget elements
			var widget = $(this);
			var itemNameEl = $(this).find('.item_name');
			var amountEl = $(this).find('.amount');
			
			var amount2El = $(this).find('.amount2');
			var fixedAmountEl = $(this).find('.fixed-amount');
			var additionalFixedEl = $(this).find('.additional-fixed');
			var quantityEl = $(this).find('.quantity');
			var categoryEl = $(this).find('.donation_category');
			var commentsEl = $(this).find('.comments');
			
			var totalAmountEl = $(this).find('.total_amt');
			var submitButton = $(this).find('.paypalSubmit');
			var cpQuantityEl = $(this).find('.cp_quantity');
			
			// Default values
			var itemName = itemNameEl.val();
			var defaultDonation = fixedAmountEl.html();	
			var q = 0;
			
			if(additionalFixedEl) {
				var additionalFixed = parseFloat(additionalFixedEl.html());
				if(!isNaN(additionalFixed)) {
					var initialAmount = parseFloat(defaultDonation) + additionalFixed;
					totalAmountEl.html(initialAmount);
					amountEl.val(initialAmount);
				}
			}

			amountEl.on('keydown', function(e){if(!((e.keyCode > 47 && e.keyCode < 59) || ( e.keyCode >= 96 && e.keyCode <= 105 ||  e.keyCode == 110 || e.keyCode == 190) || e.keyCode == 8)){e.preventDefault();}});
			
			// Type 1
			amountEl.on('keyup', function(){												   
			var donation = amountEl.val();
			if(!isNaN(donation)){
				var total = donation;
				amountEl.val(total);
				totalAmountEl.html(total);
				if(additionalFixedEl) {
					if(!isNaN(additionalFixed)) {							
						total = total + additionalFixed;
						totalAmountEl.html(total);
						amountEl.val(total);
					}
				}
				}else{
					totalAmountEl.html(defaultDonation);
				} 
			});
			
			//Type 2
			amount2El.on('keyup', function(){ 	  
				var donation = parseFloat(fixedAmountEl.html());
				var quantity = (q != 0) ? q : 1;
				var additionalDonation = parseFloat(amount2El.val());
				if(!isNaN(additionalDonation)){
					var total = additionalDonation+(donation*quantity);
					amountEl.val(total);
					totalAmountEl.html(total);
					if(additionalFixedEl) {
						if(!isNaN(additionalFixed)) {							
							total = total + additionalFixed;
							totalAmountEl.html(total);
							amountEl.val(total);
						}
					}
				}else{
					totalAmountEl.html(defaultDonation);
				}	
			});
			
			//Type 3 and Type 4
			quantityEl.change(function(){ 				  
				//amount2El.val('');						
				var quantity = (parseFloat($(this).find('option:selected').val()) > 1) ? parseFloat($(this).find('option:selected').val()) : 1;
				q = quantity;
				if(!isNaN(quantity)){
					var total = quantity*parseFloat(fixedAmountEl.html())+amount2El.val()*1;
					cpQuantityEl.val(quantity);
					if(additionalFixedEl) {
						additionalFixed = parseFloat(additionalFixedEl.html());
						if(!isNaN(additionalFixed)) {
							total = total + additionalFixed;
						}
					}
					amountEl.val(total);
					totalAmountEl.html(total);
				}else{
					totalAmountEl.html(defaultDonation);
				}	
			});
			
			//Submit
			submitButton.on('click', function() {
				var quantity = cpQuantityEl.val();
				if (quantity != '0') {
					itemNameEl.val(itemName + ' (quantity ' + quantity + ')');	
				}
				if(typeof(categoryEl.val()) != 'undefined') {
					var tempName = itemNameEl.val();
					itemNameEl.val(tempName + ' Category: ' + categoryEl.val());
				}
				if(typeof(commentsEl.val()) != 'undefined') {
					var tempName = itemNameEl.val();
					itemNameEl.val(tempName + ' Comments: ' + commentsEl.val());
				}
				widget.submit();										 
			});
		});
	}
})(jQuery);

jQuery(document).ready(function() {
	jQuery('.cpDonation').cpdonation();
});