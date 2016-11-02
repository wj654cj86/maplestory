var dataid = ["ability", "critical", "max", "min", "boss", "total", "ignore", "defence", "condition", "point", "gain"];
var datastring = ["", "爆擊機率", "最大爆傷", "最小爆傷", "王傷加成", "總傷加成", "無視防禦", "怪物防禦", "點數預算"];
var outputstring = ["破防狀態為", "剩餘點數為", "極限屬性增益為"];
var jobstring = ["一般職業", "惡魔復仇者", "影武者", "傑諾"];
var abilitystring = [["主要屬性", "副要屬性", ""], //
["血量點數", "血量加成", "力量屬性"], //
["幸運屬性", "力量屬性", "敏捷屬性"], //
["力量屬性", "敏捷屬性", "幸運屬性"]];
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

function effect(lv, m) {
	return lv * m + (lv - 5) * (lv > 5);
}

var sumpoint = _sumpoint();

var M_ability = [],
    M_criticaldamage,
    M_damage;
var L_ability = [],
    L_criticaldamage,
    L_damage;
function start() {
	//建立介面
	var f1 = function(did, i, ds) {
		var s = '';
		s += '<tr><td id="' + did + 'inputlable' + i + '">輸入' + ds + '：</td>';
		s += '<td><input type="text" id="' + did + 'input' + i + '" maxlength="6" style="text-align:right;width:50px;"/></td></tr>';
		return s;
	};
	var f2 = function(did, i, ds) {
		var s = '';
		s += '<tr><td id="' + did + 'outputlable' + i + '">' + ds + '：</td>';
		s += '<td><input type="text" id="' + did + 'output' + i + '" style="text-align:right;width:50px;" readonly="readonly"/></td></tr>';
		return s;
	};
	var f3 = function(did, i, ds) {
		return f1(did, i, ds) + f2(did, i, '將' + ds + '提升至');
	};
	var s = '<form>極限屬性最佳增益計算機<br>職業選擇：';
	for (var i = 0; i < 4; i++)
		s += '<br><input type="radio" name="radiobutton" onchange="jobset(' + i + ')">' + jobstring[i];
	s += '</form><table><tr><td><table style="text-align:right;">';
	for (var i = 0; i < 3; i++)
		s += f1(dataid[0], i, '');
	for (var i = 1; i < 8; i++)
		s += f1(dataid[i], '', datastring[i]);
	s += f1(dataid[9], '', datastring[8]);
	s += '<tr><td colspan = "2"><input type="button" value="開始計算" style="width:100%;"onclick="calculate()"/></td></tr>';
	s += '</table></td><td><table style="text-align:right;">';
	for (var i = 0; i < 3; i++)
		s += f2(dataid[0], i, '將' + '' + '提升至');
	for (var i = 1; i < 7; i++)
		s += f2(dataid[i], '', '將' + datastring[i] + '提升至');
	for (var i = 8; i < 11; i++)
		s += f2(dataid[i], '', outputstring[i - 8]);
	s += '</table></td></tr></table>';
	s += '<form>';
	s += '破防狀態說明<br>正常：本身就能破防<br>剛好：必須點極限屬性才能破防，增益不計算無視防禦<br>無法：就算點極限屬性也無法破防';
	s += '<br>將此計算機分享出去吧<br>http://tinyurl.com/tutugoogle/</form>';
	pagbody.innerHTML += s;
	document.getElementsByName('radiobutton')[0].checked = true;
	jobset(0);

	//建立搜尋加速表
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

	M_ability[0] = build_table(function(i) {
		return 4.0 / setpoint(i);
	}, function(j) {
		return 1.0 / setpoint(j);
	});
	L_ability[0] = M_ability[0].length;

	M_ability[1] = [];
	for (var i = 0; i < 11; i++)
		for (var j = 0; j < 11; j++)
			M_ability[1][M_ability[1].length] = build_data(0, i, j);
	L_ability[1] = M_ability[1].length;

	M_ability[2] = dualblade_table(function(i) {
		return 4.0 / setpoint(i);
	}, function(j) {
		return 1.0 / setpoint(j);
	});
	L_ability[2] = M_ability[2].length;

	M_ability[3] = [];
	for (var i = 0; i <= 10; i++) {
		M_ability[3][M_ability[3].length] = build_data(i, i, i);
		if (i + 1 <= 10) {
			M_ability[3][M_ability[3].length] = build_data(i, i, i + 1);
			M_ability[3][M_ability[3].length] = build_data(i, i + 1, i + 1);
		}
	}
	L_ability[3] = M_ability[3].length;

	M_criticaldamage = best_table(6, function(i) {
		return (1.0 + (i > 4)) / setpoint(i);
	}, function(j) {
		return 1.0 / setpoint(j);
	});
	L_criticaldamage = M_criticaldamage.length;

	M_damage = best_table(6, function(i) {
		return (3.0 + (i > 4)) / setpoint(i);
	}, function(j) {
		return 3.0 / setpoint(j);
	});
	L_damage = M_damage.length;

	//測試函數
	//test();
}

function jobset(j) {//切換職業選擇
	job = j;
	var setio5 = function(idl, s, idt, b) {
		document.getElementById(idl).innerHTML = s;
		document.getElementById(idt).disabled = b;
	};
	var setio4 = function(x, b, io) {
		setio5(dataid[0] + ( io ? 'in' : 'out') + 'putlable' + x, b ? '' : (( io ? '輸入' : '將') + abilitystring[j][x] + ( io ? '：' : '提升至：')), dataid[0] + ( io ? 'in' : 'out') + 'put' + x, b);
	};
	var setio3 = function(x, ib, ob) {
		setio4(x, ib, 1);
		setio4(x, ob, 0);
	};
	var setio2 = function(ib, ob) {
		for (var i = 0; i < 3; i++)
			setio3(i, ib[i], ob[i]);
	};
	var setio = function(b) {
		setio2(b[0], b[1]);
	};
	var disabled = [//
	[[0, 0, 1], [0, 0, 1]], //
	[[0, 0, 0], [1, 0, 0]], //
	[[0, 0, 0], [0, 0, 0]], //
	[[0, 0, 0], [0, 0, 0]]];
	setio(disabled[j]);
}

function calculate() {//開始計算
	var delstr = function(t) {
		t.value = t.value.replace(/[^\d]/g, '');
		return (0 + t.value) * 1;
	};
	var a = [delstr(abilityinput0), delstr(abilityinput1), delstr(abilityinput2)];
	var critical = delstr(criticalinput);
	var max = delstr(maxinput);
	var min = delstr(mininput);
	var boss = delstr(bossinput);
	var total = delstr(totalinput);
	var ignore = delstr(ignoreinput);
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
		return 20000 + c * cd;
	};
	var P_critical = F_critical(critical, max + min);
	var G_critical = [];
	for (var i = 0; i < L_critical; i++) {
		G_critical[i] = [];
		for (var j = 0; j < L_criticaldamage; j++)
			G_critical[i][j] = F_critical(critical + M_critical[i], max + min + (function(v) {
				return effect(v[1], 1) + v[2];
			})(M_criticaldamage[j])) / P_critical;
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
				for (var k = 0; k < L_criticaldamage; k++)
					for (var l = 0; l < L_damage; l++)
						for (var m = 0; m < 11; m++) {
							var _point = M_ability[job][i][0] * 1 + sumpoint[j] * 1 + M_criticaldamage[k][0] * 1 + M_damage[l][0] * 1 + sumpoint[m] * 1;
							if (point >= _point) {
								var _gain = G_ability[i] * G_critical[j][k] * G_damage[l] * G_attack[m];
								if (gain < _gain || (gain == _gain && surplus < point - _point)) {
									R_ability = M_ability[job][i];
									R_critical = j;
									R_criticaldamage = M_criticaldamage[k];
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
		maxoutput.value = R_criticaldamage[1];
		minoutput.value = R_criticaldamage[2];
		bossoutput.value = R_damage[1];
		totaloutput.value = R_damage[2];
		ignoreoutput.value = R_ignore;
		conditionoutput.value = S_ignore == 1 ? '正常' : '剛好';
		conditionoutput.style.backgroundColor = S_ignore == 1 ? '#44ff44' : '#ffff44';
		pointoutput.value = surplus;
		gainoutput.value = S_ignore == 1 ? gain : gain2;
	} else {
		abilityoutput0.value = '';
		abilityoutput1.value = '';
		abilityoutput2.value = '';
		criticaloutput.value = '';
		maxoutput.value = '';
		minoutput.value = '';
		bossoutput.value = '';
		totaloutput.value = '';
		ignoreoutput.value = '';
		conditionoutput.value = '無法';
		conditionoutput.style.backgroundColor = '#ff4444';
		pointoutput.value = '';
		gainoutput.value = '';
	}

}

function test() {//測試函數，將數值自動填入表單
	abilityinput0.value = 5000;
	abilityinput1.value = 2000;
	abilityinput2.value = 0;
	criticalinput.value = 93;
	maxinput.value = 100;
	mininput.value = 50;
	bossinput.value = 200;
	totalinput.value = 150;
	ignoreinput.value = 50;
	defenceinput.value = 273;
	pointinput.value = 300;
}
