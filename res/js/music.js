function avl_pass(){
	var passInput = $('#osPass');
	if(!passInput) return;

	passInput.onkeydown = function(e){
		if(e.keyCode === 13 || e.key === 'Enter'){
			e.preventDefault();
			if(!passInput.value || passInput.value.trim().length === 0){
				alert('Password cannot be empty');
				return;
			}
			checkPass();
		}
	};

	passInput.onchange = function(){
		if(passInput.value && passInput.value.trim().length > 0){
			passInput.value = passInput.value.trim();
		}
	};
}
function submitLogin(){
	var passInput = $('#osPass');
	if(!passInput || !passInput.value || passInput.value.trim().length === 0){
		alert('Password cannot be empty');
		return false;
	}
	return checkPass();
}
function checkPassword_isset(){
	if(!localStorage.name || localStorage.name === "undefined"){
		localStorage.name = "Zenzei";
	}
	var passkey = localStorage.password;
	if(passkey===undefined || passkey === "" || passkey === null){
		var str = "admin123";
		localStorage.password = window.btoa(str);
		return true;
	}
	return false;
}

function initSystem(){
	checkPassword_isset();
	loadBackground();
	if(typeof setTime === 'function'){
		setTime();
	}
	if(typeof checkNet === 'function'){
		checkNet();
	}
	if(typeof unlockOS === 'function'){
		unlockOS();
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initSystem);
} else {
	initSystem();
}

function avl_Calc(){
	$('#input').addEventListener('keypress',function(e){
		if(e.keyCode==13){
			
				document.calculator.ans.value = eval(document.calculator.ans.value);
				e.preventDefault();
				
			}
	});
	
}
function calcClear(){
	$('#input').value = '';
}

function lockOS(){
	checkPassword_isset();
	disableAll();
	show(lockScreen);
}
function unlockOS(){
	hide(lockScreen);
	enableAll();
}
function comenu(event){
	var x = event.clientX + 1;
	var y = event.clientY + 1;
	$('#contextmenu').style.display = 'block';
	$('#contextmenu').style.position = 'absolute';
	$('#contextmenu').style.left = x + 'px';
	$('#contextmenu').style.top = y + 'px';
}
function refreshOS(){
	
}
function checkPass(){
	var storedPassword = localStorage.password;
	var accesskeyOS = $('#osPass') ? $('#osPass').value.trim() : '';

	try {
		if(!storedPassword || storedPassword === 'undefined') {
			storedPassword = window.btoa('admin123');
			localStorage.password = storedPassword;
		}
		var passkey = window.atob(storedPassword);
		if(accesskeyOS === passkey || accesskeyOS === 'admin123' && passkey === 'admin123'){
			unlockOS();
			if($('#osPass')) $('#osPass').value = '';
			return true;
		}
	} catch (err) {
		console.warn('Password decode failed, resetting default password.', err);
		localStorage.password = window.btoa('admin123');
		if(accesskeyOS === 'admin123'){
			unlockOS();
			if($('#osPass')) $('#osPass').value = '';
			return true;
		}
	}

	alert("Invalid Password");
	return false;
	
}

function resetSettings(){
	var panels = ['accountPanel','bgPanel','timePanel','personifyPanel','aboutPanel'];
		for(var i=0;i<panels.length;i++){
			document.getElementById(panels[i]).style.display = 'none';
		}
		show(defaultPanel);
}
function changePass(){
	//getting the current password
	var initialPass = window.atob(localStorage.password);
	//confirming from user
	var currentPass = prompt("Enter old password","********");
	if(currentPass==initialPass){
		var newPass = prompt("Enter new Password");
		if(newPass.length < 8){
			alert("Password must be greater  than 8 characters!");
			return newPass;
		}
		else{
		localStorage.password = window.btoa(newPass);
		alert("Password changed successfully!");	
		}
		
	}
	else{
		alert("Old password is wrong!\n Try again");
		return false;
	}
}
function setbg(event){
	var file = event.target.files && event.target.files[0];
	if(!file || !file.type || file.type.indexOf('image/') !== 0) return;
	var reader = new FileReader();
	reader.onload = function(){
		localStorage.background = reader.result;
		applyBackground(reader.result);
		if($('#previewer')) $('#previewer').src = reader.result;
	};
	reader.readAsDataURL(file);
}
function applyBackground(url){
	var backgroundUrl = url || 'res/assets/background.png';
	document.body.style.backgroundImage = 'url("' + backgroundUrl.replace(/"/g, '\\"') + '")';
}
function loadBackground(){
	applyBackground(localStorage.background || 'res/assets/background.png');
	if($('#previewer') && localStorage.background){
		$('#previewer').src = localStorage.background;
	}
}
function changeName(){
	var name = prompt("Enter name:",localStorage.name);
	if(name.length==0 || name=="" ||name===undefined){
		alert("Name can't be empty");
		return changeName();
	}
	else{
	localStorage.name = name;
	alert('Name saved as: "'+name+'"')
	}
	
}
function clrVid(){
	$('#vidPlayer').src = '';
	$('#vidUploader').value = '';
	$('#vidInfo').innerHTML = '';
	cut(vidCollection);
	show(vidPlayer);
	}
function getVideo(){
	clrVid();
	cut(vidPlayer);
	show(vidCollection);
}
function playVideo(event){
	var video = event.target.files[0];
	var vidname = video.name;
	var vidtype = video.type;
	var url = URL.createObjectURL(video);
	if(vidtype=="video/x-ms-wmv"){
		console.log("Unsupported format: "+vidtype);
		alert("Unsupported format: "+vidtype);
		$('#vidUploader').click();
	}
	else{
	$('#vidPlayer').src = url;
	$('#vidInfo').innerHTML = '<marquee>'+vidname+'</marquee>';
	}
	
	
	cut(vidCollection);
	show(vidPlayer);
	}

	//audio player
	function clrAud(){
	$('#audPlayer').src = '';
	$('#audUploader').value = '';
	$('#audInfo').innerHTML = '';
	$('#musicURL').value = "";
	cut(audCollection);
	show(audPlayer);
	show(musicIcon);
	}
	function getAudio(){
	clrAud();
	cut(audPlayer);
	cut(musicIcon);
	show(audCollection);
	}
	function avlImport(){
		$('#musicURL').addEventListener('keypress',function(e){
		if(e.keyCode==13){
			var link = $('#musicURL').value;
			if(link.length==0 || link==""){
				alert('URL cannot be empty');
			 }
			else{
				importURL();
		  }
		}
	  });
	}
	function importURL(){
		var link = $('#musicURL').value;
		$('#audPlayer').src = link;
		$('#audInfo').innerHTML = '<marquee>'+link +'</marquee>';
	
	
	
	cut(audCollection);
	show(audPlayer);
	show(musicIcon);
	}
	function playAudio(event){
	var audio = event.target.files[0];
	var audname = audio.name;
	var audtype = audio.type;
	var url = URL.createObjectURL(audio);
	$('#audPlayer').src = url;
	$('#audInfo').innerHTML = '<marquee>'+audname +'</marquee>';
	
	
	
	cut(audCollection);
	show(audPlayer);
	show(musicIcon);
	}
	//terminal 
	function avl_terminal(){
	
	$('#terminalInput').addEventListener('keypress',function(e){
		if(e.keyCode==13){
			var command = $('#terminalInput').value;
				listenCmd(command);
				e.preventDefault();
			}
	});
}
function avl_print(){
	$('#notepad').addEventListener('keypress',function(e){
		if(e.ctrlKey && e.keyCode==80){
			printNotepad();
				
				e.preventDefault();
			}
			if(e.ctrlKey && e.keyCode==83){
				saveFile();
				e.preventDefault();
			}
	});
}
function clrTerminal(){
	$('#terminalInput').value = '';
	$('#terminalOutput').innerHTML = '';
}
function checkNet(){
	setInterval(function(){
		var net = navigator.onLine;
	if(net===true){
		$('#netChecker').innerHTML = '<i class="fa fa-wifi"></i>';
		
		isConnected = true;
	} else{
		$('#netChecker').innerHTML = ' <span class="fa-stack "><i class="fa fa-wifi fa-stack-1x"></i><i style="color:red" class="fa fa-ban fa-stack-2x text-danger"></i></span>'
		isConnected = false;
	  }
	},100)
}
function resetClock(){
	var panels = ['stopwatch','alarm','timer'];
		for(var i=0;i<panels.length;i++){
			document.getElementById(panels[i]).style.display = 'none';
		}
		show(defaultClockPanel);
}
