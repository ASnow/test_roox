(function () {
	var btn = document.getElementById('my-btn'),
		content = document.getElementById('content');
	btn.addEventListener('click', function () {
		var miniMessage = new gadgets.MiniMessage(0, content);
			miniMessage.createStaticMessage("Welcome to the OpenSocial widget!");
			miniMessage.createStaticMessage("Check developer tools 'sources' tab to see all resources that a gadget is using, including HTML, CSS, and JavaScript.");
			miniMessage.createStaticMessage("This message was generated with 'miniMessage' feature.");
	});
})();