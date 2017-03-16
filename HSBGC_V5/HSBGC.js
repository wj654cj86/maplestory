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

var O_ability = [],
    O_damage;
var N_ability = [],
    N_damage;

var build_data = function(i, j, k) {
	if (isNaN(k))
		return [sumpoint[i] + sumpoint[j], i, j];
	else
		return [sumpoint[i] + sumpoint[j] + sumpoint[k], i, j, k];
};
var build_table = function(fun1, fun2) {
	var M = [];
	M[M.length] = build_data(0, 0);
	for (var i = 1; i <= 10; i++) {
		var min1 = fun1(i),
		    max1 = fun1(i + 1);
		var min2 = 0,
		    max2 = 10;
		for (var j = 10; j >= 1; j--)
			if (fun2(j) > min1) {
				min2 = j;
				break;
			}
		for (var j = 1; j <= 10; j++)
			if (fun2(j) < max1) {
				max2 = j;
				break;
			}
		for (var j = min2; j <= max2; j++)
			M[M.length] = build_data(i, j);
	}
	for (var i = M[M.length - 1][2] + 1; i <= 10; i++)
		M[M.length] = build_data(10, i);
	return M;
};
var best_table = function(best, fun1, fun2) {
	var M = build_table(fun1, fun2);
	var L = M.length;
	var B;
	for ( B = 0; B < L; B++)
		if (M[B][1] >= best)
			break;
	var M2 = [];
	for (var i = 0; i < best; i++) {
		M2[M2.length] = build_data(i, i);
		M2[M2.length] = build_data(i, i + 1);
	}
	for (; B < L; B++)
		M2[M2.length] = M[B];
	return M2;
};
var dualblade_table = function(fun1, fun2) {
	var M = build_table(fun1, fun2);
	var L = M.length;
	var F = function(v, i) {
		return build_data(v[1], v[2], v[2] + i);
	};
	var M2 = [];
	for (var i = 0; i < L; i++)
		if (i + 1 < L) {
			M2[M2.length] = F(M[i], 0);
			if (M[i][1] == M[i + 1][1])
				M2[M2.length] = F(M[i], 1);
		}
	M2[M2.length] = build_data(10, 10, 10);
	return M2;
};

O_ability[0] = build_table(function(i) {
	return 4.0 / setpoint(i);
}, function(j) {
	return 1.0 / setpoint(j);
});
N_ability[0] = O_ability[0].length;

O_ability[1] = [];
//for (var i = 0; i < 11; i++)
//	for (var j = 0; j < 11; j++)
//		O_ability[1][O_ability[1].length] = build_data(0, i, j);
N_ability[1] = O_ability[1].length;

O_ability[2] = dualblade_table(function(i) {
	return 4.0 / setpoint(i);
}, function(j) {
	return 1.0 / setpoint(j);
});
N_ability[2] = O_ability[2].length;

O_ability[3] = dualblade_table(function(i) {
	return 1.0 / setpoint(i);
}, function(j) {
	return 1.0 / setpoint(j);
});
N_ability[3] = O_ability[3].length;

O_damage = best_table(6, function(i) {
	return (3.0 + (i > 4)) / setpoint(i);
}, function(j) {
	return 3.0 / setpoint(j);
});
N_damage = O_damage.length;

function jobset(j) {//切換職業選擇
	job = j;
	var setio = function(id, s, b) {
		window['lable' + id].innerHTML = b ? '' : s + '：';
		window['text' + id].disabled = b;
	};

	var disabled = [//
	[[0, 0, 1], [0, 0, 1]], //
	[[0, 0, 0], [1, 0, 0]], //
	[[0, 0, 0], [0, 0, 0]], //
	[[0, 0, 0], [0, 0, 0]]];
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
	//test();
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

	var inlevel_table = function(O, N, l1, l2) {
		var i;
		var M = [];
		for (i = 0; i < N; i++)
			if(O[i][1] == l1 || O[i][2] == l2)
				break;
		for(var j = O[i][1]; j < l1; j++)
			M[M.length] = build_data(l1, j);
		for(var j = O[i][2]; j < l2; j++)
			M[M.length] = build_data(j, l2);
		for(; i < N; i++)
			M[M.length] = O[i];
		var L = M.length;
		var s = sumpoint[l1] + sumpoint[l2];
		for(var j = 0; j < L; j++)
			M[j][0] -= s;
		return M;
	};
	var inlevel_table_3 = function(O, N, l1, l2, l3) {
		var i;
		var M = [];
		for (i = 0; i < N; i++)
			if(O[i][1] == l1 || O[i][2] == l2 || O[i][3] == l3)
				break;
		for(var j = O[i][1]; j < l1; j++)
			M[M.length] = build_data(l1, j);
		for(var j = O[i][2]; j < l2; j++)
			M[M.length] = build_data(j, l2);
		for(; i < N; i++)
			M[M.length] = O[i];
		var L = M.length;
		var s = sumpoint[l1] + sumpoint[l2];
		for(var j = 0; j < L; j++)
			M[j][0] -= s;
		return M;
	};

	var L_ability;
	var M_ability = [];
	var V_ability;
	var P_ability;
	var G_ability = [];
	switch (job) {
	case 0:
		M_ability = inlevel_table(O_ability[0], N_ability, inlevelability0, inlevelability1);
		L_ability = M_ability.length;
		V_ability = 15 * (4 * inlevelability0 + inlevelability1);
		P_ability = 4 * baseability0 + baseability1;
		if (P_ability < 20)
			P_ability = 20;
		for (var i = 0; i < L_ability[0]; i++)
			G_ability[i] = 1 + ((function(v) {
				return 15 * (4 * v[1] + v[2]);
			})(M_ability[i]) - V_ability) / P_ability;
		break;
	case 1:
		M_ability = [];
		var s = sumpoint[inlevelability1] + sumpoint[inlevelability2];
		for (var i = inlevelability1; i < 11; i++)
			for (var j = inlevelability2; j < 11; j++){
				M_ability[M_ability.length] = build_data(0, i, j);
				M_ability[M_ability.length - 1][0] -= s;
			}
		L_ability = M_ability.length;
		P_ability = baseability0 / 7;
		if (P_ability < 20)
			P_ability = 20;
		for (var i = inlevelability1; i < 11; i++)
			for (var j = inlevelability2; j < 11; j++)
				G_ability[i * 11 + j] = 1 + (P_ability * 2 * (i - inlevelability1) / (100 + baseability1) + 15 * (j - inlevelability2)) / (P_ability + baseability2);
		break;
	case 2:
	default:
	}

}

function calculate2() {//開始計算
	var delstr = function(t) {
		t.value = t.value.replace(/[^\d]/g, '');
		return (0 + t.value) * 1;
	};
	var a = [delstr(abilityinput0), delstr(abilityinput1), delstr(abilityinput2)];
	var critical = delstr(criticalinput);
	var criticaldamage = delstr(criticaldamageinput);
	var ignore = delstr(ignoreinput);
	var total = delstr(totalinput);
	var boss = delstr(bossinput);
	var defence = delstr(defenceinput);
	var point = delstr(pointinput);

	var P_ability;
	var G_ability = [];
	switch (job) {
	case 0:
		P_ability = 4 * a[0] + a[1];
		if (P_ability < 20)
			P_ability = 20;
		for (var i = 0; i < L_ability[0]; i++)
			G_ability[i] = 1 + (function(v) {
				return 15 * (4 * v[1] + v[2]);
			})(M_ability[0][i]) / P_ability;
		break;
	case 1:
		P_ability = a[0] / 7;
		if (P_ability < 20)
			P_ability = 20;
		for (var i = 0; i < 11; i++)
			for (var j = 0; j < 11; j++)
				G_ability[i * 11 + j] = 1 + (P_ability * 2 * i / (100 + a[1]) + 15 * j) / (P_ability + a[2]);
		break;
	case 2:
		P_ability = 4 * a[0] + a[1] + a[2];
		if (P_ability < 24)
			P_ability = 24;
		for (var i = 0; i < L_ability[2]; i++)
			G_ability[i] = 1 + (function(v) {
				return 15 * (4 * v[1] + v[2] + v[3]);
			})(M_ability[2][i]) / P_ability;
		break;
	default:
		P_ability = a[0] + a[1] + a[2];
		if (P_ability < 12)
			P_ability = 12;
		for (var i = 0; i < L_ability[3]; i++)
			G_ability[i] = 1 + (function(v) {
				return 15 * (v[1] + v[2] + v[3]);
			})(M_ability[3][i]) / P_ability;
	}

	var M_critical = [];
	for (var i = 0; i < 11; i++) {
		M_critical[i] = minnum(effect(i, 1), 100 - critical);
		if (i && M_critical[i] == M_critical[i - 1])
			break;
	}
	var L_critical = M_critical.length;

	var F_critical = function(c, cd) {
		return 10000 + c * (cd + 35);
	};
	var P_critical = F_critical(critical, criticaldamage);
	var G_critical = [];
	for (var i = 0; i < L_critical; i++) {
		G_critical[i] = [];
		for (var j = 0; j < 11; j++)
			G_critical[i][j] = F_critical(critical + M_critical[i], criticaldamage + j) / P_critical;
	}

	var P_damage = 100 + boss + total;
	var G_damage = [];
	for (var i = 0; i < L_damage; i++)
		G_damage[i] = 1 + (function(v) {
			return effect(v[1], 3) + v[2] * 3;
		})(M_damage[i]) / P_damage;

	var P_attack = (100 - ignore) * defence;
	var G_attack = [];
	for (var i = 0; i < 11; i++)
		G_attack[i] = 1 + 0.03 * i * P_attack / (10000 - P_attack);
	var S_ignore;
	if (G_attack[10] < 0 || 10000 - P_attack == 0) {
		S_ignore = 2;
		var S_attack;
		if (10000 - P_attack) {
			for ( S_attack = 1; S_attack < 11; S_attack++)
				if (G_attack[S_attack] < 0)
					break;
		} else
			S_attack = 1;
		for (var i = 0; i < S_attack; i++)
			G_attack[i] = 0;
		for (var i = S_attack; i < 11; i++)
			G_attack[i] = 1 + 0.03 * (i - S_attack) * P_attack / (10000 - (1 - 0.03 * S_attack) * P_attack);
	} else if (G_attack[10] >= 1)
		S_ignore = 1;
	else
		S_ignore = 0;

	var R_ability,
	    R_critical,
	    R_criticaldamage,
	    R_damage,
	    R_ignore,
	    gain = 1.0,
	    gain2,
	    surplus;
	if (S_ignore) {
		for (var i = 0; i < L_ability[job]; i++)
			for (var j = 0; j < L_critical; j++)
				for (var k = 0; k < 11; k++)
					for (var l = 0; l < L_damage; l++)
						for (var m = 0; m < 11; m++) {
							var _point = M_ability[job][i][0] * 1 + sumpoint[j] * 1 + sumpoint[k] * 1 + M_damage[l][0] * 1 + sumpoint[m] * 1;
							if (point >= _point) {
								var _gain = G_ability[i] * G_critical[j][k] * G_damage[l] * G_attack[m];
								if (gain < _gain || (gain == _gain && surplus < point - _point)) {
									R_ability = M_ability[job][i];
									R_critical = j;
									R_criticaldamage = k;
									R_damage = M_damage[l];
									R_ignore = m;
									gain = _gain;
									gain2 = _gain / G_attack[m];
									surplus = point - _point;
								}
							}
						}
	}
	if (S_ignore) {
		abilityoutput0.value = job != 1 ? R_ability[1] : '';
		abilityoutput1.value = R_ability[2];
		abilityoutput2.value = job != 0 ? R_ability[3] : '';
		criticaloutput.value = R_critical;
		criticaldamageoutput.value = R_criticaldamage;
		ignoreoutput.value = R_ignore;
		totaloutput.value = R_damage[2];
		bossoutput.value = R_damage[1];
		conditionoutput.value = S_ignore == 1 ? '正常' : '剛好';
		conditionoutput.style.backgroundColor = S_ignore == 1 ? '#44ff44' : '#ffff44';
		pointoutput.value = surplus;
		gainoutput.value = S_ignore == 1 ? gain : gain2;
	} else {
		abilityoutput0.value = '';
		abilityoutput1.value = '';
		abilityoutput2.value = '';
		criticaloutput.value = '';
		criticaldamageoutput.value = '';
		ignoreoutput.value = '';
		totaloutput.value = '';
		bossoutput.value = '';
		conditionoutput.value = '無法';
		conditionoutput.style.backgroundColor = '#ff4444';
		pointoutput.value = '';
		gainoutput.value = '';
	}

}

function test() {//測試函數，將數值自動填入表單
	abilityinput0.value = 10000;
	abilityinput1.value = 5000;
	abilityinput2.value = 0;
	criticalinput.value = 93;
	criticaldamageinput.value = 100;
	bossinput.value = 200;
	totalinput.value = 150;
	ignoreinput.value = 50;
	defenceinput.value = 273;
	pointinput.value = 300;
}
