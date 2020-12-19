/**
 * @module Rgpd
 * @description 
 * Managing cookies via categories.

 * @element .rgpd-manage-link - open the manage popin
 * 
 * @callback onexec(cat) - fired if at least 1 category is enabled.
 * @param cat - in checkbox val, is the id of the cookie ex 'stats'
 * @var strictmode if false, execute onexec event if no consent action in modal alert
 * @var cookieName name of the rgpd cookie 
 * @var cookieDuration duration of the rgpd cookie
 * 
 */

const Rgpd = onexec => {
	const cookieName = 'rgpd';
	const cookieDuration = 30;
	const strictmode = true;
	const root = document.documentElement || window;
	const clicktouch = ('ontouchstart' in root) ? 'touchstart' : 'click';
	const modal = document.querySelector('.rgpd-modal');
	const btn_accept = modal.querySelector('.btn-accept');
	const btn_refuse = modal.querySelector('.btn-refuse');
	const manage = document.querySelector('.rgpd-manage');
	const manage_box = manage.querySelector('.box');
	const btn_details = manage.querySelectorAll('.btn-detail');
	const btn_save = manage.querySelector('.btn-save');
	const checkboxes = manage.querySelectorAll('input[type="checkbox"]');
	const btn_close = manage.querySelector('.btn-close');
	const manage_links = document.querySelectorAll('.rgpd-manage-link');
	let scrollTop;
	let cats = {};
	
	const cookie = {
		create(name, value, days) {
			var date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			document.cookie = `${name}=${value}${days ? `; expires=${date.toGMTString()}` : ''}; path=/`; 
		},
		read(name) {
			const nameEQ = `${name}=`;
			for(let item of document.cookie.split(';')){
				while (item.charAt(0) === ' ') item = item.substring(1, item.length);
				if (item.indexOf(nameEQ) === 0) return item.substring(nameEQ.length, item.length); 
			}
			return null;
		},
		erase(name) {
			var hostname = document.location.hostname;
			if (hostname.indexOf('www.') === 0) hostname = hostname.substring(4);
			//hostname = hostname.substr(hostname.indexOf('.') + 1); //if subdomains
			document.cookie = `${name}=; domain=.${hostname}; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=`;
			document.cookie = `${name}=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/`;
		},
		eraseUnused() {
			for (let checkbox of checkboxes) {
				!checkbox.checked && checkbox.dataset.cookies.split(',').forEach(val => cookie.erase(val));
			}
		},
	};
	
	let consent = cookie.read(cookieName) ? true : false;

	// fire event onexec if cat == true
	const execute = () => {
		for (let key in cats) (cats[key] && typeof onexec === 'function') && onexec(key);
	}

	// set cookie obj status
	const status = () => checkboxes.forEach(item => cats[item.value] = item.checked ? true : false)

	const set_consent = () => {
		consent = true;
		modal.classList.remove('active');
		cookie.create(cookieName, JSON.stringify(cats), cookieDuration);
	}

  	const accept = () => {
		status();
		execute();
		set_consent();
  	}

	const denie = () => {
		checkboxes.forEach(checkbox => checkbox.checked = false)
		status();
		set_consent();
	}

	const save = () => {
		status();
		!consent && execute();
		set_consent();
		cookie.eraseUnused();
	}

 	const disableScroll = () => window.scrollTo(0, scrollTop);

	// init or load cookie obj
	if (consent === true) cats = JSON.parse(cookie.read(cookieName));
	else if (!strictmode){
		status();
		checkboxes.forEach(checkbox => cats[checkbox.value] = true);
		execute();
	} 
	else checkboxes.forEach(checkbox => cats[checkbox.value] = true);
    
    // init checkboxes
	for(let key in cats){
		for(let checkbox of checkboxes){
			if(checkbox.value == key) checkbox.checked = cats[key];
		}
 	}

	btn_details.forEach(btn => btn.onclick = () => {
		btn.classList.toggle('active');
		const aria_expanded = btn.classList.contains('active') ? true : false;
		btn.setAttribute('aria-expanded', aria_expanded);
	})

	btn_accept.onclick = () => accept();

	btn_refuse.onclick = () => denie();

	consent == true ? execute() : modal.classList.add('active');

	const clickoutside = e => !manage_box.contains(e.target) && close();
	
	const trap = {
		index: 0,
		els: [],
		isShifted: false,
		init(){
			manage.querySelectorAll('button,a,input').forEach(el => trap.els.push(el));
		},
		keyup(e){
			e.key === 'Escape' && close();
			if(e.key === 'Shift') {
				trap.isShifted = false;
			}
		},
		keydown(e){
			if(e.key === 'Shift') {
				trap.isShifted = true;
			}
        	if(e.key === 'Tab') {
           		if(e.preventDefault) e.preventDefault();
				else e.returnValue = false;
				trap.isShifted ? trap.index -- : trap.index ++;
				if(trap.index < 0) trap.index = trap.els.length-1;
				if(trap.index >= trap.els.length) trap.index = 0;
				trap.els[trap.index].focus();
			}
		},
		add(){
			btn_close.focus();
			document.addEventListener('keydown', trap.keydown, false);
			document.addEventListener('keyup', trap.keyup, false);
		},
		remove(){
			document.removeEventListener('keydown', trap.keydown);
			document.removeEventListener('keyup', trap.keyup);
		}
	}
	
	trap.init();
	
	const open = () => {
		status();
		modal.classList.remove('active');
		manage.classList.add('open');
		manage.addEventListener('animationend', e => {
			window.addEventListener(clicktouch, clickoutside, {once: true});
		}, {once: true});
		scrollTop = window.pageYOffset || window.scrollY;
		window.addEventListener('scroll', disableScroll);
		trap.add();
	}
	 
	const close = e => {
		if(!consent) modal.classList.add('active');
		manage.classList.add('close');
		window.removeEventListener(clicktouch, clickoutside)
		window.removeEventListener('scroll', disableScroll);
		btn_details.forEach(btn => btn.onclick = () => btn.classList.toggle('active'))
		manage.addEventListener('animationend', e => {
			manage.classList.remove('open');
			manage.classList.remove('close');
		}, {once: true});
		trap.remove();
	}
	
	manage_links.forEach(link => link.onclick = e => {
		e.stopPropagation();
		e.preventDefault();
		open();
	})
		 
	btn_save.onclick = () => {
		save();
		close();
	}
	
	btn_close.onclick = e => close(e);
};


export default Rgpd;
