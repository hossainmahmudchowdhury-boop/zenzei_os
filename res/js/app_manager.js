function launchApp(name,link){
	
	
	var container = document.createElement("div");
	var controls = document.createElement("div");
	var appname = document.createElement("div");
	var cut = document.createElement("div");
	var viewer = document.createElement("iframe");
	
	
	container.setAttribute("id","appPlayer");
	controls.setAttribute("id","controls");
	appname.setAttribute("id","appName");
	cut.setAttribute("id","cut");
	cut.setAttribute("onclick","$('#appPlayer').remove()");
	viewer.setAttribute("id","appViewer");
	
	
	$('#desktop').appendChild(container);
	container.appendChild(controls);
	controls.appendChild(appname);
	controls.appendChild(cut);
	container.appendChild(viewer);
	
	
	appname.innerHTML = name;
	appname.addEventListener("mousedown",function(e){
		e.preventDefault();
	});
	cut.innerHTML = '<i class="fa fa-times-circle-o"></i>';
	viewer.src = link;
	hide(appsDrawer)
	display(container);
	
}


function msg(txt){
	
	
	
	var container = document.createElement("div");
	var head = document.createElement("div");
	var cut = document.createElement("div");
	var msg = document.createElement("div");
	
	
	
	container.setAttribute("id","msgBox");
	head.setAttribute("id","head");
	cut.setAttribute("id","cut");
	cut.setAttribute("onclick","$('#msgBox').remove()");
	msg.setAttribute("id","msg");
	
	
	
	$('#desktop').appendChild(container);
	container.appendChild(head);
	container.appendChild(cut);
	container.appendChild(msg);
	
	
	head.innerHTML = '<i class="fa fa-info-circle"></i> &nbsp; Message';
	cut.innerHTML = '<i class="fa fa-times-circle-o"></i>';
	msg.innerHTML = txt;
	
	display(container);
}
