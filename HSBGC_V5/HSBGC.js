var job;
function setpoint(lv) {
	if (lv <= 0)
		return 0;
	else if (lv <= 4)
		return 1 << (lv - 1);
	else
		return (lv - 3) * 5;
}

function _sumpoint() {
	var sumpoint = [0];
	for (var i = 1; i <= 10; i++)
		sumpoint[sumpoint.length] = setpoint(i) + sumpoint[i - 1];
	return sumpoint;
}

function minnum(x, y) {
	return x < y ? x : y;
}
function maxnum(x, y) {
	return x > y ? x : y;
}

function effect(lv, m) {
	return lv * m + (lv - 5) * (lv > 5);
}

var sumpoint = _sumpoint();

var build_data = function(nowlevel, gain, level) {
	var sp = 0;
	for(var i = 0; i < level.length; i++)
		sp += sumpoint[nowlevel[i]] - sumpoint[level[i]];
	return [].concat(sp, gain, nowlevel);
};
var build_table = function(base, level, f) {
	var M = [];
	var nowlevel = level.slice(0);
	var p = 0, ll = level.length;
	while(p < ll){
		p = 0;
		M[M.length] = build_data(nowlevel, f(nowlevel, base, level), level);
		while(p < ll){
			if(++nowlevel[p] > 10) {
				nowlevel[p] = level[p];
				p++;
			} else
				break;
		}
	}
	M = M.sort(function(a, b) {
		var d = a[0] - b[0];
		return d == 0 ? a[1] - b[1] : d;
	});
	for(var i = 1; i < M.length; i++)
		while(i < M.length && M[i - 1][1] >= M[i][1])
			M.splice(i, 1);
	return M;
};

var disabled = [//
[[0, 0, 1], [0, 0, 1]], //
[[0, 0, 0], [1, 0, 0]], //
[[0, 0, 0], [0, 0, 0]], //
[[0, 0, 0], [0, 0, 0]]];

function jobset(j) {//切換職業選擇
	job = j;
	var setio = function(id, s, b) {
		window['lable' + id].innerHTML = b ? '' : s + '：';
		window['text' + id].disabled = b;
	};

	var ioid = ["base", "inlevel", "outlevel"];
	var abilitystring = [["主要屬性", "副要屬性", ""], //
	["血量點數", "血量加成", "力量屬性"], //
	["幸運屬性", "力量屬性", "敏捷屬性"], //
	["力量屬性", "敏捷屬性", "幸運屬性"]];

	for(var io = 0; io < 3; io++)
		for(var i = 0; i < 3; i++)
			setio(ioid[io] + 'ability' + i, abilitystring[j][i], disabled[j][(io < 1) ? io : 1][i]);
}

function start() {
	document.getElementsByName('radiobutton')[0].checked = true;
	jobset(0);
	//測試函數
	test();
}

function calculate() {//開始計算
	var delstr = function(t) {
		t.value = t.value.replace(/[^\d]/g, '');
		return (0 + t.value) * 1;
	};
	var baseability0 = delstr(textbaseability0);
	var baseability1 = delstr(textbaseability1);
	var baseability2 = delstr(textbaseability2);
	var basecritical = delstr(textbasecritical);
	var basecriticaldamage = delstr(textbasecriticaldamage);
	var baseignore = delstr(textbaseignore);
	var basetotal = delstr(textbasetotal);
	var baseboss = delstr(textbaseboss);
	var otherdefence = delstr(textotherdefence);
	var otherpoint = delstr(textotherpoint);
	var inlevelability0 = minnum(10, delstr(textinlevelability0));
	var inlevelability1 = minnum(10, delstr(textinlevelability1));
	var inlevelability2 = minnum(10, delstr(textinlevelability2));
	var inlevelcritical = minnum(10, delstr(textinlevelcritical));
	var inlevelcriticaldamage = minnum(10, delstr(textinlevelcriticaldamage));
	var inlevelignore = minnum(10, delstr(textinlevelignore));
	var inleveltotal = minnum(10, delstr(textinleveltotal));
	var inlevelboss = minnum(10, delstr(textinlevelboss));
//	var outlevelability0 = delstr(textoutlevelability0);
//	var outlevelability1 = delstr(textoutlevelability1);
//	var outlevelability2 = delstr(textoutlevelability2);
//	var outlevelcritical = delstr(textoutlevelcritical);
//	var outlevelcriticaldamage = delstr(textoutlevelcriticaldamage);
//	var outlevelignore = delstr(textoutlevelignore);
//	var outleveltotal = delstr(textoutleveltotal);
//	var outlevelboss = delstr(textoutlevelboss);
//	var explaincondition = delstr(textexplaincondition);
//	var explainpoint = delstr(textexplainpoint);
//	var explaingain = delstr(textexplaingain);

	var M_ability = build_table([baseability0, baseability1, baseability2], //
	[inlevelability0, inlevelability1, inlevelability2], //
	[function(nowlevel, base, level) {
		var P = maxnum(20, 4 * base[0] + base[1]);
		var N = 15 * (4 * (nowlevel[0] - level[0]) + (nowlevel[1] - level[1]));
		return 1 + N / P;
	}, function(nowlevel, base, level) {
		var P = maxnum(8, base[0] / 7);
		var N = P * 2 * (nowlevel[1] - level[1]) / (100 + base[1]) + 15 * (nowlevel[2] - level[2]);
		return 1 + N / (P + base[2]);
	}, function(nowlevel, base, level) {
		var P = maxnum(24, 4 * base[0] + base[1] + base[2]);
		var N = 15 * (4 * (nowlevel[0] - level[0]) + (nowlevel[1] - level[1]) + (nowlevel[2] - level[2]));
		return 1 + N / P;
	}, function(nowlevel, base, level) {
		var P = maxnum(12, base[0] + base[1] + base[2]);
		var N = 15 * ((nowlevel[0] - level[0]) + (nowlevel[1] - level[1]) + (nowlevel[2] - level[2]));
		return 1 + N / P;
	}][job]
	);
	var L_ability = M_ability.length;

	var M_critical = build_table([basecritical, basecriticaldamage], //
	[inlevelcritical, inlevelcriticaldamage], //
	function(nowlevel, base, level) {
		var B = 10000 + base[0] * (35 + base[1]);
		var C = minnum(100, base[0] + (effect(nowlevel[0], 1) - effect(level[0], 1)));
		var D = 10000 + C * (35 + base[1] + (nowlevel[1] - level[1]));
		return D / B;
	});
	var L_critical = M_critical.length;

	var M_damage = build_table([baseboss, basetotal], //
	[inlevelboss, inleveltotal], //
	function(nowlevel, base, level) {
		var P = 100 + base[0] + base[1];
		var N = (effect(nowlevel[0], 3) - effect(level[0], 3)) + 3 * (nowlevel[1] - level[1]);
		return 1 + N / P;
	});
	var L_damage = M_damage.length;

	var N_attack = (100 - baseignore) * otherdefence;
	var P_attack = N_attack / (1 - 0.03 * inlevelignore);
	var S_attack;
	for(S_attack = inlevelignore; S_attack < 11; S_attack++) {
		N_attack = P_attack * (1 - 0.03 * S_attack);
		if(N_attack < 10000)
			break;		
	}
	var M_attack = [];
	for(; S_attack < 11; S_attack++)
		M_attack[M_attack.length] = build_data([S_attack], 1 + 0.03 * S_attack * P_attack / (10000 - N_attack), [inlevelignore]);
	var L_attack = M_attack.length;
	
	var outlevelability0 = '';
	var outlevelability1 = '';
	var outlevelability2 = '';
	var outlevelcritical = '';
	var outlevelcriticaldamage = '';
	var outlevelignore = '';
	var outleveltotal = '';
	var outlevelboss = '';
	var explainpoint = '';
	var explaingain = 1.0;
	var explaingain2 = 1.0;
	for (var l = 0; l < L_attack; l++)
		for (var i = 0; i < L_ability; i++)
			for (var j = 0; j < L_critical; j++)
				for (var k = 0; k < L_damage; k++) {
					var point = M_ability[i][0] + M_critical[j][0] + M_damage[k][0] + M_attack[l][0];
					if(otherpoint >= point) {
						var gain = M_ability[i][1] * M_critical[j][1] * M_damage[k][1] * M_attack[l][1];
						if (explaingain < gain || (explaingain == gain && explainpoint < otherpoint - point)) {
							outlevelability0 = M_ability[i][2];
							outlevelability1 = M_ability[i][3];
							outlevelability2 = M_ability[i][4];
							outlevelcritical = M_critical[j][2];
							outlevelcriticaldamage = M_critical[j][3];
							outlevelignore = M_attack[l][2];
							outleveltotal = M_damage[k][3];
							outlevelboss = M_damage[k][2];
							explainpoint = otherpoint - point;
							explaingain = gain;
							explaingain2 = gain / M_attack[l][1];
						}
					}
				}
	textoutlevelability0.value = disabled[job][1][0] ? '' : outlevelability0;
	textoutlevelability1.value = disabled[job][1][1] ? '' : outlevelability1;
	textoutlevelability2.value = disabled[job][1][2] ? '' : outlevelability2;
	textoutlevelcritical.value = outlevelcritical;
	textoutlevelcriticaldamage.value = outlevelcriticaldamage;
	textoutlevelignore.value = outlevelignore;
	textoutleveltotal.value = outleveltotal;
	textoutlevelboss.value = outlevelboss;
	textexplaincondition.value = L_attack ? (L_attack == 11 - inlevelignore ? '正常' : '剛好') : '無法';
	textexplaincondition.style.backgroundColor = L_attack ? (L_attack == 11 - inlevelignore ? '#44ff44' : '#ffff44') : '#ff4444';
	textexplainpoint.value = explainpoint;
	textexplaingain.value = L_attack ? (L_attack == 11 - inlevelignore ? explaingain : explaingain2) : '';
}

function test() {//測試函數，將數值自動填入表單
	textbaseability0.value = 10000;
	textbaseability1.value = 5000;
	textbaseability2.value = 0;
	textbasecritical.value = 93;
	textbasecriticaldamage.value = 100;
	textbaseignore.value = 50;
	textbasetotal.value = 150;
	textbaseboss.value = 200;
	textotherdefence.value = 273;
	textotherpoint.value = 300;
	textinlevelability0.value = 0;
	textinlevelability1.value = 0;
	textinlevelability2.value = 0;
	textinlevelcritical.value = 0;
	textinlevelcriticaldamage.value = 0;
	textinlevelignore.value = 0;
	textinleveltotal.value = 0;
	textinlevelboss.value = 0;
}
