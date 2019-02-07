var job;
var monster;
var arc;
var ioset = {};
var iohtml = {};
var lang = {};

function texttoobj(objkey) {
	let delstr = function (t) {
		t.value = t.value.replace(/[^\d]/g, '');
		return (0 + t.value) * 1;
	};
	let obj = {};
	for (let key in ioset[objkey]) {
		if (typeof ioset[objkey][key] == 'object') {
			obj[key] = [];
			let len = ioset[objkey][key].length;
			for (let i = 0; i < len; i++) {
				obj[key][i] = delstr(iohtml[objkey][key][i].text);
			}
		} else {
			obj[key] = delstr(iohtml[objkey][key].text);
		}
	}
	return obj;
}

function objtotext(objkey, obj) {
	for (let key in ioset[objkey]) {
		if (typeof ioset[objkey][key] == 'object') {
			let len = ioset[objkey][key].length;
			for (let i = 0; i < len; i++) {
				iohtml[objkey][key][i].text.value = obj[key][i];
			}
		} else {
			iohtml[objkey][key].text.value = obj[key];
		}
	}
}

function setpoint(lv) {
	if (lv <= 0)
		return 0;
	else if (lv <= 4)
		return 1 << (lv - 1);
	else if (lv <= 9)
		return (lv - 3) * 5;
	else
		return (lv - 10) * 15 + 35;
}

function _sumpoint() {
	let sumpoint = [0];
	for (let i = 1; i <= 15; i++)
		sumpoint[sumpoint.length] = setpoint(i) + sumpoint[i - 1];
	return sumpoint;
}

var sumpoint = _sumpoint();

var min = Math.min;
var max = Math.max;

function effect(lv, m) {
	return lv * m + (lv - 5) * (lv > 5);
}

function build_data(nowlevel, gain, level) {
	let sp = 0;
	for (let i = 0; i < level.length; i++)
		sp += sumpoint[nowlevel[i]] - sumpoint[level[i]];
	return {
		"point": sp,
		"gain": gain,
		"level": objcopy(nowlevel)
	};
}

function clear_table(matrix) {
	merge_sort(matrix, function (a, b) {
		return a.point == b.point ? a.gain < b.gain : a.point < b.point;
	});

	for (let i = 1; i < matrix.length; i++)
		while (i < matrix.length && matrix[i - 1].gain >= matrix[i].gain)
			matrix.splice(i, 1);
	return matrix;
}

function build_table(base, level, formula, disabled) {
	let matrix = [];
	let nowlevel = level.slice(0);
	let p = 0,
		ll = level.length;
	if (disabled === undefined) {
		disabled = [];
		for (let i = 0; i < ll; i++)
			disabled.push(0);
	}

	while (p < ll) {
		p = 0;
		matrix.push(build_data(nowlevel, formula(nowlevel, base, level), level));
		while (p < ll) {
			if (++nowlevel[p] > !disabled[p] * 15) {
				nowlevel[p] = level[p];
				p++;
			} else
				break;
		}
	}
	return clear_table(matrix);
}

function merge_table(a, b) {
	let al = a.length;
	let bl = b.length;
	let matrix = [];
	for (let ai = 0; ai < al; ai++) {
		for (let bi = 0; bi < bl; bi++) {
			matrix.push({
				"point": a[ai].point + b[bi].point,
				"gain": a[ai].gain * b[bi].gain,
				"level": [].concat(a[ai].level, b[bi].level)
			});
		}
	}
	return clear_table(matrix);
}

var disabled = [
	[
		[0, 0, 1, 1, 1],
		[0, 0, 1, 1, 1]
	],
	[
		[0, 0, 0, 0, 0],
		[1, 1, 0, 1, 0]
	],
	[
		[0, 0, 0, 1, 1],
		[0, 0, 0, 1, 1]
	],
	[
		[0, 0, 0, 1, 1],
		[0, 0, 0, 1, 1]
	]
];

var ioid = ["base", "inlevel", "outlevel"];
var abilitystring = [];

function jobset(j) { //切換職業選擇
	job = j;
	let setio = function (obj, s, b) {
		obj.label.innerHTML = b ? '' : s + '：';
		obj.text.disabled = b;
	};


	for (let io = 0; io < 3; io++)
		for (let i = 0; i < 5; i++)
			setio(iohtml[ioid[io]]['ability'][i], abilitystring[j][i], disabled[j][io < 1 ? io : 1][i]);
}

function monsterset(m) {
	monster = m;
}

function arcset(a) {
	arc = a;
}

function calculate() { //開始計算
	let data = {
		base: texttoobj('base'),
		other: texttoobj('other'),
		inlevel: texttoobj('inlevel'),
		outlevel: {
			"attack": '',
			"arc": '',
			"ability": ['', '', '', '', ''],
			"critical": '',
			"criticaldamage": '',
			"ignore": '',
			"total": '',
			"boss": ''
		},
		explain: {
			"condition": '',
			"point": '',
			"gain": 1.0,
			"gain2": 1.0
		}
	};

	let matrix = [
		build_table([data.base.attack],
			[data.inlevel.attack],
			function (nowlevel, base, level) {
				let P = max(10, base[0]);
				let N = 3 * (nowlevel[0] - level[0]);
				return 1 + N / P;
			}
		),
		build_table([data.base.arc, data.other.arc],
			[data.inlevel.arc, 15],
			[function (nowlevel, base, level) {
				let F = function (lv) {
					return lv * 5 + (lv - 10) * 5 * (lv > 10);
				};
				let P = base[0];
				let N = F(nowlevel[0]) - F(level[0]);
				let A = P + N;
				let FA = function (A) {
					let B = A / base[1] * 100;
					if (B < 10) return 10;
					else if (B < 30) return 30;
					else if (B < 50) return 60;
					else if (B < 70) return 70;
					else if (B < 100) return 80;
					else if (B < 110) return 100;
					else if (B < 130) return 110;
					else if (B < 150) return 130;
					else return 150;
				}
				let PA = FA(P);
				let AA = FA(A);
				console.log(AA, PA, AA / PA);
				return AA / PA;
			}, function () {
				return 1;
			}][arc]
		),
		build_table(data.base.ability,
			data.inlevel.ability,
			[function (nowlevel, base, level) {
				let P = max(20, 4 * base[0] + base[1]);
				let N = 30 * (4 * (nowlevel[0] - level[0]) + (nowlevel[1] - level[1]));
				return 1 + N / P;
			}, function (nowlevel, base, level) {
				let P = 545 + base[0];
				let A = (P + (base[1] - P) * 0.8) / 3.5 + base[4];
				let Q = 100 + base[2];
				let N = (base[1] - base[3]) / Q * (Q + (nowlevel[2] - level[2]) * 2) + base[3];
				let B = (P + (N - P) * 0.8) / 3.5 + base[4] + 30 * (nowlevel[4] - level[4]);
				return B / A;
			}, function (nowlevel, base, level) {
				let P = max(24, 4 * base[0] + base[1] + base[2]);
				let N = 30 * (4 * (nowlevel[0] - level[0]) + (nowlevel[1] - level[1]) + (nowlevel[2] - level[2]));
				return 1 + N / P;
			}, function (nowlevel, base, level) {
				let P = max(12, base[0] + base[1] + base[2]);
				let N = 30 * ((nowlevel[0] - level[0]) + (nowlevel[1] - level[1]) + (nowlevel[2] - level[2]));
				return 1 + N / P;
			}][job],
			disabled[job][1]),
		build_table([data.base.critical, data.base.criticaldamage],
			[data.inlevel.critical, data.inlevel.criticaldamage],
			function (nowlevel, base, level) {
				let B = 10000 + base[0] * (35 + base[1]);
				let C = min(100, base[0] + (effect(nowlevel[0], 1) - effect(level[0], 1)));
				let D = 10000 + C * (35 + base[1] + (nowlevel[1] - level[1]));
				return D / B;
			}),
		build_table([data.base.total, data.base.boss, data.base.ordinary],
			[data.inlevel.total, data.inlevel.boss, 15],
			[function (nowlevel, base, level) {
				let P = 100 + base[0] + base[1];
				let N = 3 * (nowlevel[0] - level[0]) + (effect(nowlevel[1], 3) - effect(level[1], 3));
				return 1 + N / P;
			}, function (nowlevel, base, level) {
				let P = 100 + base[0] + base[2];
				let N = 3 * (nowlevel[0] - level[0]);
				return 1 + N / P;
			}][monster])
	];
	let N_attack = (100 - data.base.ignore) * data.other.defence;
	let P_attack = N_attack / (1 - 0.03 * data.inlevel.ignore);
	let S_attack;
	for (S_attack = data.inlevel.ignore; S_attack < 16; S_attack++) {
		N_attack = P_attack * (1 - 0.03 * S_attack);
		if (N_attack < 10000)
			break;
	}
	let M_attack = [];
	for (; S_attack < 16; S_attack++)
		M_attack.push(build_data([S_attack], 1 + 0.03 * S_attack * P_attack / (10000 - N_attack), [data.inlevel.ignore]));
	let L_attack = M_attack.length;
	if (L_attack != 0) {
		let len;
		while (matrix.length > 2) {
			len = [];
			let mlen = matrix.length;
			for (let i = 0; i < mlen; i++) {
				len.push(matrix[i].length);
			}
			let minlen = 1e10;
			let mine;
			for (let i = 1; i < mlen; i++) {
				if (len[i - 1] * len[i] < minlen) {
					minlen = len[i - 1] * len[i];
					mine = i;
				}
			}
			matrix.splice(mine - 1, 2, merge_table(matrix[mine - 1], matrix[mine]));
		}

		len = [matrix[0].length, matrix[1].length];
		let dlen = [matrix[0][0].level.length, matrix[1][0].level.length];
		for (let k = 0; k < L_attack; k++) {
			for (let i = 0; i < len[0]; i++) {
				for (let j = 0; j < len[1]; j++) {
					let point = matrix[0][i].point + matrix[1][j].point + M_attack[k].point;
					if (data.other.point >= point) {
						let gain = matrix[0][i].gain * matrix[1][j].gain * M_attack[k].gain;
						if (data.explain.gain < gain || (data.explain.gain == gain && data.explain.point < data.other.point - point)) {
							let count = 0;
							data.outlevel.attack = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.arc = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.arc2 = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.ability[0] = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.ability[1] = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.ability[2] = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.ability[3] = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.ability[4] = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.critical = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.criticaldamage = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.total = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.boss = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.ordinary = dlen[0] > count ? matrix[0][i].level[count++] : matrix[1][j].level[count++ - dlen[0]];
							data.outlevel.ignore = M_attack[k].level[0];
							data.explain.point = data.other.point - point;
							data.explain.gain = gain;
							data.explain.gain2 = gain / M_attack[k].gain;
						}
					}
				}
			}
		}
	}
	objtotext('outlevel', data.outlevel);
	objtotext('explain', data.explain);
	for (let i = 0; i < 5; i++) {
		if (disabled[job][1][i])
			iohtml.outlevel.ability[i].text.value = '';
	}
	iohtml.explain.condition.text.value = L_attack ? (L_attack == 16 - data.inlevel.ignore ? '正常' : '剛好') : '無法';
	iohtml.explain.condition.text.style.backgroundColor = L_attack ? (L_attack == 16 - data.inlevel.ignore ? '#44ff44' : '#ffff44') : '#ff4444';
	iohtml.explain.gain.text.value = L_attack ? (L_attack == 16 - data.inlevel.ignore ? data.explain.gain : data.explain.gain2) : '';
}

function test() { //測試函數，將數值自動填入表單
	objtotext('base', {
		"attack": 200,
		"arc": 100,
		"ability": [10000, 5000, 100, 500, 5000],
		"critical": 93,
		"criticaldamage": 100,
		"ignore": 50,
		"total": 150,
		"boss": 200,
		"ordinary": 200
	});
	objtotext('other', {
		"defence": 273,
		"arc": 50,
		"point": 300
	});
	objtotext('inlevel', {
		"attack": 0,
		"arc": 0,
		"ability": [0, 0, 0, 0, 0],
		"critical": 0,
		"criticaldamage": 0,
		"ignore": 0,
		"total": 0,
		"boss": 0
	});
}

window.onload = function () {
	let geturl = url2array();

	window.onkeydown = function () {
		if (event.keyCode == 13) calculate();
	};
	generator(function* () {
		yield {
			nextfunc: openfile,
			argsfront: ['ioset.json'],
			cbfunc: function (str) {
				ioset = JSON.parse(str);
			}
		};
		let ioprint = function (objkey) {
			let count = 0;
			for (let key in ioset[objkey]) {
				if (typeof ioset[objkey][key] == 'object') {
					count += ioset[objkey][key].length;
				} else {
					count++;
				}
			}
			let ss = '';
			for (let i = 0; i < count; i++) {
				ss += '<tr><td></td><td><input type="text" maxlength="6" style="text-align:right;width:50px;"></td></tr>'
			}
			window['table' + objkey].innerHTML += ss;
			let tbhtml = window['table' + objkey].getElementsByTagName('tr');
			let j = 0;
			iohtml[objkey] = {};
			for (let key in ioset[objkey]) {
				if (typeof ioset[objkey][key] == 'object') {
					let len = ioset[objkey][key].length;
					iohtml[objkey][key] = [];
					for (let i = 0; i < len; i++) {
						iohtml[objkey][key][i] = {};
						iohtml[objkey][key][i].label = tbhtml[j].getElementsByTagName('td')[0];
						iohtml[objkey][key][i].text = tbhtml[j].getElementsByTagName('input')[0];
						j++;
					}
				} else {
					iohtml[objkey][key] = {};
					iohtml[objkey][key].label = tbhtml[j].getElementsByTagName('td')[0];
					iohtml[objkey][key].text = tbhtml[j].getElementsByTagName('input')[0];
					j++;
				}
			}
		};
		ioprint('base');
		ioprint('other');
		ioprint('inlevel');
		ioprint('outlevel');
		ioprint('explain');

		let locktext = function (objkey) {
			for (let key in ioset[objkey]) {
				if (typeof ioset[objkey][key] == 'object') {
					let len = ioset[objkey][key].length;
					for (let i = 0; i < len; i++) {
						iohtml[objkey][key][i].text.readOnly = true;
					}
				} else {
					iohtml[objkey][key].text.readOnly = true;
				}
			}
		};
		locktext('outlevel');
		locktext('explain');

		yield {
			nextfunc: openfile,
			argsfront: ['language/zh-Hant.json'],
			cbfunc: function (str) {
				lang = JSON.parse(str);
			}
		};

		if (typeof geturl.lang != 'undefined') {
			let langfilepath = 'language/' + geturl.lang + '.json';
			yield {
				nextfunc: openfile,
				argsfront: [langfilepath],
				cbfunc: function (str) {
					Object.assign(lang, JSON.parse(str));
				}
			};
		}

		document.title = lang.HSBGC;
		bodytitle.innerHTML = lang.HSBGC;
		labelloaddata.innerHTML = lang.loaddata + lang.colon;
		labelsavedata.innerHTML = lang.savedata + lang.colon;
		fileout.value = lang.download;

		jobchoose.innerHTML = lang.jobchoose + lang.colon;
		labelgeneraljob.innerHTML = lang.generaljob;
		labeldemonavenger.innerHTML = lang.demonavenger;
		labelthief.innerHTML = lang.thief;
		labelxenon.innerHTML = lang.xenon;

		arcchoose.innerHTML = lang.arcchoose + lang.colon;
		labelhitarc.innerHTML = lang.hitarc;
		labelnothitarc.innerHTML = lang.nothitarc;

		monsterchoose.innerHTML = lang.monsterchoose + lang.colon;
		labelhitboss.innerHTML = lang.hitboss;
		labelpractice.innerHTML = lang.practice;

		startcalculate.value = lang.startcalculate;

		labelbase.innerHTML = lang.base + lang.colon;
		labelother.innerHTML = lang.other + lang.colon;
		labelinlevel.innerHTML = lang.inlevel + lang.colon;
		labeloutlevel.innerHTML = lang.outlevel + lang.colon;
		labelexplain.innerHTML = lang.explain + lang.colon;

		iohtml['base']['attack'].label.innerHTML = lang.attack + lang.colon;
		iohtml['base']['arc'].label.innerHTML = lang.arc + lang.colon;
		iohtml['base']['critical'].label.innerHTML = lang.critical + lang.colon;
		iohtml['base']['criticaldamage'].label.innerHTML = lang.criticaldamage + lang.colon;
		iohtml['base']['ignore'].label.innerHTML = lang.ignore + lang.colon;
		iohtml['base']['total'].label.innerHTML = lang.total + lang.colon;
		iohtml['base']['boss'].label.innerHTML = lang.boss + lang.colon;
		iohtml['base']['ordinary'].label.innerHTML = lang.ordinary + lang.colon;

		iohtml['other']['defence'].label.innerHTML = lang.defence + lang.colon;
		iohtml['other']['arc'].label.innerHTML = lang.maparc + lang.colon;
		iohtml['other']['point'].label.innerHTML = lang.pointbudget + lang.colon;

		iohtml['inlevel']['attack'].label.innerHTML = lang.attack + lang.colon;
		iohtml['inlevel']['arc'].label.innerHTML = lang.arc + lang.colon;
		iohtml['inlevel']['critical'].label.innerHTML = lang.critical + lang.colon;
		iohtml['inlevel']['criticaldamage'].label.innerHTML = lang.criticaldamage + lang.colon;
		iohtml['inlevel']['ignore'].label.innerHTML = lang.ignore + lang.colon;
		iohtml['inlevel']['total'].label.innerHTML = lang.total + lang.colon;
		iohtml['inlevel']['boss'].label.innerHTML = lang.boss + lang.colon;

		iohtml['outlevel']['attack'].label.innerHTML = lang.attack + lang.colon;
		iohtml['outlevel']['arc'].label.innerHTML = lang.arc + lang.colon;
		iohtml['outlevel']['critical'].label.innerHTML = lang.critical + lang.colon;
		iohtml['outlevel']['criticaldamage'].label.innerHTML = lang.criticaldamage + lang.colon;
		iohtml['outlevel']['ignore'].label.innerHTML = lang.ignore + lang.colon;
		iohtml['outlevel']['total'].label.innerHTML = lang.total + lang.colon;
		iohtml['outlevel']['boss'].label.innerHTML = lang.boss + lang.colon;

		iohtml['explain']['condition'].label.innerHTML = lang.condition + lang.colon;
		iohtml['explain']['point'].label.innerHTML = lang.pointlast + lang.colon;
		iohtml['explain']['gain'].label.innerHTML = lang.gain + lang.colon;

		instructions.innerHTML += lang.conditionexplain +
			'<br>' + lang.conditionexplaintext +
			'<br>' +
			'<br>' + lang.inleveltext +
			'<br>' +
			'<br>' + lang.demonavengerexplain +
			'<br>' + lang.demonavengerexplaintext +
			'<br>' +
			'<br>' + lang.loadsaveexplain +
			'<br>' + lang.loadsaveexplaintext +
			'<br>' +
			'<br>' + lang.shareme +
			'<br>' + location.href;


		abilitystring = [
			[lang.mainability, lang.deputyability, "", "", ""],
			[lang.nowlevel, lang.nowhp, lang.percentagehp, lang.finalhp, lang.str],
			[lang.luk, lang.str, lang.dex, "", ""],
			[lang.str, lang.dex, lang.luk, "", ""]
		];

		document.getElementsByName('radiojob')[0].checked = true;
		jobset(0);
		document.getElementsByName('radiomonster')[0].checked = true;
		monsterset(0);
		document.getElementsByName('radioarc')[1].checked = true;
		arcset(1);

		//測試函數
		// test();

	});
};

function savedata() {
	let data = {
		job: job,
		monster: monster,
		arc: arc,
		base: texttoobj('base'),
		other: texttoobj('other'),
		inlevel: texttoobj('inlevel')
	};

	download(data, fileoutname.value + '.json');
}

function loaddata() {
	let url = URL.createObjectURL(filein.files[0]);
	openfile(url, function (str) {
		let data = JSON.parse(str);

		document.getElementsByName('radiojob')[data.job].checked = true;
		jobset(data.job);

		document.getElementsByName('radiomonster')[data.monster].checked = true;
		monsterset(data.monster);

		document.getElementsByName('radioarc')[data.arc].checked = true;
		arcset(data.arc);

		objtotext('base', data.base);
		objtotext('other', data.other);
		objtotext('inlevel', data.inlevel);
	});
}