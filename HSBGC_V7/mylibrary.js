function objcopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function url2array() {
	var arr = [];
	var strUrl = location.search;
	if (strUrl.indexOf('?') != -1) {
		var allData = strUrl.split("?")[1].split("&");
		for (var i = 0; i < allData.length; i++) {
			var data = allData[i].split("=");
			arr[data[0]] = decodeURIComponent(data[1]);
		}
	}
	return arr;
}

function array2url(arr) {
	var allData = [];
	for (var i in arr) {
		allData.push(i + '=' + encodeURIComponent(arr[i]));
	}
	var strUrl = allData.length != 0 ? ('?' + allData.join('&')) : '';
	var url = location.href.split('?')[0];
	window.history.pushState({}, 0, url + strUrl + location.hash);
}

var download = function () {
	let a = document.createElement("a");
	a.style = "display: none";
	return function (data, fileName) {
		let json = JSON.stringify(data, null, '\t'),
			blob = new Blob([json], {
				type: "octet/stream"
			}),
			url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = fileName;
		a.click();
		window.URL.revokeObjectURL(url);
	};
}();

function openfile(url, callback) {
	if (typeof callback == "undefined") {
		callback = function (str) {};
	}
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", function () {
		if (oReq.status != 404) {
			callback(this.responseText);
		} else {
			callback('{}');
		}
	});
	oReq.addEventListener("error", function () {
		callback('{}');
	});
	oReq.open("GET", url);
	oReq.send();
}

function generator(genfunc) {
	var g = genfunc();

	function next() {
		let res = g.next();
		if (!res.done) {
			if (typeof res.value.argsfront != 'object') res.value.argsfront = [];
			if (typeof res.value.argsback != 'object') res.value.argsback = [];
			res.value.nextfunc(...res.value.argsfront, function (...args) {
				res.value.cbfunc(...args);
				next();
			}, ...res.value.argsback);
		}
	}
	next();
}

function merge_sort(arr, compare) {
	if (typeof compare == 'undefined') {
		compare = function (a, b) {
			return a < b;
		};
	}
	let a = arr;
	let len = a.length;
	let b = [];
	for (let seg = 1; seg < len; seg += seg) {
		for (let start = 0; start < len; start += seg + seg) {
			let low = start,
				mid = Math.min(start + seg, len),
				high = Math.min(start + seg + seg, len);
			let k = low;
			let start1 = low,
				end1 = mid;
			let start2 = mid,
				end2 = high;
			while (start1 < end1 && start2 < end2)
				b[k++] = compare(a[start1], a[start2]) ? a[start1++] : a[start2++];
			while (start1 < end1)
				b[k++] = a[start1++];
			while (start2 < end2)
				b[k++] = a[start2++];
		}
		let temp = a;
		a = b;
		b = temp;
	}
	for (let i = 0; i < len; i++)
		b[i] = a[i];
}